// Tarihler veritabanında yerel saatle YYYY-MM-DD, saatler HH:MM metni olarak tutulur.
// Saat dilimi kaymasına düşmemek için Date yalnızca yerel bileşenleriyle kullanılır.

export const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export const GUNLER = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
export const GUNLER_KISA = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

const iki = (n: number) => String(n).padStart(2, '0');

export function tarihMetni(d: Date): string {
  return `${d.getFullYear()}-${iki(d.getMonth() + 1)}-${iki(d.getDate())}`;
}

export function saatMetni(d: Date): string {
  return `${iki(d.getHours())}:${iki(d.getMinutes())}`;
}

const TARIH_DESENI = /^(\d{4})-(\d{2})-(\d{2})$/;
const SAAT_DESENI = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function gecerliTarih(s: unknown): s is string {
  if (typeof s !== 'string') return false;
  const m = TARIH_DESENI.exec(s);
  if (!m) return false;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return tarihMetni(d) === s;
}

export function gecerliSaat(s: unknown): s is string {
  return typeof s === 'string' && SAAT_DESENI.test(s);
}

export function tarihten(s: string): Date {
  const m = TARIH_DESENI.exec(s);
  if (!m) throw new Error(`Geçersiz tarih: ${s}`);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function tarihSaatten(tarih: string, saat: string): Date {
  const d = tarihten(tarih);
  const [s, dk] = saat.split(':').map(Number);
  d.setHours(s ?? 0, dk ?? 0, 0, 0);
  return d;
}

export function gunEkle(tarih: string, gun: number): string {
  const d = tarihten(tarih);
  d.setDate(d.getDate() + gun);
  return tarihMetni(d);
}

/** Pazartesi 1, pazar 7. */
export function haftaninGunu(tarih: string): number {
  const g = tarihten(tarih).getDay();
  return g === 0 ? 7 : g;
}

export function haftaBasi(tarih: string): string {
  return gunEkle(tarih, 1 - haftaninGunu(tarih));
}

export function ayAnahtari(tarih: string): string {
  return tarih.slice(0, 7);
}

export function ayEkle(ay: string, fark: number): string {
  const [y, a] = ay.split('-').map(Number);
  const d = new Date(y ?? 2000, (a ?? 1) - 1 + fark, 1);
  return `${d.getFullYear()}-${iki(d.getMonth() + 1)}`;
}

export function ayAdi(ay: string): string {
  const [y, a] = ay.split('-').map(Number);
  return `${AYLAR[(a ?? 1) - 1]} ${y}`;
}

/** 27 Kasım */
export function kisaTarih(tarih: string): string {
  const d = tarihten(tarih);
  return `${d.getDate()} ${AYLAR[d.getMonth()]}`;
}

/** 27 Kasım 2026 */
export function uzunTarih(tarih: string): string {
  const d = tarihten(tarih);
  return `${d.getDate()} ${AYLAR[d.getMonth()]} ${d.getFullYear()}`;
}

/** Cuma, 27 Kasım */
export function gunluTarih(tarih: string): string {
  return `${GUNLER[haftaninGunu(tarih) - 1]}, ${kisaTarih(tarih)}`;
}

export function yas(dogum: string, bugun: string): number {
  const d = tarihten(dogum);
  const b = tarihten(bugun);
  let y = b.getFullYear() - d.getFullYear();
  if (b.getMonth() < d.getMonth() || (b.getMonth() === d.getMonth() && b.getDate() < d.getDate())) y--;
  return y;
}

export function dakikaFarki(onceki: Date, sonraki: Date): number {
  return Math.round((sonraki.getTime() - onceki.getTime()) / 60000);
}
