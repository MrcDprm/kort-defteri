/** Boş metin null, aralık dışı ya da sayı olmayan değer hata, aksi hâlde tek ondalıklı sayı. */
export function sayiOku(metin: string, min: number, max: number): number | null | 'hata' {
  const t = metin.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n * 10) / 10 : 'hata';
}
