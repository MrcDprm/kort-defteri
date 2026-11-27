import { yas } from './tarih';

export type TopEvresi = 'kirmizi' | 'turuncu' | 'yesil' | 'sari';
export type El = 'sag' | 'sol';
export type Backhand = 'tek' | 'cift';
export type DersTuru = 'grup' | 'ozel';
export type DersDurumu = 'yapildi' | 'iptal' | 'planli';

export interface Sporcu {
  id: string;
  first_name: string;
  last_name: string;
  parent_name: string | null;
  phone: string | null;
  parent_phone: string | null;
  birth_date: string | null;
  ball: TopEvresi | null;
  hand: El | null;
  backhand: Backhand | null;
  group_name: string | null;
  started_on: string | null;
  photo: string | null;
  active: number;
  tournament: number;
  notes: string | null;
  created_at: string;
}

export interface Olcum {
  id: string;
  athlete_id: string;
  date: string;
  height_cm: number | null;
  weight_kg: number | null;
}

export interface DersSablonu {
  id: string;
  title: string;
  weekday: number;
  start: string;
  end: string;
  court: string | null;
  kind: DersTuru;
  active: number;
  created_at: string;
}

export interface Ders {
  id: string;
  template_id: string | null;
  date: string;
  start: string;
  end: string;
  title: string;
  court: string | null;
  kind: DersTuru;
  status: DersDurumu;
  note: string | null;
}

export interface Yoklama {
  lesson_id: string;
  athlete_id: string;
  present: number;
}

export interface Odeme {
  id: string;
  athlete_id: string;
  due_date: string;
  amount: number;
  paid: number;
  paid_at: string | null;
  note: string | null;
}

export interface Metrik {
  id: string;
  name: string;
  sort: number;
  active: number;
}

export interface Degerlendirme {
  id: string;
  athlete_id: string;
  date: string;
  note: string | null;
}

export interface Puan {
  evaluation_id: string;
  metric_id: string;
  score: number;
}

export interface Turnuva {
  id: string;
  name: string;
  date: string;
  place: string | null;
  category: string | null;
}

export interface TurnuvaKatilimi {
  tournament_id: string;
  athlete_id: string;
  result: string | null;
}

export interface Hoca {
  id: number;
  name: string | null;
  title: string | null;
  bio: string | null;
  experience: string | null;
  certificates: string | null;
  phone: string | null;
  instagram: string | null;
  photo: string | null;
}

/** Takvimde gösterilen bir ders: ya şablondan o güne düşen ders ya da kaydedilmiş bir ders. */
export interface DersOlayi {
  anahtar: string;
  template_id: string | null;
  lesson_id: string | null;
  date: string;
  start: string;
  end: string;
  title: string;
  court: string | null;
  kind: DersTuru;
  status: DersDurumu;
  note: string | null;
}

export const TOP_ADLARI: Record<TopEvresi, string> = {
  kirmizi: 'Kırmızı top',
  turuncu: 'Turuncu top',
  yesil: 'Yeşil top',
  sari: 'Sarı top',
};

/** Turuncu top, 8 yaş, Performans grubu */
export function sporcuAltYazisi(sp: Pick<Sporcu, 'ball' | 'birth_date' | 'group_name'>, bugun: string): string {
  return [sp.ball ? TOP_ADLARI[sp.ball] : null, sp.birth_date ? `${yas(sp.birth_date, bugun)} yaş` : null, sp.group_name]
    .filter(Boolean)
    .join(', ');
}

export function adSoyad(s: Pick<Sporcu, 'first_name' | 'last_name'>): string {
  return `${s.first_name} ${s.last_name}`.trim();
}

export function basHarfler(s: Pick<Sporcu, 'first_name' | 'last_name'>): string {
  return `${s.first_name.charAt(0)}${s.last_name.charAt(0)}`.toLocaleUpperCase('tr-TR');
}
