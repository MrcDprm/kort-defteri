// Yalnızca kullanılan kesimler alt yollardan alınır; paketin kökü bütün kesimleri uygulamaya gömer.
import { Archivo_400Regular } from '@expo-google-fonts/archivo/400Regular';
import { Archivo_500Medium } from '@expo-google-fonts/archivo/500Medium';
import { Archivo_600SemiBold } from '@expo-google-fonts/archivo/600SemiBold';
import { Archivo_700Bold } from '@expo-google-fonts/archivo/700Bold';
import { Archivo_800ExtraBold } from '@expo-google-fonts/archivo/800ExtraBold';
import { ArchivoNarrow_600SemiBold } from '@expo-google-fonts/archivo-narrow/600SemiBold';
import { ArchivoNarrow_700Bold } from '@expo-google-fonts/archivo-narrow/700Bold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Suspense, useEffect } from 'react';
import { Text, View } from 'react-native';
import { bildirimIzniIste, bildirimPlanlayicisiniBaslat } from '@/bildirim';
import { veritabaniniHazirla } from '@/db/sema';
import { Yukleniyor } from '@/ui/bilesenler';
import { renk, yazi } from '@/ui/tema';
import { otomatikYedegiBaslat } from '@/yedek/yedek';

void SplashScreen.preventAutoHideAsync();

function Arkaplan() {
  const db = useSQLiteContext();
  useEffect(() => {
    void bildirimIzniIste().catch(() => false);
    const b = bildirimPlanlayicisiniBaslat(db);
    const y = otomatikYedegiBaslat(db);
    return () => {
      b();
      y();
    };
  }, [db]);
  return null;
}

export default function KokYerlesim() {
  const [yuklendi, hata] = useFonts({
    Archivo_400Regular, Archivo_500Medium, Archivo_600SemiBold, Archivo_700Bold, Archivo_800ExtraBold,
    ArchivoNarrow_600SemiBold, ArchivoNarrow_700Bold,
  });

  useEffect(() => {
    if (yuklendi || hata) void SplashScreen.hideAsync();
  }, [yuklendi, hata]);

  if (!yuklendi && !hata) return null;

  return (
    <Suspense fallback={<Yukleniyor />}>
      <SQLiteProvider databaseName="courtside.db" onInit={veritabaniniHazirla} useSuspense>
        <StatusBar style="dark" />
        <Arkaplan />
        <Stack
          screenOptions={{
            headerTintColor: renk.kort,
            headerStyle: { backgroundColor: renk.kirec },
            headerShadowVisible: false,
            headerTitleStyle: { fontFamily: yazi.kalin, fontSize: 17, color: renk.murekkep },
            headerBackButtonDisplayMode: 'minimal',
            contentStyle: { backgroundColor: renk.kirec },
          }}
        >
          <Stack.Screen name="(sekmeler)" options={{ headerShown: false, title: 'Geri' }} />
          <Stack.Screen name="yoklama" options={{ headerShown: false }} />
          <Stack.Screen name="karne/[id]" options={{ title: 'Gelişim karnesi', presentation: 'modal' }} />
        </Stack>
      </SQLiteProvider>
    </Suspense>
  );
}

/** Beklenmeyen bir hata olursa ham hata metni yerine sade bir ekran gösterilir. */
export function ErrorBoundary({ retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <View style={{ flex: 1, backgroundColor: renk.kirec, justifyContent: 'center', padding: 24, gap: 14 }}>
      <Text style={{ fontFamily: yazi.baslik, fontSize: 24, color: renk.murekkep }}>Bir şeyler ters gitti</Text>
      <Text style={{ fontFamily: yazi.normal, fontSize: 16, color: renk.soluk, lineHeight: 22 }}>
        Verilerin telefonda duruyor. Ekranı yeniden açmayı dene; sorun sürerse uygulamayı kapatıp yeniden aç.
      </Text>
      <Text onPress={() => void retry()} style={{ fontFamily: yazi.kalin, fontSize: 17, color: renk.kort, paddingVertical: 10 }} accessibilityRole="button">
        Yeniden dene
      </Text>
    </View>
  );
}
