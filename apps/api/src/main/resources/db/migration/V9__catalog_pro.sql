create table catalog_import_job(
 id uuid primary key,tenant_id uuid not null references tenant(id),branch_id uuid not null references branch(id),
 file_hash char(64) not null,format varchar(8) not null check(format in('CSV','XLSX')),
 status varchar(20) not null check(status in('PREVIEW','COMMITTED')),valid_rows integer not null,error_rows integer not null,
 created_at timestamptz not null default now(),committed_at timestamptz,unique(tenant_id,file_hash)
);
create table catalog_import_row(
 job_id uuid not null references catalog_import_job(id),tenant_id uuid not null,row_number integer not null,
 category_name varchar(140),sku varchar(80),product_name varchar(180),description varchar(1000),allergens varchar(500),
 price numeric(12,2),currency varchar(3),active boolean,available boolean,status varchar(10) not null,message varchar(500),
 primary key(job_id,row_number)
);
create table price_change_batch(
 id uuid primary key,tenant_id uuid not null references tenant(id),branch_id uuid not null references branch(id),
 status varchar(20) not null check(status in('PREVIEW','COMMITTED','ROLLED_BACK','PARTIAL_ROLLBACK')),
 created_at timestamptz not null default now(),committed_at timestamptz,rolled_back_at timestamptz
);
create table price_change_item(
 batch_id uuid not null references price_change_batch(id),tenant_id uuid not null,product_id uuid not null,
 old_price numeric(12,2) not null,new_price numeric(12,2) not null,old_version bigint not null,
 applied_version bigint,rollback_status varchar(20),primary key(batch_id,product_id)
);
alter table catalog_import_job enable row level security;
alter table catalog_import_row enable row level security;
alter table price_change_batch enable row level security;
alter table price_change_item enable row level security;
revoke all on table catalog_import_job,catalog_import_row,price_change_batch,price_change_item from anon,authenticated,service_role;
