export type AuthUser = {
  userId: string;
  tenantId: string;
  branchId: string;
  displayName: string;
  role: string;
  permissions: string[];
};
export type Staff = { id:string; email:string; displayName:string; role:string; active:boolean; branchId:string };
export type AddonPlan = { code:string; name:string; description:string; monthlyPrice:number; currency:string; trialDays:number; status:string; trialEndsAt:string|null; currentPeriodEndsAt:string|null; cancelAtPeriodEnd:boolean };

export type Product = {
  id: string; categoryId: string; sku: string | null; name: string;
  description: string | null; allergenInfo: string | null; imageUrl: string | null;
  price: number; currency: string; sortOrder: number; active: boolean;
  available: boolean; version: number;
};
export type Category = { id: string; name: string; sortOrder: number; active: boolean; products: Product[] };
export type Catalog = {
  menu: { id: string; slug: string; name: string; description: string | null;
    logoUrl: string | null; locale: string; published: boolean };
  categories: Category[];
};

function csrfToken() {
  if (typeof document === "undefined") return "";
  return decodeURIComponent(document.cookie.split("; ").find((item) => item.startsWith("MASA_CSRF="))?.split("=")[1] ?? "");
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = init.method?.toUpperCase() ?? "GET";
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) headers.set("X-CSRF-Token", csrfToken());
  const response = await fetch(`/backend${path}`, { ...init, headers, credentials: "include", cache: "no-store" });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null;
    const error = new Error(payload?.message ?? `İstek başarısız (${response.status})`) as Error & { status: number };
    error.status = response.status;
    throw error;
  }
  if (response.status === 204 || response.headers.get("content-length") === "0") return undefined as T;
  return response.json() as Promise<T>;
}

export function json(method: string, body?: unknown): RequestInit {
  return { method, body: body === undefined ? undefined : JSON.stringify(body) };
}
