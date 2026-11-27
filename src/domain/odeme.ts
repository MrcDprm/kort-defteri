import { ayAnahtari } from './tarih';
import type { Odeme } from './tipler';

export type OdemeDurumu = 'odendi' | 'bekliyor' | 'gecikti';

export function odemeDurumu(o: Pick<Odeme, 'paid' | 'due_date'>, bugun: string): OdemeDurumu {
  if (o.paid === 1) return 'odendi';
  return o.due_date < bugun ? 'gecikti' : 'bekliyor';
}

export interface AyOzeti {
  alinan: number;
  bekleyen: number;
  odeyenSporcu: number;
}

export function ayOzeti(odemeler: Odeme[], ay: string): AyOzeti {
  const oAy = odemeler.filter((o) => ayAnahtari(o.due_date) === ay);
  const alinan = oAy.filter((o) => o.paid === 1).reduce((t, o) => t + o.amount, 0);
  const bekleyen = oAy.filter((o) => o.paid !== 1).reduce((t, o) => t + o.amount, 0);
  const odeyenSporcu = new Set(oAy.filter((o) => o.paid === 1).map((o) => o.athlete_id)).size;
  return { alinan, bekleyen, odeyenSporcu };
}

export function gecikenler(odemeler: Odeme[], bugun: string): Odeme[] {
  return odemeler.filter((o) => odemeDurumu(o, bugun) === 'gecikti').sort((a, b) => a.due_date.localeCompare(b.due_date));
}

/** 2500 -> 2.500 TL, 2500.5 -> 2.500,50 TL */
export function tl(tutar: number): string {
  const tam = Number.isInteger(tutar);
  return `${tutar.toLocaleString('tr-TR', { minimumFractionDigits: tam ? 0 : 2, maximumFractionDigits: 2 })} TL`;
}

/** Kullanıcının yazdığı tutarı okur: 2500, 2.500, 2500,50 ve 2.500,50 kabul edilir. */
export function tutarOku(metin: string): number | null {
  const temiz = metin.replace(/\s|TL/gi, '');
  let sayi: number;
  if (/^(\d{1,3}(\.\d{3})+|\d+),\d{1,2}$/.test(temiz)) {
    sayi = Number(temiz.replace(/\./g, '').replace(',', '.'));
  } else if (/^\d{1,3}(\.\d{3})+$/.test(temiz)) {
    sayi = Number(temiz.replace(/\./g, ''));
  } else if (/^\d+(\.\d{1,2})?$/.test(temiz)) {
    sayi = Number(temiz);
  } else {
    return null;
  }
  if (!Number.isFinite(sayi) || sayi <= 0 || sayi > 10_000_000) return null;
  return Math.round(sayi * 100) / 100;
}
