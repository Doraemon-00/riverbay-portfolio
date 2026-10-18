create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create type public.app_role as enum ('admin', 'teacher');
create type public.learning_domain as enum ('english', 'chinese', 'mathematics', 'social_emotional');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  display_name text not null check (length(display_name) between 1 and 100),
  role public.app_role not null default 'teacher'
);
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(name) between 1 and 100),
  level text not null
);
create table public.reporting_periods (
  id uuid primary key default gen_random_uuid(),
  year smallint not null check (year between 2020 and 2200),
  semester smallint not null check (semester in (1, 2)),
  unique (year, semester)
);
create table public.teacher_assignments (
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  class_id uuid not null references public.classes(id) on delete restrict,
  period_id uuid not null references public.reporting_periods(id) on delete restrict,
  primary key (teacher_id, class_id, period_id)
);
create table public.children (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (length(display_name) between 1 and 100)
);
create table public.enrolments (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete restrict,
  class_id uuid not null references public.classes(id) on delete restrict,
  period_id uuid not null references public.reporting_periods(id) on delete restrict,
  unique (child_id, period_id)
);
create table public.portfolios (
  id uuid primary key default gen_random_uuid(),
  enrolment_id uuid not null unique references public.enrolments(id) on delete restrict,
  created_at timestamptz not null default now()
);
create table public.domain_entries (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete restrict,
  domain public.learning_domain not null,
  rating smallint check (rating between 1 and 3),
  rating_scale_version text not null default 'sample-domain-ring-v1',
  comments text not null default '' check (length(comments) <= 6000),
  narrative text not null default '' check (length(narrative) <= 10000),
  revision integer not null default 0 check (revision >= 0),
  reviewed_revision integer,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  guideline_version text,
  updated_at timestamptz not null default now(),
  unique (portfolio_id, domain),
  check (reviewed_revision is null or reviewed_revision = revision),
  check ((reviewed_revision is null and reviewed_by is null and reviewed_at is null)
    or (reviewed_revision is not null and reviewed_by is not null and reviewed_at is not null))
);
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.domain_entries(id) on delete restrict,
  storage_key text not null unique,
  caption text not null default '' check (length(caption) <= 300),
  position smallint not null default 0 check (position >= 0),
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  check (split_part(storage_key, '/', 1) = entry_id::text)
);
create table public.generation_runs (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.domain_entries(id) on delete restrict,
  input_revision integer not null,
  model_id text not null,
  prompt_version text not null,
  guideline_version text not null,
  candidate_text text,
  status text not null check (status in ('passed', 'flagged', 'failed')),
  findings jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index enrolments_scope on public.enrolments(class_id, period_id);
create index assignments_scope on public.teacher_assignments(class_id, period_id);
create index entries_portfolio on public.domain_entries(portfolio_id);
create index photos_entry on public.photos(entry_id);
create index runs_entry on public.generation_runs(entry_id);

create function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;
create function private.can_access_class(c uuid, p uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_admin() or exists (
    select 1 from public.teacher_assignments where teacher_id = (select auth.uid()) and class_id = c and period_id = p
  );
$$;
create function private.can_access_portfolio(p uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.portfolios f join public.enrolments e on e.id = f.enrolment_id
    where f.id = p and private.can_access_class(e.class_id, e.period_id));
$$;
create function private.can_access_entry(e uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.domain_entries where id = e and private.can_access_portfolio(portfolio_id));
$$;
create function private.can_access_child(c uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_admin() or exists (select 1 from public.enrolments where child_id = c and private.can_access_class(class_id, period_id));
$$;
create function private.can_access_photo_path(path text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.domain_entries where id::text = split_part(path, '/', 1) and private.can_access_portfolio(portfolio_id));
$$;
revoke all on all functions in schema private from public;
grant execute on all functions in schema private to authenticated;

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.reporting_periods enable row level security;
alter table public.teacher_assignments enable row level security;
alter table public.children enable row level security;
alter table public.enrolments enable row level security;
alter table public.portfolios enable row level security;
alter table public.domain_entries enable row level security;
alter table public.photos enable row level security;
alter table public.generation_runs enable row level security;

create policy profiles_read on public.profiles for select to authenticated using (id = (select auth.uid()) or private.is_admin());
create policy profiles_admin on public.profiles for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy classes_read on public.classes for select to authenticated using (private.is_admin() or exists (select 1 from public.teacher_assignments where class_id = classes.id and teacher_id = (select auth.uid())));
create policy classes_admin on public.classes for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy periods_read on public.reporting_periods for select to authenticated using (true);
create policy periods_admin on public.reporting_periods for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy assignments_read on public.teacher_assignments for select to authenticated using (teacher_id = (select auth.uid()) or private.is_admin());
create policy assignments_admin on public.teacher_assignments for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy children_read on public.children for select to authenticated using (private.can_access_child(id));
create policy children_admin on public.children for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy enrolments_read on public.enrolments for select to authenticated using (private.can_access_class(class_id, period_id));
create policy enrolments_admin on public.enrolments for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy portfolios_read on public.portfolios for select to authenticated using (private.can_access_portfolio(id));
create policy entries_read on public.domain_entries for select to authenticated using (private.can_access_portfolio(portfolio_id));
create policy photos_read on public.photos for select to authenticated using (private.can_access_entry(entry_id));
create policy photos_insert on public.photos for insert to authenticated with check (private.can_access_entry(entry_id) and uploaded_by = (select auth.uid()));
create policy photos_update on public.photos for update to authenticated using (private.can_access_entry(entry_id)) with check (private.can_access_entry(entry_id));
create policy photos_delete on public.photos for delete to authenticated using (private.can_access_entry(entry_id));
create policy runs_read on public.generation_runs for select to authenticated using (private.can_access_entry(entry_id));

-- Entry writes go through this narrow function, preventing forged review/revision fields.
create function public.save_domain_entry(entry_id uuid, expected_revision integer, new_rating smallint, new_comments text, new_narrative text)
returns public.domain_entries language plpgsql security definer set search_path = '' as $$
declare result public.domain_entries;
begin
  if auth.uid() is null or not private.can_access_entry(entry_id) then
    raise exception 'Entry unavailable' using errcode = '42501';
  end if;
  update public.domain_entries set rating = new_rating, comments = new_comments, narrative = new_narrative,
    revision = revision + 1, reviewed_revision = null, reviewed_by = null, reviewed_at = null, updated_at = now()
    where id = entry_id and revision = expected_revision returning * into result;
  if result.id is null then raise exception 'This entry changed. Reload before saving.' using errcode = '40001'; end if;
  return result;
end;
$$;

create function public.set_enrolment(student_id uuid, target_class uuid, target_period uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare enrolment uuid; portfolio uuid;
begin
  if auth.uid() is null or not private.is_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  insert into public.enrolments(child_id, class_id, period_id) values (student_id, target_class, target_period)
    on conflict (child_id, period_id) do update set class_id = excluded.class_id returning id into enrolment;
  insert into public.portfolios(enrolment_id) values (enrolment)
    on conflict (enrolment_id) do update set enrolment_id = excluded.enrolment_id returning id into portfolio;
  insert into public.domain_entries(portfolio_id, domain)
    select portfolio, unnest(enum_range(null::public.learning_domain)) on conflict (portfolio_id, domain) do nothing;
  return enrolment;
end;
$$;

create function public.previous_semester_ratings(current_portfolio uuid)
returns table(domain public.learning_domain, rating smallint, rating_scale_version text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not private.can_access_portfolio(current_portfolio) then
    raise exception 'Portfolio unavailable' using errcode = '42501';
  end if;
  return query select d.domain, d.rating, d.rating_scale_version
    from public.portfolios f
    join public.enrolments e on e.id = f.enrolment_id
    join public.reporting_periods r on r.id = e.period_id and r.semester = 2
    join public.reporting_periods prev on prev.year = r.year and prev.semester = 1
    join public.enrolments pe on pe.child_id = e.child_id and pe.period_id = prev.id
    join public.portfolios pf on pf.enrolment_id = pe.id
    join public.domain_entries d on d.portfolio_id = pf.id
    where f.id = current_portfolio;
end;
$$;
revoke all on function public.save_domain_entry(uuid, integer, smallint, text, text) from public;
revoke all on function public.set_enrolment(uuid, uuid, uuid) from public;
revoke all on function public.previous_semester_ratings(uuid) from public;
grant execute on function public.save_domain_entry(uuid, integer, smallint, text, text) to authenticated;
grant execute on function public.set_enrolment(uuid, uuid, uuid) to authenticated;
grant execute on function public.previous_semester_ratings(uuid) to authenticated;

-- Explicit privileges: RLS controls row scope, privileges control write surfaces.
revoke all on public.profiles, public.classes, public.reporting_periods, public.teacher_assignments,
  public.children, public.enrolments, public.portfolios, public.domain_entries, public.photos, public.generation_runs from anon, authenticated;
grant select on all tables in schema public to authenticated;
grant insert, update, delete on public.classes, public.reporting_periods, public.teacher_assignments, public.children, public.enrolments, public.photos to authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
  values ('portfolio-photos', 'portfolio-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']);
create policy portfolio_photos_read on storage.objects for select to authenticated
  using (bucket_id = 'portfolio-photos' and private.can_access_photo_path(name));
create policy portfolio_photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'portfolio-photos' and private.can_access_photo_path(name));
create policy portfolio_photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'portfolio-photos' and private.can_access_photo_path(name));
