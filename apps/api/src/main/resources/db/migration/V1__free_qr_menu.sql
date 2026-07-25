create table tenant (
    id uuid primary key,
    name varchar(140) not null,
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table branch (
    id uuid primary key,
    tenant_id uuid not null references tenant(id),
    name varchar(140) not null,
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index idx_branch_tenant on branch(tenant_id);

create table menu (
    id uuid primary key,
    tenant_id uuid not null references tenant(id),
    branch_id uuid not null references branch(id),
    slug varchar(120) not null unique,
    name varchar(140) not null,
    description varchar(500),
    logo_url varchar(500),
    locale varchar(8) not null default 'tr',
    published boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (id, tenant_id)
);
create index idx_menu_tenant_branch on menu(tenant_id, branch_id);

create table menu_category (
    id uuid primary key,
    tenant_id uuid not null references tenant(id),
    menu_id uuid not null,
    name varchar(140) not null,
    sort_order integer not null default 0,
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    foreign key (menu_id, tenant_id) references menu(id, tenant_id),
    unique (id, tenant_id)
);
create index idx_category_tenant_menu on menu_category(tenant_id, menu_id);

create table product (
    id uuid primary key,
    tenant_id uuid not null references tenant(id),
    category_id uuid not null,
    sku varchar(80),
    name varchar(180) not null,
    description varchar(1000),
    allergen_info varchar(500),
    image_url varchar(500),
    price numeric(12,2) not null check (price >= 0),
    currency varchar(3) not null default 'TRY',
    sort_order integer not null default 0,
    active boolean not null default true,
    available boolean not null default true,
    archived boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    foreign key (category_id, tenant_id) references menu_category(id, tenant_id),
    unique (tenant_id, sku)
);
create index idx_product_tenant_category on product(tenant_id, category_id);

comment on table menu is 'Kalıcı public slug taşıyan ücretsiz menü.';
comment on column product.price is 'Public katalog fiyatı; para değerleri numeric tutulur.';

