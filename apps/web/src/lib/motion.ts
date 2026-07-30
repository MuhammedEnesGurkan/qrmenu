/**
 * MasaAkış hareket sistemi.
 *
 * Tek kaynak: süre, easing ve yay değerleri burada tanımlanır. Component
 * içinde ham sayı yazılmaz — renk tokenlarında olduğu gibi hareket de
 * semantik isimlerden beslenir.
 *
 * Ölçek fikri: kullanıcı bir şeye dokunduğunda tepki `fast` olmalı (elin
 * altındaki his), bağlam değişimi `normal` (yön duygusu), ekranın büyük bir
 * parçası yer değiştiriyorsa `slow`. Bunun dışına çıkmak yavaş hissettirir.
 */

/** Süreler saniye cinsinden (motion API'si saniye ister). */
export const duration = {
  /** 160ms — basma geri bildirimi, hover, renk geçişi. */
  fast: 0.16,
  /** 240ms — sekme, kart, panel içeriği. */
  normal: 0.24,
  /** 340ms — sayfa ve büyük yüzey geçişleri. */
  slow: 0.34,
} as const;

/**
 * Standart easing. Hızlı başlar, yumuşak durur; "kontrollü" hissin kaynağı.
 * Zıplama yok — overshoot içermez.
 */
export const ease = [0.22, 1, 0.36, 1] as const;

/** Yön ve mesafe sabitleri. Piksel. */
export const distance = {
  /** Sayfa çıkışı. */
  pageExit: 8,
  /** Sayfa girişi — girişin biraz daha uzun yolu vardır, yön okunur olsun. */
  pageEnter: 14,
  /** Sekme paneli içeriği. */
  panel: 10,
  /** Liste öğesi ilk yükleme. */
  list: 10,
} as const;

/**
 * Fiziksel his gereken küçük etkileşimler için yay. Bottom sheet ve basma
 * geri bildirimi gibi "tutulan" yüzeylerde kullanılır.
 * Sayfa geçişlerinde kullanılmaz: yay süreyi öngörülemez yapar.
 */
export const spring = {
  /** Bottom sheet, drawer. */
  surface: { type: "spring", stiffness: 420, damping: 38, mass: 0.9 },
  /** layoutId göstergeleri (aktif sekme, alt navigasyon). */
  indicator: { type: "spring", stiffness: 520, damping: 42, mass: 0.7 },
} as const;

/** Yaygın tween geçişleri. */
export const tween = {
  fast: { duration: duration.fast, ease },
  normal: { duration: duration.normal, ease },
  slow: { duration: duration.slow, ease },
} as const;

/**
 * Stagger: liste toplamda 350ms'yi geçmemeli. 10 karttan sonra gecikme
 * eklemek beklemeye dönüşür, o yüzden index sınırlanır.
 */
export const stagger = {
  step: 0.03,
  /** 10 * 0.03 = 300ms + giriş süresi. */
  maxIndex: 10,
} as const;

/** Bir liste öğesinin stagger gecikmesi. */
export function staggerDelay(index: number): number {
  return Math.min(index, stagger.maxIndex) * stagger.step;
}

/**
 * prefers-reduced-motion açıkken kullanılacak geçiş: hareket yok, yalnız
 * opaklık. Süre de kısalır çünkü hareketsiz bir fade uzun sürerse tembel
 * hissettirir.
 */
export const reducedTween = { duration: 0.12, ease: "linear" } as const;
