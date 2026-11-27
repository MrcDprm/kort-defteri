import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { tarihMetni } from '@/domain/tarih';
import { adSoyad, basHarfler, type Sporcu } from '@/domain/tipler';
import { sporcular, turnuva, turnuvaKatilimlari, turnuvaKaydet, turnuvaSil } from '@/db/veri';
import { Alan, Avatar, Bolum, Dugme, Ekran, TarihAlani, Yukleniyor, s as ortak } from '@/ui/bilesenler';
import { SporcuSecici } from '@/ui/SporcuSecici';
import { renk, yazi } from '@/ui/tema';

export default function TurnuvaDuzenle() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [hazir, setHazir] = useState(false);
  const [tum, setTum] = useState<Sporcu[]>([]);
  const [ad, setAd] = useState('');
  const [tarih, setTarih] = useState<string | null>(tarihMetni(new Date()));
  const [yer, setYer] = useState('');
  const [kategori, setKategori] = useState('');
  const [secili, setSecili] = useState<string[]>([]);
  const [sonuclar, setSonuclar] = useState<Record<string, string>>({});
  const [denendi, setDenendi] = useState(false);

  useEffect(() => {
    void (async () => {
      setTum(await sporcular(db));
      if (id) {
        const t = await turnuva(db, id);
        if (t) {
          setAd(t.name); setTarih(t.date); setYer(t.place ?? ''); setKategori(t.category ?? '');
          const k = await turnuvaKatilimlari(db, id);
          setSecili(k.map((x) => x.athlete_id));
          setSonuclar(Object.fromEntries(k.map((x) => [x.athlete_id, x.result ?? ''])));
        }
      }
      setHazir(true);
    })();
  }, [db, id]);

  if (!hazir) return <Yukleniyor />;

  async function kaydet() {
    setDenendi(true);
    if (!ad.trim() || !tarih) return;
    try {
      await turnuvaKaydet(
        db, id ?? null,
        { name: ad.trim(), date: tarih, place: yer.trim() || null, category: kategori.trim() || null },
        secili.map((a) => ({ tournament_id: id ?? '', athlete_id: a, result: sonuclar[a]?.trim() || null })),
      );
      router.back();
    } catch {
      Alert.alert('Kaydedilemedi', 'Turnuva kaydedilirken bir sorun çıktı, tekrar dene.');
    }
  }

  const katilanlar = tum.filter((x) => secili.includes(x.id));

  return (
    <Ekran altDugme={<Dugme yazi={id ? 'Değişiklikleri kaydet' : 'Turnuvayı kaydet'} onPress={() => void kaydet()} />}>
      <Stack.Screen options={{ title: id ? 'Turnuva' : 'Yeni turnuva' }} />
      <Bolum stil={{ marginTop: 4 }}>
        <Alan etiket="Turnuva adı" value={ad} onChangeText={setAd} maxLength={100} hata={denendi && !ad.trim() ? 'Turnuva adı gerekli.' : null} />
        <TarihAlani etiket="Tarih" deger={tarih} degisti={setTarih} />
        <Alan etiket="Yer" value={yer} onChangeText={setYer} maxLength={80} />
        <Alan etiket="Kategori" value={kategori} onChangeText={setKategori} placeholder="Örneğin 12 yaş erkekler" maxLength={80} />
      </Bolum>
      {katilanlar.length > 0 ? (
        <Bolum baslik="Sonuçlar">
          {katilanlar.map((x) => (
            <View key={x.id} style={st.satir}>
              <Avatar ad={basHarfler(x)} foto={x.photo} top={x.ball} boyut={38} />
              <Text style={st.ad} numberOfLines={1}>{adSoyad(x)}</Text>
              <TextInput
                value={sonuclar[x.id] ?? ''}
                onChangeText={(v) => setSonuclar({ ...sonuclar, [x.id]: v })}
                placeholder="Örneğin Çeyrek final"
                placeholderTextColor="#9AA2AA"
                maxLength={60}
                style={[ortak.girdi, st.sonuc]}
              />
            </View>
          ))}
        </Bolum>
      ) : null}
      <Bolum baslik={`Katılan sporcular, ${secili.length}`}>
        <SporcuSecici sporcular={tum} secili={secili} degisti={setSecili} />
      </Bolum>
      {id ? (
        <Bolum>
          <Dugme
            yazi="Turnuvayı sil"
            tur="tehlike"
            onPress={() =>
              Alert.alert('Turnuva silinsin mi?', 'Sporcuların bu turnuvadaki sonuçları da silinir.', [
                { text: 'Vazgeç', style: 'cancel' },
                { text: 'Sil', style: 'destructive', onPress: async () => { await turnuvaSil(db, id); router.back(); } },
              ])
            }
          />
        </Bolum>
      ) : null}
    </Ekran>
  );
}

const st = StyleSheet.create({
  satir: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: renk.cizgi },
  ad: { flex: 1, fontFamily: yazi.yariKalin, fontSize: 15, color: renk.murekkep },
  sonuc: { width: 150, minHeight: 42, fontSize: 15 },
});
