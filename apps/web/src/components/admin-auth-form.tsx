"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api, json } from "@/lib/admin-api";

export function AdminAuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    const payload = mode === "login"
      ? { email: data.get("email"), password: data.get("password") }
      : { email: data.get("email"), password: data.get("password"),
          displayName: data.get("displayName"), businessName: data.get("businessName") };
    try {
      await api(`/api/auth/${mode === "login" ? "login" : "register"}`, json("POST", payload));
      router.replace("/admin"); router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "İşlem tamamlanamadı.");
    } finally { setBusy(false); }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-5 py-12">
      <section className="w-full rounded-[2rem] border border-[#ddd8cc] bg-[#fffdf8] p-7 shadow-xl shadow-emerald-950/10">
        <Link href="/" className="text-sm font-black tracking-[.18em] text-[#176b52]">MASAAKIŞ</Link>
        <h1 className="mt-5 text-3xl font-black">{mode === "login" ? "Yönetim paneline gir" : "Ücretsiz menünü kur"}</h1>
        <p className="mt-2 text-[#68736b]">{mode === "login" ? "İşletme hesabınla güvenli oturum aç." : "İlk menü ve merkez şuben otomatik hazırlanır."}</p>
        <form onSubmit={submit} className="mt-7 grid gap-4">
          {mode === "register" && <>
            <Field name="displayName" label="Ad soyad" minLength={2} maxLength={140} />
            <Field name="businessName" label="İşletme adı" minLength={2} maxLength={140} />
          </>}
          <Field name="email" label="E-posta" type="email" maxLength={254} />
          <Field name="password" label="Parola" type="password" minLength={12} maxLength={128} />
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}
          <button disabled={busy} className="min-h-12 rounded-xl bg-[#176b52] px-5 font-bold text-white disabled:opacity-60">
            {busy ? "Bekleyin…" : mode === "login" ? "Giriş yap" : "Hesap oluştur"}
          </button>
        </form>
        <p className="mt-5 text-sm text-[#68736b]">
          {mode === "login" ? "Hesabın yok mu? " : "Zaten hesabın var mı? "}
          <Link className="font-bold text-[#176b52] underline" href={mode === "login" ? "/admin/kayit" : "/admin/giris"}>
            {mode === "login" ? "Ücretsiz kayıt ol" : "Giriş yap"}
          </Link>
        </p>
      </section>
    </main>
  );
}

function Field(props: { name: string; label: string; type?: string; minLength?: number; maxLength: number }) {
  return <label className="grid gap-1.5 text-sm font-bold">{props.label}
    <input required {...props} aria-label={props.label} className="min-h-12 rounded-xl border border-[#cfc8b9] bg-white px-4 font-normal outline-none focus:border-[#176b52]" />
  </label>;
}
