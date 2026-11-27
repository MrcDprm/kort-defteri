import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Oturum bilgisi iOS Keychain'de tutulur. SecureStore tek değerde 2048 baytı aşınca uyarı verdiği
// için uzun oturum metni parçalara bölünerek yazılır.
const PARCA = 1800;

const keychainDeposu = {
  async getItem(anahtar: string): Promise<string | null> {
    const sayi = await SecureStore.getItemAsync(`${anahtar}_parca`);
    if (!sayi) return null;
    const parcalar: string[] = [];
    for (let i = 0; i < Number(sayi); i++) {
      const p = await SecureStore.getItemAsync(`${anahtar}_${i}`);
      if (p === null) return null;
      parcalar.push(p);
    }
    return parcalar.join('');
  },
  async setItem(anahtar: string, deger: string): Promise<void> {
    await this.removeItem(anahtar);
    const sayi = Math.ceil(deger.length / PARCA);
    for (let i = 0; i < sayi; i++) {
      await SecureStore.setItemAsync(`${anahtar}_${i}`, deger.slice(i * PARCA, (i + 1) * PARCA));
    }
    await SecureStore.setItemAsync(`${anahtar}_parca`, String(sayi));
  },
  async removeItem(anahtar: string): Promise<void> {
    const sayi = await SecureStore.getItemAsync(`${anahtar}_parca`);
    for (let i = 0; i < Number(sayi ?? 0); i++) await SecureStore.deleteItemAsync(`${anahtar}_${i}`);
    await SecureStore.deleteItemAsync(`${anahtar}_parca`);
  },
};

const adres = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anahtar = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  adres && anahtar
    ? createClient(adres, anahtar, {
        auth: { storage: keychainDeposu, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
      })
    : null;

export const KOVA = 'yedek';
