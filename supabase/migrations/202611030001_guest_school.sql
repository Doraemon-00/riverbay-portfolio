-- A second, self-contained Riverbay for public guests. Every account, class and child belongs to one
-- school. Administrators see and change only their own school; the database refuses any change that
-- would link records across schools. The guest school is restored from a snapshot every night.
create table public.schools (
  id uuid primary key,
  name text not null check (length(name) between 1 and 100),
  is_guest boolean not null default false
);
insert into public.schools(id, name, is_guest) values
  ('00000000-0000-4000-8000-000000000001', 'Riverbay Preschool', false),
  ('00000000-0000-4000-8000-000000000002', 'Riverbay Preschool', true);

-- Existing records belong to the staff school.
alter table public.profiles add column school_id uuid not null default '00000000-0000-4000-8000-000000000001' references public.schools(id);
alter table public.classes add column school_id uuid not null default '00000000-0000-4000-8000-000000000001' references public.schools(id);
alter table public.children add column school_id uuid not null default '00000000-0000-4000-8000-000000000001' references public.schools(id);
create index profiles_school on public.profiles(school_id);
create index classes_school on public.classes(school_id);
create index children_school on public.children(school_id);

-- Class names are unique per school and year, so the guest school can repeat the staff school's names.
drop index public.classes_annual_name;
create unique index classes_annual_name on public.classes(school_id, academic_year, lower(name));

create function private.current_school() returns uuid
language sql stable security definer set search_path = '' as $$
  select school_id from public.profiles where id = auth.uid();
$$;
create function private.is_admin_of(s uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select s is not null and private.is_admin() and s = private.current_school();
$$;
create function private.child_school(c uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select school_id from public.children where id = c;
$$;
create function private.class_school(c uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select school_id from public.classes where id = c;
$$;
revoke all on function private.current_school(), private.is_admin_of(uuid), private.child_school(uuid), private.class_school(uuid) from public;
grant execute on function private.current_school(), private.is_admin_of(uuid), private.child_school(uuid), private.class_school(uuid) to authenticated;
-- Server scripts insert with the service role, which evaluates the school default below.
grant usage on schema private to service_role;
grant execute on function private.current_school() to service_role;

-- New records join the acting administrator's school; server scripts default to the staff school.
alter table public.profiles alter column school_id set default coalesce(private.current_school(), '00000000-0000-4000-8000-000000000001');
alter table public.classes alter column school_id set default coalesce(private.current_school(), '00000000-0000-4000-8000-000000000001');
alter table public.children alter column school_id set default coalesce(private.current_school(), '00000000-0000-4000-8000-000000000001');

-- Every administration write runs through security definer RPCs. This guard checks each row those
-- RPCs touch, before and after the change: the people, classes and children involved must all belong
-- to the signed-in user's school. Server jobs (no signed-in user) are not limited.
create function private.guard_school() returns trigger
language plpgsql security definer set search_path = '' as $$
declare mine uuid; touched uuid[] := '{}'; r jsonb;
begin
  if auth.uid() is null then return coalesce(new, old); end if;
  mine := private.current_school();
  for r in select x from (values (to_jsonb(old)), (to_jsonb(new))) v(x) where x is not null loop
    if tg_table_name in ('profiles', 'classes', 'children') then touched := touched || (r->>'school_id')::uuid; end if;
    if r ? 'child_id' then touched := touched || private.child_school((r->>'child_id')::uuid); end if;
    if r ? 'class_id' and r->>'class_id' is not null then touched := touched || private.class_school((r->>'class_id')::uuid); end if;
    if r ? 'teacher_id' then touched := touched || (select school_id from public.profiles where id = (r->>'teacher_id')::uuid); end if;
  end loop;
  if mine is null or exists (select 1 from unnest(touched) s where s is distinct from mine) then
    raise exception 'Selection unavailable' using errcode = '22023';
  end if;
  return coalesce(new, old);
end $$;
revoke all on function private.guard_school() from public, authenticated;
create trigger guard_school before insert or update or delete on public.profiles for each row execute function private.guard_school();
create trigger guard_school before insert or update or delete on public.classes for each row execute function private.guard_school();
create trigger guard_school before insert or update or delete on public.children for each row execute function private.guard_school();
create trigger guard_school before insert or update or delete on public.class_memberships for each row execute function private.guard_school();
create trigger guard_school before insert or update or delete on public.class_teachers for each row execute function private.guard_school();
create trigger guard_school before insert or update or delete on public.enrolments for each row execute function private.guard_school();
create trigger guard_school before insert or update or delete on public.teacher_assignments for each row execute function private.guard_school();

-- Administrator access is limited to the administrator's own school. Teacher access is unchanged:
-- it already runs through class assignments, which the guard keeps within one school.
create or replace function private.can_access_class(c uuid, p uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select private.is_admin_of(private.class_school(c)) or (private.is_active_staff() and exists(select 1 from public.classes k
 join public.class_teachers a on a.class_id=k.id join public.reporting_periods r on r.year=k.academic_year
 where k.id=c and r.id=p and k.archived_at is null and a.teacher_id=auth.uid()));
$$;
create or replace function private.can_access_enrolment(eid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.enrolments e where e.id=eid and private.is_admin_of(private.child_school(e.child_id)))
 or exists(select 1 from public.enrolments e
 join public.reporting_periods p on p.id=e.period_id
 join public.class_memberships m on m.child_id=e.child_id and m.academic_year=p.year and m.class_id=e.class_id and m.access_enabled
 join public.children c on c.id=e.child_id and c.archived_at is null
 where e.id=eid and private.can_access_class(m.class_id,e.period_id));
$$;
create or replace function private.can_access_child(c uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select private.is_admin_of(private.child_school(c)) or (private.is_active_staff() and exists(select 1 from public.class_memberships m
 join public.classes k on k.id=m.class_id and k.archived_at is null
 join public.class_teachers t on t.class_id=k.id and t.teacher_id=auth.uid()
 join public.children ch on ch.id=m.child_id and ch.archived_at is null
 where m.child_id=c and m.access_enabled));
$$;

drop policy profiles_read on public.profiles;
drop policy profiles_admin on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (id = (select auth.uid()) or private.is_admin_of(school_id));
create policy profiles_admin on public.profiles for all to authenticated using (private.is_admin_of(school_id)) with check (private.is_admin_of(school_id));
drop policy classes_read on public.classes;
drop policy classes_admin on public.classes;
create policy classes_read on public.classes for select to authenticated using (private.is_admin_of(school_id) or
 (private.is_active_staff() and archived_at is null and exists(select 1 from public.class_teachers t where t.class_id=classes.id and t.teacher_id=auth.uid())));
create policy classes_admin on public.classes for all to authenticated using (private.is_admin_of(school_id)) with check (private.is_admin_of(school_id));
drop policy children_admin on public.children;
create policy children_admin on public.children for all to authenticated using (private.is_admin_of(school_id)) with check (private.is_admin_of(school_id));
drop policy enrolments_admin on public.enrolments;
create policy enrolments_admin on public.enrolments for all to authenticated
 using (private.is_admin_of(private.child_school(child_id))) with check (private.is_admin_of(private.child_school(child_id)));
drop policy assignments_read on public.teacher_assignments;
drop policy assignments_admin on public.teacher_assignments;
create policy assignments_read on public.teacher_assignments for select to authenticated using (private.is_admin_of(private.class_school(class_id)) or (private.is_active_staff() and teacher_id=auth.uid()));
create policy assignments_admin on public.teacher_assignments for all to authenticated
 using (private.is_admin_of(private.class_school(class_id))) with check (private.is_admin_of(private.class_school(class_id)));
drop policy class_teachers_read on public.class_teachers;
create policy class_teachers_read on public.class_teachers for select to authenticated using (private.is_admin_of(private.class_school(class_id)) or (private.is_active_staff() and teacher_id=auth.uid()));
drop policy memberships_read on public.class_memberships;
create policy memberships_read on public.class_memberships for select to authenticated using (private.is_admin_of(private.child_school(child_id)) or
 (access_enabled and private.can_access_child(child_id) and private.can_access_class(class_id,
 (select p.id from public.reporting_periods p where p.year=academic_year order by p.semester desc limit 1))));

alter table public.schools enable row level security;
create policy schools_read on public.schools for select to authenticated using (id = private.current_school());
revoke all on public.schools from anon, authenticated;
grant select on public.schools to authenticated;
grant all on public.schools to service_role;

-- ---- Guest snapshot and nightly reset (server only) -------------------------------------------

-- The guest school's starting records. Photo files are kept in the private guest-snapshot bucket
-- under the same paths, so a photo a guest deletes comes back at the next reset.
create table private.guest_snapshot (
  id boolean primary key default true check (id),
  taken_at timestamptz not null default now(),
  data jsonb not null
);
revoke all on private.guest_snapshot from public, authenticated;
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
  values ('guest-snapshot', 'guest-snapshot', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']);

-- Removes every guest-school record except the guest administrators. Returns the sign-ins guests
-- created, for the server to delete once their profiles are gone.
create function private.clear_guest_school() returns uuid[]
language plpgsql security definer set search_path = '' as $$
declare s uuid := '00000000-0000-4000-8000-000000000002'; keep uuid[]; removed uuid[];
begin
  select coalesce(array_agg((p->>'id')::uuid), '{}') into keep
    from private.guest_snapshot g, jsonb_array_elements(g.data->'profiles') p;
  select coalesce(array_agg(u.id), '{}') into removed from auth.users u
    where u.id <> all(keep) and (u.raw_app_meta_data->>'riverbay_setup_by')::uuid in (select id from public.profiles where school_id = s and role = 'admin');
  delete from public.generation_runs r using public.domain_entries d, public.portfolios f, public.enrolments e
    where r.entry_id = d.id and d.portfolio_id = f.id and f.enrolment_id = e.id and private.child_school(e.child_id) = s;
  delete from public.photos ph using public.domain_entries d, public.portfolios f, public.enrolments e
    where ph.entry_id = d.id and d.portfolio_id = f.id and f.enrolment_id = e.id and private.child_school(e.child_id) = s;
  delete from public.domain_entries d using public.portfolios f, public.enrolments e
    where d.portfolio_id = f.id and f.enrolment_id = e.id and private.child_school(e.child_id) = s;
  delete from public.portfolios f using public.enrolments e where f.enrolment_id = e.id and private.child_school(e.child_id) = s;
  delete from public.enrolments e where private.child_school(e.child_id) = s;
  delete from public.teacher_assignments a where private.class_school(a.class_id) = s;
  delete from public.class_teachers t where private.class_school(t.class_id) = s;
  delete from public.class_memberships m where private.child_school(m.child_id) = s;
  delete from public.children where school_id = s;
  delete from public.classes where school_id = s;
  delete from public.profiles where school_id = s and role = 'teacher';
  update public.profiles set is_active = true where school_id = s and role = 'admin';
  -- Years a guest opened that nothing uses any more.
  delete from public.reporting_periods p where not exists (select 1 from public.enrolments e where e.period_id = p.id)
    and not exists (select 1 from public.teacher_assignments a where a.period_id = p.id)
    and not exists (select 1 from public.classes k where k.academic_year = p.year);
  return removed;
end $$;
revoke all on function private.clear_guest_school() from public, authenticated;

-- First setup: copies the staff school's current records into the guest school with new IDs.
-- teacher_map pairs each staff teacher's ID with the sign-in created for their guest copy.
-- Returns the photo files to copy, as [{from, to}] storage paths.
create function public.copy_school_to_guest(guest_admin uuid, teacher_map jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare s uuid := '00000000-0000-4000-8000-000000000002'; m uuid := '00000000-0000-4000-8000-000000000001'; files jsonb;
begin
  if exists (select 1 from private.guest_snapshot) then raise exception 'The guest school already exists' using errcode = '23505'; end if;
  perform pg_advisory_xact_lock(1920261019);
  perform private.clear_guest_school();
  insert into public.profiles(id, display_name, role, is_active, email, school_id)
    select guest_admin, 'Guest Administrator', 'admin', true, u.email, s from auth.users u where u.id = guest_admin
    on conflict (id) do update set role = 'admin', is_active = true, school_id = s;

  create temp table guest_ids(kind text, old_id uuid, new_id uuid, primary key (kind, old_id)) on commit drop;
  insert into guest_ids select 'teacher', key::uuid, value::uuid from jsonb_each_text(teacher_map);
  insert into guest_ids select 'class', id, gen_random_uuid() from public.classes where school_id = m;
  insert into guest_ids select 'child', id, gen_random_uuid() from public.children where school_id = m;
  insert into guest_ids select 'enrolment', e.id, gen_random_uuid() from public.enrolments e where private.child_school(e.child_id) = m;
  insert into guest_ids select 'portfolio', f.id, gen_random_uuid() from public.portfolios f join guest_ids g on g.kind = 'enrolment' and g.old_id = f.enrolment_id;
  insert into guest_ids select 'entry', d.id, gen_random_uuid() from public.domain_entries d join guest_ids g on g.kind = 'portfolio' and g.old_id = d.portfolio_id;
  insert into guest_ids select 'photo', ph.id, gen_random_uuid() from public.photos ph join guest_ids g on g.kind = 'entry' and g.old_id = ph.entry_id;

  insert into public.profiles(id, display_name, role, is_active, email, school_id)
    select g.new_id, p.display_name, 'teacher', p.is_active, u.email, s
    from public.profiles p join guest_ids g on g.kind = 'teacher' and g.old_id = p.id join auth.users u on u.id = g.new_id;
  insert into public.classes(id, name, level, academic_year, archived_at, school_id)
    select g.new_id, k.name, k.level, k.academic_year, k.archived_at, s from public.classes k join guest_ids g on g.kind = 'class' and g.old_id = k.id;
  insert into public.children(id, display_name, archived_at, school_id)
    select g.new_id, c.display_name, c.archived_at, s from public.children c join guest_ids g on g.kind = 'child' and g.old_id = c.id order by c.student_number;
  insert into public.class_memberships(child_id, academic_year, class_id, access_enabled)
    select gc.new_id, mb.academic_year, gk.new_id, mb.access_enabled from public.class_memberships mb
    join guest_ids gc on gc.kind = 'child' and gc.old_id = mb.child_id left join guest_ids gk on gk.kind = 'class' and gk.old_id = mb.class_id;
  insert into public.class_teachers(teacher_id, class_id)
    select gt.new_id, gk.new_id from public.class_teachers t
    join guest_ids gt on gt.kind = 'teacher' and gt.old_id = t.teacher_id join guest_ids gk on gk.kind = 'class' and gk.old_id = t.class_id;
  insert into public.teacher_assignments(teacher_id, class_id, period_id)
    select gt.new_id, gk.new_id, a.period_id from public.teacher_assignments a
    join guest_ids gt on gt.kind = 'teacher' and gt.old_id = a.teacher_id join guest_ids gk on gk.kind = 'class' and gk.old_id = a.class_id;
  insert into public.enrolments(id, child_id, class_id, period_id)
    select ge.new_id, gc.new_id, gk.new_id, e.period_id from public.enrolments e join guest_ids ge on ge.kind = 'enrolment' and ge.old_id = e.id
    join guest_ids gc on gc.kind = 'child' and gc.old_id = e.child_id join guest_ids gk on gk.kind = 'class' and gk.old_id = e.class_id;
  insert into public.portfolios(id, enrolment_id, created_at)
    select gf.new_id, ge.new_id, f.created_at from public.portfolios f join guest_ids gf on gf.kind = 'portfolio' and gf.old_id = f.id
    join guest_ids ge on ge.kind = 'enrolment' and ge.old_id = f.enrolment_id;
  insert into public.domain_entries(id, portfolio_id, domain, rating, rating_scale_version, comments, narrative, revision,
      reviewed_revision, reviewed_by, reviewed_at, guideline_version, updated_at, observations)
    select gd.new_id, gf.new_id, d.domain, d.rating, d.rating_scale_version, d.comments, d.narrative, d.revision,
      case when gr.new_id is null then null else d.reviewed_revision end, gr.new_id, case when gr.new_id is null then null else d.reviewed_at end,
      d.guideline_version, d.updated_at, d.observations
    from public.domain_entries d join guest_ids gd on gd.kind = 'entry' and gd.old_id = d.id
    join guest_ids gf on gf.kind = 'portfolio' and gf.old_id = d.portfolio_id left join guest_ids gr on gr.kind = 'teacher' and gr.old_id = d.reviewed_by;
  insert into public.photos(id, entry_id, storage_key, caption, position, uploaded_by, created_at)
    select gp.new_id, gd.new_id, gd.new_id::text || '/' || split_part(ph.storage_key, '/', 2), ph.caption, ph.position,
      coalesce(gt.new_id, guest_admin), ph.created_at
    from public.photos ph join guest_ids gp on gp.kind = 'photo' and gp.old_id = ph.id
    join guest_ids gd on gd.kind = 'entry' and gd.old_id = ph.entry_id left join guest_ids gt on gt.kind = 'teacher' and gt.old_id = ph.uploaded_by;

  select coalesce(jsonb_agg(jsonb_build_object('from', ph.storage_key, 'to', n.storage_key)), '[]') into files
    from public.photos ph join guest_ids gp on gp.kind = 'photo' and gp.old_id = ph.id join public.photos n on n.id = gp.new_id;
  return files;
end $$;

-- Saves the guest school's current records as the state every reset returns to.
create function public.capture_guest_snapshot() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare s uuid := '00000000-0000-4000-8000-000000000002'; snap jsonb;
begin
  perform pg_advisory_xact_lock(1920261019);
  snap := jsonb_build_object(
    'reporting_periods', (select coalesce(jsonb_agg(to_jsonb(p)), '[]') from public.reporting_periods p
      where exists (select 1 from public.enrolments e where e.period_id = p.id and private.child_school(e.child_id) = s)),
    'profiles', (select coalesce(jsonb_agg(to_jsonb(p) - 'staff_code'), '[]') from public.profiles p where p.school_id = s and p.role = 'teacher'),
    'classes', (select coalesce(jsonb_agg(to_jsonb(k)), '[]') from public.classes k where k.school_id = s),
    'children', (select coalesce(jsonb_agg(to_jsonb(c) - 'student_code'), '[]') from public.children c where c.school_id = s),
    'class_memberships', (select coalesce(jsonb_agg(to_jsonb(mb)), '[]') from public.class_memberships mb where private.child_school(mb.child_id) = s),
    'class_teachers', (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from public.class_teachers t where private.class_school(t.class_id) = s),
    'teacher_assignments', (select coalesce(jsonb_agg(to_jsonb(a)), '[]') from public.teacher_assignments a where private.class_school(a.class_id) = s),
    'enrolments', (select coalesce(jsonb_agg(to_jsonb(e)), '[]') from public.enrolments e where private.child_school(e.child_id) = s),
    'portfolios', (select coalesce(jsonb_agg(to_jsonb(f)), '[]') from public.portfolios f join public.enrolments e on e.id = f.enrolment_id where private.child_school(e.child_id) = s),
    'domain_entries', (select coalesce(jsonb_agg(to_jsonb(d)), '[]') from public.domain_entries d join public.portfolios f on f.id = d.portfolio_id
      join public.enrolments e on e.id = f.enrolment_id where private.child_school(e.child_id) = s),
    'photos', (select coalesce(jsonb_agg(to_jsonb(ph)), '[]') from public.photos ph join public.domain_entries d on d.id = ph.entry_id
      join public.portfolios f on f.id = d.portfolio_id join public.enrolments e on e.id = f.enrolment_id where private.child_school(e.child_id) = s));
  insert into private.guest_snapshot(id, taken_at, data) values (true, now(), snap)
    on conflict (id) do update set taken_at = excluded.taken_at, data = excluded.data;
  return jsonb_build_object('children', jsonb_array_length(snap->'children'), 'photos', jsonb_array_length(snap->'photos'));
end $$;

-- Storage work the server does before a reset: files guests added, PDFs guests created, and
-- snapshot photos that need copying back. Returns {ready: false} before the first setup.
create function public.guest_reset_plan() returns jsonb
language sql stable security definer set search_path = '' as $$
  with snap as (select data from private.guest_snapshot where id),
  keep as (select p->>'storage_key' as key from snap, jsonb_array_elements(snap.data->'photos') p),
  entries as (
    select d->>'id' as id from snap, jsonb_array_elements(snap.data->'domain_entries') d
    union select d.id::text from public.domain_entries d join public.portfolios f on f.id = d.portfolio_id
      join public.enrolments e on e.id = f.enrolment_id where private.child_school(e.child_id) = '00000000-0000-4000-8000-000000000002'),
  folios as (
    select f->>'id' as id from snap, jsonb_array_elements(snap.data->'portfolios') f
    union select f.id::text from public.portfolios f join public.enrolments e on e.id = f.enrolment_id
      where private.child_school(e.child_id) = '00000000-0000-4000-8000-000000000002')
  select case when not exists (select 1 from snap) then jsonb_build_object('ready', false) else jsonb_build_object(
    'ready', true,
    'remove_photos', coalesce((select jsonb_agg(o.name) from storage.objects o where o.bucket_id = 'portfolio-photos'
      and split_part(o.name, '/', 1) in (select id from entries) and o.name not in (select key from keep)), '[]'),
    'remove_exports', coalesce((select jsonb_agg(o.name) from storage.objects o where o.bucket_id = 'portfolio-exports'
      and split_part(o.name, '/', 1) in (select id from folios)), '[]'),
    'restore_photos', coalesce((select jsonb_agg(k.key) from keep k where not exists
      (select 1 from storage.objects o where o.bucket_id = 'portfolio-photos' and o.name = k.key)), '[]')) end;
$$;

-- Puts the guest school back to the snapshot in one transaction. Returns the sign-ins guests created.
create function public.reset_guest_school() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare snap jsonb; removed uuid[];
begin
  select data into snap from private.guest_snapshot where id;
  if snap is null then raise exception 'The guest school has no snapshot yet' using errcode = 'P0002'; end if;
  perform pg_advisory_xact_lock(1920261019);
  removed := private.clear_guest_school();
  insert into public.reporting_periods select * from jsonb_populate_recordset(null::public.reporting_periods, snap->'reporting_periods')
    on conflict do nothing;
  insert into public.profiles(id, display_name, role, is_active, email, staff_number, school_id) overriding system value
    select id, display_name, role, is_active, email, staff_number, school_id from jsonb_populate_recordset(null::public.profiles, snap->'profiles');
  insert into public.classes select * from jsonb_populate_recordset(null::public.classes, snap->'classes');
  insert into public.children(id, display_name, archived_at, student_number, school_id) overriding system value
    select id, display_name, archived_at, student_number, school_id from jsonb_populate_recordset(null::public.children, snap->'children');
  insert into public.class_memberships select * from jsonb_populate_recordset(null::public.class_memberships, snap->'class_memberships');
  insert into public.class_teachers select * from jsonb_populate_recordset(null::public.class_teachers, snap->'class_teachers');
  insert into public.teacher_assignments select * from jsonb_populate_recordset(null::public.teacher_assignments, snap->'teacher_assignments');
  insert into public.enrolments select * from jsonb_populate_recordset(null::public.enrolments, snap->'enrolments');
  insert into public.portfolios select * from jsonb_populate_recordset(null::public.portfolios, snap->'portfolios');
  insert into public.domain_entries select * from jsonb_populate_recordset(null::public.domain_entries, snap->'domain_entries');
  insert into public.photos select * from jsonb_populate_recordset(null::public.photos, snap->'photos');
  return jsonb_build_object('removed_users', to_jsonb(removed));
end $$;

revoke all on function public.copy_school_to_guest(uuid, jsonb), public.capture_guest_snapshot(), public.guest_reset_plan(), public.reset_guest_school() from public, anon, authenticated;
grant execute on function public.copy_school_to_guest(uuid, jsonb), public.capture_guest_snapshot(), public.guest_reset_plan(), public.reset_guest_school() to service_role;
