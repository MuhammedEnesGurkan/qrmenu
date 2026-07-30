"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { api, json } from "@/lib/admin-api";
import { BrandMark } from "@/components/landing/brand-mark";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/field";
import { Alert } from "@/components/ui/states";

const HIGHLIGHTS = [
  {
    title: "Ücretsiz QR menü",
    body: "Kalıcı menü adresi ve indirilebilir QR kod, süre sınırı olmadan.",
  },
  {
    title: "Anlık ürün ve fiyat güncellemesi",
    body: "Değişiklik kaydettiğin an müşteri menüsünde görünür.",
  },
  {
    title: "Personel yetkilendirme",
    body: "Garson, mutfak ve menü editörü rolleri yalnız gereken izni alır.",
  },
  {
    title: "Güvenli masa QR sistemi",
    body: "Her masa kendi kodunu taşır; yenilendiğinde eskisi anında geçersizdir.",
  },
];

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const isLogin = mode === "login";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");

    const next: Record<string, string> = {};
    if (!email.includes("@")) next.email = "Geçerli bir e-posta adresi gir.";
    if (!isLogin && password.length < 12) {
      next.password = "Parola en az 12 karakter olmalı.";
    }
    setFieldErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    setError("");
    const payload = isLogin
      ? { email, password }
      : {
          email,
          password,
          displayName: data.get("displayName"),
          businessName: data.get("businessName"),
        };
    try {
      await api(`/api/auth/${isLogin ? "login" : "register"}`, json("POST", payload));
      router.replace("/admin");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "İşlem tamamlanamadı.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main" className="min-h-dvh lg:grid lg:grid-cols-2">
      {/* Form kolonu */}
      <div className="safe-bottom flex items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 rounded-lg"
            aria-label="MasaAkış ana sayfa"
          >
            <BrandMark />
            <span className="text-base font-semibold tracking-[-0.01em] text-fg">
              MasaAkış
            </span>
          </Link>

          <h1 className="type-display mt-8 text-3xl text-fg">
            {isLogin ? "Yönetim paneline gir" : "Ücretsiz menünü kur"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            {isLogin
              ? "İşletme hesabınla güvenli oturum aç."
              : "Kayıt tamamlandığında ilk menün ve merkez şuben otomatik hazırlanır."}
          </p>

          <form onSubmit={submit} noValidate className="mt-8 grid gap-4">
            {error ? <Alert tone="destructive">{error}</Alert> : null}

            {!isLogin ? (
              <>
                <FormField label="Ad soyad" required>
                  <Input
                    name="displayName"
                    required
                    minLength={2}
                    maxLength={140}
                    autoComplete="name"
                  />
                </FormField>
                <FormField label="İşletme adı" required>
                  <Input
                    name="businessName"
                    required
                    minLength={2}
                    maxLength={140}
                    autoComplete="organization"
                  />
                </FormField>
              </>
            ) : null}

            <FormField label="E-posta" required error={fieldErrors.email}>
              <Input
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                inputMode="email"
              />
            </FormField>

            <FormField
              label="Parola"
              required
              error={fieldErrors.password}
              description={
                isLogin ? undefined : "En az 12 karakter kullan."
              }
            >
              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={isLogin ? undefined : 12}
                  maxLength={128}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Parolayı gizle" : "Parolayı göster"}
                  aria-pressed={showPassword}
                  /*
                   * size-11 = 44px: projenin her yerde uyguladığı dokunma
                   * hedefi. İkon 16px kalır, büyüyen yalnız basılabilir alan.
                   * right-1 (4px) + 44px = 48px, input'un pr-12'siyle tam
                   * örtüşür; metin ikonun altına girmez.
                   */
                  className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-lg text-muted transition duration-150 hover:bg-sunken hover:text-fg active:scale-[0.94]"
                >
                  {showPassword ? (
                    <EyeOff size={16} aria-hidden="true" />
                  ) : (
                    <Eye size={16} aria-hidden="true" />
                  )}
                </button>
              </div>
            </FormField>

            <Button type="submit" size="lg" fullWidth loading={busy}>
              {isLogin ? "Giriş yap" : "Hesap oluştur"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted">
            {isLogin ? "Hesabın yok mu? " : "Zaten hesabın var mı? "}
            <Link
              href={isLogin ? "/admin/kayit" : "/admin/giris"}
              className="font-semibold text-primary underline underline-offset-2"
            >
              {isLogin ? "Ücretsiz kayıt ol" : "Giriş yap"}
            </Link>
          </p>
        </div>
      </div>

      {/* Tanıtım kolonu */}
      <aside className="hidden bg-inverse px-10 py-14 text-inverse-fg lg:flex lg:items-center xl:px-16">
        <div className="max-w-md">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-inverse-fg/60">
            MasaAkış ile
          </p>
          <h2 className="type-display mt-3 text-3xl leading-tight">
            Menü güncel, masa akışta.
          </h2>
          <ul className="mt-10 grid gap-6">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-inverse-fg/10 text-inverse-fg"
                >
                  <Check size={15} />
                </span>
                <div>
                  <h3 className="text-base font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-inverse-fg/65">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </main>
  );
}
