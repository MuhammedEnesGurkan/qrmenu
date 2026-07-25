create table dining_area (
    id uuid primary key, tenant_id uuid not null references tenant(id),
    branch_id uuid not null references branch(id), name varchar(140) not null,
    sort_order integer not null default 0, active boolean not null default true,
    created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
    unique(id,tenant_id)
);
create index idx_area_tenant_branch on dining_area(tenant_id,branch_id);

create table dining_table (
    id uuid primary key, tenant_id uuid not null references tenant(id),
    branch_id uuid not null references branch(id), area_id uuid not null,
    name varchar(100) not null, capacity integer check(capacity between 1 and 100),
    active boolean not null default true, created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(), unique(id,tenant_id),
    foreign key(area_id,tenant_id) references dining_area(id,tenant_id)
);
create index idx_table_tenant_branch on dining_table(tenant_id,branch_id);

create table table_qr_token (
    id uuid primary key, tenant_id uuid not null references tenant(id),
    table_id uuid not null, token_hash char(64) not null unique, active boolean not null default true,
    created_at timestamptz not null default now(), rotated_at timestamptz,
    foreign key(table_id,tenant_id) references dining_table(id,tenant_id)
);
create unique index uq_active_table_token on table_qr_token(table_id) where active=true;

create table table_session (
    id uuid primary key, tenant_id uuid not null references tenant(id),
    branch_id uuid not null references branch(id), table_id uuid not null,
   token_hash char(64) not null unique, expires_at timestamptz not null,
    csrf_hash char(64) not null,
    created_at timestamptz not null default now(),
    foreign key(table_id,tenant_id) references dining_table(id,tenant_id)
);
create index idx_table_session_expiry on table_session(expires_at);

create table customer_order (
    id uuid primary key, tenant_id uuid not null references tenant(id),
    branch_id uuid not null references branch(id), table_id uuid references dining_table(id),
    table_session_id uuid references table_session(id), service_mode varchar(20) not null
      check(service_mode in('DINE_IN','SELF_SERVICE')),
    state varchar(30) not null check(state in('SUBMITTED','ACCEPTED','REJECTED','PREPARING','READY','SERVING','DELIVERED','CANCELLED','READY_FOR_PICKUP','PICKED_UP')),
    idempotency_key varchar(100) not null, estimated_total numeric(12,2) not null check(estimated_total>=0),
    currency varchar(3) not null, pickup_number varchar(12), customer_note varchar(500),
    version bigint not null default 0, submitted_at timestamptz not null default now(),
    updated_at timestamptz not null default now(), unique(tenant_id,idempotency_key), unique(id,tenant_id)
);
create index idx_order_tenant_branch_state on customer_order(tenant_id,branch_id,state,submitted_at);

create table order_item (
    id uuid primary key, tenant_id uuid not null references tenant(id), order_id uuid not null,
    product_id uuid references product(id), product_name_snapshot varchar(180) not null,
    unit_price_snapshot numeric(12,2) not null, currency varchar(3) not null,
    quantity integer not null check(quantity between 1 and 50), notes varchar(300),
    created_at timestamptz not null default now(),
    foreign key(order_id,tenant_id) references customer_order(id,tenant_id)
);
create index idx_order_item_order on order_item(tenant_id,order_id);

create table waiter_call (
    id uuid primary key, tenant_id uuid not null references tenant(id), branch_id uuid not null references branch(id),
    table_id uuid not null references dining_table(id), table_session_id uuid not null references table_session(id),
    status varchar(20) not null default 'PENDING' check(status in('PENDING','ACKNOWLEDGED','RESOLVED')),
    message varchar(200), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index idx_waiter_call_open on waiter_call(tenant_id,branch_id,status,created_at);

create table outbox_event (
    id uuid primary key, tenant_id uuid not null references tenant(id), aggregate_type varchar(60) not null,
    aggregate_id uuid not null, event_type varchar(100) not null, payload_json text not null,
    created_at timestamptz not null default now(), published_at timestamptz
);
create index idx_outbox_unpublished on outbox_event(created_at) where published_at is null;

alter table dining_area enable row level security; alter table dining_table enable row level security;
alter table table_qr_token enable row level security; alter table table_session enable row level security;
alter table customer_order enable row level security; alter table order_item enable row level security;
alter table waiter_call enable row level security; alter table outbox_event enable row level security;
revoke all on table dining_area,dining_table,table_qr_token,table_session,customer_order,order_item,waiter_call,outbox_event
from anon,authenticated,service_role;
