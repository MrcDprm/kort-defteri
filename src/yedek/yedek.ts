import { File } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';
import { AppState } from 'react-native';
import { TABLO_SIRASI, TABLOLAR, YEDEK_SURUMU, yedegiDogrula, yedektekiFotolar, YedekHatasi, type Satir, type Yedek } from '@/domain/yedek-semasi';
import { degisiklikleriDinle, degisti } from '@/db/olay';
import { AYAR, ayarKaydet } from '@/db/veri';
import { fotoDosyasi } from '@/foto';
import { KOVA, supabase } from './supabase';

export const SAKLANAN_YEDEK = 30;

export class GirisGerekli extends Error {}

function istemci() {
  if (!supabase) throw new YedekHatasi('Yedek ayarlanmamış: uygulamada Supabase adresi yok.');
  return supabase;
}

export async function oturum(): Promise<{ eposta: string; kimlik: string } | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  const k = data.session?.user;
  return k ? { eposta: k.email ?? '', kimlik: k.id } : null;
}

export async function girisYap(eposta: string, sifre: string): Promise<void> {
  const { error } = await istemci().auth.signInWithPassword({ email: eposta.trim(), password: sifre });
  if (error) {
    throw new YedekHatasi(error.message.toLowerCase().includes('invalid') ? 'E-posta ya da şifre yanlış.' : 'Giriş yapılamadı, internet bağlantısını kontrol et.');
  }
}

export async function cikisYap(): Promise<void> {
  await istemci().auth.signOut();
}

async function kullaniciKimligi(): Promise<string> {
  const o = await oturum();
  if (!o) throw new GirisGerekli('Yedek için giriş yapılmalı.');
  return o.kimlik;
}

async function anlikGoruntu(db: SQLiteDatabase): Promise<Yedek> {
  const tablolar: Record<string, Satir[]> = {};
  for (const tablo of TABLO_SIRASI) {
    const sutunlar = Object.keys(TABLOLAR[tablo]!).map((c) => `"${c}"`).join(', ');
    tablolar[tablo] = await db.getAllAsync<Satir>(`SELECT ${sutunlar} FROM ${tablo}`);
  }
  return { uygulama: 'kort-defteri', surum: YEDEK_SURUMU, olusturuldu: new Date().toISOString(), tablolar };
}

function hataMetni(e: { message: string } | null): string {
  return e?.message ?? 'bilinmeyen hata';
}

/** Tüm veriyi tek JSON olarak, yeni fotoğrafları da ayrı dosyalar olarak yükler. */
export async function yedekAl(db: SQLiteDatabase): Promise<void> {
  const sb = istemci();
  const kimlik = await kullaniciKimligi();
  const yedek = await anlikGoruntu(db);

  const { data: mevcut, error: listeHatasi } = await sb.storage.from(KOVA).list(`${kimlik}/fotograflar`, { limit: 1000 });
  if (listeHatasi) throw new YedekHatasi(`Yedek klasörü okunamadı: ${hataMetni(listeHatasi)}`);
  const yuklu = new Set((mevcut ?? []).map((x) => x.name));
  for (const ad of yedektekiFotolar(yedek)) {
    if (yuklu.has(ad)) continue;
    const dosya = fotoDosyasi(ad);
    if (!dosya.exists) continue;
    const { error } = await sb.storage.from(KOVA).upload(`${kimlik}/fotograflar/${ad}`, await dosya.arrayBuffer(), { contentType: 'image/jpeg', upsert: true });
    if (error) throw new YedekHatasi(`Fotoğraf yüklenemedi: ${hataMetni(error)}`);
  }

  const ad = `${yedek.olusturuldu.replace(/[:.]/g, '-')}.json`;
  const govde = new TextEncoder().encode(JSON.stringify(yedek));
  const { error } = await sb.storage.from(KOVA).upload(`${kimlik}/yedekler/${ad}`, govde.buffer as ArrayBuffer, { contentType: 'application/json' });
  if (error) throw new YedekHatasi(`Yedek yüklenemedi: ${hataMetni(error)}`);

  const liste = await yedekleriListele();
  const fazla = liste.slice(SAKLANAN_YEDEK).map((x) => `${kimlik}/yedekler/${x.ad}`);
  if (fazla.length > 0) await sb.storage.from(KOVA).remove(fazla);

  await ayarKaydet(db, AYAR.sonYedek, yedek.olusturuldu, true);
  await ayarKaydet(db, AYAR.sonYedekHatasi, null, true);
}

export async function yedekleriListele(): Promise<{ ad: string; tarih: Date }[]> {
  const sb = istemci();
  const kimlik = await kullaniciKimligi();
  const { data, error } = await sb.storage.from(KOVA).list(`${kimlik}/yedekler`, { limit: 200, sortBy: { column: 'name', order: 'desc' } });
  if (error) throw new YedekHatasi(`Yedekler okunamadı: ${hataMetni(error)}`);
  return (data ?? [])
    .filter((x) => x.name.endsWith('.json'))
    .map((x) => {
      // Ad, ISO zamanındaki : ve . yerine - konmuş hâlidir: 2026-11-27T10-00-00-000Z.json
      const m = /^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z\.json$/.exec(x.name);
      const tarih = m ? new Date(`${m[1]}T${m[2]}:${m[3]}:${m[4]}.${m[5]}Z`) : new Date(x.created_at ?? 0);
      return { ad: x.name, tarih };
    })
    .sort((a, b) => b.tarih.getTime() - a.tarih.getTime());
}

/** Seçilen yedeği indirir, doğrular ve telefondaki verinin yerine yazar. */
export async function geriYukle(db: SQLiteDatabase, ad: string): Promise<void> {
  if (!/^[\w-]+\.json$/.test(ad)) throw new YedekHatasi('Geçersiz yedek adı.');
  const sb = istemci();
  const kimlik = await kullaniciKimligi();
  const { data: imzali, error } = await sb.storage.from(KOVA).createSignedUrl(`${kimlik}/yedekler/${ad}`, 120);
  if (error || !imzali) throw new YedekHatasi(`Yedek indirilemedi: ${hataMetni(error)}`);
  const yanit = await fetch(imzali.signedUrl);
  if (!yanit.ok) throw new YedekHatasi('Yedek indirilemedi, internet bağlantısını kontrol et.');
  let ham: unknown;
  try {
    ham = JSON.parse(await yanit.text());
  } catch {
    throw new YedekHatasi('Yedek dosyası bozuk.');
  }
  const yedek = yedegiDogrula(ham);

  const eksik = yedektekiFotolar(yedek).filter((f) => !fotoDosyasi(f).exists);
  if (eksik.length > 0) {
    const { data: adresler } = await sb.storage.from(KOVA).createSignedUrls(eksik.map((f) => `${kimlik}/fotograflar/${f}`), 300);
    for (const [i, a] of (adresler ?? []).entries()) {
      const f = eksik[i];
      if (!a.signedUrl || !f) continue;
      try {
        await File.downloadFileAsync(a.signedUrl, fotoDosyasi(f));
      } catch {
        // Bir fotoğraf inmezse kayıt fotoğrafsız görünür; verinin kalanı yine geri gelir.
      }
    }
  }

  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.execAsync('PRAGMA defer_foreign_keys = ON');
    for (const tablo of [...TABLO_SIRASI].reverse()) await tx.runAsync(`DELETE FROM ${tablo}`);
    for (const tablo of TABLO_SIRASI) {
      const sutunlar = Object.keys(TABLOLAR[tablo]!);
      const sql = `INSERT INTO ${tablo} (${sutunlar.map((c) => `"${c}"`).join(', ')}) VALUES (${sutunlar.map(() => '?').join(', ')})`;
      for (const satir of yedek.tablolar[tablo] ?? []) {
        await tx.runAsync(sql, ...sutunlar.map((c) => satir[c] ?? null));
      }
    }
    const hocaVar = await tx.getFirstAsync('SELECT id FROM coach WHERE id = 1');
    if (!hocaVar) await tx.runAsync('INSERT INTO coach (id) VALUES (1)');
  });
  degisti();
}

/* Otomatik yedek */

const BEKLEME = 30_000;
let zamanlayici: ReturnType<typeof setTimeout> | null = null;
let bekleyen = false;
let calisiyor = false;

async function calistir(db: SQLiteDatabase): Promise<void> {
  if (calisiyor || !bekleyen) return;
  calisiyor = true;
  bekleyen = false;
  try {
    if (await oturum()) await yedekAl(db);
  } catch (e) {
    bekleyen = true;
    const mesaj = e instanceof Error ? e.message : 'Yedek alınamadı.';
    await ayarKaydet(db, AYAR.sonYedekHatasi, mesaj, true).catch(() => undefined);
  } finally {
    calisiyor = false;
  }
}

/** Her veri değişikliğinden 30 saniye sonra ve uygulama arka plana geçerken yedek alır. */
export function otomatikYedegiBaslat(db: SQLiteDatabase): () => void {
  const iptal = degisiklikleriDinle(() => {
    bekleyen = true;
    if (zamanlayici) clearTimeout(zamanlayici);
    zamanlayici = setTimeout(() => void calistir(db), BEKLEME);
  });
  const abonelik = AppState.addEventListener('change', (durum) => {
    if (durum === 'background' && bekleyen) {
      if (zamanlayici) clearTimeout(zamanlayici);
      void calistir(db);
    }
    if (durum === 'active' && bekleyen) {
      // Önceki deneme internet yokken düştüyse uygulama öne geldiğinde yeniden denenir.
      if (zamanlayici) clearTimeout(zamanlayici);
      zamanlayici = setTimeout(() => void calistir(db), 5000);
    }
  });
  return () => {
    iptal();
    abonelik.remove();
  };
}

/** Elle yedek: bekleyen otomatik yedeği de karşılar. */
export async function simdiYedekle(db: SQLiteDatabase): Promise<void> {
  if (zamanlayici) clearTimeout(zamanlayici);
  bekleyen = false;
  try {
    await yedekAl(db);
  } catch (e) {
    bekleyen = true;
    throw e;
  }
}
