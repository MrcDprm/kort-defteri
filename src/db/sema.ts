import type { SQLiteDatabase } from 'expo-sqlite';
import * as Crypto from 'expo-crypto';

// Göçler sırayla uygulanır; hangisinde kalındığı PRAGMA user_version'da tutulur.
// Yeni göç her zaman sona eklenir, eskileri değiştirilmez.
const GOCLER: string[] = [
  `
  CREATE TABLE athletes (
    id TEXT PRIMARY KEY NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    parent_name TEXT,
    phone TEXT,
    parent_phone TEXT,
    birth_date TEXT,
    ball TEXT,
    hand TEXT,
    backhand TEXT,
    group_name TEXT,
    started_on TEXT,
    photo TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    tournament INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE measurements (
    id TEXT PRIMARY KEY NOT NULL,
    athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    height_cm REAL,
    weight_kg REAL
  );
  CREATE TABLE lesson_templates (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    weekday INTEGER NOT NULL,
    start TEXT NOT NULL,
    end TEXT NOT NULL,
    court TEXT,
    kind TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );
  CREATE TABLE template_athletes (
    template_id TEXT NOT NULL REFERENCES lesson_templates(id) ON DELETE CASCADE,
    athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    PRIMARY KEY (template_id, athlete_id)
  );
  CREATE TABLE lessons (
    id TEXT PRIMARY KEY NOT NULL,
    template_id TEXT REFERENCES lesson_templates(id) ON DELETE SET NULL,
    date TEXT NOT NULL,
    start TEXT NOT NULL,
    end TEXT NOT NULL,
    title TEXT NOT NULL,
    court TEXT,
    kind TEXT NOT NULL,
    status TEXT NOT NULL,
    note TEXT
  );
  CREATE INDEX lessons_date ON lessons(date);
  CREATE TABLE lesson_athletes (
    lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    PRIMARY KEY (lesson_id, athlete_id)
  );
  CREATE TABLE attendance (
    lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    present INTEGER NOT NULL,
    PRIMARY KEY (lesson_id, athlete_id)
  );
  CREATE TABLE payments (
    id TEXT PRIMARY KEY NOT NULL,
    athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    due_date TEXT NOT NULL,
    amount REAL NOT NULL,
    paid INTEGER NOT NULL DEFAULT 0,
    paid_at TEXT,
    note TEXT
  );
  CREATE INDEX payments_due ON payments(due_date);
  CREATE TABLE metrics (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    sort INTEGER NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE evaluations (
    id TEXT PRIMARY KEY NOT NULL,
    athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    note TEXT
  );
  CREATE TABLE evaluation_scores (
    evaluation_id TEXT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    metric_id TEXT NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    PRIMARY KEY (evaluation_id, metric_id)
  );
  CREATE TABLE tournaments (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    place TEXT,
    category TEXT
  );
  CREATE TABLE tournament_entries (
    tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    result TEXT,
    PRIMARY KEY (tournament_id, athlete_id)
  );
  CREATE TABLE coach (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT, title TEXT, bio TEXT, experience TEXT, certificates TEXT,
    phone TEXT, instagram TEXT, photo TEXT
  );
  CREATE TABLE settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT
  );
  INSERT INTO coach (id) VALUES (1);
  `,
];

const VARSAYILAN_METRIKLER = ['Forehand', 'Backhand', 'Servis', 'Karşılama', 'Vole', 'Smaç', 'Ayak hareketi', 'Kondisyon', 'Taktik', 'Mental'];

export async function veritabaniniHazirla(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const satir = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let surum = satir?.user_version ?? 0;
  while (surum < GOCLER.length) {
    const goc = GOCLER[surum]!;
    const ilk = surum === 0;
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.execAsync(goc);
      if (ilk) {
        for (const [i, ad] of VARSAYILAN_METRIKLER.entries()) {
          await tx.runAsync('INSERT INTO metrics (id, name, sort, active) VALUES (?, ?, ?, 1)', Crypto.randomUUID(), ad, i);
        }
      }
      await tx.execAsync(`PRAGMA user_version = ${surum + 1}`);
    });
    surum++;
  }
}
