import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gunluTarih, tarihMetni } from '@/domain/tarih';
import { adSoyad, basHarfler, sporcuAltYazisi } from '@/domain/tipler';
import { dersAyrintisi, dersIptal, iptaliGeriAl, yoklamaKaydet, type DersAyrintisi, type DersKimligi } from '@/db/veri';
import { Alan, Avatar, Bolum, Bos, Dugme, Ekran, Etiket, MetinDugme, Yukleniyor } from '@/ui/bilesenler';
import { SeritBaslik } from '@/ui/cizimler';
import { renk, yazi } from '@/ui/tema';

export default function YoklamaEkrani() {
  const db = useSQLiteContext();
  const ic = useSafeAreaInsets();
  const p = useLocalSearchParams<{ ders?: string; sablon?: string; tarih: string }>();
  const kimlik: DersKimligi = { lessonId: p.ders || null, templateId: p.sablon || null, tarih: p.tarih };
  const [ayrinti, setAyrinti] = useState<DersAyrintisi | null | undefined>();
  const [durum, setDurum] = useState<Map<string, number>>(new Map());
  const [iptalModu, setIptalModu] = useState(false);
  const [iptalNotu, setIptalNotu] = useState('Yağmur');
  const [kaydediliyor, setKaydediliyor] = useState(false);

  useEffect(() => {
    void dersAyrintisi(db, kimlik).then((a) => {
      setAyrinti(a);
      // Daha önce alınmış yoklama varsa o gösterilir; yoksa herkes geldi kabul edilir, gelmeyenler işaretlenir.
      if (a) setDurum(new Map(a.sporcular.map((s) => [s.id, a.yoklama.get(s.id) ?? 1])));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, p.ders, p.sablon, p.tarih]);

  if (ayrinti === undefined) return <Yukleniyor />;

  const geri = <View style={{ position: 'absolute', top: ic.top + 8, left: 12, zIndex: 2 }}><MetinDugme yazi="Kapat" renkYazi="#fff" onPress={() => router.back()} /></View>;

  if (ayrinti === null) {
    return (
      <Ekran>
        <SeritBaslik ustBosluk={ic.top + 30} baslik="Ders bulunamadı" />
        {geri}
        <Bolum><Bos yazi="Bu ders silinmiş ya da değiştirilmiş olabilir." /></Bolum>
      </Ekran>
    );
  }

  const { olay, sporcular } = ayrinti;
  const gelen = [...durum.values()].filter((v) => v === 1).length;
  const gelmeyen = durum.size - gelen;
  const bugun = tarihMetni(new Date());
  const ileride = olay.date > bugun;

  async function kaydet() {
    setKaydediliyor(true);
    try {
      await yoklamaKaydet(db, kimlik, durum);
      router.back();
    } catch {
      setKaydediliyor(false);
      Alert.alert('Kaydedilemedi', 'Yoklama kaydedilirken bir sorun çıktı, tekrar dene.');
    }
  }

  async function iptalEt() {
    await dersIptal(db, kimlik, iptalNotu.trim() || null);
    router.back();
  }

  const duzenle = () => {
    if (olay.template_id && !olay.lesson_id) router.push({ pathname: '/ders/duzenle', params: { sablon: olay.template_id } });
    else if (olay.lesson_id && !olay.template_id) router.push({ pathname: '/ders/duzenle', params: { ders: olay.lesson_id } });
    else if (olay.template_id) router.push({ pathname: '/ders/duzenle', params: { sablon: olay.template_id } });
  };

  const alt =
    olay.status === 'iptal' ? (
      <View style={{ gap: 10 }}>
        <Dugme yazi="İptali geri al" tur="ikincil" onPress={async () => { if (olay.lesson_id) await iptaliGeriAl(db, olay.lesson_id); router.back(); }} />
        <Dugme yazi="Telafi dersi ekle" onPress={() => router.replace({ pathname: '/ders/duzenle', params: { tarih: telafiTarihi(olay.date), telafi: olay.title } })} />
      </View>
    ) : iptalModu ? (
      <View style={{ gap: 10 }}>
        <Dugme yazi="Dersi iptal et" tur="tehlike" onPress={() => void iptalEt()} />
        <Dugme yazi="Vazgeç" tur="ikincil" onPress={() => setIptalModu(false)} />
      </View>
    ) : sporcular.length > 0 ? (
      <Dugme yazi={olay.status === 'yapildi' ? 'Yoklamayı güncelle' : 'Yoklamayı kaydet'} onPress={() => void kaydet()} mesgul={kaydediliyor} />
    ) : undefined;

  return (
    <Ekran altDugme={alt}>
      <SeritBaslik ustBosluk={ic.top + 30} ust={gunluTarih(olay.date)} baslik={olay.title} alt={[`${olay.start} - ${olay.end}`, olay.court].filter(Boolean).join(', ')} />
      {geri}
      <View style={st.ozet}>
        {olay.status === 'iptal' ? (
          <Etiket yazi={olay.note ? `İptal edildi: ${olay.note}` : 'İptal edildi'} ton="gri" />
        ) : (
          <>
            <Etiket yazi={`${gelen} geldi`} ton="yesil" />
            <Etiket yazi={`${gelmeyen} gelmedi`} ton="kirmizi" />
          </>
        )}
        <View style={{ flex: 1 }} />
        <MetinDugme yazi="Düzenle" onPress={duzenle} />
      </View>

      {iptalModu ? (
        <Bolum stil={{ marginTop: 6 }}>
          <Alan etiket="İptal nedeni" value={iptalNotu} onChangeText={setIptalNotu} maxLength={120} />
        </Bolum>
      ) : null}

      {olay.status !== 'iptal' ? (
        sporcular.length === 0 ? (
          <Bolum><Bos yazi="Bu derse kayıtlı sporcu yok. Düzenle'den sporcu ekle." /></Bolum>
        ) : (
          <View style={{ marginTop: 6 }}>
            {ileride && olay.status === 'planli' ? <Text style={st.uyari}>Bu ders henüz yapılmadı; yoklamayı ders günü alabilirsin.</Text> : null}
            {sporcular.map((s) => {
              const v = durum.get(s.id);
              const ayarla = (d: number) => setDurum(new Map(durum).set(s.id, d));
              return (
                <View key={s.id} style={st.satir}>
                  <Avatar ad={basHarfler(s)} foto={s.photo} top={s.ball} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={st.ad} numberOfLines={1}>{adSoyad(s)}</Text>
                    <Text style={st.alt} numberOfLines={1}>{sporcuAltYazisi(s, bugun)}</Text>
                  </View>
                  <View style={st.ikili}>
                    <Pressable onPress={() => ayarla(1)} style={[st.secim, v === 1 && { backgroundColor: renk.geldi }]} accessibilityRole="radio" accessibilityState={{ checked: v === 1 }} accessibilityLabel={`${adSoyad(s)} geldi`}>
                      <Text style={[st.secimYazi, v === 1 && { color: '#fff' }]}>Geldi</Text>
                    </Pressable>
                    <Pressable onPress={() => ayarla(0)} style={[st.secim, v === 0 && { backgroundColor: renk.gelmedi }]} accessibilityRole="radio" accessibilityState={{ checked: v === 0 }} accessibilityLabel={`${adSoyad(s)} gelmedi`}>
                      <Text style={[st.secimYazi, v === 0 && { color: '#fff' }]}>Gelmedi</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )
      ) : null}

      {olay.status === 'planli' && !iptalModu ? (
        <Bolum>
          <MetinDugme yazi="Dersi iptal et, örneğin yağmur" renkYazi={renk.gelmedi} onPress={() => setIptalModu(true)} />
        </Bolum>
      ) : null}
    </Ekran>
  );
}

/** Telafi dersi için önerilen tarih: iptal edilen gün geçtiyse bugün, değilse o gün. */
function telafiTarihi(tarih: string): string {
  const bugun = tarihMetni(new Date());
  return tarih < bugun ? bugun : tarih;
}

const st = StyleSheet.create({
  ozet: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  uyari: { fontFamily: yazi.normal, fontSize: 14, color: renk.soluk, paddingHorizontal: 16, paddingBottom: 6 },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: renk.cizgi },
  ad: { fontFamily: yazi.yariKalin, fontSize: 16, color: renk.murekkep },
  alt: { fontFamily: yazi.normal, fontSize: 13, color: renk.soluk, marginTop: 1 },
  ikili: { flexDirection: 'row', backgroundColor: renk.gri, borderRadius: 12, padding: 3 },
  secim: { minHeight: 40, paddingHorizontal: 11, borderRadius: 9, justifyContent: 'center' },
  secimYazi: { fontFamily: yazi.yariKalin, fontSize: 14, color: renk.soluk },
});
