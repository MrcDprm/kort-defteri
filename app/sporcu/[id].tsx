import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { odemeDurumu, tl } from '@/domain/odeme';
import { devamOrani } from '@/domain/program';
import { kisaTarih, tarihMetni, uzunTarih, yas } from '@/domain/tarih';
import { adSoyad, basHarfler, TOP_ADLARI } from '@/domain/tipler';
import { odemeHatirlatmaMetni, waBaglantisi, waNumarasi } from '@/domain/whatsapp';
import { useVeri } from '@/db/olay';
import {
  degerlendirmeler, degerlendirmeSil, hoca, metrikler, olcumler, olcumSil, odendiIsaretle, sporcu, sporcuOdemeleri, sporcuTurnuvalari, sporcuYoklamasi,
} from '@/db/veri';
import { Avatar, Bolum, Bos, Dugme, Ekran, Etiket, MetinDugme, Satir, Yukleniyor } from '@/ui/bilesenler';
import { CizgiGrafik, Radar } from '@/ui/cizimler';
import { DURUM_ETIKETI } from '@/ui/odemeEtiketi';
import { renk, yazi } from '@/ui/tema';

type Sekme = 'bilgi' | 'gelisim' | 'odeme' | 'yoklama';
const SEKMELER: { ad: Sekme; yazi: string }[] = [
  { ad: 'bilgi', yazi: 'Bilgiler' },
  { ad: 'gelisim', yazi: 'Gelişim' },
  { ad: 'odeme', yazi: 'Ödemeler' },
  { ad: 'yoklama', yazi: 'Yoklama' },
];

export default function SporcuAyrintisi() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sekme, setSekme] = useState<Sekme>('bilgi');
  const { width } = useWindowDimensions();
  const { veri } = useVeri(
    async (d) => {
      const [sp, olc, deg, met, od, yok, tur, h] = await Promise.all([
        sporcu(d, id), olcumler(d, id), degerlendirmeler(d, id), metrikler(d), sporcuOdemeleri(d, id), sporcuYoklamasi(d, id), sporcuTurnuvalari(d, id), hoca(d),
      ]);
      return { sp, olc, deg, met, od, yok, tur, hocaAdi: h.name };
    },
    [id],
  );
  if (!veri) return <Yukleniyor />;
  const { sp } = veri;
  if (!sp) {
    return (
      <Ekran>
        <Bos yazi="Bu sporcu silinmiş." dugme="Sporculara dön" onPress={() => router.back()} />
      </Ekran>
    );
  }

  const bugun = tarihMetni(new Date());
  const sonBoy = [...veri.olc].reverse().find((o) => o.height_cm !== null)?.height_cm ?? null;
  const sonKilo = [...veri.olc].reverse().find((o) => o.weight_kg !== null)?.weight_kg ?? null;
  const devam = devamOrani(veri.yok);
  const tel = waNumarasi(sp.parent_phone ?? sp.phone);
  const satirlar = [
    [sp.birth_date ? `${yas(sp.birth_date, bugun)} yaş` : null, sp.ball ? TOP_ADLARI[sp.ball].toLocaleLowerCase('tr-TR') : null].filter(Boolean).join(', '),
    [sp.hand ? (sp.hand === 'sag' ? 'Sağ el' : 'Sol el') : null, sp.backhand ? (sp.backhand === 'tek' ? 'tek el backhand' : 'çift el backhand') : null].filter(Boolean).join(', '),
    sp.parent_name ? `Veli: ${sp.parent_name}` : null,
  ].filter(Boolean);

  return (
    <Ekran>
      <Stack.Screen options={{ title: '', headerRight: () => <MetinDugme yazi="Düzenle" onPress={() => router.push({ pathname: '/sporcu/duzenle', params: { id } })} /> }} />
      <View style={st.ust}>
        <Avatar ad={basHarfler(sp)} foto={sp.photo} top={sp.ball} boyut={96} yuvarlak={false} />
        <View style={{ flex: 1 }}>
          <Text style={st.ad}>{adSoyad(sp)}</Text>
          {satirlar.map((x) => (
            <Text key={x} style={st.bilgi}>{x}</Text>
          ))}
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
            {sp.active !== 1 ? <Etiket yazi="Pasif" ton="gri" /> : null}
            {sp.tournament === 1 ? <Etiket yazi="Turnuva sporcusu" ton="mavi" /> : null}
          </View>
        </View>
      </View>

      <View style={st.serit}>
        <View style={st.seritKutu}>
          <Text style={st.seritSayi}>{sonBoy ? (sonBoy / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</Text>
          <Text style={st.seritEtiket}>Boy, m</Text>
        </View>
        <View style={[st.seritKutu, st.seritCizgi]}>
          <Text style={st.seritSayi}>{sonKilo ? sonKilo.toLocaleString('tr-TR') : '-'}</Text>
          <Text style={st.seritEtiket}>Kilo, kg</Text>
        </View>
        <View style={[st.seritKutu, st.seritCizgi]}>
          <Text style={st.seritSayi}>{devam === null ? '-' : `%${devam}`}</Text>
          <Text style={st.seritEtiket}>Devam</Text>
        </View>
      </View>

      <View style={st.sekmeler} accessibilityRole="tablist">
        {SEKMELER.map((x) => (
          <Pressable key={x.ad} onPress={() => setSekme(x.ad)} style={[st.sekme, sekme === x.ad && st.sekmeAktif]} accessibilityRole="tab" accessibilityState={{ selected: sekme === x.ad }}>
            <Text style={[st.sekmeYazi, sekme === x.ad && { color: renk.murekkep }]}>{x.yazi}</Text>
          </Pressable>
        ))}
      </View>

      {sekme === 'bilgi' ? (
        <>
          <Bolum>
            {sp.parent_phone ? <Satir baslik={sp.parent_phone} alt={sp.parent_name ? `Veli, ${sp.parent_name}` : 'Veli telefonu'} onPress={() => void Linking.openURL(`tel:${sp.parent_phone}`)} sag={<Text style={st.link}>Ara</Text>} /> : null}
            {sp.phone ? <Satir baslik={sp.phone} alt="Sporcunun telefonu" onPress={() => void Linking.openURL(`tel:${sp.phone}`)} sag={<Text style={st.link}>Ara</Text>} /> : null}
            {tel ? <Satir baslik="WhatsApp'tan yaz" alt={sp.parent_phone ? 'Veliye' : 'Sporcuya'} onPress={() => void Linking.openURL(`https://wa.me/${tel}`)} /> : null}
            {sp.birth_date ? <Satir baslik={uzunTarih(sp.birth_date)} alt="Doğum tarihi" /> : null}
            {sp.started_on ? <Satir baslik={uzunTarih(sp.started_on)} alt={`Tenise başlama, ${Math.max(0, yas(sp.started_on, bugun))} yıl`} /> : null}
            {sp.group_name ? <Satir baslik={sp.group_name} alt="Grup" /> : null}
            {sp.notes ? <Satir baslik="Notlar" alt={sp.notes} son /> : null}
          </Bolum>
          <Bolum baslik="Boy ve kilo" sag={<MetinDugme yazi="Ölçüm ekle" onPress={() => router.push({ pathname: '/olcum', params: { sporcu: id } })} />}>
            {veri.olc.length === 0 ? (
              <Bos yazi="Henüz ölçüm yok. Boy ve kiloyu ara ara girersen gelişimi grafikte görürsün." />
            ) : (
              <>
                <CizgiGrafik genislik={width - 32} birim="cm" noktalar={veri.olc.filter((o) => o.height_cm !== null).map((o) => ({ etiket: kisaTarih(o.date), deger: o.height_cm! }))} />
                <CizgiGrafik genislik={width - 32} birim="kg" noktalar={veri.olc.filter((o) => o.weight_kg !== null).map((o) => ({ etiket: kisaTarih(o.date), deger: o.weight_kg! }))} />
                {[...veri.olc].reverse().map((o, i) => (
                  <Satir
                    key={o.id}
                    baslik={[o.height_cm ? `${o.height_cm} cm` : null, o.weight_kg ? `${o.weight_kg} kg` : null].filter(Boolean).join(', ')}
                    alt={uzunTarih(o.date)}
                    sag={<MetinDugme yazi="Sil" renkYazi={renk.soluk} onPress={() => Alert.alert('Ölçüm silinsin mi?', undefined, [{ text: 'Vazgeç', style: 'cancel' }, { text: 'Sil', style: 'destructive', onPress: () => void olcumSil(db, o.id) }])} />}
                    son={i === veri.olc.length - 1}
                  />
                ))}
              </>
            )}
          </Bolum>
          {veri.tur.length > 0 ? (
            <Bolum baslik="Turnuvalar">
              {veri.tur.map((t, i) => (
                <Satir key={t.id} baslik={t.name} alt={[uzunTarih(t.date), t.result].filter(Boolean).join(', ')} onPress={() => router.push({ pathname: '/turnuva', params: { id: t.id } })} son={i === veri.tur.length - 1} />
              ))}
            </Bolum>
          ) : null}
        </>
      ) : null}

      {sekme === 'gelisim' ? <Gelisim veri={veri} genislik={width - 32} id={id} /> : null}

      {sekme === 'odeme' ? (
        <Bolum sag={undefined}>
          <Dugme yazi="Ödeme ekle" tur="ikincil" onPress={() => router.push({ pathname: '/odeme/duzenle', params: { sporcu: id } })} />
          {veri.od.length === 0 ? (
            <Bos yazi="Bu sporcu için ödeme kaydı yok." />
          ) : (
            veri.od.map((o, i) => {
              const d = DURUM_ETIKETI[odemeDurumu(o, bugun)];
              return (
                <Satir
                  key={o.id}
                  sol={<View style={{ width: 78 }}><Etiket yazi={d.yazi} ton={d.ton} /></View>}
                  baslik={tl(o.amount)}
                  alt={[uzunTarih(o.due_date), o.note].filter(Boolean).join('. ')}
                  onPress={() => router.push({ pathname: '/odeme/duzenle', params: { id: o.id } })}
                  sag={
                    o.paid !== 1 ? (
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <MetinDugme yazi="Ödendi" renkYazi={renk.geldi} onPress={() => void odendiIsaretle(db, o.id, true)} />
                        {tel ? <MetinDugme yazi="Hatırlat" renkYazi={renk.kort} onPress={() => void Linking.openURL(waBaglantisi(tel, odemeHatirlatmaMetni(sp.parent_name, adSoyad(sp), o.amount, o.due_date, veri.hocaAdi)))} /> : null}
                      </View>
                    ) : undefined
                  }
                  son={i === veri.od.length - 1}
                />
              );
            })
          )}
        </Bolum>
      ) : null}

      {sekme === 'yoklama' ? (
        <Bolum>
          {veri.yok.length === 0 ? (
            <Bos yazi="Henüz yoklama kaydı yok. Ders sonunda Bugün ya da Takvim ekranından yoklama alınca burada görünür." />
          ) : (
            <>
              <Text style={st.ozet}>{`${veri.yok.length} dersin ${veri.yok.filter((y) => y.present === 1).length} tanesine geldi.`}</Text>
              {veri.yok.slice(0, 60).map((y, i) => (
                <Satir key={`${y.lesson_id}`} baslik={y.title} alt={uzunTarih(y.date)} sag={y.present === 1 ? <Etiket yazi="Geldi" ton="yesil" /> : <Etiket yazi="Gelmedi" ton="kirmizi" />} son={i === Math.min(veri.yok.length, 60) - 1} />
              ))}
            </>
          )}
        </Bolum>
      ) : null}
    </Ekran>
  );
}

type Veri = { deg: Awaited<ReturnType<typeof degerlendirmeler>>; met: Awaited<ReturnType<typeof metrikler>> };

function Gelisim({ veri, genislik, id }: { veri: Veri; genislik: number; id: string }) {
  const db = useSQLiteContext();
  const [son, onceki] = veri.deg;
  const seriler = [onceki, son].filter((x): x is NonNullable<typeof x> => !!x).map((d, i, a) => ({
    degerler: veri.met.map((m) => d.puanlar.get(m.id) ?? 0),
    renk: i === a.length - 1 ? renk.kort : '#9AA5AF',
  }));
  const degisimler = son && onceki
    ? veri.met
        .map((m) => ({ ad: m.name, once: onceki.puanlar.get(m.id), simdi: son.puanlar.get(m.id) }))
        .filter((x): x is { ad: string; once: number; simdi: number } => x.once !== undefined && x.simdi !== undefined && x.once !== x.simdi)
        .sort((a, b) => b.simdi - b.once - (a.simdi - a.once))
    : [];

  return (
    <Bolum>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Dugme yazi="Değerlendir" tur="ikincil" onPress={() => router.push({ pathname: '/degerlendirme', params: { sporcu: id } })} stil={{ flex: 1 }} />
        {son ? <Dugme yazi="Karneyi paylaş" tur="mavi" onPress={() => router.push({ pathname: '/karne/[id]', params: { id } })} stil={{ flex: 1 }} /> : null}
      </View>
      {!son ? (
        <Bos yazi="Henüz değerlendirme yok. Forehand, backhand, servis gibi metrikleri 1 ile 5 arasında puanla; iki değerlendirmeden sonra gelişim grafikte üst üste görünür." />
      ) : (
        <>
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <Radar etiketler={veri.met.map((m) => m.name)} seriler={seriler} genislik={genislik} />
          </View>
          <View style={st.lejant}>
            {onceki ? <Text style={st.lejantYazi}><Text style={{ color: '#9AA5AF' }}>■ </Text>{kisaTarih(onceki.date)}</Text> : null}
            <Text style={st.lejantYazi}><Text style={{ color: renk.kort }}>■ </Text>{kisaTarih(son.date)}</Text>
          </View>
          {degisimler.map((x, i) => (
            <Satir
              key={x.ad}
              baslik={x.ad}
              sag={<Text style={[st.degisim, { color: x.simdi > x.once ? renk.geldi : renk.gelmedi }]}>{`${x.once} → ${x.simdi}`}</Text>}
              son={i === degisimler.length - 1}
            />
          ))}
          {son.note ? <Text style={[st.ozet, { marginTop: 12 }]}>{son.note}</Text> : null}
          <Text style={[st.altBaslik]}>Değerlendirmeler</Text>
          {veri.deg.map((d, i) => (
            <Satir
              key={d.id}
              baslik={uzunTarih(d.date)}
              alt={d.note}
              sag={<MetinDugme yazi="Sil" renkYazi={renk.soluk} onPress={() => Alert.alert('Değerlendirme silinsin mi?', undefined, [{ text: 'Vazgeç', style: 'cancel' }, { text: 'Sil', style: 'destructive', onPress: () => void degerlendirmeSil(db, d.id) }])} />}
              son={i === veri.deg.length - 1}
            />
          ))}
        </>
      )}
    </Bolum>
  );
}

const st = StyleSheet.create({
  ust: { flexDirection: 'row', gap: 16, alignItems: 'center', paddingHorizontal: 16, paddingTop: 4 },
  ad: { fontFamily: yazi.baslik, fontSize: 24, color: renk.murekkep, lineHeight: 28 },
  bilgi: { fontFamily: yazi.normal, fontSize: 14, color: renk.soluk, marginTop: 3 },
  serit: { flexDirection: 'row', marginHorizontal: 16, marginTop: 18, backgroundColor: renk.beyaz, borderRadius: 16, paddingVertical: 12 },
  seritKutu: { flex: 1, paddingHorizontal: 14 },
  seritCizgi: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: renk.cizgi },
  seritSayi: { fontFamily: yazi.sayi, fontSize: 24, color: renk.murekkep },
  seritEtiket: { fontFamily: yazi.normal, fontSize: 12, color: renk.soluk },
  sekmeler: { flexDirection: 'row', marginHorizontal: 16, marginTop: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: renk.cizgi },
  sekme: { paddingVertical: 10, marginRight: 18, minHeight: 44, justifyContent: 'center' },
  sekmeAktif: { borderBottomWidth: 3, borderBottomColor: renk.kort },
  sekmeYazi: { fontFamily: yazi.yariKalin, fontSize: 15, color: renk.soluk },
  link: { fontFamily: yazi.yariKalin, fontSize: 15, color: renk.kort },
  ozet: { fontFamily: yazi.normal, fontSize: 15, color: renk.soluk, lineHeight: 21, marginBottom: 4 },
  lejant: { flexDirection: 'row', gap: 18, marginBottom: 6 },
  lejantYazi: { fontFamily: yazi.normal, fontSize: 13, color: renk.soluk },
  degisim: { fontFamily: yazi.sayi, fontSize: 17 },
  altBaslik: { fontFamily: yazi.kalin, fontSize: 16, color: renk.murekkep, marginTop: 22 },
});
