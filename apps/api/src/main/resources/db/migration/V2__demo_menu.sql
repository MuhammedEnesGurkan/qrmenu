insert into tenant (id, name) values
('10000000-0000-0000-0000-000000000001', 'Demo Kafe');

insert into branch (id, tenant_id, name) values
('20000000-0000-0000-0000-000000000001',
 '10000000-0000-0000-0000-000000000001', 'Merkez');

insert into menu (id, tenant_id, branch_id, slug, name, description, locale, published)
values ('30000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000001',
        'demo-kafe', 'Demo Kafe',
        'Günün iyi anlarına eşlik eden taze lezzetler.', 'tr', true);

insert into menu_category (id, tenant_id, menu_id, name, sort_order) values
('40000000-0000-0000-0000-000000000001',
 '10000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000001', 'Kahveler', 10),
('40000000-0000-0000-0000-000000000002',
 '10000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000001', 'Tatlılar', 20);

insert into product
(id, tenant_id, category_id, sku, name, description, allergen_info, price, sort_order)
values
('50000000-0000-0000-0000-000000000001',
 '10000000-0000-0000-0000-000000000001',
 '40000000-0000-0000-0000-000000000001',
 'KHV-001', 'Flat White', 'Çift shot espresso ve kadifemsi süt.', 'Süt içerir.', 125.00, 10),
('50000000-0000-0000-0000-000000000002',
 '10000000-0000-0000-0000-000000000001',
 '40000000-0000-0000-0000-000000000001',
 'KHV-002', 'Filtre Kahve', 'Günün çekirdeğiyle taze demlenir.', null, 95.00, 20),
('50000000-0000-0000-0000-000000000003',
 '10000000-0000-0000-0000-000000000001',
 '40000000-0000-0000-0000-000000000002',
 'TTL-001', 'San Sebastian', 'Yoğun kıvamlı fırın cheesecake.', 'Süt, yumurta ve gluten içerir.', 185.00, 10);

