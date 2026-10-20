-- Do not expose a child's memberships in unrelated years to a current teacher.
drop policy memberships_read on public.class_memberships;
create policy memberships_read on public.class_memberships for select to authenticated using(
  private.is_admin() or (private.can_access_child(child_id) and private.can_access_class(class_id,
    (select p.id from public.reporting_periods p where p.year=academic_year order by p.semester desc limit 1)))
);
