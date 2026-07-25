create table app_user (
    id uuid primary key,
    email varchar(254) not null,
    display_name varchar(140) not null,
    password_hash varchar(255) not null,
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create unique index uq_app_user_email_lower on app_user(lower(email));

create table membership (
    id uuid primary key,
    tenant_id uuid not null references tenant(id),
    user_id uuid not null references app_user(id),
    branch_id uuid references branch(id),
    role_code varchar(40) not null check (role_code in (
        'OWNER', 'BRANCH_MANAGER', 'MENU_EDITOR', 'WAITER', 'KITCHEN_STAFF', 'VIEWER'
    )),
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (tenant_id, user_id)
);
create index idx_membership_user on membership(user_id) where active = true;
create index idx_membership_tenant on membership(tenant_id) where active = true;

create table staff_session (
    id uuid primary key,
    user_id uuid not null references app_user(id) on delete cascade,
    token_hash char(64) not null unique,
    csrf_hash char(64) not null,
    expires_at timestamptz not null,
    last_seen_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);
create index idx_staff_session_expiry on staff_session(expires_at);

create table audit_log (
    id uuid primary key,
    tenant_id uuid references tenant(id),
    actor_user_id uuid references app_user(id),
    action varchar(100) not null,
    object_type varchar(80),
    object_id uuid,
    metadata_json text,
    created_at timestamptz not null default now()
);
create index idx_audit_tenant_created on audit_log(tenant_id, created_at desc);

alter table app_user enable row level security;
alter table membership enable row level security;
alter table staff_session enable row level security;
alter table audit_log enable row level security;

revoke all on table app_user, membership, staff_session, audit_log
from anon, authenticated, service_role;
