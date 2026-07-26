"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Trash2 } from "lucide-react";
import { api } from "@/lib/admin-api";
import { Button, Spinner } from "@/components/ui/button";

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Görsel yükleme alanı. Dosya sunucuya gönderilir, dönen güvenli asset
 * yolu forma yazılır. Yükleme sırasında önizleme ve durum gösterilir.
 */
export function ImagePicker({
  value,
  onChange,
  label = "Ürün görseli",
}: {
  value: string | null;
  onChange: (next: string | null) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setError("");
    if (file.size > MAX_BYTES) {
      setError("Dosya en fazla 5 MB olabilir.");
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const result = await api<{ url: string }>("/api/admin/assets", {
        method: "POST",
        body,
      });
      onChange(result.url);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Görsel yüklenemedi.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium text-fg">
        {label}
        <span className="ml-1 text-xs font-normal text-muted">
          (isteğe bağlı)
        </span>
      </p>
      <div className="flex items-center gap-3">
        <span className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-sunken">
          {uploading ? (
            <Spinner className="text-primary" />
          ) : value ? (
            <Image
              src={value}
              alt="Seçilen görsel önizlemesi"
              fill
              sizes="5rem"
              unoptimized={/^https?:\/\//i.test(value)}
              className="object-cover"
            />
          ) : (
            <ImagePlus size={20} aria-hidden="true" className="text-muted" />
          )}
        </span>
        <div className="grid gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {value ? "Görseli değiştir" : "Görsel yükle"}
            </Button>
            {value ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={uploading}
                onClick={() => onChange(null)}
                leadingIcon={<Trash2 size={15} aria-hidden="true" />}
              >
                Kaldır
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted">
            PNG, JPEG veya WebP · en fazla 5 MB. Görsel sunucuda yeniden
            kodlanır.
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        aria-label={label}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <p role="status" aria-live="polite" className="sr-only">
        {uploading ? "Görsel yükleniyor" : value ? "Görsel hazır" : ""}
      </p>
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
