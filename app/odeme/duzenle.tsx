import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Linking, Text } from 'react-native';
import { tutarOku } from '@/domain/odeme';
import { tarihMetni } from '@/domain/tarih';
import { adSoyad, type Sporcu } from '@/domain/tipler';
import { odemeHatirlatmaMetni, waBaglantisi, waNumarasi } from '@/domain/whatsapp';
import { hoca, odeme, odemeKaydet, odemeSil, sonTutar, sporcular } from '@/db/veri';
import { Alan, Anahtar, Bolum, Dugme, Ekran, TarihAlani, Yukleniyor } from '@/ui/bilesenler';
import { SporcuSecici } from '@/ui/SporcuSecici';
import { renk, yazi } from '@/ui/tema';

export default function OdemeDuzenle() {
  const db = useSQLiteContext();
  const p = useLocalSearchParams<{ id?: string; sporcu?: string }>();
  const [hazir, setHazir] = useState(false);
  const [tum, setTum] = useState<Sporcu[]>([]);
  const [secili, setSecili] = useState<string[]>(p.sporcu ? [p.sporcu] : []);
  const [tarih, setTarih] = useState<string | null>(tarihMetni(new Date()));
  const [tutar, setTutar] = useState('');
  const [odendi, setOdendi] = useState(false);
  const [not, setNot] = useState('');
  const [hocaAdi, setHocaAdi] = useState<string | null>(null);
  const [denendi, setDenendi] = useState(false);

  useEffect(() => {
    void (async () => {
      setTum(await sporcular(db));
      setHocaAdi((await hoca(db)).name);
      if (p.id) {
        const o = await odeme(db, p.id);
        if (o) {
          setSecili([o.athlete_id]); setTarih(o.due_date); setTutar(String(o.amount).replace('.', ',')); setOdendi(o.paid === 1); setNot(o.note ?? '');
        }
      } else if (p.sporcu) {
        const t = await sonTutar(db, p.sporcu);
        if (t) setTutar(String(t).replace('.', ','));
      }
      setHazir(true);
    })();
  }, [db, p.id, p.sporcu]);

  if (!hazir) return <Yukleniyor />;

  const miktar = tutarOku(tutar);
  const hata = {
    sporcu: secili.length === 0 ? 'En az bir sporcu seç.' : null,
    tutar: miktar === null ? 'Tutarı sayı olarak yaz, örneğin 2500.' : null,
  };
  const tekSporcu = secili.length === 1 ? tum.find((x) => x.id === secili[0]) : undefined;
  const wa = waNumarasi(tekSporcu?.parent_phone ?? tekSporcu?.phone);

  async function sporcuSecildi(d: string[]) {
    setSecili(d);
    if (!p.id && d.length === 1 && !tutar && d[0]) {
      const t = await sonTutar(db, d[0]);
      if (t) setTutar(String(t).replace('.', ','));
    }
  }

  async function kaydet() {
    setDenendi(true);
    if (hata.sporcu || hata.tutar || miktar === null || !tarih) return;
    try {
      await odemeKaydet(db, p.id ?? null, secili, { due_date: tarih, amount: miktar, paid: odendi ? 1 : 0, note: not.trim() || null });
      router.back();
    } catch {
      Alert.alert('Kaydedilemedi', 'Ödeme kaydedilirken bir sorun çıktı, tekrar dene.');
    }
  }

  function sil() {
    if (!p.id) return;
    Alert.alert('Ödeme kaydı silinsin mi?', 'Bu geri alınamaz.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => { await odemeSil(db, p.id!); router.back(); } },
    ]);
  }

  return (
    <Ekran altDugme={<Dugme yazi={p.id ? 'Değişiklikleri kaydet' : secili.length > 1 ? `${secili.length} ödeme kaydı aç` : 'Ödemeyi kaydet'} onPress={() => void kaydet()} />}>
      <Stack.Screen options={{ title: p.id ? 'Ödemeyi düzenle' : 'Yeni ödeme' }} />
      <Bolum stil={{ marginTop: 4 }}>
        <TarihAlani etiket="Ödeme tarihi" deger={tarih} degisti={setTarih} />
        <Alan etiket="Tutar, TL" value={tutar} onChangeText={setTutar} keyboardType="decimal-pad" placeholder="2500" hata={denendi ? hata.tutar : null} />
        <Anahtar etiket="Ödendi" deger={odendi} degisti={setOdendi} />
        <Alan etiket="Not" value={not} onChangeText={setNot} placeholder="Örneğin Kasım aidatı, 8 derslik paket" maxLength={200} />
        {p.id && !odendi && wa && tekSporcu && miktar && tarih ? (
          <Dugme
            yazi="WhatsApp ile hatırlat"
            tur="ikincil"
            stil={{ marginTop: 16 }}
            onPress={() => void Linking.openURL(waBaglantisi(wa, odemeHatirlatmaMetni(tekSporcu.parent_name, adSoyad(tekSporcu), miktar, tarih, hocaAdi)))}
          />
        ) : null}
      </Bolum>
      <Bolum baslik={p.id ? 'Sporcu' : `Sporcular, ${secili.length} seçili`}>
        {!p.id ? <Text style={{ fontFamily: yazi.normal, fontSize: 14, color: renk.soluk, marginBottom: 6 }}>Birden çok sporcu seçersen her biri için aynı tarih ve tutarla ayrı kayıt açılır.</Text> : null}
        {denendi && hata.sporcu ? <Text style={{ fontFamily: yazi.orta, fontSize: 13, color: renk.gelmedi, marginBottom: 6 }}>{hata.sporcu}</Text> : null}
        <SporcuSecici sporcular={tum} secili={secili} degisti={(d) => void sporcuSecildi(d)} tekli={!!p.id} />
      </Bolum>
      {p.id ? (
        <Bolum>
          <Dugme yazi="Ödeme kaydını sil" tur="tehlike" onPress={sil} />
        </Bolum>
      ) : null}
    </Ekran>
  );
}
