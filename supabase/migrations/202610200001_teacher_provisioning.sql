alter table public.profiles add column email text;
update public.profiles p set email=u.email from auth.users u where u.id=p.id;

-- Auth account creation happens only on the server. Profile and optional class
-- assignments are committed together, using the acting administrator's session.
create function public.finish_teacher_setup(teacher_id uuid, teacher_name text, teacher_email text, yr smallint, class_ids uuid[])
returns void language plpgsql security definer set search_path='' as $$
declare title text; target_email text; n integer;
begin
 if not private.is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(1920261019);
 title=btrim(teacher_name); target_email=lower(btrim(teacher_email));
 if title is null or length(title) not between 1 and 100 or yr is null or yr not between 2020 and 2200 then
   raise exception 'Invalid teacher details' using errcode='22023'; end if;
 if not exists(select 1 from auth.users u where u.id=teacher_id and lower(u.email)=target_email
   and u.raw_app_meta_data->>'riverbay_setup_by'=auth.uid()::text) then
   raise exception 'Account unavailable for provisioning' using errcode='22023'; end if;
 if exists(select 1 from public.profiles where id=teacher_id) then raise exception 'Profile already exists' using errcode='23505'; end if;
 if coalesce(cardinality(class_ids),0)>200 then raise exception 'Too many classes' using errcode='22023'; end if;
 select count(distinct c.id) into n from public.classes c where c.id=any(class_ids) and c.academic_year=yr and c.archived_at is null;
 if n<>coalesce(cardinality(class_ids),0) then raise exception 'Class selection unavailable' using errcode='22023'; end if;
 insert into public.profiles(id,display_name,role,is_active,email) values(teacher_id,title,'teacher',true,target_email);
 insert into public.class_teachers(teacher_id,class_id) select teacher_id,unnest(class_ids);
end $$;
revoke all on function public.finish_teacher_setup(uuid,text,text,smallint,uuid[]) from public;
grant execute on function public.finish_teacher_setup(uuid,text,text,smallint,uuid[]) to authenticated;
