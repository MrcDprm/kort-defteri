import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { GUNLER_KISA, haftaninGunu, tarihMetni } from '@/domain/tarih';
import type { DersTuru, Sporcu } from '@/domain/tipler';
import { ders, dersSil, dersSporculari, sablon, sablonKaydet, sablonSil, sablonSporculari, sporcular, tekDersKaydet } from '@/db/veri';
import { Alan, Anahtar, Bolum, Dugme, Ekran, SaatAlani, Secenekler, TarihAlani, Yukleniyor } from '@/ui/bilesenler';
import { SporcuSecici } from '@/ui/SporcuSecici';
import { renk, yazi } from '@/ui/tema';

type Tekrar = 'hafta' | 'tek';

function saatEkle(saat: string, dakika: number): string {
  const [s, d] = saat.split(':').map(Number);
  const t = Math.min(23 * 60 + 55, (s ?? 0) * 60 + (d ?? 0) + dakika);
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

export default function DersDuzenle() {
  const db = useSQLiteContext();
  const p = useLocalSearchParams<{ sablon?: string; ders?: string; tarih?: string; telafi?: string }>();
  const duzenleme = !!(p.sablon || p.ders);
  const [hazir, setHazir] = useState(false);
  const [tekrar, setTekrar] = useState<Tekrar>(p.ders || p.tarih ? 'tek' : 'hafta');
  const [baslik, setBaslik] = useState(p.telafi ? `Telafi: ${p.telafi}` : '');
  const [gun, setGun] = useState(p.tarih ? haftaninGunu(p.tarih) : haftaninGunu(tarihMetni(new Date())));
  const [tarih, setTarih] = useState<string | null>(p.tarih ?? tarihMetni(new Date()));
  const [baslangic, setBaslangic] = useState('10:00');
  const [bitis, setBitis] = useState('11:00');
  const [kort, setKort] = useState('');
  const [tur, setTur] = useState<DersTuru>('grup');
  const [aktif, setAktif] = useState(true);
  const [not, setNot] = useState('');
  const [secili, setSecili] = useState<string[]>([]);
  const [tumSporcular, setTumSporcular] = useState<Sporcu[]>([]);
  const [denendi, setDenendi] = useState(false);

  useEffect(() => {
    void (async () => {
      setTumSporcular(await sporcular(db));
      if (p.sablon) {
        const x = await sablon(db, p.sablon);
        if (x) {
          setBaslik(x.title); setGun(x.weekday); setBaslangic(x.start); setBitis(x.end); setKort(x.court ?? ''); setTur(x.kind); setAktif(x.active === 1);
          setSecili(await sablonSporculari(db, x.id));
        }
      } else if (p.ders) {
        const x = await ders(db, p.ders);
        if (x) {
          setBaslik(x.title); setTarih(x.date); setBaslangic(x.start); setBitis(x.end); setKort(x.court ?? ''); setTur(x.kind); setNot(x.note ?? '');
          setSecili(await dersSporculari(db, x.id));
        }
      }
      setHazir(true);
    })();
  }, [db, p.sablon, p.ders]);

  if (!hazir) return <Yukleniyor />;

  const hata = {
    baslik: !baslik.trim() ? 'Ders adı gerekli.' : null,
    saat: bitis <= baslangic ? 'Bitiş saati başlangıçtan sonra olmalı.' : null,
  };

  async function kaydet() {
    setDenendi(true);
    if (hata.baslik || hata.saat) return;
    const ortak = { title: baslik.trim(), start: baslangic, end: bitis, court: kort.trim() || null, kind: tur };
    try {
      if (tekrar === 'hafta') {
        await sablonKaydet(db, p.sablon ?? null, { ...ortak, weekday: gun, active: aktif ? 1 : 0 }, secili);
      } else {
        await tekDersKaydet(db, p.ders ?? null, { ...ortak, date: tarih ?? tarihMetni(new Date()), note: not.trim() || null }, secili);
      }
      router.back();
    } catch {
      Alert.alert('Kaydedilemedi', 'Ders kaydedilirken bir sorun çıktı, tekrar dene.');
    }
  }

  function sil() {
    Alert.alert(
      tekrar === 'hafta' ? 'Haftalık ders silinsin mi?' : 'Ders silinsin mi?',
      tekrar === 'hafta' ? 'Gelecek haftalarda takvimde görünmez. Alınmış yoklamalar kalır. Ara vermek için silmek yerine durdurabilirsin.' : 'Bu derse ait yoklama da silinir.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil', style: 'destructive',
          onPress: async () => {
            if (p.sablon) await sablonSil(db, p.sablon);
            else if (p.ders) await dersSil(db, p.ders);
            router.dismissTo('/takvim');
          },
        },
      ],
    );
  }

  return (
    <Ekran altDugme={<Dugme yazi={duzenleme ? 'Değişiklikleri kaydet' : 'Dersi kaydet'} onPress={() => void kaydet()} />}>
      <Stack.Screen options={{ title: duzenleme ? 'Dersi düzenle' : 'Yeni ders' }} />
      <Bolum stil={{ marginTop: 4 }}>
        {!duzenleme ? (
          <Secenekler<Tekrar> secenekler={[{ deger: 'hafta', yazi: 'Her hafta' }, { deger: 'tek', yazi: 'Tek seferlik' }]} deger={tekrar} degisti={(d) => d && setTekrar(d)} />
        ) : null}
        <Alan etiket="Ders adı" value={baslik} onChangeText={setBaslik} placeholder="Örneğin Performans grubu" maxLength={80} hata={denendi ? hata.baslik : null} />
        {tekrar === 'hafta' ? (
          <Secenekler<number> etiket="Gün" secenekler={GUNLER_KISA.map((g, i) => ({ deger: i + 1, yazi: g }))} deger={gun} degisti={(d) => d && setGun(d)} />
        ) : (
          <TarihAlani etiket="Tarih" deger={tarih} degisti={setTarih} />
        )}
        <Bolum stil={{ marginTop: 0, paddingHorizontal: 0, flexDirection: 'row', gap: 12 }}>
          <SaatAlani etiket="Başlangıç" deger={baslangic} degisti={(d) => { setBaslangic(d); if (bitis <= d) setBitis(saatEkle(d, 60)); }} />
          <SaatAlani etiket="Bitiş" deger={bitis} degisti={setBitis} />
        </Bolum>
        {denendi && hata.saat ? <Text style={{ fontFamily: yazi.orta, fontSize: 13, color: renk.gelmedi, marginTop: 4 }}>{hata.saat}</Text> : null}
        <Alan etiket="Kort" value={kort} onChangeText={setKort} placeholder="Örneğin Kort 1" maxLength={40} />
        <Secenekler<DersTuru> etiket="Ders türü" secenekler={[{ deger: 'grup', yazi: 'Grup dersi' }, { deger: 'ozel', yazi: 'Özel ders' }]} deger={tur} degisti={(d) => d && setTur(d)} />
        {tekrar === 'tek' ? <Alan etiket="Not" value={not} onChangeText={setNot} maxLength={200} /> : null}
        {tekrar === 'hafta' && duzenleme ? <Anahtar etiket="Ders devam ediyor, takvimde göster" deger={aktif} degisti={setAktif} /> : null}
      </Bolum>
      <Bolum baslik={`Sporcular, ${secili.length} seçili`}>
        <SporcuSecici sporcular={tumSporcular} secili={secili} degisti={setSecili} />
      </Bolum>
      {duzenleme ? (
        <Bolum>
          <Dugme yazi="Dersi sil" tur="tehlike" onPress={sil} />
        </Bolum>
      ) : null}
    </Ekran>
  );
}
