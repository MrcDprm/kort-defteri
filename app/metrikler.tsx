import { Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, Text } from 'react-native';
import { useVeri } from '@/db/olay';
import { metrikKaydet, metrikler } from '@/db/veri';
import { Alan, Bolum, Dugme, Ekran, Etiket, MetinDugme, Satir, Yukleniyor } from '@/ui/bilesenler';
import { renk, yazi } from '@/ui/tema';

export default function Metrikler() {
  const db = useSQLiteContext();
  const { veri } = useVeri((d) => metrikler(d, true));
  const [yeni, setYeni] = useState('');
  if (!veri) return <Yukleniyor />;

  const ekle = async () => {
    const ad = yeni.trim();
    if (!ad) return;
    if (veri.some((m) => m.name.toLocaleLowerCase('tr-TR') === ad.toLocaleLowerCase('tr-TR'))) {
      Alert.alert('Bu metrik zaten var.');
      return;
    }
    await metrikKaydet(db, null, ad, 1);
    setYeni('');
  };

  const yenidenAdlandir = (id: string, eski: string, aktif: number) =>
    Alert.prompt('Metriğin adı', undefined, (ad) => {
      if (ad?.trim()) void metrikKaydet(db, id, ad.trim(), aktif);
    }, 'plain-text', eski);

  return (
    <Ekran>
      <Stack.Screen options={{ title: 'Metrikler' }} />
      <Bolum stil={{ marginTop: 4 }}>
        <Text style={{ fontFamily: yazi.normal, fontSize: 15, color: renk.soluk, lineHeight: 21 }}>
          Değerlendirmede puanlanan başlıklar. Kapattığın metrik yeni değerlendirmelerde çıkmaz, eski puanları silinmez.
        </Text>
        {veri.map((m, i) => (
          <Satir
            key={m.id}
            baslik={m.name}
            onPress={() => yenidenAdlandir(m.id, m.name, m.active)}
            sol={m.active !== 1 ? <Etiket yazi="Kapalı" ton="gri" /> : undefined}
            sag={<MetinDugme yazi={m.active === 1 ? 'Kapat' : 'Aç'} renkYazi={m.active === 1 ? renk.soluk : renk.kort} onPress={() => void metrikKaydet(db, m.id, m.name, m.active === 1 ? 0 : 1)} />}
            son={i === veri.length - 1}
          />
        ))}
        <Alan etiket="Yeni metrik" value={yeni} onChangeText={setYeni} placeholder="Örneğin Drop shot" maxLength={40} onSubmitEditing={() => void ekle()} returnKeyType="done" />
        <Dugme yazi="Metrik ekle" tur="ikincil" onPress={() => void ekle()} kapali={!yeni.trim()} stil={{ marginTop: 12 }} />
      </Bolum>
    </Ekran>
  );
}
