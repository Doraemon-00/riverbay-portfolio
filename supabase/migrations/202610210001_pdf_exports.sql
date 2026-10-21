-- Finished portfolio PDFs (store, then link). Objects live under '<portfolio id>/...';
-- only viewers who can access that portfolio may read, write or remove them.
-- PDFs are regenerated on demand from saved records; the app keeps only the latest export.
create function private.can_access_export_path(path text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.portfolios f where f.id::text = split_part(path, '/', 1) and private.can_access_portfolio(f.id));
$$;
revoke all on function private.can_access_export_path(text) from public;
grant execute on function private.can_access_export_path(text) to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
  values ('portfolio-exports', 'portfolio-exports', false, 52428800, array['application/pdf']);

create policy portfolio_exports_read on storage.objects for select to authenticated
  using (bucket_id = 'portfolio-exports' and private.can_access_export_path(name));
create policy portfolio_exports_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'portfolio-exports' and private.can_access_export_path(name));
create policy portfolio_exports_delete on storage.objects for delete to authenticated
  using (bucket_id = 'portfolio-exports' and private.can_access_export_path(name));
