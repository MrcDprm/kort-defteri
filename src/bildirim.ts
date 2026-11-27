import * as Notifications from 'expo-notifications';
import type { SQLiteDatabase } from 'expo-sqlite';
import { bildirimPlani } from '@/domain/bildirim-plani';
import { gunEkle, tarihMetni } from '@/domain/tarih';
import { degisiklikleriDinle } from '@/db/olay';
import { bildirimAyarlari, dersler, odemeler, sablonlar, sporcular } from '@/db/veri';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export async function bildirimIzniIste(): Promise<boolean> {
  const mevcut = await Notifications.getPermissionsAsync();
  if (mevcut.granted) return true;
  if (!mevcut.canAskAgain) return false;
  const r = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
  return r.granted;
}

/** Bekleyen bütün bildirimleri silip önümüzdeki iki haftanın planını yeniden kurar. */
export async function bildirimleriKur(db: SQLiteDatabase): Promise<void> {
  const izin = await Notifications.getPermissionsAsync();
  if (!izin.granted) return;
  const bugun = tarihMetni(new Date());
  const [s, d, o, sp, ayarlar] = await Promise.all([sablonlar(db), dersler(db, bugun, gunEkle(bugun, 14)), odemeler(db), sporcular(db), bildirimAyarlari(db)]);
  const plan = bildirimPlani({ simdi: new Date(), sablonlar: s, dersler: d, odemeler: o, sporcular: sp, ayarlar });
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const b of plan) {
    await Notifications.scheduleNotificationAsync({
      // Raket vuruşu sesi uygulamaya gömülüdür; Expo Go'da çalmaz, yalnızca derlenmiş uygulamada duyulur.
      content: { title: b.baslik, body: b.govde, sound: 'vurus.wav' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: b.zaman },
    });
  }
}

let zamanlayici: ReturnType<typeof setTimeout> | null = null;

/** Veri her değiştiğinde birkaç saniye bekleyip planı yeniden kurar. */
export function bildirimPlanlayicisiniBaslat(db: SQLiteDatabase): () => void {
  const kur = () => {
    if (zamanlayici) clearTimeout(zamanlayici);
    zamanlayici = setTimeout(() => {
      bildirimleriKur(db).catch(() => {
        // Bildirim kurulamazsa uygulama çalışmaya devam eder; bir sonraki değişiklikte yeniden denenir.
      });
    }, 2000);
  };
  kur();
  return degisiklikleriDinle(kur);
}
