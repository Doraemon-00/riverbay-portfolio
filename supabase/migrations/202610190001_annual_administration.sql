-- Annual class identity and membership; portfolio records keep their IDs and text.
alter table public.classes drop constraint classes_name_key;
alter table public.classes add column academic_year smallint not null default 2026 check (academic_year between 2020 and 2200);
alter table public.classes add column archived_at timestamptz;
alter table public.children add column archived_at timestamptz;
create unique index classes_annual_name on public.classes(academic_year, lower(name));
alter table public.classes add constraint classes_id_year unique(id, academic_year);

-- Split any class reused across existing years before backfilling annual membership.
do $$
declare r record; target uuid;
begin
  for r in select distinct c.id, c.name, c.level, p.year from public.classes c
    join public.enrolments e on e.class_id=c.id join public.reporting_periods p on p.id=e.period_id
    where p.year <> c.academic_year
  loop
    insert into public.classes(name,level,academic_year) values(r.name,r.level,r.year)
      on conflict do nothing;
    select id into target from public.classes where academic_year=r.year and lower(name)=lower(r.name);
    update public.enrolments e set class_id=target from public.reporting_periods p where e.class_id=r.id and e.period_id=p.id and p.year=r.year;
    update public.teacher_assignments a set class_id=target from public.reporting_periods p where a.class_id=r.id and a.period_id=p.id and p.year=r.year;
  end loop;
end $$;

create table public.class_memberships (
  child_id uuid not null references public.children(id) on delete restrict,
  academic_year smallint not null check(academic_year between 2020 and 2200),
  class_id uuid,
  primary key(child_id,academic_year),
  foreign key(class_id,academic_year) references public.classes(id,academic_year) on delete restrict
);
create index memberships_class on public.class_memberships(class_id);
create table public.class_teachers (
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  class_id uuid not null references public.classes(id) on delete restrict,
  primary key(teacher_id,class_id)
);
create index class_teachers_class on public.class_teachers(class_id);
insert into public.class_memberships(child_id,academic_year,class_id)
  select distinct on(e.child_id,p.year) e.child_id,p.year,e.class_id
  from public.enrolments e join public.reporting_periods p on p.id=e.period_id
  order by e.child_id,p.year,p.semester desc;
insert into public.class_teachers select distinct teacher_id,class_id from public.teacher_assignments;

-- Latest semester's assignment is authoritative when migrating the old demo.
-- Existing ratings, narratives, revisions and portfolio IDs remain untouched.
update public.enrolments e set class_id=m.class_id
  from public.class_memberships m, public.reporting_periods p
  where e.child_id=m.child_id and e.period_id=p.id and p.year=m.academic_year;

create function private.prepare_annual_portfolios(students uuid[], target uuid, yr smallint)
returns void language plpgsql security definer set search_path='' as $$
declare sid uuid; pid uuid; eid uuid; fid uuid;
begin
  insert into public.reporting_periods(year,semester) values(yr,1),(yr,2) on conflict do nothing;
  for sid in select unnest(students) loop
    for pid in select id from public.reporting_periods where year=yr loop
      insert into public.enrolments(child_id,class_id,period_id) values(sid,target,pid)
        on conflict(child_id,period_id) do update set class_id=excluded.class_id returning id into eid;
      insert into public.portfolios(enrolment_id) values(eid)
        on conflict(enrolment_id) do update set enrolment_id=excluded.enrolment_id returning id into fid;
      insert into public.domain_entries(portfolio_id,domain)
        select fid,unnest(enum_range(null::public.learning_domain)) on conflict do nothing;
    end loop;
  end loop;
end $$;
-- Populate missing semester shells for annual memberships without changing existing text.
do $$ declare c record; ids uuid[]; begin
  for c in select id,academic_year from public.classes loop
    select array_agg(child_id) into ids from public.class_memberships where class_id=c.id;
    if ids is not null then perform private.prepare_annual_portfolios(ids,c.id,c.academic_year); end if;
  end loop;
end $$;

create or replace function private.can_access_class(c uuid,p uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select private.is_admin() or exists(select 1 from public.classes k
    join public.class_teachers a on a.class_id=k.id
    join public.reporting_periods r on r.year=k.academic_year
    where k.id=c and r.id=p and k.archived_at is null and a.teacher_id=auth.uid());
$$;
create function private.can_access_enrolment(eid uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select private.is_admin() or exists(select 1 from public.enrolments e
    join public.reporting_periods p on p.id=e.period_id
    join public.class_memberships m on m.child_id=e.child_id and m.academic_year=p.year and m.class_id=e.class_id
    join public.children c on c.id=e.child_id and c.archived_at is null
    where e.id=eid and private.can_access_class(m.class_id,e.period_id));
$$;
create or replace function private.can_access_portfolio(p uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.portfolios f where f.id=p and private.can_access_enrolment(f.enrolment_id));
$$;
create or replace function private.can_access_child(c uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select private.is_admin() or exists(select 1 from public.class_memberships m
    join public.classes k on k.id=m.class_id and k.archived_at is null
    join public.class_teachers t on t.class_id=k.id and t.teacher_id=auth.uid()
    join public.children ch on ch.id=m.child_id and ch.archived_at is null where m.child_id=c);
$$;
drop policy enrolments_read on public.enrolments;
create policy enrolments_read on public.enrolments for select to authenticated using(private.can_access_enrolment(id));
drop policy classes_read on public.classes;
create policy classes_read on public.classes for select to authenticated using(private.is_admin() or
  (archived_at is null and exists(select 1 from public.class_teachers t where t.class_id=classes.id and t.teacher_id=auth.uid())));
alter table public.class_memberships enable row level security;
alter table public.class_teachers enable row level security;
create policy memberships_read on public.class_memberships for select to authenticated using(private.can_access_child(child_id));
create policy class_teachers_read on public.class_teachers for select to authenticated using(private.is_admin() or teacher_id=auth.uid());
grant select on public.class_memberships,public.class_teachers to authenticated;
grant all on public.class_memberships,public.class_teachers to service_role;
-- All administration writes are atomic RPCs; direct writes can no longer bypass annual rules.
revoke insert,update,delete on public.classes,public.children,public.enrolments,public.teacher_assignments,public.reporting_periods from authenticated;
revoke execute on function public.set_enrolment(uuid,uuid,uuid) from authenticated;
revoke all on function private.prepare_annual_portfolios(uuid[],uuid,smallint) from public,authenticated;
revoke all on function private.can_access_enrolment(uuid) from public;
grant execute on function private.can_access_enrolment(uuid) to authenticated;

create function public.manage_class(command text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare yr smallint; cid uuid; ids uuid[]; sid uuid; title text; lvl text; result uuid; n integer;
begin
  if auth.uid() is null or not private.is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
  -- Serialize small admin transactions to avoid move/archive races in this prototype.
  perform pg_advisory_xact_lock(1920261019);
  yr=(payload->>'year')::smallint;
  if yr is null or yr not between 2020 and 2200 then raise exception 'Invalid year' using errcode='22023'; end if;
  cid=nullif(payload->>'class_id','')::uuid;
  select array_agg(distinct v::uuid) into ids from jsonb_array_elements_text(coalesce(payload->'ids','[]')) v;
  if coalesce(cardinality(ids),0)>200 then raise exception 'Too many selections' using errcode='22023'; end if;
  if cid is not null and not exists(select 1 from public.classes where id=cid and academic_year=yr) then
    raise exception 'Class unavailable for this year' using errcode='22023'; end if;
  if command in ('create_class','rename_class') then
    lvl=payload->>'level'; title=btrim(payload->>'name');
    if lvl is null or lvl not in ('PG','N1','N2','K1','K2') or title is null or length(title) not between 1 and 60 then
      raise exception 'Invalid class name or level' using errcode='22023'; end if;
    if command='create_class' then
      insert into public.classes(name,level,academic_year) values(lvl||' '||title,lvl,yr) returning id into result;
      insert into public.reporting_periods(year,semester) values(yr,1),(yr,2) on conflict do nothing;
    else
      if cid is null then raise exception 'Class required' using errcode='22023'; end if;
      update public.classes set name=lvl||' '||title,level=lvl where id=cid returning id into result;
    end if;
  elsif command='create_student' then
    title=btrim(payload->>'name');
    if title is null or length(title) not between 1 and 100 then raise exception 'Student name required' using errcode='22023'; end if;
    if cid is not null and exists(select 1 from public.classes where id=cid and archived_at is not null) then raise exception 'Class archived' using errcode='22023'; end if;
    insert into public.children(display_name) values(title) returning id into result;
    insert into public.class_memberships(child_id,academic_year,class_id) values(result,yr,cid);
    if cid is not null then perform private.prepare_annual_portfolios(array[result],cid,yr); end if;
  elsif command in ('assign_students','remove_students','archive_students','restore_students') then
    if ids is null then raise exception 'Select students first' using errcode='22023'; end if;
    select count(*) into n from public.children where id=any(ids);
    if n<>cardinality(ids) then raise exception 'Selection unavailable' using errcode='22023'; end if;
    if command='assign_students' then
      if cid is null or not exists(select 1 from public.classes where id=cid and archived_at is null) then raise exception 'Choose an active class' using errcode='22023'; end if;
      if exists(select 1 from public.children where id=any(ids) and archived_at is not null) then raise exception 'Restore archived students first' using errcode='22023'; end if;
      insert into public.class_memberships(child_id,academic_year,class_id) select unnest(ids),yr,cid
        on conflict(child_id,academic_year) do update set class_id=excluded.class_id;
      perform private.prepare_annual_portfolios(ids,cid,yr);
    elsif command='remove_students' then
      select count(*) into n from public.class_memberships where child_id=any(ids) and academic_year=yr and class_id=cid;
      if n<>cardinality(ids) then raise exception 'Membership changed. Reload the class.' using errcode='40001'; end if;
      update public.class_memberships set class_id=null where child_id=any(ids) and academic_year=yr;
    elsif command='archive_students' then
      update public.children set archived_at=now() where id=any(ids) and archived_at is null;
    else
      update public.children set archived_at=null where id=any(ids);
    end if;
  elsif command in ('assign_teachers','remove_teachers') then
    if cid is null or ids is null then raise exception 'Select class and teachers' using errcode='22023'; end if;
    select count(*) into n from public.profiles where id=any(ids) and role='teacher';
    if n<>cardinality(ids) then raise exception 'Teacher selection unavailable' using errcode='22023'; end if;
    if command='assign_teachers' then
      if exists(select 1 from public.classes where id=cid and archived_at is not null) then raise exception 'Class archived' using errcode='22023'; end if;
      insert into public.class_teachers(teacher_id,class_id) select unnest(ids),cid on conflict do nothing;
    else
      delete from public.class_teachers where class_id=cid and teacher_id=any(ids);
    end if;
  elsif command in ('archive_class','restore_class','clear_class') then
    if cid is null then raise exception 'Class required' using errcode='22023'; end if;
    if command='archive_class' then update public.classes set archived_at=now() where id=cid;
    elsif command='restore_class' then update public.classes set archived_at=null where id=cid;
    else
      update public.class_memberships set class_id=null where class_id=cid;
      delete from public.class_teachers where class_id=cid;
    end if;
  else raise exception 'Unknown command' using errcode='22023'; end if;
  return jsonb_build_object('id',coalesce(result,cid),'count',coalesce(cardinality(ids),1));
end $$;
revoke all on function public.manage_class(text,jsonb) from public;
grant execute on function public.manage_class(text,jsonb) to authenticated;
