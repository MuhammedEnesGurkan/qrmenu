# Domain modeli

`Tenant → Branch → Menu → Category → Product` ücretsiz katalog omurgasıdır.
Tenant sahipli her tabloda `tenant_id`; branch kaydında ayrıca `branch_id`
bulunur. Bileşik foreign key, aynı tenant'a ait olmayan ebeveyn/çocuk bağını
veritabanı seviyesinde engeller.

Operasyon katmanı Area, DiningTable, QrCodeToken, TableSession, Order ve
KitchenStation; ticari katman AddonPlan, AddonSubscription, TenantAddon ve
BillingEvent; güvenilirlik katmanı AuditLog, OutboxEvent ve IdempotencyRecord
ekler.

