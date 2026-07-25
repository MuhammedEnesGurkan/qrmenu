# Modül sınırları

Modüller: identity, tenancy, subscription, addon, branch, catalog, pricing,
menu, tableqr, ordering, kitchen, selfservice, service-request, import-export,
notification, reporting, branding, audit ve security.

`domain` katmanı API veya persistence ayrıntısına bağımlı olmaz. Bir modül başka
modülün repository'sini enjekte etmez. Senkron etkileşim application port,
asenkron etkileşim domain event + transactional outbox kullanır. ArchUnit bu
bağımlılık yönünü CI'da korur.

