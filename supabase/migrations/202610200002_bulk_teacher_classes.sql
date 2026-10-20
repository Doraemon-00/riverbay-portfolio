-- Add access for a group atomically; never replace existing assignments.
create function public.add_teacher_classes(payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare ids uuid[]; targets uuid[]; yr smallint; n integer;
begin
 if not private.is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(1920261019);
 yr=(payload->>'year')::smallint;
 if yr is null or yr not between 2020 and 2200 then raise exception 'Invalid year' using errcode='22023'; end if;
 select array_agg(distinct v::uuid) into ids from jsonb_array_elements_text(payload->'ids') v;
 select array_agg(distinct v::uuid) into targets from jsonb_array_elements_text(payload->'class_ids') v;
 if coalesce(cardinality(ids),0) not between 1 and 200 or coalesce(cardinality(targets),0) not between 1 and 200 then
   raise exception 'Select teachers and classes' using errcode='22023'; end if;
 select count(*) into n from public.profiles where id=any(ids) and role='teacher' and is_active;
 if n<>cardinality(ids) then raise exception 'Active teachers required' using errcode='22023'; end if;
 select count(*) into n from public.classes where id=any(targets) and academic_year=yr and archived_at is null;
 if n<>cardinality(targets) then raise exception 'Active classes required for this year' using errcode='22023'; end if;
 insert into public.class_teachers(teacher_id,class_id)
 select t,c from unnest(ids) t cross join unnest(targets) c on conflict do nothing;
 get diagnostics n=row_count;
 return jsonb_build_object('count',n);
end $$;
revoke all on function public.add_teacher_classes(jsonb) from public;
grant execute on function public.add_teacher_classes(jsonb) to authenticated;
