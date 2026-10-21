-- Observations are one revision-checked aggregate with the domain entry.
alter table public.domain_entries add column observations jsonb not null default '[]'::jsonb
  check (jsonb_typeof(observations) = 'array' and jsonb_array_length(observations) <= 100);

-- Preserve existing freeform notes exactly, without guessing dates from prose.
update public.domain_entries set observations = jsonb_build_array(jsonb_build_object(
  'id', gen_random_uuid(), 'date', null, 'text', comments
)) where btrim(comments) <> '';

create function public.save_domain_observations(entry_id uuid, expected_revision integer, new_rating smallint, new_narrative text, new_observations jsonb)
returns public.domain_entries language plpgsql security definer set search_path = '' as $$
declare result public.domain_entries; item jsonb; parsed_date date;
begin
  if auth.uid() is null or not private.can_access_entry(entry_id) then
    raise exception 'Entry unavailable' using errcode = '42501';
  end if;
  if new_observations is null or jsonb_typeof(new_observations) <> 'array' then
    raise exception 'Observations must be a list' using errcode = '22023';
  end if;
  if jsonb_array_length(new_observations) > 100 or length(new_observations::text) > 120000 then
    raise exception 'Too many observations' using errcode = '22023';
  end if;
  for item in select value from jsonb_array_elements(new_observations) loop
    if jsonb_typeof(item) <> 'object' or jsonb_typeof(item->'text') is distinct from 'string'
      or length(btrim(item->>'text')) = 0 or length(item->>'text') > 6000
      or (item->>'id') is null then
      raise exception 'Invalid observation' using errcode = '22023';
    end if;
    perform (item->>'id')::uuid;
    if item->>'date' is not null then
      if (item->>'date') !~ '^\d{4}-\d{2}-\d{2}$' then
        raise exception 'Invalid observation date' using errcode = '22023';
      end if;
      parsed_date := (item->>'date')::date;
    end if;
  end loop;
  if (select count(distinct value->>'id') from jsonb_array_elements(new_observations)) <> jsonb_array_length(new_observations) then
    raise exception 'Duplicate observation' using errcode = '22023';
  end if;
  update public.domain_entries set observations = new_observations,
    -- Keep the legacy comment preview useful; the structured notes remain complete.
    comments = left(coalesce((select string_agg(value->>'text', E'\n\n' order by ord) from jsonb_array_elements(new_observations) with ordinality as notes(value,ord)), ''),6000),
    rating = new_rating, narrative = new_narrative,
    revision = revision + 1, reviewed_revision = null, reviewed_by = null, reviewed_at = null, updated_at = now()
    where id = entry_id and revision = expected_revision returning * into result;
  if result.id is null then raise exception 'This entry changed. Reload before saving.' using errcode = '40001'; end if;
  return result;
end;
$$;
revoke all on function public.save_domain_observations(uuid,integer,smallint,text,jsonb) from public;
grant execute on function public.save_domain_observations(uuid,integer,smallint,text,jsonb) to authenticated;
