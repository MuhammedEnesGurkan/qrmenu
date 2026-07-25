"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, AuthUser, Catalog, Category, json, Product, Staff } from "@/lib/admin-api";

export function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const me = await api<AuthUser>("/api/auth/me");
      const [data, people] = await Promise.all([api<Catalog>("/api/admin/catalog"),
        me.permissions.includes("membership/manage") ? api<Staff[]>("/api/admin/staff") : Promise.resolve([])]);
      setUser(me); setCatalog(data); setStaff(people);
    } catch (caught) {
      if ((caught as Error & { status?: number }).status === 401 || (caught as Error & { status?: number }).status === 403) router.replace("/admin/giris");
      else setError(caught instanceof Error ? caught.message : "Panel yüklenemedi.");
    }
  }, [router]);
  useEffect(() => { void refresh(); }, [refresh]);

  async function action(task: () => Promise<unknown>, message: string) {
    setBusy(true); setError(""); setNotice("");
    try { await task(); setNotice(message); await refresh(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "İşlem tamamlanamadı."); }
    finally { setBusy(false); }
  }

  if (!catalog || !user) return <main className="grid min-h-screen place-items-center p-6"><p>{error || "Panel hazırlanıyor…"}</p></main>;
  const canWrite = user.permissions.includes("catalog/write");

  return <main className="mx-auto min-h-screen max-w-6xl px-4 py-5 sm:px-7 sm:py-8">
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-[#17201b] p-5 text-white">
      <div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-300">MasaAkış yönetim</p>
        <h1 className="mt-1 text-2xl font-black">{catalog.menu.name}</h1>
        <p className="mt-1 text-sm text-white/65">{user.displayName} · {user.role}</p></div>
      <div className="flex flex-wrap gap-2">
        <a href={`/m/${catalog.menu.slug}`} target="_blank" className="inline-flex min-h-11 items-center rounded-xl border border-white/25 px-4 font-bold">Menüyü aç</a>
        <a href="/backend/api/admin/catalog/qr.png" className="inline-flex min-h-11 items-center rounded-xl bg-white px-4 font-bold text-[#17201b]">QR indir</a>
        <button onClick={() => action(() => api("/api/auth/logout", json("POST")), "Çıkış yapıldı.").then(() => router.replace("/admin/giris"))} className="min-h-11 rounded-xl border border-white/25 px-4 font-bold">Çıkış</button>
      </div>
    </header>
    {(error || notice) && <p role={error ? "alert" : "status"} className={`mt-4 rounded-xl p-3 text-sm font-semibold ${error ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`}>{error || notice}</p>}

    <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.8fr]">
      <div className="grid content-start gap-5">
        <MenuCard catalog={catalog} disabled={!canWrite || busy} onSave={(body) => action(() => api("/api/admin/catalog/menu", json("PATCH", body)), "Menü bilgileri kaydedildi.")}
          onPublish={() => action(() => api(`/api/admin/catalog/${catalog.menu.published ? "unpublish" : "publish"}`, json("POST")), catalog.menu.published ? "Menü yayından kaldırıldı." : "Menü yayınlandı.")} />
        {canWrite && <NewCategory disabled={busy} onCreate={(body) => action(() => api("/api/admin/catalog/categories", json("POST", body)), "Kategori eklendi.")} />}
        {canWrite && catalog.categories.length > 0 && <NewProduct categories={catalog.categories} disabled={busy} onCreate={(body) => action(() => api("/api/admin/catalog/products", json("POST", body)), "Ürün eklendi.")} />}
        {user.permissions.includes("membership/manage") && <StaffCard staff={staff} currentUserId={user.userId} disabled={busy}
          onCreate={(body)=>action(()=>api("/api/admin/staff",json("POST",body)),"Personel eklendi.")}
          onUpdate={(person,body)=>action(()=>api(`/api/admin/staff/${person.id}`,json("PATCH",body)),"Personel güncellendi.")} />}
      </div>
      <div className="grid content-start gap-4">
        {catalog.categories.length === 0 && <Empty text="Henüz kategori yok. İlk kategorini soldaki formdan ekle." />}
        {catalog.categories.map((category) => <CategoryCard key={category.id} category={category} canWrite={canWrite} disabled={busy}
          onUpdate={(body) => action(() => api(`/api/admin/catalog/categories/${category.id}`, json("PATCH", body)), "Kategori güncellendi.")}
          onArchive={() => action(() => api(`/api/admin/catalog/categories/${category.id}`, json("DELETE")), "Kategori arşivlendi.")}
          onPrice={(product, price) => action(() => api(`/api/admin/catalog/products/${product.id}/price`, json("PATCH", { price, currency: product.currency, version: product.version })), "Fiyat güncellendi.")}
          onAvailability={(product) => action(() => api(`/api/admin/catalog/products/${product.id}/availability`, json("PATCH", { available: !product.available })), "Mevcutluk güncellendi.")}
          onProductUpdate={(product, body) => action(() => api(`/api/admin/catalog/products/${product.id}`, json("PATCH", body)), "Ürün bilgileri güncellendi.")}
          onArchiveProduct={(product) => action(() => api(`/api/admin/catalog/products/${product.id}`, json("DELETE")), "Ürün arşivlendi.")} />)}
      </div>
    </section>
  </main>;
}

function Card({ children }: { children: React.ReactNode }) { return <section className="rounded-3xl border border-[#ddd8cc] bg-[#fffdf8] p-5 shadow-sm">{children}</section>; }
function Empty({ text }: { text: string }) { return <Card><p className="text-[#68736b]">{text}</p></Card>; }
function Input({ label, name, defaultValue, type="text", required=true }: { label:string; name:string; defaultValue?:string|number; type?:string; required?:boolean }) {
  return <label className="grid gap-1 text-sm font-bold">{label}<input name={name} type={type} required={required} defaultValue={defaultValue} className="min-h-11 rounded-xl border border-[#cfc8b9] bg-white px-3 font-normal" /></label>;
}

function MenuCard({ catalog, disabled, onSave, onPublish }: { catalog:Catalog; disabled:boolean; onSave:(v:unknown)=>void; onPublish:()=>void }) {
  return <Card><h2 className="text-xl font-black">Menü ayarları</h2><p className="mt-1 text-sm text-[#68736b]">Kalıcı adres: /m/{catalog.menu.slug}</p>
    <form className="mt-4 grid gap-3" onSubmit={(e) => { e.preventDefault(); const d=new FormData(e.currentTarget); onSave({name:d.get("name"),description:d.get("description"),logoUrl:d.get("logoUrl"),locale:d.get("locale")}); }}>
      <Input label="Menü adı" name="name" defaultValue={catalog.menu.name}/><Input label="Açıklama" name="description" defaultValue={catalog.menu.description ?? ""} required={false}/>
      <Input label="Logo URL" name="logoUrl" defaultValue={catalog.menu.logoUrl ?? ""} required={false}/><Input label="Dil" name="locale" defaultValue={catalog.menu.locale}/>
      <button disabled={disabled} className="min-h-11 rounded-xl bg-[#176b52] px-4 font-bold text-white">Kaydet</button>
    </form><button disabled={disabled} onClick={onPublish} className="mt-3 min-h-11 w-full rounded-xl border border-[#176b52] px-4 font-bold text-[#176b52]">{catalog.menu.published ? "Yayından kaldır" : "Menüyü yayınla"}</button>
  </Card>;
}

function NewCategory({ disabled, onCreate }: { disabled:boolean; onCreate:(v:unknown)=>void }) {
  return <Card><h2 className="text-xl font-black">Kategori ekle</h2><form className="mt-4 grid gap-3" onSubmit={(e)=>{e.preventDefault();const d=new FormData(e.currentTarget);onCreate({name:d.get("name"),sortOrder:Number(d.get("sortOrder"))});e.currentTarget.reset();}}>
    <Input label="Kategori adı" name="name"/><Input label="Sıra" name="sortOrder" type="number" defaultValue={0}/><button disabled={disabled} className="min-h-11 rounded-xl bg-[#176b52] font-bold text-white">Ekle</button></form></Card>;
}

const staffRoles = ["BRANCH_MANAGER","MENU_EDITOR","WAITER","KITCHEN_STAFF","VIEWER"] as const;
function StaffCard({staff,currentUserId,disabled,onCreate,onUpdate}:{staff:Staff[];currentUserId:string;disabled:boolean;onCreate:(v:unknown)=>void;onUpdate:(p:Staff,v:unknown)=>void}) {
  return <Card><h2 className="text-xl font-black">Personel ve roller</h2><p className="mt-1 text-sm text-[#68736b]">Her kullanıcı yalnız görevine gereken izinleri alır.</p>
    <form className="mt-4 grid gap-3" onSubmit={e=>{e.preventDefault();const d=new FormData(e.currentTarget);onCreate({email:d.get("email"),displayName:d.get("displayName"),password:d.get("password"),role:d.get("role")});e.currentTarget.reset();}}>
      <Input label="Ad soyad" name="displayName"/><Input label="E-posta" name="email" type="email"/><Input label="Geçici parola (en az 12)" name="password" type="password"/>
      <label className="grid gap-1 text-sm font-bold">Rol<select name="role" className="min-h-11 rounded-xl border border-[#cfc8b9] bg-white px-3">{staffRoles.map(role=><option key={role}>{role}</option>)}</select></label>
      <button disabled={disabled} className="min-h-11 rounded-xl bg-[#17201b] font-bold text-white">Personel ekle</button>
    </form>
    <div className="mt-4 grid gap-2">{staff.map(person=><div key={person.id} className="rounded-xl border bg-white p-3"><p className="font-bold">{person.displayName}{person.id===currentUserId?" (siz)":""}</p><p className="text-xs text-[#68736b]">{person.email} · {person.role}</p>{person.id!==currentUserId&&<button disabled={disabled} onClick={()=>onUpdate(person,{role:person.role,active:!person.active})} className="mt-2 min-h-9 rounded-lg border px-3 text-xs font-bold">{person.active?"Devre dışı bırak":"Etkinleştir"}</button>}</div>)}</div>
  </Card>;
}

function NewProduct({ categories, disabled, onCreate }: { categories:Category[]; disabled:boolean; onCreate:(v:unknown)=>void }) {
  const [imageUrl,setImageUrl]=useState("");
  async function upload(file:File) { const data=new FormData();data.append("file",file);const result=await api<{url:string}>("/api/admin/assets",{method:"POST",body:data});setImageUrl(result.url); }
  return <Card><h2 className="text-xl font-black">Ürün ekle</h2><form className="mt-4 grid gap-3" onSubmit={(e)=>{e.preventDefault();const d=new FormData(e.currentTarget);onCreate({categoryId:d.get("categoryId"),sku:d.get("sku"),name:d.get("name"),description:d.get("description"),allergenInfo:d.get("allergenInfo"),imageUrl,price:Number(d.get("price")),currency:"TRY",sortOrder:Number(d.get("sortOrder"))});}}>
    <label className="grid gap-1 text-sm font-bold">Kategori<select name="categoryId" className="min-h-11 rounded-xl border border-[#cfc8b9] bg-white px-3">{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <Input label="Ürün adı" name="name"/><Input label="SKU (isteğe bağlı)" name="sku" required={false}/><Input label="Açıklama" name="description" required={false}/><Input label="Alerjen" name="allergenInfo" required={false}/>
    <div className="grid grid-cols-2 gap-3"><Input label="Fiyat" name="price" type="number" defaultValue="0.00"/><Input label="Sıra" name="sortOrder" type="number" defaultValue={0}/></div>
    <label className="grid gap-1 text-sm font-bold">Görsel (PNG/JPEG, 5 MB)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e)=>e.target.files?.[0]&&void upload(e.target.files[0])} className="min-h-11 text-sm" /></label>
    {imageUrl && <p className="text-xs text-emerald-700">Görsel güvenli biçimde yüklendi.</p>}<button disabled={disabled} className="min-h-11 rounded-xl bg-[#176b52] font-bold text-white">Ürünü ekle</button></form></Card>;
}

function CategoryCard({category,canWrite,disabled,onUpdate,onArchive,onPrice,onAvailability,onProductUpdate,onArchiveProduct}:{category:Category;canWrite:boolean;disabled:boolean;onUpdate:(v:unknown)=>void;onArchive:()=>void;onPrice:(p:Product,v:number)=>void;onAvailability:(p:Product)=>void;onProductUpdate:(p:Product,v:unknown)=>void;onArchiveProduct:(p:Product)=>void}) {
  const [categoryName,setCategoryName]=useState(category.name);
  const [categoryOrder,setCategoryOrder]=useState(String(category.sortOrder));
  return <Card><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">{category.name}</h2><p className="text-sm text-[#68736b]">{category.products.length} ürün · {category.active?"Aktif":"Gizli"}</p></div>{canWrite&&<div className="flex gap-2"><button disabled={disabled} onClick={()=>onUpdate({name:category.name,sortOrder:category.sortOrder,active:!category.active})} className="min-h-10 rounded-lg border px-3 text-sm font-bold">{category.active?"Gizle":"Göster"}</button><button disabled={disabled} onClick={onArchive} className="min-h-10 rounded-lg border border-red-200 px-3 text-sm font-bold text-red-700">Arşivle</button></div>}</div>
    {canWrite&&<div className="mt-3 flex flex-wrap gap-2"><input aria-label="Kategori adı" value={categoryName} onChange={e=>setCategoryName(e.target.value)} className="min-h-10 min-w-48 flex-1 rounded-lg border px-3"/><input aria-label="Kategori sırası" type="number" value={categoryOrder} onChange={e=>setCategoryOrder(e.target.value)} className="min-h-10 w-24 rounded-lg border px-2"/><button disabled={disabled} onClick={()=>onUpdate({name:categoryName,sortOrder:Number(categoryOrder),active:category.active})} className="min-h-10 rounded-lg bg-[#17201b] px-3 text-sm font-bold text-white">Bilgileri kaydet</button></div>}
    <div className="mt-4 grid gap-3">{category.products.map(product=><ProductRow key={product.id} product={product} canWrite={canWrite} disabled={disabled} onPrice={onPrice} onAvailability={onAvailability} onUpdate={onProductUpdate} onArchive={onArchiveProduct}/>)}</div>
    {category.products.length===0&&<p className="mt-4 text-sm text-[#68736b]">Bu kategoride ürün yok.</p>}</Card>;
}

function ProductRow({product,canWrite,disabled,onPrice,onAvailability,onUpdate,onArchive}:{product:Product;canWrite:boolean;disabled:boolean;onPrice:(p:Product,v:number)=>void;onAvailability:(p:Product)=>void;onUpdate:(p:Product,v:unknown)=>void;onArchive:(p:Product)=>void}) {
  const [price,setPrice]=useState(String(product.price));
  const [editing,setEditing]=useState(false);
  return <article className="rounded-2xl border border-[#e5e0d6] bg-white p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black">{product.name}</h3><p className="mt-1 text-sm text-[#68736b]">{product.description||"Açıklama yok"}</p></div><span className={`rounded-full px-2 py-1 text-xs font-bold ${product.available?"bg-emerald-50 text-emerald-700":"bg-zinc-100 text-zinc-600"}`}>{product.available?"Mevcut":"Tükendi"}</span></div>
    {editing&&<form className="mt-3 grid gap-2 rounded-xl bg-[#f6f2e9] p-3" onSubmit={e=>{e.preventDefault();const d=new FormData(e.currentTarget);onUpdate(product,{categoryId:product.categoryId,sku:d.get("sku"),name:d.get("name"),description:d.get("description"),allergenInfo:d.get("allergenInfo"),imageUrl:product.imageUrl,sortOrder:product.sortOrder,active:product.active});setEditing(false);}}><Input label="Ürün adı" name="name" defaultValue={product.name}/><Input label="SKU" name="sku" defaultValue={product.sku??""} required={false}/><Input label="Açıklama" name="description" defaultValue={product.description??""} required={false}/><Input label="Alerjen" name="allergenInfo" defaultValue={product.allergenInfo??""} required={false}/><button disabled={disabled} className="min-h-10 rounded-lg bg-[#17201b] px-3 text-sm font-bold text-white">Ürün bilgilerini kaydet</button></form>}
    {canWrite&&<div className="mt-3 flex flex-wrap gap-2"><input aria-label={`${product.name} fiyat`} value={price} onChange={e=>setPrice(e.target.value)} type="number" className="min-h-10 w-28 rounded-lg border px-2"/><button disabled={disabled} onClick={()=>onPrice(product,Number(price))} className="min-h-10 rounded-lg bg-[#176b52] px-3 text-sm font-bold text-white">Fiyatı kaydet</button><button disabled={disabled} onClick={()=>setEditing(!editing)} className="min-h-10 rounded-lg border px-3 text-sm font-bold">Düzenle</button><button disabled={disabled} onClick={()=>onAvailability(product)} className="min-h-10 rounded-lg border px-3 text-sm font-bold">{product.available?"Tükendi yap":"Mevcut yap"}</button><button disabled={disabled} onClick={()=>onArchive(product)} className="min-h-10 rounded-lg border border-red-200 px-3 text-sm font-bold text-red-700">Arşivle</button></div>}</article>;
}
