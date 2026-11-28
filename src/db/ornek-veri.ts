import * as Crypto from 'expo-crypto';
import { Directory, Paths } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';
import { AYLAR, gunEkle, haftaBasi, haftaninGunu, tarihMetni, tarihten } from '@/domain/tarih';
import type { Backhand, DersTuru, El, TopEvresi } from '@/domain/tipler';
import { TABLO_SIRASI } from '@/domain/yedek-semasi';
import { degisti } from './olay';

// Yalnızca geliştirme sürümünde görünen örnek veri: uygulamayı dolu göstermek ve ekran
// görüntüsü almak için. Telefon numarası bilerek yok; örnek numara gerçek birine denk gelebilir.

const id = () => Crypto.randomUUID();

/** Her çalıştırmada aynı sonucu veren basit rastgele sayı üreteci. */
function uretec(tohum: number) {
  let s = tohum;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

interface OrnekSporcu {
  ad: string;
  soyad: string;
  veli: string | null;
  yas: number;
  top: TopEvresi;
  el: El;
  bh: Backhand;
  grup: string;
  turnuva: boolean;
  aidat: number;
  aktif?: boolean;
  dogumBuHafta?: boolean;
}

const SPORCULAR: OrnekSporcu[] = [
  { ad: 'Ege', soyad: 'Korkmaz', veli: 'Serkan Korkmaz', yas: 14, top: 'sari', el: 'sag', bh: 'cift', grup: 'Performans grubu', turnuva: true, aidat: 3000 },
  { ad: 'Defne', soyad: 'Yıldız', veli: 'Gülay Yıldız', yas: 12, top: 'yesil', el: 'sag', bh: 'cift', grup: 'Performans grubu', turnuva: true, aidat: 3000 },
  { ad: 'Arda', soyad: 'Çelik', veli: 'Murat Çelik', yas: 13, top: 'sari', el: 'sol', bh: 'tek', grup: 'Performans grubu', turnuva: true, aidat: 3000 },
  { ad: 'Zeynep', soyad: 'Aydın', veli: 'Esra Aydın', yas: 15, top: 'sari', el: 'sag', bh: 'tek', grup: 'Performans grubu', turnuva: true, aidat: 3000 },
  { ad: 'Kerem', soyad: 'Şahin', veli: 'Hakan Şahin', yas: 11, top: 'yesil', el: 'sag', bh: 'cift', grup: 'Performans grubu', turnuva: false, aidat: 3000 },
  { ad: 'Elif', soyad: 'Demir', veli: 'Sevgi Demir', yas: 9, top: 'turuncu', el: 'sag', bh: 'cift', grup: 'Çocuk grubu', turnuva: false, aidat: 2200 },
  { ad: 'Mert', soyad: 'Kaya', veli: 'Emre Kaya', yas: 10, top: 'turuncu', el: 'sag', bh: 'cift', grup: 'Çocuk grubu', turnuva: false, aidat: 2200, dogumBuHafta: true },
  { ad: 'Ada', soyad: 'Arslan', veli: 'Pınar Arslan', yas: 8, top: 'turuncu', el: 'sol', bh: 'cift', grup: 'Çocuk grubu', turnuva: false, aidat: 2200 },
  { ad: 'Can', soyad: 'Öztürk', veli: 'Tolga Öztürk', yas: 9, top: 'turuncu', el: 'sag', bh: 'cift', grup: 'Çocuk grubu', turnuva: false, aidat: 2200 },
  { ad: 'Lina', soyad: 'Koç', veli: 'Derya Koç', yas: 6, top: 'kirmizi', el: 'sag', bh: 'cift', grup: 'Mini tenis', turnuva: false, aidat: 1800 },
  { ad: 'Deniz', soyad: 'Polat', veli: 'Okan Polat', yas: 7, top: 'kirmizi', el: 'sag', bh: 'cift', grup: 'Mini tenis', turnuva: false, aidat: 1800 },
  { ad: 'Ömer', soyad: 'Yılmaz', veli: 'Nur Yılmaz', yas: 6, top: 'kirmizi', el: 'sol', bh: 'cift', grup: 'Mini tenis', turnuva: false, aidat: 1800 },
  { ad: 'Selin', soyad: 'Erdem', veli: 'Aylin Erdem', yas: 16, top: 'sari', el: 'sag', bh: 'tek', grup: 'Özel ders', turnuva: true, aidat: 4000 },
  { ad: 'Burak', soyad: 'Tan', veli: null, yas: 34, top: 'sari', el: 'sag', bh: 'tek', grup: 'Yetişkin', turnuva: false, aidat: 4000 },
  { ad: 'Ayşe', soyad: 'Güneş', veli: 'Fatma Güneş', yas: 10, top: 'turuncu', el: 'sag', bh: 'cift', grup: 'Çocuk grubu', turnuva: false, aidat: 2200, aktif: false },
];

interface OrnekSablon {
  baslik: string;
  gun: number;
  bas: string;
  bit: string;
  kort: string;
  tur: DersTuru;
  grup?: string;
  kisiler?: string[];
}

const SABLONLAR: OrnekSablon[] = [
  { baslik: 'Performans grubu', gun: 1, bas: '17:00', bit: '18:30', kort: 'Kort 1', tur: 'grup', grup: 'Performans grubu' },
  { baslik: 'Performans grubu', gun: 3, bas: '17:00', bit: '18:30', kort: 'Kort 1', tur: 'grup', grup: 'Performans grubu' },
  { baslik: 'Performans grubu', gun: 5, bas: '17:00', bit: '18:30', kort: 'Kort 1', tur: 'grup', grup: 'Performans grubu' },
  { baslik: 'Çocuk grubu', gun: 2, bas: '16:00', bit: '17:00', kort: 'Kort 2', tur: 'grup', grup: 'Çocuk grubu' },
  { baslik: 'Çocuk grubu', gun: 4, bas: '16:00', bit: '17:00', kort: 'Kort 2', tur: 'grup', grup: 'Çocuk grubu' },
  { baslik: 'Çocuk grubu', gun: 6, bas: '11:00', bit: '12:00', kort: 'Kort 2', tur: 'grup', grup: 'Çocuk grubu' },
  { baslik: 'Mini tenis', gun: 6, bas: '10:00', bit: '11:00', kort: 'Kort 2', tur: 'grup', grup: 'Mini tenis' },
  { baslik: 'Mini tenis', gun: 3, bas: '15:30', bit: '16:30', kort: 'Kort 2', tur: 'grup', grup: 'Mini tenis' },
  { baslik: 'Özel ders', gun: 2, bas: '18:00', bit: '19:00', kort: 'Kort 1', tur: 'ozel', kisiler: ['Selin'] },
  { baslik: 'Özel ders', gun: 5, bas: '10:00', bit: '11:00', kort: 'Kort 1', tur: 'ozel', kisiler: ['Zeynep'] },
  { baslik: 'Özel ders', gun: 5, bas: '14:00', bit: '15:00', kort: 'Kort 2', tur: 'ozel', kisiler: ['Ege'] },
  { baslik: 'Özel ders', gun: 4, bas: '19:00', bit: '20:00', kort: 'Kort 1', tur: 'ozel', kisiler: ['Burak'] },
  { baslik: 'Turnuva hazırlık', gun: 7, bas: '10:00', bit: '12:00', kort: 'Kort 1', tur: 'grup', kisiler: ['Ege', 'Defne', 'Arda', 'Zeynep', 'Selin'] },
];

/** Grup ve seviyeye göre temel puan; tenise yeni başlayanlar düşük başlar. */
const TEMEL_PUAN: Record<string, number> = { 'Performans grubu': 3, 'Özel ders': 3.5, 'Çocuk grubu': 2, 'Mini tenis': 1.5, 'Yetişkin': 2.5 };

export async function ornekVeriYukle(db: SQLiteDatabase): Promise<void> {
  const bugun = tarihMetni(new Date());
  const rastgele = uretec(42);
  const simdi = new Date();
  const baslangic = new Date(simdi.getTime() - 40 * 86_400_000).toISOString();

  await db.withExclusiveTransactionAsync(async (tx) => {
    const kimlik = new Map<string, string>();
    const gruplar = new Map<string, string[]>();

    for (const [i, s] of SPORCULAR.entries()) {
      const sid = id();
      kimlik.set(s.ad, sid);
      if (s.aktif !== false) gruplar.set(s.grup, [...(gruplar.get(s.grup) ?? []), sid]);
      const yil = tarihten(bugun).getFullYear() - s.yas;
      // Bir sporcunun doğum günü bu haftaya, diğerleri yıla dağılır.
      const dogum = s.dogumBuHafta
        ? `${yil + (gunEkle(bugun, 2).slice(5) < bugun.slice(5) ? 1 : 0)}-${gunEkle(bugun, 2).slice(5)}`
        : `${yil - (i % 3 === 0 ? 1 : 0)}-${String((i * 5) % 12 + 1).padStart(2, '0')}-${String((i * 7) % 27 + 1).padStart(2, '0')}`;
      const baslama = gunEkle(bugun, -Math.round(200 + rastgele() * Math.min(s.yas - 4, 8) * 300));
      await tx.runAsync(
        `INSERT INTO athletes (id, first_name, last_name, parent_name, phone, parent_phone, birth_date, ball, hand, backhand, group_name, started_on,
         photo, active, tournament, notes, created_at) VALUES (?,?,?,?,NULL,NULL,?,?,?,?,?,?,NULL,?,?,?,?)`,
        sid, s.ad, s.soyad, s.veli, dogum, s.top, s.el, s.bh, s.grup, baslama, s.aktif === false ? 0 : 1, s.turnuva ? 1 : 0,
        s.ad === 'Arda' ? 'Servis atışında top atışı düzensiz, her derste 10 dakika servis çalışılacak.' : null, baslangic,
      );

      // Boy ve kilo: altı ay boyunca üç ölçüm.
      const boy0 = s.yas >= 16 ? 168 + rastgele() * 12 : 105 + (s.yas - 5) * 6.2 + rastgele() * 5;
      const kilo0 = s.yas >= 16 ? 58 + rastgele() * 18 : 17 + (s.yas - 5) * 3.1 + rastgele() * 3;
      for (const [j, gun] of [-180, -90, -6].entries()) {
        const buyume = s.yas >= 16 ? 0 : j * 1.6;
        await tx.runAsync(
          'INSERT INTO measurements (id, athlete_id, date, height_cm, weight_kg) VALUES (?,?,?,?,?)',
          id(), sid, gunEkle(bugun, gun), Math.round((boy0 + buyume) * 10) / 10, Math.round((kilo0 + j * 0.9) * 10) / 10,
        );
      }

      // Ödemeler: son iki ay ödenmiş; bu ay çoğu ödenmiş, ikisi gecikmiş, ikisi bekliyor.
      if (s.aktif === false) continue;
      for (const ay of [2, 1, 0]) {
        const d = tarihten(bugun);
        d.setMonth(d.getMonth() - ay, 5);
        let tarih = tarihMetni(d);
        let odendi = true;
        if (ay === 0) {
          if (s.ad === 'Can' || s.ad === 'Kerem') { tarih = gunEkle(bugun, -9); odendi = false; }
          else if (s.ad === 'Lina' || s.ad === 'Burak') { tarih = gunEkle(bugun, 3); odendi = false; }
          else if (tarih > bugun) tarih = bugun;
        }
        if (ay === 1 && s.ad === 'Ada') odendi = false;
        await tx.runAsync(
          'INSERT INTO payments (id, athlete_id, due_date, amount, paid, paid_at, note) VALUES (?,?,?,?,?,?,?)',
          id(), sid, tarih, s.aidat, odendi ? 1 : 0, odendi ? `${tarih}T12:00:00.000Z` : null, `${AYLAR[tarihten(tarih).getMonth()]} aidatı`,
        );
      }
    }

    // Haftalık program ve son üç haftanın yoklaması.
    const sablonKimlik: { s: OrnekSablon; id: string; kisiler: string[] }[] = [];
    for (const s of SABLONLAR) {
      const tid = id();
      const kisiler = s.grup ? gruplar.get(s.grup) ?? [] : (s.kisiler ?? []).map((a) => kimlik.get(a)!).filter(Boolean);
      sablonKimlik.push({ s, id: tid, kisiler });
      await tx.runAsync(
        'INSERT INTO lesson_templates (id, title, weekday, start, end, court, kind, active, created_at) VALUES (?,?,?,?,?,?,?,1,?)',
        tid, s.baslik, s.gun, s.bas, s.bit, s.kort, s.tur, baslangic,
      );
      for (const k of kisiler) await tx.runAsync('INSERT INTO template_athletes (template_id, athlete_id) VALUES (?, ?)', tid, k);
    }

    const yagmurGunu = gunEkle(haftaBasi(bugun), -5);
    for (let g = 21; g >= 1; g--) {
      const gun = gunEkle(bugun, -g);
      for (const { s, id: tid, kisiler } of sablonKimlik) {
        if (s.gun !== haftaninGunu(gun)) continue;
        const lid = id();
        const iptal = gun === yagmurGunu && s.grup === 'Performans grubu';
        await tx.runAsync(
          'INSERT INTO lessons (id, template_id, date, start, end, title, court, kind, status, note) VALUES (?,?,?,?,?,?,?,?,?,?)',
          lid, tid, gun, s.bas, s.bit, s.baslik, s.kort, s.tur, iptal ? 'iptal' : 'yapildi', iptal ? 'Yağmur' : null,
        );
        for (const k of kisiler) {
          await tx.runAsync('INSERT INTO lesson_athletes (lesson_id, athlete_id) VALUES (?, ?)', lid, k);
          if (!iptal) await tx.runAsync('INSERT INTO attendance (lesson_id, athlete_id, present) VALUES (?,?,?)', lid, k, rastgele() < 0.87 ? 1 : 0);
        }
        if (iptal) {
          // Yağmur iptalinin telafisi iki gün sonra.
          const telafi = id();
          await tx.runAsync(
            "INSERT INTO lessons (id, template_id, date, start, end, title, court, kind, status, note) VALUES (?,NULL,?,?,?,?,?,?,'yapildi','Yağmur telafisi')",
            telafi, gunEkle(gun, 2), '18:30', '20:00', 'Telafi: Performans grubu', s.kort, s.tur,
          );
          for (const k of kisiler) {
            await tx.runAsync('INSERT INTO lesson_athletes (lesson_id, athlete_id) VALUES (?, ?)', telafi, k);
            await tx.runAsync('INSERT INTO attendance (lesson_id, athlete_id, present) VALUES (?,?,1)', telafi, k);
          }
        }
      }
    }

    // Performans: iki değerlendirme, ikincisinde çoğu metrik bir adım ileride.
    const metrikler = await tx.getAllAsync<{ id: string }>('SELECT id FROM metrics WHERE active = 1 ORDER BY sort');
    for (const s of SPORCULAR) {
      if (s.aktif === false) continue;
      const sid = kimlik.get(s.ad)!;
      const temel = TEMEL_PUAN[s.grup] ?? 2;
      const ilk = metrikler.map(() => Math.max(1, Math.min(5, Math.round(temel + (rastgele() - 0.5) * 1.6))));
      for (const [j, gun] of [-62, -4].entries()) {
        const eid = id();
        await tx.runAsync(
          'INSERT INTO evaluations (id, athlete_id, date, note) VALUES (?,?,?,?)', eid, sid, gunEkle(bugun, gun),
          j === 1 ? `${s.ad} son iki ayda belirgin gelişti. Ayak hareketi ve backhand'de daha istikrarlı, servis çalışmasına devam.` : null,
        );
        for (const [m, met] of metrikler.entries()) {
          const puan = j === 0 ? ilk[m]! : Math.min(5, ilk[m]! + (rastgele() < 0.6 ? 1 : 0));
          await tx.runAsync('INSERT INTO evaluation_scores (evaluation_id, metric_id, score) VALUES (?,?,?)', eid, met.id, puan);
        }
      }
    }

    // Turnuvalar: biri geçmiş, sonuçlu; biri yaklaşan.
    const gecmis = id();
    await tx.runAsync('INSERT INTO tournaments (id, name, date, place, category) VALUES (?,?,?,?,?)', gecmis, 'Kış Kupası', gunEkle(bugun, -18), 'Tekirdağ', '12-16 yaş');
    for (const [a, sonuc] of [['Ege', 'Yarı final'], ['Defne', 'Şampiyon'], ['Arda', 'Çeyrek final'], ['Zeynep', 'Final'], ['Selin', 'İkinci tur']]) {
      await tx.runAsync('INSERT INTO tournament_entries (tournament_id, athlete_id, result) VALUES (?,?,?)', gecmis, kimlik.get(a!)!, sonuc!);
    }
    const yaklasan = id();
    await tx.runAsync('INSERT INTO tournaments (id, name, date, place, category) VALUES (?,?,?,?,?)', yaklasan, 'Gençler Turnuvası', gunEkle(bugun, 16), 'İstanbul', '14 yaş');
    for (const a of ['Ege', 'Arda', 'Defne']) {
      await tx.runAsync('INSERT INTO tournament_entries (tournament_id, athlete_id, result) VALUES (?,?,NULL)', yaklasan, kimlik.get(a)!);
    }

    // Hoca profili boşsa doldurulur; doluysa dokunulmaz.
    const h = await tx.getFirstAsync<{ name: string | null }>('SELECT name FROM coach WHERE id = 1');
    if (!h?.name) {
      await tx.runAsync(
        `UPDATE coach SET name = ?, title = ?, bio = ?, experience = ?, certificates = ? WHERE id = 1`,
        'Alper', 'Tenis antrenörü',
        'Çocuklara ve yetişkinlere tenis öğretiyorum. Derslerde teknik kadar oyun sevgisine ve sahadaki özgüvene önem veriyorum.',
        'Mini tenisten turnuva oyuncusuna kadar her yaştan sporcuyla çalışıyorum. Öğrencilerim bölge turnuvalarında yarışıyor.',
        'Tenis antrenörlüğü belgesi\nİlk yardım eğitimi\nMini tenis eğitmen kursu',
      );
    }
  });
  degisti();
}

/** Bütün kayıtları ve fotoğrafları siler; metrikler ve bildirim ayarları kalır. */
export async function tumVeriyiSil(db: SQLiteDatabase): Promise<void> {
  const korunan = new Set(['metrics', 'settings', 'coach']);
  await db.withExclusiveTransactionAsync(async (tx) => {
    for (const tablo of [...TABLO_SIRASI].reverse()) {
      if (!korunan.has(tablo)) await tx.runAsync(`DELETE FROM ${tablo}`);
    }
    await tx.runAsync('UPDATE coach SET name = NULL, title = NULL, bio = NULL, experience = NULL, certificates = NULL, phone = NULL, instagram = NULL, photo = NULL WHERE id = 1');
  });
  try {
    const d = new Directory(Paths.document, 'fotograflar');
    if (d.exists) d.delete();
  } catch {
    // Fotoğraf klasörü silinemezse yalnızca yer kaplar.
  }
  degisti();
}
