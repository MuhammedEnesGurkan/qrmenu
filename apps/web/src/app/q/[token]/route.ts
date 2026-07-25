import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest,{params}:{params:Promise<{token:string}>}) {
  const {token}=await params;
  if(!/^[A-Za-z0-9_-]{40,100}$/.test(token))return NextResponse.redirect(new URL("/?qr=gecersiz",request.url),303);
  const apiUrl=process.env.API_URL??"http://localhost:8080";
  const upstream=await fetch(`${apiUrl}/api/public/table/exchange/${encodeURIComponent(token)}`,{redirect:"manual",cache:"no-store"});
  if(upstream.status!==303)return NextResponse.redirect(new URL("/?qr=suresi-dolmus",request.url),303);
  const response=NextResponse.redirect(new URL("/siparis",request.url),303);
  const cookieHeaders=(upstream.headers as Headers & {getSetCookie?:()=>string[]}).getSetCookie?.() ?? [];
  if(cookieHeaders.length===0){const combined=upstream.headers.get("set-cookie");if(combined)cookieHeaders.push(...combined.split(/,(?=\s*MASA_)/));}
  cookieHeaders.forEach(cookie=>response.headers.append("Set-Cookie",cookie));
  response.headers.set("Cache-Control","no-store");response.headers.set("Referrer-Policy","no-referrer");
  return response;
}
