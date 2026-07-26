"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";

type Resource<T> = {
  data: T | null;
  error: string;
  loading: boolean;
  reload: () => Promise<void>;
  setData: (next: T) => void;
};

/**
 * Yükleme / hata / yeniden dene üçlüsünü tek yerde toplar.
 * loader referansı çağıran tarafta useCallback ile sabitlenmelidir.
 */
export function useResource<T>(loader: () => Promise<T>): Resource<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const result = await loader();
      if (!alive.current) return;
      setData(result);
      setError("");
    } catch (caught) {
      if (!alive.current) return;
      setError(
        caught instanceof Error ? caught.message : "Veriler yüklenemedi.",
      );
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, reload, setData };
}

/**
 * Mutasyonları tek noktadan çalıştırır: busy durumu, başarı toast'ı,
 * hata toast'ı ve ardından veri tazeleme.
 */
export function useAction(reload: () => Promise<void>) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (task: () => Promise<unknown>, successMessage?: string) => {
      setBusy(true);
      try {
        await task();
        if (successMessage) toast.success(successMessage);
        await reload();
        return true;
      } catch (caught) {
        toast.error(
          caught instanceof Error ? caught.message : "İşlem tamamlanamadı.",
        );
        return false;
      } finally {
        setBusy(false);
      }
    },
    [reload, toast],
  );

  return { busy, run };
}
