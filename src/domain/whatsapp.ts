import { kisaTarih } from './tarih';
import { tl } from './odeme';

/** Türkiye numarasını wa.me biçimine çevirir: 0532 123 45 67 -> 905321234567. Geçersizse null. */
export function waNumarasi(telefon: string | null | undefined): string | null {
  if (!telefon) return null;
  let r = telefon.replace(/[^\d+]/g, '');
  if (r.startsWith('+')) r = r.slice(1);
  if (r.startsWith('00')) r = r.slice(2);
  if (r.startsWith('0')) r = `90${r.slice(1)}`;
  if (r.length === 10 && r.startsWith('5')) r = `90${r}`;
  return /^\d{11,15}$/.test(r) ? r : null;
}

export function odemeHatirlatmaMetni(veliAdi: string | null, sporcuAdi: string, tutar: number, tarih: string, hoca: string | null): string {
  const selam = veliAdi ? `Merhaba ${veliAdi},` : 'Merhaba,';
  const imza = hoca ? `\n\n${hoca}` : '';
  return `${selam} ${sporcuAdi} için ${kisaTarih(tarih)} tarihli ${tl(tutar)} tenis ders ödemesini hatırlatmak istedim. Teşekkürler.${imza}`;
}

export function waBaglantisi(numara: string, metin: string): string {
  return `https://wa.me/${numara}?text=${encodeURIComponent(metin)}`;
}
