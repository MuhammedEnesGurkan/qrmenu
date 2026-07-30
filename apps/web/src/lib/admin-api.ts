export type AuthUser = {
  userId: string;
  tenantId: string;
  branchId: string;
  displayName: string;
  role: string;
  permissions: string[];
};

export type Staff = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  active: boolean;
  branchId: string;
};

export type AddonPlan = {
  code: string;
  name: string;
  description: string;
  monthlyPrice: number;
  currency: string;
  trialDays: number;
  status: string;
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
};

export type Product = {
  id: string;
  categoryId: string;
  sku: string | null;
  name: string;
  description: string | null;
  allergenInfo: string | null;
  imageUrl: string | null;
  price: number;
  currency: string;
  sortOrder: number;
  active: boolean;
  available: boolean;
  version: number;
};

export type Category = {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
  products: Product[];
};

export type Catalog = {
  menu: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    logoUrl: string | null;
    locale: string;
    published: boolean;
  };
  categories: Category[];
};

export type OrderItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  currency: string;
};

export type Order = {
  id: string;
  tableId: string | null;
  tableName: string | null;
  serviceMode: string;
  state: string;
  estimatedTotal: number;
  currency: string;
  customerNote: string | null;
  pickupNumber: string | null;
  version: number;
  submittedAt: string;
  items: OrderItem[];
};

export type WaiterCall = {
  id: string;
  tableId: string | null;
  tableName: string | null;
  status: string;
  message: string | null;
  createdAt: string;
};

export type TableRow = {
  id: string;
  areaId: string;
  name: string;
  capacity: number | null;
  active: boolean;
};

export type Area = {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
  tables: TableRow[];
};

export type TableQr = {
  tableId: string;
  exchangeUrl: string;
  qrPngBase64: string;
};

export type Station = {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
  categoryIds: string[];
};

export type KitchenOverview = {
  publicPickupUrl: string;
  stations: Station[];
};

export type KitchenItem = {
  itemId: string;
  orderId: string;
  productName: string;
  quantity: number;
  notes: string | null;
  kitchenState: string;
  orderState: string;
  serviceMode: string;
  pickupNumber: string | null;
  tableName: string | null;
  submittedAt: string;
};

export type ImportRow = {
  rowNumber: number;
  category: string;
  sku: string;
  name: string;
  price: number;
  currency: string;
  message: string;
};

export type ImportJob = {
  id: string;
  status: string;
  validRows: number;
  errorRows: number;
  rows: ImportRow[];
};

export type PriceItem = {
  productId: string;
  oldPrice: number;
  newPrice: number;
  oldVersion: number;
  appliedVersion: number | null;
  rollbackStatus: string | null;
};

export type PriceBatch = { id: string; status: string; items: PriceItem[] };

export type Branding = {
  primaryColor: string;
  surfaceColor: string;
  font: string;
  layout: string;
  hidePoweredBy: boolean;
};

export type FeatureSettings = {
  branches: { id: string; name: string; active: boolean; current: boolean }[];
  branding: Branding;
  translations: { locale: string; translatedProducts: number }[];
  totalProducts: number;
};

export type OperationReport = {
  from: string;
  to: string;
  disclaimer: string;
  states: { state: string; orderCount: number; estimatedOrderValue: number }[];
  topProducts: { productName: string; quantity: number }[];
};

export type ApiError = Error & { status: number };

function csrfToken() {
  if (typeof document === "undefined") return "";
  return decodeURIComponent(
    document.cookie
      .split("; ")
      .find((item) => item.startsWith("MASA_CSRF="))
      ?.split("=")[1] ?? "",
  );
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = init.method?.toUpperCase() ?? "GET";
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    headers.set("X-CSRF-Token", csrfToken());
  }
  const response = await fetch(`/backend${path}`, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    const error = new Error(
      payload?.message ?? `İstek başarısız (${response.status})`,
    ) as ApiError;
    error.status = response.status;
    throw error;
  }
  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export function json(method: string, body?: unknown): RequestInit {
  return {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}
