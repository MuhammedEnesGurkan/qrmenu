create table addon_plan (
    id uuid primary key,
    code varchar(60) not null unique,
    name varchar(140) not null,
    description varchar(500) not null,
    monthly_price numeric(12,2) not null check (monthly_price >= 0),
    currency varchar(3) not null default 'TRY',
    trial_days integer not null default 14 check (trial_days between 0 and 90),
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table addon_subscription (
    id uuid primary key,
    tenant_id uuid not null references tenant(id),
    addon_plan_id uuid not null references addon_plan(id),
    status varchar(30) not null check (status in ('INACTIVE','TRIAL','ACTIVE','PAST_DUE','CANCELLED','EXPIRED','SUSPENDED')),
    provider varchar(40) not null default 'MOCK',
    provider_reference varchar(160),
    starts_at timestamptz not null,
    trial_ends_at timestamptz,
    current_period_ends_at timestamptz,
    cancel_at_period_end boolean not null default false,
    version bigint not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (tenant_id, addon_plan_id),
    unique (provider, provider_reference)
);
create index idx_subscription_tenant_status on addon_subscription(tenant_id, status);

create table tenant_addon (
    id uuid primary key,
    tenant_id uuid not null references tenant(id),
    addon_plan_id uuid not null references addon_plan(id),
    subscription_id uuid references addon_subscription(id),
    enabled boolean not null default false,
    valid_from timestamptz,
    valid_until timestamptz,
    updated_at timestamptz not null default now(),
    unique (tenant_id, addon_plan_id)
);

create table billing_event (
    id uuid primary key,
    provider varchar(40) not null,
    external_event_id varchar(180) not null,
    event_type varchar(100) not null,
    payload_sha256 char(64) not null,
    processed_at timestamptz not null default now(),
    unique (provider, external_event_id)
);

insert into addon_plan (id,code,name,description,monthly_price,currency,trial_days) values
('61000000-0000-0000-0000-000000000001','TABLE_ORDERING','Masadan Sipariş','Masa QR oturumu, sepet, sipariş ve garson akışı.',499.00,'TRY',14),
('61000000-0000-0000-0000-000000000002','SELF_SERVICE','Self Servis','Teslim numarası ve hazır sipariş ekranı.',299.00,'TRY',14),
('61000000-0000-0000-0000-000000000003','CATALOG_PRO','Katalog Pro','Güvenli içe aktarma, dışa aktarma ve toplu fiyat.',349.00,'TRY',14),
('61000000-0000-0000-0000-000000000004','MULTILINGUAL','Çoklu Dil','Menü çevirileri ve eksik çeviri denetimi.',199.00,'TRY',14),
('61000000-0000-0000-0000-000000000005','ADVANCED_REPORTS','Gelişmiş Raporlar','Ödeme iddiası içermeyen operasyon raporları.',249.00,'TRY',14),
('61000000-0000-0000-0000-000000000006','MULTI_BRANCH','Çoklu Şube','Şube ekleme ve kapsamlı personel yönetimi.',399.00,'TRY',14),
('61000000-0000-0000-0000-000000000007','BRANDING','Markalama','Güvenli renk, yazı ve logo seçenekleri.',149.00,'TRY',14),
('61000000-0000-0000-0000-000000000008','KITCHEN_STATIONS','Mutfak İstasyonları','İstasyon yönlendirme ve mutfak ekranları.',299.00,'TRY',14);

alter table addon_plan enable row level security;
alter table addon_subscription enable row level security;
alter table tenant_addon enable row level security;
alter table billing_event enable row level security;
revoke all on table addon_plan, addon_subscription, tenant_addon, billing_event
from anon, authenticated, service_role;
