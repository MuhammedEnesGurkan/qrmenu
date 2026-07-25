alter table asset_object alter column content drop not null;
alter table asset_object add column object_key varchar(500);
alter table asset_object add constraint ck_asset_payload check(content is not null or object_key is not null);
