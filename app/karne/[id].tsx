import { useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useRef, useState, type ComponentRef } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import Svg, { G, Line, Rect } from 'react-native-svg';
import { uzunTarih, tarihMetni } from '@/domain/tarih';
import { adSoyad, basHarfler, sporcuAltYazisi } from '@/domain/tipler';
import { useVeri } from '@/db/olay';
import { degerlendirmeler, hoca, metrikler, sporcu } from '@/db/veri';
import { Avatar, Bos, Dugme, Ekran, Yukleniyor } from '@/ui/bilesenler';
import { Radar } from '@/ui/cizimler';
import { renk, yazi } from '@/ui/tema';

const GENISLIK = 340;

export default function Karne() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const kart = useRef<ComponentRef<typeof View>>(null);
  const [paylasiliyor, setPaylasiliyor] = useState(false);
  const { veri } = useVeri(async (d) => ({ sp: await sporcu(d, id), deg: await degerlendirmeler(d, id), met: await metrikler(d), h: await hoca(d) }), [id]);
  if (!veri) return <Yukleniyor />;
  const { sp, deg, met, h } = veri;
  const [son, onceki] = deg;
  if (!sp || !son) return <Ekran><Bos yazi="Karne için önce bir değerlendirme ekle." /></Ekran>;

  const seriler = [onceki, son].filter((x): x is NonNullable<typeof x> => !!x).map((d, i, a) => ({
    degerler: met.map((m) => d.puanlar.get(m.id) ?? 0),
    renk: i === a.length - 1 ? renk.kort : '#9AA5AF',
  }));
  const artanlar = onceki
    ? met
        .map((m) => ({ ad: m.name, once: onceki.puanlar.get(m.id) ?? 0, simdi: son.puanlar.get(m.id) ?? 0 }))
        .filter((x) => x.once > 0 && x.simdi > x.once)
        .sort((a, b) => b.simdi - b.once - (a.simdi - a.once))
        .slice(0, 3)
    : [];

  async function paylas() {
    setPaylasiliyor(true);
    try {
      const uri = await captureRef(kart, { format: 'png', quality: 1, result: 'tmpfile' });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: `${adSoyad(sp!)} gelişim karnesi` });
    } catch {
      Alert.alert('Paylaşılamadı', 'Karne görseli hazırlanırken bir sorun çıktı, tekrar dene.');
    } finally {
      setPaylasiliyor(false);
    }
  }

  return (
    <Ekran altDugme={<Dugme yazi="Veliye paylaş" onPress={() => void paylas()} mesgul={paylasiliyor} />}>
      <View style={{ alignItems: 'center', paddingVertical: 16 }}>
        <View ref={kart} collapsable={false} style={st.kart}>
          <View style={st.ust}>
            <Svg width={GENISLIK} height={110} style={StyleSheet.absoluteFill}>
              <Rect width={GENISLIK} height={110} fill={renk.kort} />
              <G stroke="rgba(255,255,255,0.4)" strokeWidth={2.5}>
                <Line x1={GENISLIK - 90} y1={0} x2={GENISLIK - 90} y2={110} />
                <Line x1={GENISLIK - 90} y1={56} x2={GENISLIK} y2={56} />
                <Line x1={GENISLIK - 40} y1={0} x2={GENISLIK - 40} y2={56} />
              </G>
            </Svg>
            <Avatar ad={basHarfler(sp)} foto={sp.photo} top={sp.ball} boyut={72} yuvarlak={false} />
            <View style={{ flex: 1, paddingRight: 80 }}>
              <Text style={st.ad}>{adSoyad(sp)}</Text>
              <Text style={st.alt}>{sporcuAltYazisi(sp, tarihMetni(new Date()))}</Text>
            </View>
          </View>
          <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
            <Text style={st.baslik}>Gelişim karnesi, {uzunTarih(son.date)}</Text>
            <View style={{ alignItems: 'center', marginHorizontal: -10 }}>
              <Radar etiketler={met.map((m) => m.name)} seriler={seriler} genislik={GENISLIK - 12} />
            </View>
            {onceki ? (
              <Text style={st.lejant}>
                <Text style={{ color: '#9AA5AF' }}>■ </Text>{uzunTarih(onceki.date)}{'    '}<Text style={{ color: renk.kort }}>■ </Text>{uzunTarih(son.date)}
              </Text>
            ) : null}
            {artanlar.length > 0 ? (
              <View style={{ marginTop: 10 }}>
                <Text style={st.bolum}>En çok gelişenler</Text>
                {artanlar.map((x) => (
                  <View key={x.ad} style={st.satir}>
                    <Text style={st.satirAd}>{x.ad}</Text>
                    <Text style={st.satirSayi}>{`${x.once} → ${x.simdi}`}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {son.note ? <Text style={st.not}>{son.note}</Text> : null}
            {h.name ? (
              <Text style={st.imza}>{[h.name, h.title].filter(Boolean).join(', ')}</Text>
            ) : null}
          </View>
        </View>
      </View>
    </Ekran>
  );
}

const st = StyleSheet.create({
  kart: { width: GENISLIK, backgroundColor: renk.beyaz, borderRadius: 20, overflow: 'hidden', paddingBottom: 18 },
  ust: { height: 110, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16 },
  ad: { fontFamily: yazi.baslik, fontSize: 22, color: '#fff' },
  alt: { fontFamily: yazi.normal, fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  baslik: { fontFamily: yazi.kalin, fontSize: 16, color: renk.murekkep },
  lejant: { fontFamily: yazi.normal, fontSize: 12, color: renk.soluk },
  bolum: { fontFamily: yazi.kalin, fontSize: 14, color: renk.murekkep, marginBottom: 4 },
  satir: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: renk.cizgi },
  satirAd: { fontFamily: yazi.orta, fontSize: 14, color: renk.murekkep },
  satirSayi: { fontFamily: yazi.sayi, fontSize: 15, color: renk.geldi },
  not: { fontFamily: yazi.normal, fontSize: 14, color: renk.murekkep, lineHeight: 20, marginTop: 12 },
  imza: { fontFamily: yazi.yariKalin, fontSize: 13, color: renk.kort, marginTop: 14 },
});
