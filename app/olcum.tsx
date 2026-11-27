import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { sayiOku } from '@/domain/sayi';
import { tarihMetni } from '@/domain/tarih';
import { olcumEkle } from '@/db/veri';
import { Alan, Bolum, Dugme, Ekran, TarihAlani } from '@/ui/bilesenler';

export default function OlcumEkle() {
  const db = useSQLiteContext();
  const { sporcu } = useLocalSearchParams<{ sporcu: string }>();
  const [tarih, setTarih] = useState<string | null>(tarihMetni(new Date()));
  const [boy, setBoy] = useState('');
  const [kilo, setKilo] = useState('');
  const [denendi, setDenendi] = useState(false);

  const b = sayiOku(boy, 50, 230);
  const k = sayiOku(kilo, 10, 200);
  const hata = {
    boy: b === 'hata' ? 'Boy 50 ile 230 cm arasında olmalı.' : null,
    kilo: k === 'hata' ? 'Kilo 10 ile 200 kg arasında olmalı.' : null,
    bos: b === null && k === null ? 'Boy ya da kilodan en az birini gir.' : null,
  };

  async function kaydet() {
    setDenendi(true);
    if (hata.boy || hata.kilo || hata.bos || !tarih) return;
    try {
      await olcumEkle(db, { athlete_id: sporcu, date: tarih, height_cm: typeof b === 'number' ? b : null, weight_kg: typeof k === 'number' ? k : null });
      router.back();
    } catch {
      Alert.alert('Kaydedilemedi', 'Ölçüm kaydedilirken bir sorun çıktı, tekrar dene.');
    }
  }

  return (
    <Ekran altDugme={<Dugme yazi="Ölçümü kaydet" onPress={() => void kaydet()} />}>
      <Stack.Screen options={{ title: 'Ölçüm ekle' }} />
      <Bolum stil={{ marginTop: 4 }}>
        <TarihAlani etiket="Tarih" deger={tarih} degisti={setTarih} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}><Alan etiket="Boy, cm" value={boy} onChangeText={setBoy} keyboardType="decimal-pad" autoFocus hata={denendi ? hata.boy ?? hata.bos : null} /></View>
          <View style={{ flex: 1 }}><Alan etiket="Kilo, kg" value={kilo} onChangeText={setKilo} keyboardType="decimal-pad" hata={denendi ? hata.kilo : null} /></View>
        </View>
      </Bolum>
    </Ekran>
  );
}
