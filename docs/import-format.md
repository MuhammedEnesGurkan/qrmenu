# Ürün içe aktarma formatı

CSV/XLSX kolonları: `sku`, `category`, `name`, `description`, `price`,
`currency`, `active`, `available`, `allergens`.

XLSM/makro ve formül hücreleri reddedilir; CSV export hücreleri `=`, `+`, `-`
ve `@` başlangıcına karşı escape edilir. Dosya/row limiti ve SHA-256 hash
zorunludur. PREVIEW yazmaz; COMMIT aynı import için en fazla bir kez çalışır.

