import { useFocusEffect } from 'expo-router';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';

// Veri değişince açık ekranlar yeniden okusun, bildirim planı ve yedek tetiklensin diye
// basit bir yayın: her yazma işleminden sonra degisti() çağrılır.
type Dinleyici = () => void;
const dinleyiciler = new Set<Dinleyici>();

export function degisti(): void {
  for (const d of dinleyiciler) d();
}

export function degisiklikleriDinle(d: Dinleyici): () => void {
  dinleyiciler.add(d);
  return () => {
    dinleyiciler.delete(d);
  };
}

/** Ekran odaklandığında ve veri her değiştiğinde sorguyu yeniden çalıştırır. */
export function useVeri<T>(sorgu: (db: SQLiteDatabase) => Promise<T>, bagimliliklar: unknown[] = []): { veri: T | undefined; hata: Error | null } {
  const db = useSQLiteContext();
  const [veri, setVeri] = useState<T>();
  const [hata, setHata] = useState<Error | null>(null);
  const sorguRef = useRef(sorgu);
  sorguRef.current = sorgu;

  const yukle = useCallback(() => {
    let iptal = false;
    sorguRef
      .current(db)
      .then((v) => {
        if (!iptal) {
          setVeri(v);
          setHata(null);
        }
      })
      .catch((e: unknown) => {
        if (!iptal) setHata(e instanceof Error ? e : new Error(String(e)));
      });
    return () => {
      iptal = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, ...bagimliliklar]);

  useFocusEffect(yukle);
  useEffect(() => degisiklikleriDinle(() => void yukle()), [yukle]);
  return { veri, hata };
}
