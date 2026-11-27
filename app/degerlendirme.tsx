import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { tarihMetni } from '@/domain/tarih';
import type { Metrik } from '@/domain/tipler';
import { degerlendirmeKaydet, degerlendirmeler, metrikler } from '@/db/veri';
import { Alan, Bolum, Dugme, Ekran, MetinDugme, TarihAlani, Yukleniyor } from '@/ui/bilesenler';
import { renk, yazi } from '@/ui/tema';

export default function Degerlendir() {
  const db = useSQLiteContext();
  const { sporcu } = useLocalSearchParams<{ sporcu: string }>();
  const [met, setMet] = useState<Metrik[] | null>(null);
  const [puan, setPuan] = useState<Map<string, number>>(new Map());
  const [tarih, setTarih] = useState<string | null>(tarihMetni(new Date()));
  const [not, setNot] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);

  useEffect(() => {
    void (async () => {
      const m = await metrikler(db);
      const onceki = (await degerlendirmeler(db, sporcu))[0];
      // Son değerlendirmenin puanlarıyla başlanır; hoca yalnızca değişenleri günceller.
      setPuan(new Map(onceki ? [...onceki.puanlar].filter(([id]) => m.some((x) => x.id === id)) : []));
      setMet(m);
    })();
  }, [db, sporcu]);

  if (!met) return <Yukleniyor />;

  async function kaydet() {
    if (puan.size < 3) {
      Alert.alert('Eksik puan', 'Grafiğin anlamlı olması için en az üç metriği puanla.');
      return;
    }
    setKaydediliyor(true);
    try {
      await degerlendirmeKaydet(db, sporcu, tarih ?? tarihMetni(new Date()), not.trim() || null, puan);
      router.back();
    } catch {
      setKaydediliyor(false);
      Alert.alert('Kaydedilemedi', 'Değerlendirme kaydedilirken bir sorun çıktı, tekrar dene.');
    }
  }

  return (
    <Ekran altDugme={<Dugme yazi="Değerlendirmeyi kaydet" onPress={() => void kaydet()} mesgul={kaydediliyor} />}>
      <Stack.Screen options={{ title: 'Değerlendirme', headerRight: () => <MetinDugme yazi="Metrikler" onPress={() => router.push('/metrikler')} /> }} />
      <Bolum stil={{ marginTop: 4 }}>
        <TarihAlani etiket="Tarih" deger={tarih} degisti={setTarih} />
        <Text style={st.aciklama}>1 başlangıç, 3 yaşına göre iyi, 5 çok iyi.</Text>
        {met.map((m) => (
          <View key={m.id} style={st.satir}>
            <Text style={st.ad} numberOfLines={1}>{m.name}</Text>
            <View style={st.puanlar}>
              {[1, 2, 3, 4, 5].map((p) => {
                const secili = puan.get(m.id) === p;
                return (
                  <Pressable
                    key={p}
                    onPress={() => {
                      const y = new Map(puan);
                      if (secili) y.delete(m.id);
                      else y.set(m.id, p);
                      setPuan(y);
                    }}
                    style={[st.puan, secili && { backgroundColor: renk.kort }]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: secili }}
                    accessibilityLabel={`${m.name} ${p}`}
                  >
                    <Text style={[st.puanYazi, secili && { color: '#fff' }]}>{p}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
        <Alan etiket="Hoca notu" value={not} onChangeText={setNot} multiline maxLength={1000} placeholder="Veliye de gidecek kısa bir not" />
      </Bolum>
    </Ekran>
  );
}

const st = StyleSheet.create({
  aciklama: { fontFamily: yazi.normal, fontSize: 14, color: renk.soluk, marginTop: 14 },
  satir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: renk.cizgi },
  ad: { flex: 1, fontFamily: yazi.yariKalin, fontSize: 15, color: renk.murekkep },
  puanlar: { flexDirection: 'row', gap: 5 },
  puan: { width: 40, height: 40, borderRadius: 10, backgroundColor: renk.gri, alignItems: 'center', justifyContent: 'center' },
  puanYazi: { fontFamily: yazi.sayi, fontSize: 18, color: renk.murekkep },
});
