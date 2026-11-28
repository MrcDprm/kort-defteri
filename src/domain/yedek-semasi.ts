import { gecerliSaat, gecerliTarih } from './tarih';

/**
 * Yedeğe giren tablolar ve sütunları. Geri yüklemede yalnızca burada adı geçen tablo ve
 * sütunlar yazılır; dosyadaki her değer türü ve biçimiyle doğrulanır. Sıra, yabancı anahtar
 * ilişkilerine göre ekleme sırasıdır.
 */
type Tur = 'metin' | 'tarih' | 'saat' | 'tamsayi' | 'sayi' | 'bayrak' | 'foto' | 'kimlik';
interface Sutun {
  tur: Tur;
  bos?: true;
}

export const YEDEK_SURUMU = 1;
const FOTO_DESENI = /^[0-9a-f-]{36}\.jpg$/;
const KIMLIK_DESENI = /^[0-9a-f-]{36}$/;

export const TABLOLAR: Record<string, Record<string, Sutun>> = {
  athletes: {
    id: { tur: 'kimlik' },
    first_name: { tur: 'metin' },
    last_name: { tur: 'metin' },
    parent_name: { tur: 'metin', bos: true },
    phone: { tur: 'metin', bos: true },
    parent_phone: { tur: 'metin', bos: true },
    birth_date: { tur: 'tarih', bos: true },
    ball: { tur: 'metin', bos: true },
    hand: { tur: 'metin', bos: true },
    backhand: { tur: 'metin', bos: true },
    group_name: { tur: 'metin', bos: true },
    started_on: { tur: 'tarih', bos: true },
    photo: { tur: 'foto', bos: true },
    active: { tur: 'bayrak' },
    tournament: { tur: 'bayrak' },
    notes: { tur: 'metin', bos: true },
    created_at: { tur: 'metin' },
  },
  measurements: {
    id: { tur: 'kimlik' },
    athlete_id: { tur: 'kimlik' },
    date: { tur: 'tarih' },
    height_cm: { tur: 'sayi', bos: true },
    weight_kg: { tur: 'sayi', bos: true },
  },
  lesson_templates: {
    id: { tur: 'kimlik' },
    title: { tur: 'metin' },
    weekday: { tur: 'tamsayi' },
    start: { tur: 'saat' },
    end: { tur: 'saat' },
    court: { tur: 'metin', bos: true },
    kind: { tur: 'metin' },
    active: { tur: 'bayrak' },
    created_at: { tur: 'metin' },
  },
  template_athletes: {
    template_id: { tur: 'kimlik' },
    athlete_id: { tur: 'kimlik' },
  },
  lessons: {
    id: { tur: 'kimlik' },
    template_id: { tur: 'kimlik', bos: true },
    date: { tur: 'tarih' },
    start: { tur: 'saat' },
    end: { tur: 'saat' },
    title: { tur: 'metin' },
    court: { tur: 'metin', bos: true },
    kind: { tur: 'metin' },
    status: { tur: 'metin' },
    note: { tur: 'metin', bos: true },
  },
  lesson_athletes: {
    lesson_id: { tur: 'kimlik' },
    athlete_id: { tur: 'kimlik' },
  },
  attendance: {
    lesson_id: { tur: 'kimlik' },
    athlete_id: { tur: 'kimlik' },
    present: { tur: 'bayrak' },
  },
  payments: {
    id: { tur: 'kimlik' },
    athlete_id: { tur: 'kimlik' },
    due_date: { tur: 'tarih' },
    amount: { tur: 'sayi' },
    paid: { tur: 'bayrak' },
    paid_at: { tur: 'metin', bos: true },
    note: { tur: 'metin', bos: true },
  },
  metrics: {
    id: { tur: 'kimlik' },
    name: { tur: 'metin' },
    sort: { tur: 'tamsayi' },
    active: { tur: 'bayrak' },
  },
  evaluations: {
    id: { tur: 'kimlik' },
    athlete_id: { tur: 'kimlik' },
    date: { tur: 'tarih' },
    note: { tur: 'metin', bos: true },
  },
  evaluation_scores: {
    evaluation_id: { tur: 'kimlik' },
    metric_id: { tur: 'kimlik' },
    score: { tur: 'tamsayi' },
  },
  tournaments: {
    id: { tur: 'kimlik' },
    name: { tur: 'metin' },
    date: { tur: 'tarih' },
    place: { tur: 'metin', bos: true },
    category: { tur: 'metin', bos: true },
  },
  tournament_entries: {
    tournament_id: { tur: 'kimlik' },
    athlete_id: { tur: 'kimlik' },
    result: { tur: 'metin', bos: true },
  },
  coach: {
    id: { tur: 'tamsayi' },
    name: { tur: 'metin', bos: true },
    title: { tur: 'metin', bos: true },
    bio: { tur: 'metin', bos: true },
    experience: { tur: 'metin', bos: true },
    certificates: { tur: 'metin', bos: true },
    phone: { tur: 'metin', bos: true },
    instagram: { tur: 'metin', bos: true },
    photo: { tur: 'foto', bos: true },
  },
  settings: {
    key: { tur: 'metin' },
    value: { tur: 'metin', bos: true },
  },
};

export const TABLO_SIRASI = Object.keys(TABLOLAR);

export type Satir = Record<string, string | number | null>;

export interface Yedek {
  uygulama: 'courtside';
  surum: number;
  olusturuldu: string;
  tablolar: Record<string, Satir[]>;
}

const METIN_SINIRI = 5000;

function degerGecerli(deger: unknown, s: Sutun): boolean {
  if (deger === null) return s.bos === true;
  switch (s.tur) {
    case 'metin':
      return typeof deger === 'string' && deger.length <= METIN_SINIRI;
    case 'tarih':
      return gecerliTarih(deger);
    case 'saat':
      return gecerliSaat(deger);
    case 'tamsayi':
      return typeof deger === 'number' && Number.isInteger(deger);
    case 'sayi':
      return typeof deger === 'number' && Number.isFinite(deger);
    case 'bayrak':
      return deger === 0 || deger === 1;
    case 'foto':
      return typeof deger === 'string' && FOTO_DESENI.test(deger);
    case 'kimlik':
      return typeof deger === 'string' && KIMLIK_DESENI.test(deger);
  }
}

export class YedekHatasi extends Error {}

/** Dışarıdan gelen yedeği doğrular. Tanınmayan alan, tablo ya da hatalı değer varsa hata verir. */
export function yedegiDogrula(veri: unknown): Yedek {
  if (typeof veri !== 'object' || veri === null) throw new YedekHatasi('Yedek dosyası okunamadı.');
  const y = veri as Record<string, unknown>;
  if (y.uygulama !== 'courtside') throw new YedekHatasi('Bu dosya bir Courtside yedeği değil.');
  if (typeof y.surum !== 'number' || y.surum > YEDEK_SURUMU) throw new YedekHatasi('Yedek, uygulamanın bu sürümünden yeni. Önce uygulamayı güncelle.');
  if (typeof y.olusturuldu !== 'string') throw new YedekHatasi('Yedeğin tarihi eksik.');
  if (typeof y.tablolar !== 'object' || y.tablolar === null) throw new YedekHatasi('Yedekte veri yok.');

  const tablolar: Record<string, Satir[]> = {};
  for (const [ad, satirlar] of Object.entries(y.tablolar as Record<string, unknown>)) {
    const sema = TABLOLAR[ad];
    if (!sema) throw new YedekHatasi(`Yedekte tanınmayan tablo var: ${ad}`);
    if (!Array.isArray(satirlar)) throw new YedekHatasi(`${ad} tablosu bozuk.`);
    tablolar[ad] = satirlar.map((satir, i) => {
      if (typeof satir !== 'object' || satir === null) throw new YedekHatasi(`${ad} tablosunda ${i + 1}. satır bozuk.`);
      const temiz: Satir = {};
      for (const [sutun, tanim] of Object.entries(sema)) {
        const deger = (satir as Record<string, unknown>)[sutun] ?? null;
        if (!degerGecerli(deger, tanim)) throw new YedekHatasi(`${ad} tablosunda ${i + 1}. satırın ${sutun} değeri hatalı.`);
        temiz[sutun] = deger as string | number | null;
      }
      for (const sutun of Object.keys(satir as object)) {
        if (!(sutun in sema)) throw new YedekHatasi(`${ad} tablosunda tanınmayan alan var: ${sutun}`);
      }
      return temiz;
    });
  }
  return { uygulama: 'courtside', surum: y.surum, olusturuldu: y.olusturuldu, tablolar };
}

/** Yedekte geçen fotoğraf dosya adları. */
export function yedektekiFotolar(y: Yedek): string[] {
  const adlar = new Set<string>();
  for (const satir of [...(y.tablolar.athletes ?? []), ...(y.tablolar.coach ?? [])]) {
    if (typeof satir.photo === 'string') adlar.add(satir.photo);
  }
  return [...adlar];
}
