import { router } from 'expo-router';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { waNumarasi } from '@/domain/whatsapp';
import { useVeri } from '@/db/olay';
import { hoca } from '@/db/veri';
import { Avatar, Bolum, Dugme, Ekran, MetinDugme, SekmeBasligi, Yukleniyor } from '@/ui/bilesenler';
import { renk, yazi } from '@/ui/tema';

function instagramAdi(v: string | null): string | null {
  if (!v) return null;
  const ad = v.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/\/.*$/, '');
  return /^[\w.]{1,30}$/.test(ad) ? ad : null;
}

export default function Profilim() {
  const { veri: h } = useVeri(hoca);
  if (!h) return <Yukleniyor />;

  const bos = !h.name && !h.bio;
  const wa = waNumarasi(h.phone);
  const ig = instagramAdi(h.instagram);
  const sertifikalar = (h.certificates ?? '').split('\n').map((x) => x.trim()).filter(Boolean);
  const basHarf = (h.name ?? 'H').split(/\s+/).map((x) => x.charAt(0)).join('').slice(0, 2).toLocaleUpperCase('tr-TR');

  return (
    <Ekran ustBosluk>
      <SekmeBasligi
        baslik="Profilim"
        sag={
          <View style={{ flexDirection: 'row', gap: 18 }}>
            <MetinDugme yazi="Ayarlar" onPress={() => router.push('/ayarlar')} />
            <MetinDugme yazi="Düzenle" onPress={() => router.push('/profil-duzenle')} />
          </View>
        }
      />
      {bos ? (
        <Bolum>
          <Text style={st.metin}>Velilere ve öğrencilere telefonundan göstereceğin sayfa burası. Fotoğrafını, kısa tanıtımını, deneyimini ve sertifikalarını ekle.</Text>
          <Dugme yazi="Profilimi doldur" onPress={() => router.push('/profil-duzenle')} stil={{ marginTop: 16 }} />
        </Bolum>
      ) : (
        <>
          <View style={st.ust}>
            <Avatar ad={basHarf} foto={h.photo} boyut={132} yuvarlak={false} />
            <View style={{ flex: 1 }}>
              <Text style={st.ad}>{h.name}</Text>
              {h.title ? <Text style={st.unvan}>{h.title}</Text> : null}
            </View>
          </View>
          {h.bio ? (
            <Bolum>
              <Text style={st.metin}>{h.bio}</Text>
            </Bolum>
          ) : null}
          {h.experience ? (
            <Bolum baslik="Deneyim">
              <Text style={st.metin}>{h.experience}</Text>
            </Bolum>
          ) : null}
          {sertifikalar.length > 0 ? (
            <Bolum baslik="Sertifikalar">
              {sertifikalar.map((x) => (
                <View key={x} style={st.sertifika}>
                  <View style={st.cizgi} />
                  <Text style={[st.metin, { flex: 1 }]}>{x}</Text>
                </View>
              ))}
            </Bolum>
          ) : null}
          {wa || ig ? (
            <Bolum baslik="İletişim">
              <View style={{ gap: 10 }}>
                {wa ? <Dugme yazi="WhatsApp'tan yaz" tur="mavi" onPress={() => void Linking.openURL(`https://wa.me/${wa}`)} /> : null}
                {ig ? <Dugme yazi={`Instagram: @${ig}`} tur="ikincil" onPress={() => void Linking.openURL(`https://instagram.com/${ig}`)} /> : null}
              </View>
            </Bolum>
          ) : null}
        </>
      )}
      <Text style={st.alt}>© {new Date().getFullYear()} Miraç Deprem</Text>
    </Ekran>
  );
}

const st = StyleSheet.create({
  ust: { flexDirection: 'row', alignItems: 'center', gap: 18, paddingHorizontal: 16, paddingTop: 10 },
  ad: { fontFamily: yazi.baslik, fontSize: 26, color: renk.murekkep, lineHeight: 30 },
  unvan: { fontFamily: yazi.orta, fontSize: 16, color: renk.kort, marginTop: 6 },
  metin: { fontFamily: yazi.normal, fontSize: 16, color: renk.murekkep, lineHeight: 24 },
  sertifika: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  cizgi: { width: 14, height: 3, borderRadius: 2, backgroundColor: renk.kort },
  alt: { fontFamily: yazi.normal, fontSize: 13, color: renk.soluk, textAlign: 'center', marginTop: 36 },
});
