import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ayOzeti, odemeDurumu, tl } from '@/domain/odeme';
import { ayAdi, ayAnahtari, ayEkle, kisaTarih, tarihMetni } from '@/domain/tarih';
import { adSoyad, type Odeme, type Sporcu } from '@/domain/tipler';
import { useVeri } from '@/db/olay';
import { odemeler, odendiIsaretle, sporcular } from '@/db/veri';
import { Bolum, Bos, Ekran, Etiket, MetinDugme, Satir, SekmeBasligi, Secenekler, Yukleniyor } from '@/ui/bilesenler';
import { DURUM_ETIKETI } from '@/ui/odemeEtiketi';
import { renk, yazi } from '@/ui/tema';

type Suzgec = 'hepsi' | 'odenmedi' | 'odendi';

export default function Odemeler() {
  const db = useSQLiteContext();
  const bugun = tarihMetni(new Date());
  const [ay, setAy] = useState(ayAnahtari(bugun));
  const [suzgec, setSuzgec] = useState<Suzgec>('hepsi');
  const { veri } = useVeri(async (d) => ({ od: await odemeler(d), sp: await sporcular(d) }));
  if (!veri) return <Yukleniyor />;

  const adlar = new Map(veri.sp.map((x) => [x.id, x]));
  const ozet = ayOzeti(veri.od, ay);
  const sira = (o: Odeme) => ({ gecikti: 0, bekliyor: 1, odendi: 2 })[odemeDurumu(o, bugun)];
  const ayinki = veri.od
    .filter((o) => ayAnahtari(o.due_date) === ay)
    .filter((o) => suzgec === 'hepsi' || (suzgec === 'odendi' ? o.paid === 1 : o.paid !== 1))
    .sort((a, b) => sira(a) - sira(b) || a.due_date.localeCompare(b.due_date));
  const eskiGeciken = ay === ayAnahtari(bugun) ? veri.od.filter((o) => o.paid !== 1 && ayAnahtari(o.due_date) < ay).sort((a, b) => a.due_date.localeCompare(b.due_date)) : [];

  const satir = (o: Odeme, son: boolean) => (
    <OdemeSatiri key={o.id} o={o} sporcu={adlar.get(o.athlete_id)} bugun={bugun} son={son} odendi={() => void odendiIsaretle(db, o.id, true)} />
  );

  return (
    <Ekran ustBosluk>
      <SekmeBasligi baslik="Ödemeler" sag={<MetinDugme yazi="Ekle" onPress={() => router.push('/odeme/duzenle')} />} />
      <View style={st.ayCubugu}>
        <MetinDugme yazi="Önceki" onPress={() => setAy(ayEkle(ay, -1))} />
        <Text style={st.ayYazi}>{ayAdi(ay)}</Text>
        <MetinDugme yazi="Sonraki" onPress={() => setAy(ayEkle(ay, 1))} />
      </View>
      <View style={st.ozet}>
        <View style={st.ozetKutu}>
          <Text style={[st.ozetSayi, { color: renk.geldi }]} numberOfLines={1} adjustsFontSizeToFit>{tl(ozet.alinan)}</Text>
          <Text style={st.ozetEtiket}>Alınan</Text>
        </View>
        <View style={[st.ozetKutu, st.ozetCizgi]}>
          <Text style={[st.ozetSayi, { color: ozet.bekleyen > 0 ? renk.gelmedi : renk.murekkep }]} numberOfLines={1} adjustsFontSizeToFit>{tl(ozet.bekleyen)}</Text>
          <Text style={st.ozetEtiket}>Bekleyen</Text>
        </View>
      </View>
      <View style={{ paddingHorizontal: 16 }}>
        <Secenekler<Suzgec>
          secenekler={[{ deger: 'hepsi', yazi: 'Hepsi' }, { deger: 'odenmedi', yazi: 'Ödenmedi' }, { deger: 'odendi', yazi: 'Ödendi' }]}
          deger={suzgec}
          degisti={(d) => setSuzgec(d ?? 'hepsi')}
        />
      </View>

      {eskiGeciken.length > 0 ? <Bolum baslik="Önceki aylardan gecikenler">{eskiGeciken.map((o, i) => satir(o, i === eskiGeciken.length - 1))}</Bolum> : null}

      <Bolum baslik={ayAdi(ay)}>
        {ayinki.length === 0 ? (
          <Bos
            yazi={veri.od.length === 0 ? 'Henüz ödeme kaydı yok. Bir ödemeyi tarih ve tutarıyla ekle; aynı anda birden çok sporcu seçebilirsin.' : 'Bu ay için kayıt yok.'}
            dugme="Ödeme ekle"
            onPress={() => router.push('/odeme/duzenle')}
          />
        ) : (
          ayinki.map((o, i) => satir(o, i === ayinki.length - 1))
        )}
      </Bolum>
    </Ekran>
  );
}

function OdemeSatiri({ o, sporcu, bugun, son, odendi }: { o: Odeme; sporcu: Sporcu | undefined; bugun: string; son: boolean; odendi: () => void }) {
  const d = DURUM_ETIKETI[odemeDurumu(o, bugun)];
  return (
    <Satir
      sol={<View style={{ width: 78 }}><Etiket yazi={d.yazi} ton={d.ton} /></View>}
      baslik={sporcu ? adSoyad(sporcu) : 'Silinmiş sporcu'}
      alt={[`${tl(o.amount)}, ${kisaTarih(o.due_date)}`, o.note].filter(Boolean).join('. ')}
      sag={o.paid !== 1 ? <MetinDugme yazi="Ödendi" renkYazi={renk.geldi} onPress={odendi} /> : undefined}
      onPress={() => router.push({ pathname: '/odeme/duzenle', params: { id: o.id } })}
      son={son}
    />
  );
}

const st = StyleSheet.create({
  ayCubugu: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, marginHorizontal: 16, backgroundColor: renk.beyaz, borderRadius: 14 },
  ayYazi: { fontFamily: yazi.kalin, fontSize: 17, color: renk.murekkep },
  ozet: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: renk.cizgi },
  ozetKutu: { flex: 1, paddingHorizontal: 8 },
  ozetCizgi: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: renk.cizgi, paddingLeft: 16 },
  ozetSayi: { fontFamily: yazi.sayi, fontSize: 28 },
  ozetEtiket: { fontFamily: yazi.normal, fontSize: 13, color: renk.soluk, marginTop: 2 },
});
