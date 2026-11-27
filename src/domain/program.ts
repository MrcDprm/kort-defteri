import { haftaninGunu } from './tarih';
import type { Ders, DersOlayi, DersSablonu } from './tipler';

/**
 * Bir günün derslerini çıkarır. Haftalık şablonlar o güne düşen dersleri üretir;
 * kaydedilmiş bir ders aynı şablonun o günkü dersinin yerine geçer. Yoklama alınınca
 * ya da ders iptal edilince şablon dersi kaydedilir. Şablonsuz kayıtlar tek seferlik
 * ya da telafi dersleridir.
 */
export function gununDersleri(tarih: string, sablonlar: DersSablonu[], dersler: Ders[]): DersOlayi[] {
  const gun = haftaninGunu(tarih);
  const oGunKayitli = dersler.filter((d) => d.date === tarih);
  const kayitliSablonlar = new Set(oGunKayitli.map((d) => d.template_id).filter((x): x is string => !!x));

  const sablondan: DersOlayi[] = sablonlar
    .filter((s) => s.active === 1 && s.weekday === gun && !kayitliSablonlar.has(s.id))
    .filter((s) => s.created_at.slice(0, 10) <= tarih)
    .map((s) => ({
      anahtar: `${s.id}:${tarih}`,
      template_id: s.id,
      lesson_id: null,
      date: tarih,
      start: s.start,
      end: s.end,
      title: s.title,
      court: s.court,
      kind: s.kind,
      status: 'planli',
      note: null,
    }));

  const kayitli: DersOlayi[] = oGunKayitli.map((d) => ({
    anahtar: d.id,
    template_id: d.template_id,
    lesson_id: d.id,
    date: d.date,
    start: d.start,
    end: d.end,
    title: d.title,
    court: d.court,
    kind: d.kind,
    status: d.status,
    note: d.note,
  }));

  return [...sablondan, ...kayitli].sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title, 'tr'));
}

/** Bugün henüz yapılmamış ve iptal edilmemiş dersler. */
export function bekleyenDersler(olaylar: DersOlayi[]): DersOlayi[] {
  return olaylar.filter((o) => o.status === 'planli');
}

/** Şu andan sonra başlayan ya da sürmekte olan ilk bekleyen ders. */
export function siradakiDers(olaylar: DersOlayi[], simdi: string): DersOlayi | null {
  return bekleyenDersler(olaylar).find((o) => o.end > simdi) ?? null;
}

export function devamOrani(kayitlar: { present: number }[]): number | null {
  if (kayitlar.length === 0) return null;
  const gelen = kayitlar.filter((k) => k.present === 1).length;
  return Math.round((gelen / kayitlar.length) * 100);
}
