-- Human-readable references remain stable through moves, archive and restoration.
alter table public.children add column student_number bigint generated always as identity unique;
alter table public.children add column student_code text generated always as
  ('RB-' || lpad(student_number::text, greatest(6,length(student_number::text)), '0')) stored unique;
alter table public.profiles add column is_active boolean not null default true;
alter table public.class_memberships add column access_enabled boolean not null default true;

create function private.is_active_staff() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and is_active);
$$;
revoke all on function private.is_active_staff() from public;
grant execute on function private.is_active_staff() to authenticated;
create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role='admin' and is_active);
$$;
create or replace function private.can_access_class(c uuid,p uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select private.is_admin() or (private.is_active_staff() and exists(select 1 from public.classes k
 join public.class_teachers a on a.class_id=k.id join public.reporting_periods r on r.year=k.academic_year
 where k.id=c and r.id=p and k.archived_at is null and a.teacher_id=auth.uid()));
$$;
create or replace function private.can_access_enrolment(eid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select private.is_admin() or exists(select 1 from public.enrolments e
 join public.reporting_periods p on p.id=e.period_id
 join public.class_memberships m on m.child_id=e.child_id and m.academic_year=p.year and m.class_id=e.class_id and m.access_enabled
 join public.children c on c.id=e.child_id and c.archived_at is null
 where e.id=eid and private.can_access_class(m.class_id,e.period_id));
$$;
create or replace function private.can_access_child(c uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select private.is_admin() or (private.is_active_staff() and exists(select 1 from public.class_memberships m
 join public.classes k on k.id=m.class_id and k.archived_at is null
 join public.class_teachers t on t.class_id=k.id and t.teacher_id=auth.uid()
 join public.children ch on ch.id=m.child_id and ch.archived_at is null
 where m.child_id=c and m.access_enabled));
$$;
drop policy classes_read on public.classes;
create policy classes_read on public.classes for select to authenticated using(private.is_admin() or
 (private.is_active_staff() and archived_at is null and exists(select 1 from public.class_teachers t where t.class_id=classes.id and t.teacher_id=auth.uid())));
drop policy class_teachers_read on public.class_teachers;
create policy class_teachers_read on public.class_teachers for select to authenticated using(private.is_admin() or (private.is_active_staff() and teacher_id=auth.uid()));
drop policy assignments_read on public.teacher_assignments;
create policy assignments_read on public.teacher_assignments for select to authenticated using(private.is_admin() or (private.is_active_staff() and teacher_id=auth.uid()));
drop policy memberships_read on public.class_memberships;
create policy memberships_read on public.class_memberships for select to authenticated using(private.is_admin() or
 (access_enabled and private.can_access_child(child_id) and private.can_access_class(class_id,
 (select p.id from public.reporting_periods p where p.year=academic_year order by p.semester desc limit 1))));

-- Keep the previous, tested class operations behind a non-exposed wrapper.
alter function public.manage_class(text,jsonb) set schema private;
alter function private.manage_class(text,jsonb) rename to manage_class_base;
revoke all on function private.manage_class_base(text,jsonb) from public,authenticated;
create function public.manage_class(command text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; ids uuid[]; restoring uuid[]; yr smallint; cid uuid; n integer;
begin
 if not private.is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(1920261019);
 if command='restore_students' then
   yr=(payload->>'year')::smallint; cid=nullif(payload->>'class_id','')::uuid;
   if yr is null or yr not between 2020 and 2200 then raise exception 'Invalid year' using errcode='22023'; end if;
   select array_agg(distinct v::uuid) into ids from jsonb_array_elements_text(payload->'ids') v;
   if coalesce(cardinality(ids),0) not between 1 and 200 then raise exception 'Select students' using errcode='22023'; end if;
   select count(*) into n from public.children where id=any(ids);
   if n<>cardinality(ids) then raise exception 'Student unavailable' using errcode='22023'; end if;
   select array_agg(id) into restoring from public.children where id=any(ids) and archived_at is not null;
   -- Preserve historical groupings without automatically re-enabling former teachers.
   update public.class_memberships set access_enabled=false where child_id=any(restoring);
   update public.children set archived_at=null where id=any(restoring);
   if cid is not null then
     result=private.manage_class_base('assign_students',payload);
     update public.class_memberships set access_enabled=true where child_id=any(ids) and academic_year=yr;
   end if;
   return jsonb_build_object('count',cardinality(ids));
 end if;
 if command='assign_teachers' and exists(select 1 from public.profiles where id in
   (select v::uuid from jsonb_array_elements_text(payload->'ids') v) and not is_active) then
   raise exception 'Teacher is inactive' using errcode='22023';
 end if;
 result=private.manage_class_base(command,payload);
 if command='assign_students' then
   update public.class_memberships set access_enabled=true where academic_year=(payload->>'year')::smallint
   and child_id in (select v::uuid from jsonb_array_elements_text(payload->'ids') v);
 end if;
 return result;
end $$;
revoke all on function public.manage_class(text,jsonb) from public;
grant execute on function public.manage_class(text,jsonb) to authenticated;

create function public.manage_directory(command text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare ids uuid[]; targets uuid[]; yr smallint; n integer;
begin
 if not private.is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(1920261019);
 select array_agg(distinct v::uuid) into ids from jsonb_array_elements_text(payload->'ids') v;
 if coalesce(cardinality(ids),0) not between 1 and 200 then raise exception 'Select teachers' using errcode='22023'; end if;
 select count(*) into n from public.profiles where id=any(ids) and role='teacher';
 if n<>cardinality(ids) then raise exception 'Teacher selection unavailable' using errcode='22023'; end if;
 if command in ('deactivate_teachers','reactivate_teachers') then
   update public.profiles set is_active=(command='reactivate_teachers') where id=any(ids);
 elsif command='set_teacher_classes' then
   yr=(payload->>'year')::smallint;
   if cardinality(ids)<>1 or yr is null or yr not between 2020 and 2200 then raise exception 'Choose one teacher and year' using errcode='22023'; end if;
   select array_agg(distinct v::uuid) into targets from jsonb_array_elements_text(coalesce(payload->'class_ids','[]')) v;
   if coalesce(cardinality(targets),0)>200 then raise exception 'Too many classes' using errcode='22023'; end if;
   select count(*) into n from public.classes where id=any(targets) and academic_year=yr and archived_at is null;
   if n<>coalesce(cardinality(targets),0) then raise exception 'Class unavailable for this year' using errcode='22023'; end if;
   delete from public.class_teachers a using public.classes c where a.class_id=c.id and a.teacher_id=ids[1] and c.academic_year=yr and c.archived_at is null;
   insert into public.class_teachers(teacher_id,class_id) select ids[1],unnest(targets);
 else raise exception 'Unknown command' using errcode='22023'; end if;
 return jsonb_build_object('count',cardinality(ids));
end $$;
revoke all on function public.manage_directory(text,jsonb) from public;
grant execute on function public.manage_directory(text,jsonb) to authenticated;
