alter table staff_session add column active_branch_id uuid references branch(id);
alter table menu add column brand_primary_color varchar(7) not null default '#176b52';
alter table menu add column brand_surface_color varchar(7) not null default '#fffdf8';
alter table menu add column brand_font varchar(20) not null default 'SYSTEM' check(brand_font in('SYSTEM','SERIF','ROUNDED'));
alter table menu add column brand_layout varchar(20) not null default 'CARDS' check(brand_layout in('CARDS','COMPACT'));
alter table menu add column hide_powered_by boolean not null default false;
create table menu_translation(
 menu_id uuid not null,tenant_id uuid not null,locale varchar(8) not null,name varchar(140) not null,description varchar(500),
 primary key(menu_id,locale),foreign key(menu_id,tenant_id)references menu(id,tenant_id)
);
create table category_translation(
 category_id uuid not null,tenant_id uuid not null,locale varchar(8) not null,name varchar(140) not null,
 primary key(category_id,locale),foreign key(category_id,tenant_id)references menu_category(id,tenant_id)
);
create table product_translation(
 product_id uuid not null references product(id),tenant_id uuid not null,locale varchar(8) not null,
 name varchar(180) not null,description varchar(1000),allergen_info varchar(500),primary key(product_id,locale)
);
alter table menu_translation enable row level security;
alter table category_translation enable row level security;
alter table product_translation enable row level security;
revoke all on table menu_translation,category_translation,product_translation from anon,authenticated,service_role;
