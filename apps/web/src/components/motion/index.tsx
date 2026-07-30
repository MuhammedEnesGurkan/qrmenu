"use client";

import {
  AnimatePresence,
  MotionConfig,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type Transition,
  type Variants,
} from "motion/react";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import {
  distance,
  duration,
  ease,
  reducedTween,
  staggerDelay,
  tween,
} from "@/lib/motion";

/* -------------------------------------------------------------------------
 * Kök sağlayıcı
 * ---------------------------------------------------------------------- */

/**
 * Uygulama kökünde bir kez kurulur.
 *
 * `reducedMotion="user"` işletim sistemi ayarını tüm motion ağacına bağlar:
 * kullanıcı hareketi azalttığında transform/scale/layout animasyonları
 * kütüphane seviyesinde devre dışı kalır, `useReducedMotion()` true döner ve
 * componentler sade fade'e iner. CSS tarafındaki `prefers-reduced-motion`
 * kuralı da globals.css'te zaten mevcut — iki taraf da kapanır.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/* -------------------------------------------------------------------------
 * Sayfa geçişi
 * ---------------------------------------------------------------------- */

/**
 * Geri navigasyonu tespit eder. Ziyaret edilen yollar bir yığında tutulur;
 * gelen yol yığında geride bir yerdeyse kullanıcı geri gidiyordur ve geçiş
 * yönü tersine döner.
 *
 * Ref render sırasında yazılır ama aynı yol için idempotenttir: ikinci çağrı
 * `last.current.path === path` görüp hiçbir şey yapmaz. StrictMode'un çift
 * render'ında da tek sonuç üretir.
 */
function useNavDirection(path: string): 1 | -1 {
  const stack = useRef<string[]>([]);
  const last = useRef<{ path: string; dir: 1 | -1 } | null>(null);

  if (last.current?.path !== path) {
    const index = stack.current.indexOf(path);
    let dir: 1 | -1 = 1;
    if (index !== -1 && index < stack.current.length - 1) {
      stack.current = stack.current.slice(0, index + 1);
      dir = -1;
    } else if (index === -1) {
      stack.current.push(path);
    }
    last.current = { path, dir };
  }

  return last.current.dir;
}

/**
 * Rota içeriğini yönlü bir geçişle değiştirir. Kabuk (sidebar, üst bar, alt
 * navigasyon) bunun dışındadır ve yeniden animasyon almaz.
 *
 * `mode="wait"` iki içeriğin üst üste binmesini engeller. Çıkış bilerek
 * girişten kısadır: toplam ~380ms, algıda hızlı ama yön okunur.
 */
export function PageTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const direction = useNavDirection(pathname);
  const reduced = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        className={className}
        initial={
          reduced
            ? { opacity: 0 }
            : { opacity: 0, x: direction * distance.pageEnter }
        }
        animate={{ opacity: 1, x: 0 }}
        exit={
          reduced
            ? { opacity: 0 }
            : { opacity: 0, x: direction * -distance.pageExit }
        }
        transition={
          reduced ? reducedTween : { duration: duration.normal, ease }
        }
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------
 * Giriş animasyonları
 * ---------------------------------------------------------------------- */

/** Tek bir bloğu yumuşakça göstermek için. Varsayılan olarak aşağıdan gelir. */
export function FadeIn({
  children,
  className,
  delay = 0,
  y = 6,
  as: _as,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Dikey giriş mesafesi; 0 verilirse saf fade olur. */
  y?: number;
  as?: never;
} & Omit<ComponentProps<typeof motion.div>, "children" | "className">) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      {...rest}
      className={className}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduced ? reducedTween : { duration: duration.normal, ease, delay }
      }
    >
      {children}
    </motion.div>
  );
}

/**
 * Semantik etiketi bozmadan animasyon yapabilmek için küçük bir eşleme.
 * Liste `ul`/`li` olmadan ekran okuyucuda liste olarak duyurulmaz.
 */
const tags = {
  div: motion.div,
  ul: motion.ul,
  li: motion.li,
  section: motion.section,
} as const;

type Tag = keyof typeof tags;

/**
 * Liste kabı. Çocuklar `StaggerItem` ile sarılır ve sırayla girer.
 * Toplam gecikme `staggerDelay` tarafından 300ms ile sınırlanır.
 */
export function StaggerList({
  children,
  className,
  as = "div",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: Tag;
} & Omit<ComponentProps<typeof motion.div>, "children" | "className">) {
  // ponytail: prop tipleri div üzerinden yürütülür. Buradan yalnız genel HTML
  // özellikleri geçiyor; ul/li'ye özgü bir prop gerekirse tipi genişlet.
  const Tag = tags[as] as typeof motion.div;
  return (
    <Tag {...rest} initial="hidden" animate="shown" className={className}>
      {children}
    </Tag>
  );
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: distance.list },
  shown: { opacity: 1, y: 0 },
};

const reducedItemVariants: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 },
};

/**
 * Sıralı giren liste öğesi. `index` verilmezse gecikme olmaz.
 * `layout` açık: filtreleme sırasında kalan kartlar yeni konumlarına kayar.
 *
 * Kendi `initial`/`animate` durumlarını taşır, yani `StaggerList` içinde de
 * herhangi bir düz kabın (section, ul, grid) içinde de çalışır.
 */
export function StaggerItem({
  children,
  className,
  index = 0,
  layout = true,
  as = "div",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  index?: number;
  layout?: boolean;
  as?: Tag;
} & Omit<ComponentProps<typeof motion.div>, "children" | "className">) {
  const reduced = useReducedMotion();
  // ponytail: prop tipleri div üzerinden yürütülür. Buradan yalnız genel HTML
  // özellikleri geçiyor; ul/li'ye özgü bir prop gerekirse tipi genişlet.
  const Tag = tags[as] as typeof motion.div;
  return (
    <Tag
      initial="hidden"
      animate="shown"
      {...rest}
      layout={reduced ? false : layout}
      variants={reduced ? reducedItemVariants : itemVariants}
      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
      transition={
        reduced
          ? reducedTween
          : { duration: duration.normal, ease, delay: staggerDelay(index) }
      }
      className={className}
    >
      {children}
    </Tag>
  );
}

/* -------------------------------------------------------------------------
 * Sekme paneli
 * ---------------------------------------------------------------------- */

/**
 * Sekme içeriği. `value` değiştiğinde eski panel çıkar, yeni panel girer —
 * `mode="wait"` sayesinde ikisi asla aynı anda görünmez. Hızlı art arda
 * tıklamada AnimatePresence son değeri kuyruğa alır, kırılmaz.
 */
export function AnimatedTabPanel({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={value}
        className={className}
        initial={
          reduced ? { opacity: 0 } : { opacity: 0, x: distance.panel }
        }
        animate={{ opacity: 1, x: 0 }}
        exit={reduced ? { opacity: 0 } : { opacity: 0, x: -distance.panel }}
        transition={reduced ? reducedTween : tween.fast}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------
 * Sayısal değer
 * ---------------------------------------------------------------------- */

/**
 * KPI sayacı. Değer değiştiğinde araya yumuşak bir geçiş koyar; okunabilirlik
 * için tam sayıya yuvarlanır. Reduced motion'da anında güncellenir.
 *
 * İlk render değeri doğrudan yazar — sunucudan gelen sayının sıfırdan
 * sayılması hem gürültü hem de hydration uyuşmazlığı olurdu.
 */
export function AnimatedCounter({
  value,
  format = (n) => String(n),
  className,
}: {
  value: number;
  format?: (value: number) => string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  const raw = useMotionValue(value);
  const smooth = useSpring(raw, { stiffness: 260, damping: 34, mass: 0.8 });
  const primed = useRef(false);

  useEffect(() => {
    if (reduced || !primed.current) {
      primed.current = true;
      raw.jump(value);
      setShown(value);
      return;
    }
    raw.set(value);
  }, [value, raw, reduced]);

  useEffect(() => {
    if (reduced) return;
    return smooth.on("change", (next) => setShown(Math.round(next)));
  }, [smooth, reduced]);

  return (
    <span className={className}>
      {format(reduced ? value : shown)}
    </span>
  );
}

/* -------------------------------------------------------------------------
 * Yükleme
 * ---------------------------------------------------------------------- */

/**
 * Skeleton → içerik crossfade'i. Beyaz ekran ya da sert takas yerine iki
 * katman kısa süre üst üste erir. Yükseklik farkı `layout` ile yumuşatılır.
 */
export function SkeletonTransition({
  loading,
  skeleton,
  children,
  className,
}: {
  loading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <div className={cn("relative", className)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={loading ? "skeleton" : "content"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reduced ? reducedTween : tween.fast}
        >
          {loading ? skeleton : children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * Yeni gelen bir kaydın kısa vurgusu. Tüm listeyi oynatmak yerine yalnız
 * değişen kart bir kez parlar. `active` false olduğunda hiçbir maliyeti yok.
 */
export function Highlight({
  active,
  children,
  className,
  tone = "primary",
}: {
  active: boolean;
  children: ReactNode;
  className?: string;
  tone?: "primary" | "success";
}) {
  const reduced = useReducedMotion();
  const ring =
    tone === "success"
      ? "0 0 0 3px rgb(21 127 67 / 0.35)"
      : "0 0 0 3px rgb(179 58 80 / 0.35)";

  return (
    <motion.div
      className={className}
      animate={
        active && !reduced
          ? { boxShadow: [ring, "0 0 0 0 rgb(0 0 0 / 0)"] }
          : { boxShadow: "0 0 0 0 rgb(0 0 0 / 0)" }
      }
      transition={{ duration: 1.1, ease }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Başarılı işlem onayı. Kısa, tek seferlik, süslemesiz.
 * Erişilebilirlik için görsel değil metin taşır — çağıran taraf `aria-live`
 * bölgesine koyar.
 */
export function SuccessCheck({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={cn("size-5", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <motion.path
        d="M4.5 12.5 10 18 19.5 6.5"
        initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={reduced ? reducedTween : { duration: 0.28, ease }}
      />
    </motion.svg>
  );
}

/**
 * Kapanış animasyonu sürerken içeriğin kaybolmasını engeller.
 *
 * `open={value !== null}` ile birlikte kullanılır: değer null'a döndüğünde
 * panel çıkış animasyonunu son gördüğü veriyle tamamlar, boş kabuk göstermez.
 */
export function useRetained<T>(value: T | null | undefined): T | null {
  const last = useRef<T | null>(null);
  if (value != null) last.current = value;
  return value ?? last.current;
}

/* -------------------------------------------------------------------------
 * Yeniden dışa aktarımlar
 * ---------------------------------------------------------------------- */

export { AnimatePresence, motion, useReducedMotion };
export type { Transition, Variants };
