import { gunEkle, tarihten } from './tarih';

function artikYil(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/** Doğum gününün verilen yıldaki tarihi. 29 Şubat doğumlular artık olmayan yılda 28 Şubat'ta kutlanır. */
export function yildakiDogumGunu(dogum: string, yil: number): string {
  const ay = dogum.slice(5, 7);
  let gun = dogum.slice(8, 10);
  if (ay === '02' && gun === '29' && !artikYil(yil)) gun = '28';
  return `${yil}-${ay}-${gun}`;
}

export interface YaklasanDogumGunu<T> {
  kisi: T;
  tarih: string;
  yeniYas: number;
}

/**
 * Bugünden başlayarak verilen gün sayısı içindeki doğum günleri. Yıl sonunu geçen aralıkta
 * gelecek yılın tarihine bakılır.
 */
export function yaklasanDogumGunleri<T extends { birth_date: string | null }>(
  kisiler: T[],
  bugun: string,
  gunSayisi: number,
): YaklasanDogumGunu<T>[] {
  const son = gunEkle(bugun, gunSayisi - 1);
  const yil = tarihten(bugun).getFullYear();
  const sonuc: YaklasanDogumGunu<T>[] = [];
  for (const kisi of kisiler) {
    if (!kisi.birth_date) continue;
    for (const y of [yil, yil + 1]) {
      const t = yildakiDogumGunu(kisi.birth_date, y);
      if (t >= bugun && t <= son) {
        sonuc.push({ kisi, tarih: t, yeniYas: y - Number(kisi.birth_date.slice(0, 4)) });
        break;
      }
    }
  }
  return sonuc.sort((a, b) => a.tarih.localeCompare(b.tarih));
}
