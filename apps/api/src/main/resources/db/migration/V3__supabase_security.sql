-- The public schema is exposed by Supabase's Data API. MasaAkis accesses these
-- tables only through the Spring API, so browser-facing database roles receive
-- no direct table access. The postgres owner used by the backend bypasses RLS.
alter table tenant enable row level security;
alter table branch enable row level security;
alter table menu enable row level security;
alter table menu_category enable row level security;
alter table product enable row level security;

revoke all on table tenant, branch, menu, menu_category, product
from anon, authenticated, service_role;
