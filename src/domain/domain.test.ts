import { describe, expect, it } from 'vitest';
import { bildirimPlani, BILDIRIM_SINIRI } from './bildirim-plani';
import { yaklasanDogumGunleri, yildakiDogumGunu } from './dogumgunu';
import { ayOzeti, gecikenler, odemeDurumu, tl, tutarOku } from './odeme';
import { devamOrani, gununDersleri, siradakiDers } from './program';
import { ayEkle, gecerliTarih, gunEkle, haftaBasi, haftaninGunu, yas } from './tarih';
import type { Ders, DersSablonu, Odeme, Sporcu } from './tipler';
import { odemeHatirlatmaMetni, waNumarasi } from './whatsapp';
import { yedegiDogrula, YedekHatasi, yedektekiFotolar } from './yedek-semasi';

const K = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

function sporcu(n: number, ek: Partial<Sporcu> = {}): Sporcu {
  return {
    id: K(n), first_name: `Ad${n}`, last_name: 'Soyad', parent_name: null, phone: null, parent_phone: null,
    birth_date: null, ball: null, hand: null, backhand: null, group_name: null, started_on: null, photo: null,
    active: 1, tournament: 0, notes: null, created_at: '2026-01-01T00:00:00.000Z', ...ek,
  };
}

function sablon(n: number, ek: Partial<DersSablonu> = {}): DersSablonu {
  return { id: K(n), title: `Ders ${n}`, weekday: 5, start: '10:00', end: '11:00', court: 'Kort 1', kind: 'grup', active: 1, created_at: '2026-01-01T00:00:00.000Z', ...ek };
}

function odeme(n: number, ek: Partial<Odeme> = {}): Odeme {
  return { id: K(100 + n), athlete_id: K(1), due_date: '2026-11-20', amount: 2500, paid: 0, paid_at: null, note: null, ...ek };
}

describe('tarih', () => {
  it('haftanın gününü pazartesi 1 pazar 7 olarak verir', () => {
    expect(haftaninGunu('2026-11-23')).toBe(1);
    expect(haftaninGunu('2026-11-29')).toBe(7);
  });
  it('hafta başını ve gün eklemeyi ay ve yıl sınırında doğru hesaplar', () => {
    expect(haftaBasi('2026-11-29')).toBe('2026-11-23');
    expect(gunEkle('2026-12-31', 1)).toBe('2027-01-01');
    expect(ayEkle('2026-12', 1)).toBe('2027-01');
    expect(ayEkle('2026-01', -1)).toBe('2025-12');
  });
  it('olmayan tarihleri reddeder', () => {
    expect(gecerliTarih('2026-02-30')).toBe(false);
    expect(gecerliTarih('2024-02-29')).toBe(true);
    expect(gecerliTarih('2026-2-3')).toBe(false);
    expect(gecerliTarih(20261127)).toBe(false);
  });
  it('yaşı doğum gününden önce ve sonra doğru verir', () => {
    expect(yas('2018-11-28', '2026-11-27')).toBe(7);
    expect(yas('2018-11-27', '2026-11-27')).toBe(8);
  });
});

describe('doğum günleri', () => {
  it('29 Şubat doğumluyu artık olmayan yılda 28 Şubatta kutlar', () => {
    expect(yildakiDogumGunu('2016-02-29', 2027)).toBe('2027-02-28');
    expect(yildakiDogumGunu('2016-02-29', 2028)).toBe('2028-02-29');
  });
  it('yıl sonunu geçen haftada gelecek yılın doğum gününü bulur', () => {
    const s = sporcu(1, { birth_date: '2015-01-02' });
    const r = yaklasanDogumGunleri([s], '2026-12-29', 7);
    expect(r).toHaveLength(1);
    expect(r[0]!.tarih).toBe('2027-01-02');
    expect(r[0]!.yeniYas).toBe(12);
  });
  it('aralık dışındakileri ve doğum tarihi olmayanları atlar', () => {
    const r = yaklasanDogumGunleri([sporcu(1, { birth_date: '2015-12-10' }), sporcu(2)], '2026-11-27', 7);
    expect(r).toHaveLength(0);
  });
});

describe('ders programı', () => {
  it('şablon derslerini o güne düşürür ve saate göre sıralar', () => {
    const r = gununDersleri('2026-11-27', [sablon(1, { start: '17:00', end: '18:00' }), sablon(2), sablon(3, { weekday: 1 })], []);
    expect(r.map((o) => o.template_id)).toEqual([K(2), K(1)]);
  });
  it('kaydedilmiş ders aynı şablonun dersinin yerine geçer', () => {
    const kayit: Ders = { id: K(50), template_id: K(1), date: '2026-11-27', start: '10:00', end: '11:00', title: 'Ders 1', court: null, kind: 'grup', status: 'iptal', note: 'Yağmur' };
    const r = gununDersleri('2026-11-27', [sablon(1)], [kayit]);
    expect(r).toHaveLength(1);
    expect(r[0]!.status).toBe('iptal');
  });
  it('pasif şablonu ve oluşturulmadan önceki günleri göstermez', () => {
    expect(gununDersleri('2026-11-27', [sablon(1, { active: 0 })], [])).toHaveLength(0);
    expect(gununDersleri('2026-11-20', [sablon(1, { created_at: '2026-11-25T10:00:00.000Z' })], [])).toHaveLength(0);
  });
  it('sıradaki dersi bitmemiş ilk bekleyen ders olarak bulur', () => {
    const r = gununDersleri('2026-11-27', [sablon(1), sablon(2, { start: '14:00', end: '15:00' })], []);
    expect(siradakiDers(r, '10:30')?.template_id).toBe(K(1));
    expect(siradakiDers(r, '11:00')?.template_id).toBe(K(2));
    expect(siradakiDers(r, '15:00')).toBeNull();
  });
  it('devam oranını hesaplar, kayıt yoksa boş döner', () => {
    expect(devamOrani([{ present: 1 }, { present: 0 }, { present: 1 }])).toBe(67);
    expect(devamOrani([])).toBeNull();
  });
});

describe('ödemeler', () => {
  it('durumu ödendi, bekliyor ya da gecikti olarak verir', () => {
    expect(odemeDurumu(odeme(1, { paid: 1 }), '2026-12-01')).toBe('odendi');
    expect(odemeDurumu(odeme(1), '2026-11-20')).toBe('bekliyor');
    expect(odemeDurumu(odeme(1), '2026-11-21')).toBe('gecikti');
  });
  it('ay özetinde alınan, bekleyen ve ödeyen sporcu sayısını verir', () => {
    const o = [odeme(1, { paid: 1 }), odeme(2, { paid: 1, amount: 1000 }), odeme(3, { athlete_id: K(2) }), odeme(4, { due_date: '2026-12-01', paid: 1 })];
    expect(ayOzeti(o, '2026-11')).toEqual({ alinan: 3500, bekleyen: 2500, odeyenSporcu: 1 });
  });
  it('gecikenleri eskiden yeniye sıralar', () => {
    const o = [odeme(1, { due_date: '2026-11-10' }), odeme(2, { due_date: '2026-11-01' }), odeme(3, { due_date: '2026-12-10' })];
    expect(gecikenler(o, '2026-11-27').map((x) => x.due_date)).toEqual(['2026-11-01', '2026-11-10']);
  });
  it('tutarı Türkçe biçimde yazar', () => {
    expect(tl(2500)).toBe('2.500 TL');
    expect(tl(2500.5)).toBe('2.500,50 TL');
  });
  it('kullanıcının yazdığı tutarı okur, hatalıyı reddeder', () => {
    expect(tutarOku('2500')).toBe(2500);
    expect(tutarOku('2.500')).toBe(2500);
    expect(tutarOku('2.500,50')).toBe(2500.5);
    expect(tutarOku('2500,5')).toBe(2500.5);
    expect(tutarOku('2500.50')).toBe(2500.5);
    expect(tutarOku('2.500 TL')).toBe(2500);
    expect(tutarOku('')).toBeNull();
    expect(tutarOku('0')).toBeNull();
    expect(tutarOku('-5')).toBeNull();
    expect(tutarOku('abc')).toBeNull();
    expect(tutarOku('25.00.0')).toBeNull();
  });
});

describe('WhatsApp', () => {
  it('Türkiye numaralarını wa.me biçimine çevirir', () => {
    expect(waNumarasi('0532 123 45 67')).toBe('905321234567');
    expect(waNumarasi('+90 532 123 45 67')).toBe('905321234567');
    expect(waNumarasi('5321234567')).toBe('905321234567');
    expect(waNumarasi('123')).toBeNull();
    expect(waNumarasi(null)).toBeNull();
  });
  it('hatırlatma metnine veli, sporcu, tutar ve tarihi yazar', () => {
    const m = odemeHatirlatmaMetni('Selin Hanım', 'Masal Durmuş', 2500, '2026-11-20', 'Alper Hoca');
    expect(m).toContain('Merhaba Selin Hanım,');
    expect(m).toContain('20 Kasım tarihli 2.500 TL');
    expect(m.endsWith('Alper Hoca')).toBe(true);
  });
});

describe('bildirim planı', () => {
  const ayar = { sabahSaati: '08:00', dersOncesiDakika: 30 };

  it('ders olan günlere sabah özeti ve ders öncesi hatırlatma koyar', () => {
    const p = bildirimPlani({ simdi: new Date(2026, 10, 27, 7, 0), sablonlar: [sablon(1)], dersler: [], odemeler: [], sporcular: [], ayarlar: ayar });
    const sabah = p.filter((b) => b.tur === 'sabah');
    const ders = p.filter((b) => b.tur === 'ders');
    expect(sabah).toHaveLength(2);
    expect(sabah[0]!.govde).toContain('1 ders, ilki 10:00');
    expect(ders[0]!.zaman).toEqual(new Date(2026, 10, 27, 9, 30));
  });
  it('geçmiş zamanlara bildirim koymaz', () => {
    const p = bildirimPlani({ simdi: new Date(2026, 10, 27, 12, 0), sablonlar: [sablon(1)], dersler: [], odemeler: [], sporcular: [], ayarlar: ayar });
    expect(p.every((b) => b.zaman > new Date(2026, 10, 27, 12, 0))).toBe(true);
    expect(p[0]!.zaman).toEqual(new Date(2026, 11, 4, 8, 0));
  });
  it('doğum günü ve ödeme gününü sabah özetine yazar', () => {
    const p = bildirimPlani({
      simdi: new Date(2026, 10, 27, 7, 0), sablonlar: [], dersler: [],
      odemeler: [odeme(1, { due_date: '2026-11-27' })],
      sporcular: [sporcu(1, { birth_date: '2018-11-27' })], ayarlar: ayar,
    });
    expect(p[0]!.govde).toContain('Ad1 Soyad 8 yaşında');
    expect(p[0]!.govde).toContain('Ödeme günü: Ad1 Soyad');
  });
  it('64 bildirim sınırını aşmaz, önce sabah özetlerini korur', () => {
    const cok = Array.from({ length: 7 }, (_, g) => Array.from({ length: 6 }, (_, i) => sablon(g * 10 + i, { weekday: g + 1, start: `${String(9 + i).padStart(2, '0')}:00`, end: `${String(10 + i).padStart(2, '0')}:00` }))).flat();
    const p = bildirimPlani({ simdi: new Date(2026, 10, 27, 7, 0), sablonlar: cok, dersler: [], odemeler: [], sporcular: [], ayarlar: ayar });
    expect(p.length).toBe(BILDIRIM_SINIRI);
    expect(p.filter((b) => b.tur === 'sabah')).toHaveLength(14);
  });
  it('ders hatırlatması kapalıysa yalnızca sabah özeti kurar', () => {
    const p = bildirimPlani({ simdi: new Date(2026, 10, 27, 7, 0), sablonlar: [sablon(1)], dersler: [], odemeler: [], sporcular: [], ayarlar: { sabahSaati: '08:00', dersOncesiDakika: 0 } });
    expect(p.every((b) => b.tur === 'sabah')).toBe(true);
  });
});

describe('yedek doğrulama', () => {
  const gecerli = () => ({
    uygulama: 'kort-defteri', surum: 1, olusturuldu: '2026-11-27T10:00:00.000Z',
    tablolar: {
      athletes: [{ ...sporcu(1), photo: `${K(9)}.jpg` }],
      payments: [odeme(1)],
    },
  });

  it('geçerli yedeği kabul eder ve fotoğrafları listeler', () => {
    const y = yedegiDogrula(gecerli());
    expect(y.tablolar.athletes).toHaveLength(1);
    expect(yedektekiFotolar(y)).toEqual([`${K(9)}.jpg`]);
  });
  it('başka uygulamanın dosyasını ve yeni sürümü reddeder', () => {
    expect(() => yedegiDogrula({ ...gecerli(), uygulama: 'baska' })).toThrow(YedekHatasi);
    expect(() => yedegiDogrula({ ...gecerli(), surum: 99 })).toThrow(YedekHatasi);
    expect(() => yedegiDogrula('metin')).toThrow(YedekHatasi);
  });
  it('tanınmayan tabloyu ve alanı reddeder', () => {
    const t = gecerli();
    expect(() => yedegiDogrula({ ...t, tablolar: { ...t.tablolar, kullanicilar: [] } })).toThrow(/tanınmayan tablo/);
    expect(() => yedegiDogrula({ ...t, tablolar: { athletes: [{ ...sporcu(1), sifre: 'x' }] } })).toThrow(/tanınmayan alan/);
  });
  it('dosya yolu kaçışı içeren fotoğraf adını reddeder', () => {
    expect(() => yedegiDogrula({ ...gecerli(), tablolar: { athletes: [{ ...sporcu(1), photo: '../../Library/x.jpg' }] } })).toThrow(/photo/);
  });
  it('hatalı türdeki değeri reddeder', () => {
    expect(() => yedegiDogrula({ ...gecerli(), tablolar: { payments: [odeme(1, { amount: '2500' as unknown as number })] } })).toThrow(/amount/);
    expect(() => yedegiDogrula({ ...gecerli(), tablolar: { payments: [odeme(1, { paid: 2 })] } })).toThrow(/paid/);
    expect(() => yedegiDogrula({ ...gecerli(), tablolar: { payments: [odeme(1, { due_date: '2026-13-01' })] } })).toThrow(/due_date/);
  });
});
