import { yaklasanDogumGunleri } from './dogumgunu';
import { gununDersleri } from './program';
import { gunEkle, gunluTarih, haftaninGunu, tarihSaatten, tarihMetni } from './tarih';
import { odemeDurumu } from './odeme';
import { adSoyad, type Ders, type DersSablonu, type Odeme, type Sporcu } from './tipler';

/** iOS bir uygulamada en fazla 64 bekleyen yerel bildirim tutar; biraz pay bırakılır. */
export const BILDIRIM_SINIRI = 60;
export const PLAN_GUNU = 14;

export interface BildirimAyarlari {
  sabahSaati: string;
  dersOncesiDakika: number;
}

export interface PlanliBildirim {
  zaman: Date;
  baslik: string;
  govde: string;
  tur: 'sabah' | 'ders';
}

interface Girdi {
  simdi: Date;
  sablonlar: DersSablonu[];
  dersler: Ders[];
  odemeler: Odeme[];
  sporcular: Sporcu[];
  ayarlar: BildirimAyarlari;
}

function liste(adlar: string[]): string {
  if (adlar.length <= 2) return adlar.join(' ve ');
  return `${adlar.slice(0, 2).join(', ')} ve ${adlar.length - 2} kişi daha`;
}

/**
 * Önümüzdeki iki haftanın bildirim planı. Önce her sabahın özeti, sonra ders öncesi
 * hatırlatmalar yer alır; sınır aşılırsa en uzaktaki ders hatırlatmaları düşer.
 */
export function bildirimPlani(g: Girdi): PlanliBildirim[] {
  const bugun = tarihMetni(g.simdi);
  const aktif = g.sporcular.filter((s) => s.active === 1);
  const adlar = new Map(g.sporcular.map((s) => [s.id, adSoyad(s)]));
  const sabahlar: PlanliBildirim[] = [];
  const dersler: PlanliBildirim[] = [];

  for (let i = 0; i < PLAN_GUNU; i++) {
    const gun = gunEkle(bugun, i);
    const olaylar = gununDersleri(gun, g.sablonlar, g.dersler).filter((o) => o.status !== 'iptal');
    const satirlar: string[] = [];

    if (olaylar.length > 0) {
      satirlar.push(`${olaylar.length} ders, ilki ${olaylar[0]!.start}.`);
    }
    const dogum = yaklasanDogumGunleri(aktif, gun, 1);
    if (dogum.length > 0) {
      satirlar.push(`Doğum günü: ${liste(dogum.map((d) => `${adSoyad(d.kisi)} ${d.yeniYas} yaşında`))}.`);
    }
    if (haftaninGunu(gun) === 1) {
      const hafta = yaklasanDogumGunleri(aktif, gunEkle(gun, 1), 6);
      if (hafta.length > 0) satirlar.push(`Bu hafta doğum günü olan: ${liste(hafta.map((d) => adSoyad(d.kisi)))}.`);
    }
    const vadesiGelen = g.odemeler.filter((o) => o.paid !== 1 && o.due_date === gun);
    if (vadesiGelen.length > 0) {
      satirlar.push(`Ödeme günü: ${liste(vadesiGelen.map((o) => adlar.get(o.athlete_id) ?? 'Sporcu'))}.`);
    }
    // Geciken ödemeler o gün hâlâ ödenmemiş sayılarak yazılır; ödendi işaretlenince plan yeniden kurulur.
    const geciken = g.odemeler.filter((o) => odemeDurumu(o, gun) === 'gecikti');
    if (geciken.length > 0) {
      satirlar.push(`${geciken.length} gecikmiş ödeme var.`);
    }

    const sabah = tarihSaatten(gun, g.ayarlar.sabahSaati);
    if (satirlar.length > 0 && sabah > g.simdi) {
      sabahlar.push({ zaman: sabah, baslik: gunluTarih(gun), govde: satirlar.join(' '), tur: 'sabah' });
    }

    if (g.ayarlar.dersOncesiDakika > 0) {
      for (const o of olaylar) {
        if (o.status !== 'planli') continue;
        const zaman = new Date(tarihSaatten(gun, o.start).getTime() - g.ayarlar.dersOncesiDakika * 60000);
        if (zaman <= g.simdi) continue;
        const yer = o.court ? `, ${o.court}` : '';
        dersler.push({ zaman, baslik: `${o.start} ${o.title}`, govde: `${g.ayarlar.dersOncesiDakika} dakika sonra başlıyor${yer}.`, tur: 'ders' });
      }
    }
  }

  const kalan = Math.max(0, BILDIRIM_SINIRI - sabahlar.length);
  const secilen = [...sabahlar.slice(0, BILDIRIM_SINIRI), ...dersler.sort((a, b) => a.zaman.getTime() - b.zaman.getTime()).slice(0, kalan)];
  return secilen.sort((a, b) => a.zaman.getTime() - b.zaman.getTime());
}
