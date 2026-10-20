-- Permanent human-readable staff references; UUIDs remain relational keys.
-- All profiles receive a reference so a future role change need not replace it.
alter table public.profiles add column staff_number bigint generated always as identity unique;
alter table public.profiles add column staff_code text generated always as
 ('RB-T' || lpad(staff_number::text, greatest(6,length(staff_number::text)), '0')) stored unique;
