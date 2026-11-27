**English** | [Türkçe](README.tr.md)

# Kort Defteri

An iPhone planner for tennis coaches: athletes, payment tracking, weekly lessons, attendance, performance tracking, tournaments and local reminders. Built for a tennis coach's daily use on court. All data stays on the phone, with automatic cloud backup.

## Features

- **Today:** a top-down court header with the day's lesson count, the next lesson with a one-tap attendance button, the rest of the day, birthdays this week, overdue payments and backup warnings.
- **Athletes:** photo, parent details, birth date, ITF ball stage drawn as the real red, orange, green and yellow balls, playing hand, one or two-handed backhand, group, start date, tournament flag, notes. Height and weight are kept as a history with growth charts.
- **Attendance:** everyone starts as present, the coach taps the ones who did not come. Lessons can be cancelled for rain and a make-up lesson added. Each athlete has an attendance rate.
- **Calendar:** weekly recurring group and private lessons plus one-off lessons, week by week.
- **Payments:** free-form records with date, amount, paid or not and a note. Paid is green, unpaid is amber, overdue is red. One record can be opened for several athletes at once, and an unpaid record sends a ready-written WhatsApp reminder to the parent.
- **Performance:** forehand, backhand, serve, return, volley, smash, footwork, fitness, tactics and mental scored from 1 to 5. The coach can rename, add or switch off metrics. The last two evaluations are drawn on a radar chart, and a progress card image can be shared with parents.
- **Tournaments:** tournaments with the athletes who played and their results, also listed on each athlete's profile.
- **My profile:** the coach's photo, introduction, experience, certificates, WhatsApp and Instagram, made to be shown to parents.
- **Notifications:** a morning summary of lessons, payment days and birthdays, and a reminder before each lesson. They are local notifications scheduled on the phone, with no server.
- **Backup:** after every change the whole database is uploaded as one JSON file and new photos are uploaded once. The last 30 backups are kept and any of them can be restored.

## Screenshots

Coming with the first version.

## Tech Stack

- Expo SDK 58, React Native, TypeScript, Expo Router
- expo-sqlite for on-device data, with versioned migrations
- expo-notifications for local reminders
- Supabase Auth and Storage for automatic backup, protected by Row Level Security
- react-native-svg for the court drawing, radar and growth charts
- react-native-view-shot and expo-sharing for the progress card
- Vitest for the business rules

## Installation

```bash
npm install
cp .env.example .env
npx expo start
```

Open the QR code with the iPhone camera to run the app in Expo Go.

Backup needs a free Supabase project:

1. Run `docs/supabase.sql` in the SQL Editor. It creates the private `yedek` bucket and its access rules.
2. Turn off new sign-ups and create the coach's user from the Authentication page.
3. Put the project URL and the publishable key in `.env`.

The app is installed on one iPhone with an ad hoc EAS build:

```bash
eas device:create
eas build --profile preview --platform ios
eas update --channel preview
```

## What I Learned

Coming with the first version.
