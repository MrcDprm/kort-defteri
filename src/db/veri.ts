import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';
import { gununDersleri } from '@/domain/program';
import { gunEkle } from '@/domain/tarih';
import type {
  Degerlendirme, Ders, DersOlayi, DersSablonu, Hoca, Metrik, Odeme, Olcum, Puan, Sporcu, Turnuva, TurnuvaKatilimi, Yoklama,
} from '@/domain/tipler';
import { degisti } from './olay';

const yeniId = () => Crypto.randomUUID();

/* Sporcular */

export function sporcular(db: SQLiteDatabase): Promise<Sporcu[]> {
  return db.getAllAsync<Sporcu>('SELECT * FROM athletes ORDER BY active DESC, first_name COLLATE NOCASE, last_name COLLATE NOCASE');
}

export function sporcu(db: SQLiteDatabase, id: string): Promise<Sporcu | null> {
  return db.getFirstAsync<Sporcu>('SELECT * FROM athletes WHERE id = ?', id);
}

export type SporcuGirdisi = Omit<Sporcu, 'id' | 'created_at'>;

export async function sporcuKaydet(db: SQLiteDatabase, id: string | null, s: SporcuGirdisi): Promise<string> {
  const degerler = [s.first_name, s.last_name, s.parent_name, s.phone, s.parent_phone, s.birth_date, s.ball, s.hand, s.backhand, s.group_name, s.started_on, s.photo, s.active, s.tournament, s.notes];
  if (id) {
    await db.runAsync(
      `UPDATE athletes SET first_name=?, last_name=?, parent_name=?, phone=?, parent_phone=?, birth_date=?, ball=?, hand=?, backhand=?,
       group_name=?, started_on=?, photo=?, active=?, tournament=?, notes=? WHERE id=?`,
      ...degerler, id,
    );
  } else {
    id = yeniId();
    await db.runAsync(
      `INSERT INTO athletes (first_name, last_name, parent_name, phone, parent_phone, birth_date, ball, hand, backhand, group_name,
       started_on, photo, active, tournament, notes, id, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ...degerler, id, new Date().toISOString(),
    );
  }
  degisti();
  return id;
}

export async function sporcuSil(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM athletes WHERE id = ?', id);
  degisti();
}

export async function gruplar(db: SQLiteDatabase): Promise<string[]> {
  const r = await db.getAllAsync<{ group_name: string }>("SELECT DISTINCT group_name FROM athletes WHERE group_name IS NOT NULL AND group_name <> '' ORDER BY group_name");
  return r.map((x) => x.group_name);
}

/* Ölçümler */

export function olcumler(db: SQLiteDatabase, sporcuId: string): Promise<Olcum[]> {
  return db.getAllAsync<Olcum>('SELECT * FROM measurements WHERE athlete_id = ? ORDER BY date', sporcuId);
}

export async function olcumEkle(db: SQLiteDatabase, o: Omit<Olcum, 'id'>): Promise<void> {
  await db.runAsync('INSERT INTO measurements (id, athlete_id, date, height_cm, weight_kg) VALUES (?,?,?,?,?)', yeniId(), o.athlete_id, o.date, o.height_cm, o.weight_kg);
  degisti();
}

export async function olcumSil(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM measurements WHERE id = ?', id);
  degisti();
}

/* Ders programı */

export function sablonlar(db: SQLiteDatabase): Promise<DersSablonu[]> {
  return db.getAllAsync<DersSablonu>('SELECT * FROM lesson_templates ORDER BY weekday, start');
}

export function sablon(db: SQLiteDatabase, id: string): Promise<DersSablonu | null> {
  return db.getFirstAsync<DersSablonu>('SELECT * FROM lesson_templates WHERE id = ?', id);
}

export async function sablonSporculari(db: SQLiteDatabase, sablonId: string): Promise<string[]> {
  const r = await db.getAllAsync<{ athlete_id: string }>('SELECT athlete_id FROM template_athletes WHERE template_id = ?', sablonId);
  return r.map((x) => x.athlete_id);
}

export type SablonGirdisi = Omit<DersSablonu, 'id' | 'created_at'>;

export async function sablonKaydet(db: SQLiteDatabase, id: string | null, s: SablonGirdisi, sporcuIdleri: string[]): Promise<void> {
  await db.withExclusiveTransactionAsync(async (tx) => {
    if (id) {
      await tx.runAsync('UPDATE lesson_templates SET title=?, weekday=?, start=?, end=?, court=?, kind=?, active=? WHERE id=?', s.title, s.weekday, s.start, s.end, s.court, s.kind, s.active, id);
      await tx.runAsync('DELETE FROM template_athletes WHERE template_id = ?', id);
    } else {
      id = yeniId();
      await tx.runAsync(
        'INSERT INTO lesson_templates (id, title, weekday, start, end, court, kind, active, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
        id, s.title, s.weekday, s.start, s.end, s.court, s.kind, s.active, new Date().toISOString(),
      );
    }
    for (const a of sporcuIdleri) {
      await tx.runAsync('INSERT INTO template_athletes (template_id, athlete_id) VALUES (?, ?)', id, a);
    }
  });
  degisti();
}

export async function sablonSil(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM lesson_templates WHERE id = ?', id);
  degisti();
}

export function dersler(db: SQLiteDatabase, ilk: string, son: string): Promise<Ders[]> {
  return db.getAllAsync<Ders>('SELECT * FROM lessons WHERE date BETWEEN ? AND ? ORDER BY date, start', ilk, son);
}

export function ders(db: SQLiteDatabase, id: string): Promise<Ders | null> {
  return db.getFirstAsync<Ders>('SELECT * FROM lessons WHERE id = ?', id);
}

export async function dersSporculari(db: SQLiteDatabase, dersId: string): Promise<string[]> {
  const r = await db.getAllAsync<{ athlete_id: string }>('SELECT athlete_id FROM lesson_athletes WHERE lesson_id = ?', dersId);
  return r.map((x) => x.athlete_id);
}

/** Verilen tarih aralığındaki tüm dersler, gün gün. */
export async function aralikDersleri(db: SQLiteDatabase, ilk: string, gunSayisi: number): Promise<Map<string, DersOlayi[]>> {
  const son = gunEkle(ilk, gunSayisi - 1);
  const [s, d] = await Promise.all([sablonlar(db), dersler(db, ilk, son)]);
  const sonuc = new Map<string, DersOlayi[]>();
  for (let i = 0; i < gunSayisi; i++) {
    const gun = gunEkle(ilk, i);
    sonuc.set(gun, gununDersleri(gun, s, d));
  }
  return sonuc;
}

export type TekDersGirdisi = Omit<Ders, 'id' | 'template_id' | 'status'>;

/** Tek seferlik ya da telafi dersi. */
export async function tekDersKaydet(db: SQLiteDatabase, id: string | null, d: TekDersGirdisi, sporcuIdleri: string[]): Promise<void> {
  await db.withExclusiveTransactionAsync(async (tx) => {
    if (id) {
      await tx.runAsync('UPDATE lessons SET date=?, start=?, end=?, title=?, court=?, kind=?, note=? WHERE id=?', d.date, d.start, d.end, d.title, d.court, d.kind, d.note, id);
      await tx.runAsync('DELETE FROM lesson_athletes WHERE lesson_id = ?', id);
    } else {
      id = yeniId();
      await tx.runAsync(
        "INSERT INTO lessons (id, template_id, date, start, end, title, court, kind, status, note) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, 'planli', ?)",
        id, d.date, d.start, d.end, d.title, d.court, d.kind, d.note,
      );
    }
    for (const a of sporcuIdleri) {
      await tx.runAsync('INSERT INTO lesson_athletes (lesson_id, athlete_id) VALUES (?, ?)', id, a);
    }
  });
  degisti();
}

export async function dersSil(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM lessons WHERE id = ?', id);
  degisti();
}

export interface DersKimligi {
  lessonId: string | null;
  templateId: string | null;
  tarih: string;
}

/**
 * Şablon dersini o gün için kaydeder. Kayıt anındaki sporcu listesi derse kopyalanır;
 * şablon sonradan değişse de geçmiş yoklama bozulmaz.
 */
async function dersiKaydet(db: SQLiteDatabase, k: DersKimligi): Promise<string> {
  if (k.lessonId) return k.lessonId;
  if (!k.templateId) throw new Error('Ders bulunamadı.');
  const s = await sablon(db, k.templateId);
  if (!s) throw new Error('Ders şablonu bulunamadı.');
  const id = yeniId();
  await db.runAsync(
    "INSERT INTO lessons (id, template_id, date, start, end, title, court, kind, status, note) VALUES (?,?,?,?,?,?,?,?,'planli',NULL)",
    id, s.id, k.tarih, s.start, s.end, s.title, s.court, s.kind,
  );
  await db.runAsync('INSERT INTO lesson_athletes (lesson_id, athlete_id) SELECT ?, athlete_id FROM template_athletes WHERE template_id = ?', id, s.id);
  return id;
}

export interface DersAyrintisi {
  olay: DersOlayi;
  sporcular: Sporcu[];
  yoklama: Map<string, number>;
}

export async function dersAyrintisi(db: SQLiteDatabase, k: DersKimligi): Promise<DersAyrintisi | null> {
  if (k.lessonId) {
    const d = await ders(db, k.lessonId);
    if (!d) return null;
    const sp = await db.getAllAsync<Sporcu>(
      'SELECT a.* FROM athletes a JOIN lesson_athletes l ON l.athlete_id = a.id WHERE l.lesson_id = ? ORDER BY a.first_name COLLATE NOCASE',
      d.id,
    );
    const y = await db.getAllAsync<Yoklama>('SELECT * FROM attendance WHERE lesson_id = ?', d.id);
    return {
      olay: { anahtar: d.id, template_id: d.template_id, lesson_id: d.id, date: d.date, start: d.start, end: d.end, title: d.title, court: d.court, kind: d.kind, status: d.status, note: d.note },
      sporcular: sp,
      yoklama: new Map(y.map((x) => [x.athlete_id, x.present])),
    };
  }
  if (!k.templateId) return null;
  const s = await sablon(db, k.templateId);
  if (!s) return null;
  const sp = await db.getAllAsync<Sporcu>(
    'SELECT a.* FROM athletes a JOIN template_athletes t ON t.athlete_id = a.id WHERE t.template_id = ? ORDER BY a.first_name COLLATE NOCASE',
    s.id,
  );
  return {
    olay: { anahtar: `${s.id}:${k.tarih}`, template_id: s.id, lesson_id: null, date: k.tarih, start: s.start, end: s.end, title: s.title, court: s.court, kind: s.kind, status: 'planli', note: null },
    sporcular: sp,
    yoklama: new Map(),
  };
}

export async function yoklamaKaydet(db: SQLiteDatabase, k: DersKimligi, yoklama: Map<string, number>): Promise<void> {
  await db.withExclusiveTransactionAsync(async (tx) => {
    const id = await dersiKaydet(tx, k);
    await tx.runAsync("UPDATE lessons SET status = 'yapildi' WHERE id = ?", id);
    await tx.runAsync('DELETE FROM attendance WHERE lesson_id = ?', id);
    for (const [sporcuId, var_] of yoklama) {
      await tx.runAsync('INSERT OR IGNORE INTO lesson_athletes (lesson_id, athlete_id) VALUES (?, ?)', id, sporcuId);
      await tx.runAsync('INSERT INTO attendance (lesson_id, athlete_id, present) VALUES (?, ?, ?)', id, sporcuId, var_);
    }
  });
  degisti();
}

export async function dersIptal(db: SQLiteDatabase, k: DersKimligi, not: string | null): Promise<void> {
  await db.withExclusiveTransactionAsync(async (tx) => {
    const id = await dersiKaydet(tx, k);
    await tx.runAsync("UPDATE lessons SET status = 'iptal', note = ? WHERE id = ?", not, id);
    await tx.runAsync('DELETE FROM attendance WHERE lesson_id = ?', id);
  });
  degisti();
}

export async function iptaliGeriAl(db: SQLiteDatabase, dersId: string): Promise<void> {
  const d = await ders(db, dersId);
  if (!d) return;
  if (d.template_id) {
    // Şablon dersi yeniden şablondan gelsin diye kayıt silinir.
    await db.runAsync('DELETE FROM lessons WHERE id = ?', dersId);
  } else {
    await db.runAsync("UPDATE lessons SET status = 'planli', note = NULL WHERE id = ?", dersId);
  }
  degisti();
}

export function sporcuYoklamasi(db: SQLiteDatabase, sporcuId: string): Promise<(Yoklama & { date: string; title: string })[]> {
  return db.getAllAsync(
    'SELECT y.*, l.date, l.title FROM attendance y JOIN lessons l ON l.id = y.lesson_id WHERE y.athlete_id = ? ORDER BY l.date DESC, l.start DESC',
    sporcuId,
  );
}

/* Ödemeler */

export function odemeler(db: SQLiteDatabase): Promise<Odeme[]> {
  return db.getAllAsync<Odeme>('SELECT * FROM payments ORDER BY due_date DESC');
}

export function sporcuOdemeleri(db: SQLiteDatabase, sporcuId: string): Promise<Odeme[]> {
  return db.getAllAsync<Odeme>('SELECT * FROM payments WHERE athlete_id = ? ORDER BY due_date DESC', sporcuId);
}

export function odeme(db: SQLiteDatabase, id: string): Promise<Odeme | null> {
  return db.getFirstAsync<Odeme>('SELECT * FROM payments WHERE id = ?', id);
}

export type OdemeGirdisi = Omit<Odeme, 'id' | 'athlete_id' | 'paid_at'>;

/** Yeni kayıtta birden çok sporcu seçilebilir; her biri için ayrı ödeme kaydı açılır. */
export async function odemeKaydet(db: SQLiteDatabase, id: string | null, sporcuIdleri: string[], o: OdemeGirdisi): Promise<void> {
  const simdi = new Date().toISOString();
  await db.withExclusiveTransactionAsync(async (tx) => {
    if (id) {
      const eski = await tx.getFirstAsync<Odeme>('SELECT * FROM payments WHERE id = ?', id);
      const odendi = o.paid === 1 ? (eski?.paid === 1 ? eski.paid_at : simdi) : null;
      await tx.runAsync('UPDATE payments SET athlete_id=?, due_date=?, amount=?, paid=?, paid_at=?, note=? WHERE id=?', sporcuIdleri[0] ?? eski?.athlete_id ?? '', o.due_date, o.amount, o.paid, odendi, o.note, id);
    } else {
      for (const a of sporcuIdleri) {
        await tx.runAsync(
          'INSERT INTO payments (id, athlete_id, due_date, amount, paid, paid_at, note) VALUES (?,?,?,?,?,?,?)',
          yeniId(), a, o.due_date, o.amount, o.paid, o.paid === 1 ? simdi : null, o.note,
        );
      }
    }
  });
  degisti();
}

export async function odendiIsaretle(db: SQLiteDatabase, id: string, odendi: boolean): Promise<void> {
  await db.runAsync('UPDATE payments SET paid = ?, paid_at = ? WHERE id = ?', odendi ? 1 : 0, odendi ? new Date().toISOString() : null, id);
  degisti();
}

export async function odemeSil(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM payments WHERE id = ?', id);
  degisti();
}

/** Sporcunun son ödeme tutarı; yeni kayıtta öneri olarak kullanılır. */
export async function sonTutar(db: SQLiteDatabase, sporcuId: string): Promise<number | null> {
  const r = await db.getFirstAsync<{ amount: number }>('SELECT amount FROM payments WHERE athlete_id = ? ORDER BY due_date DESC LIMIT 1', sporcuId);
  return r?.amount ?? null;
}

/* Performans */

export function metrikler(db: SQLiteDatabase, hepsi = false): Promise<Metrik[]> {
  return db.getAllAsync<Metrik>(hepsi ? 'SELECT * FROM metrics ORDER BY sort' : 'SELECT * FROM metrics WHERE active = 1 ORDER BY sort');
}

export async function metrikKaydet(db: SQLiteDatabase, id: string | null, ad: string, aktif: number): Promise<void> {
  if (id) {
    await db.runAsync('UPDATE metrics SET name = ?, active = ? WHERE id = ?', ad, aktif, id);
  } else {
    const r = await db.getFirstAsync<{ m: number | null }>('SELECT MAX(sort) AS m FROM metrics');
    await db.runAsync('INSERT INTO metrics (id, name, sort, active) VALUES (?, ?, ?, 1)', yeniId(), ad, (r?.m ?? -1) + 1);
  }
  degisti();
}

export interface DegerlendirmeAyrintisi extends Degerlendirme {
  puanlar: Map<string, number>;
}

export async function degerlendirmeler(db: SQLiteDatabase, sporcuId: string): Promise<DegerlendirmeAyrintisi[]> {
  const d = await db.getAllAsync<Degerlendirme>('SELECT * FROM evaluations WHERE athlete_id = ? ORDER BY date DESC', sporcuId);
  if (d.length === 0) return [];
  const p = await db.getAllAsync<Puan>(
    'SELECT s.* FROM evaluation_scores s JOIN evaluations e ON e.id = s.evaluation_id WHERE e.athlete_id = ?',
    sporcuId,
  );
  return d.map((x) => ({ ...x, puanlar: new Map(p.filter((y) => y.evaluation_id === x.id).map((y) => [y.metric_id, y.score])) }));
}

export async function degerlendirmeKaydet(db: SQLiteDatabase, sporcuId: string, tarih: string, not: string | null, puanlar: Map<string, number>): Promise<void> {
  await db.withExclusiveTransactionAsync(async (tx) => {
    const id = yeniId();
    await tx.runAsync('INSERT INTO evaluations (id, athlete_id, date, note) VALUES (?, ?, ?, ?)', id, sporcuId, tarih, not);
    for (const [m, p] of puanlar) {
      await tx.runAsync('INSERT INTO evaluation_scores (evaluation_id, metric_id, score) VALUES (?, ?, ?)', id, m, p);
    }
  });
  degisti();
}

export async function degerlendirmeSil(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM evaluations WHERE id = ?', id);
  degisti();
}

/* Turnuvalar */

export function turnuvalar(db: SQLiteDatabase): Promise<(Turnuva & { katilimci: number })[]> {
  return db.getAllAsync(
    'SELECT t.*, (SELECT COUNT(*) FROM tournament_entries e WHERE e.tournament_id = t.id) AS katilimci FROM tournaments t ORDER BY t.date DESC',
  );
}

export function turnuva(db: SQLiteDatabase, id: string): Promise<Turnuva | null> {
  return db.getFirstAsync<Turnuva>('SELECT * FROM tournaments WHERE id = ?', id);
}

export function turnuvaKatilimlari(db: SQLiteDatabase, id: string): Promise<TurnuvaKatilimi[]> {
  return db.getAllAsync<TurnuvaKatilimi>('SELECT * FROM tournament_entries WHERE tournament_id = ?', id);
}

export function sporcuTurnuvalari(db: SQLiteDatabase, sporcuId: string): Promise<(Turnuva & { result: string | null })[]> {
  return db.getAllAsync(
    'SELECT t.*, e.result FROM tournaments t JOIN tournament_entries e ON e.tournament_id = t.id WHERE e.athlete_id = ? ORDER BY t.date DESC',
    sporcuId,
  );
}

export async function turnuvaKaydet(db: SQLiteDatabase, id: string | null, t: Omit<Turnuva, 'id'>, katilimlar: TurnuvaKatilimi[]): Promise<void> {
  await db.withExclusiveTransactionAsync(async (tx) => {
    if (id) {
      await tx.runAsync('UPDATE tournaments SET name=?, date=?, place=?, category=? WHERE id=?', t.name, t.date, t.place, t.category, id);
      await tx.runAsync('DELETE FROM tournament_entries WHERE tournament_id = ?', id);
    } else {
      id = yeniId();
      await tx.runAsync('INSERT INTO tournaments (id, name, date, place, category) VALUES (?,?,?,?,?)', id, t.name, t.date, t.place, t.category);
    }
    for (const k of katilimlar) {
      await tx.runAsync('INSERT INTO tournament_entries (tournament_id, athlete_id, result) VALUES (?, ?, ?)', id, k.athlete_id, k.result);
    }
  });
  degisti();
}

export async function turnuvaSil(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM tournaments WHERE id = ?', id);
  degisti();
}

/* Hoca ve ayarlar */

export async function hoca(db: SQLiteDatabase): Promise<Hoca> {
  const h = await db.getFirstAsync<Hoca>('SELECT * FROM coach WHERE id = 1');
  return h ?? { id: 1, name: null, title: null, bio: null, experience: null, certificates: null, phone: null, instagram: null, photo: null };
}

export async function hocaKaydet(db: SQLiteDatabase, h: Omit<Hoca, 'id'>): Promise<void> {
  await db.runAsync(
    `INSERT INTO coach (id, name, title, bio, experience, certificates, phone, instagram, photo) VALUES (1,?,?,?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET name=excluded.name, title=excluded.title, bio=excluded.bio, experience=excluded.experience,
     certificates=excluded.certificates, phone=excluded.phone, instagram=excluded.instagram, photo=excluded.photo`,
    h.name, h.title, h.bio, h.experience, h.certificates, h.phone, h.instagram, h.photo,
  );
  degisti();
}

export async function ayar(db: SQLiteDatabase, anahtar: string): Promise<string | null> {
  const r = await db.getFirstAsync<{ value: string | null }>('SELECT value FROM settings WHERE key = ?', anahtar);
  return r?.value ?? null;
}

/** Ayar kaydı; sessiz true ise değişiklik yayını yapılmaz, yedek zamanı gibi iç kayıtlar için. */
export async function ayarKaydet(db: SQLiteDatabase, anahtar: string, deger: string | null, sessiz = false): Promise<void> {
  await db.runAsync('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', anahtar, deger);
  if (!sessiz) degisti();
}

export const AYAR = {
  sabahSaati: 'bildirim_sabah_saati',
  dersOncesi: 'bildirim_ders_oncesi_dakika',
  sonYedek: 'son_yedek',
  sonYedekHatasi: 'son_yedek_hatasi',
} as const;

export async function bildirimAyarlari(db: SQLiteDatabase): Promise<{ sabahSaati: string; dersOncesiDakika: number }> {
  const [s, d] = await Promise.all([ayar(db, AYAR.sabahSaati), ayar(db, AYAR.dersOncesi)]);
  return { sabahSaati: s ?? '08:00', dersOncesiDakika: d === null ? 30 : Number(d) };
}
