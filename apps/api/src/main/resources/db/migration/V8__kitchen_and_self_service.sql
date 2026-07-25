alter table branch add column public_slug varchar(80);
update branch set public_slug='sube-'||substr(md5(id::text),1,12) where public_slug is null;
alter table branch alter column public_slug set not null;
alter table branch alter column public_slug set default ('sube-'||substr(md5(random()::text),1,12));
alter table branch add constraint uq_branch_public_slug unique(public_slug);

create table kitchen_station(
 id uuid primary key,tenant_id uuid not null references tenant(id),branch_id uuid not null references branch(id),
 name varchar(120) not null,sort_order integer not null default 0,active boolean not null default true,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(id,tenant_id)
);
create index idx_station_branch on kitchen_station(tenant_id,branch_id,sort_order);
create table kitchen_station_category(
 station_id uuid not null,tenant_id uuid not null,category_id uuid not null,
 primary key(station_id,category_id),foreign key(station_id,tenant_id)references kitchen_station(id,tenant_id),
 foreign key(category_id,tenant_id)references menu_category(id,tenant_id)
);
alter table order_item add column station_id uuid references kitchen_station(id);
alter table order_item add column kitchen_state varchar(20) not null default 'UNASSIGNED'
 check(kitchen_state in('UNASSIGNED','QUEUED','PREPARING','DONE'));
create index idx_kitchen_item_station on order_item(tenant_id,station_id,kitchen_state);
create unique index uq_pickup_number_open on customer_order(branch_id,pickup_number)
 where pickup_number is not null and state not in('PICKED_UP','CANCELLED','REJECTED');
alter table kitchen_station enable row level security;
alter table kitchen_station_category enable row level security;
revoke all on table kitchen_station,kitchen_station_category from anon,authenticated,service_role;
