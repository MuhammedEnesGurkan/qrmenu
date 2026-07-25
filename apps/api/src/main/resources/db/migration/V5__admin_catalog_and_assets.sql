alter table menu add column published_at timestamptz;
alter table menu_category add column archived boolean not null default false;
alter table product add column version bigint not null default 0;

create table asset_object (
    id uuid primary key,
    tenant_id uuid not null references tenant(id),
    content_type varchar(80) not null check (content_type in ('image/png')),
    byte_size integer not null check (byte_size > 0 and byte_size <= 5242880),
    sha256 char(64) not null,
    content bytea not null,
    created_at timestamptz not null default now(),
    unique (tenant_id, sha256)
);
create index idx_asset_tenant on asset_object(tenant_id, created_at desc);

alter table asset_object enable row level security;
revoke all on table asset_object from anon, authenticated, service_role;
