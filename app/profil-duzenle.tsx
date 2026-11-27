import { router, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { waNumarasi } from '@/domain/whatsapp';
import { hoca, hocaKaydet } from '@/db/veri';
import { fotoSec, fotoSil } from '@/foto';
import { Alan, Avatar, Bolum, Dugme, Ekran, MetinDugme, Yukleniyor } from '@/ui/bilesenler';
import { renk, yazi } from '@/ui/tema';

export default function ProfilDuzenle() {
  const db = useSQLiteContext();
  const [hazir, setHazir] = useState(false);
  const [ad, setAd] = useState('');
  const [unvan, setUnvan] = useState('');
  const [tanitim, setTanitim] = useState('');
  const [deneyim, setDeneyim] = useState('');
  const [sertifika, setSertifika] = useState('');
  const [telefon, setTelefon] = useState('');
  const [instagram, setInstagram] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [eskiFoto, setEskiFoto] = useState<string | null>(null);
  const [denendi, setDenendi] = useState(false);

  useEffect(() => {
    void hoca(db).then((h) => {
      setAd(h.name ?? ''); setUnvan(h.title ?? ''); setTanitim(h.bio ?? ''); setDeneyim(h.experience ?? ''); setSertifika(h.certificates ?? '');
      setTelefon(h.phone ?? ''); setInstagram(h.instagram ?? ''); setFoto(h.photo); setEskiFoto(h.photo);
      setHazir(true);
    });
  }, [db]);

  if (!hazir) return <Yukleniyor />;
  const telHata = telefon.trim() && !waNumarasi(telefon) ? 'Telefon numarası geçersiz.' : null;
  const bos = (v: string) => v.trim() || null;

  async function kaydet() {
    setDenendi(true);
    if (telHata) return;
    try {
      await hocaKaydet(db, { name: bos(ad), title: bos(unvan), bio: bos(tanitim), experience: bos(deneyim), certificates: bos(sertifika), phone: bos(telefon), instagram: bos(instagram), photo: foto });
      if (eskiFoto && eskiFoto !== foto) fotoSil(eskiFoto);
      router.back();
    } catch {
      Alert.alert('Kaydedilemedi', 'Profil kaydedilirken bir sorun çıktı, tekrar dene.');
    }
  }

  return (
    <Ekran altDugme={<Dugme yazi="Profili kaydet" onPress={() => void kaydet()} />}>
      <Stack.Screen options={{ title: 'Profilini düzenle' }} />
      <Bolum stil={{ marginTop: 4 }}>
        <Pressable onPress={async () => { const f = await fotoSec(); if (f) { if (foto && foto !== eskiFoto) fotoSil(foto); setFoto(f); } }} style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }} accessibilityRole="button">
          <Avatar ad={ad.charAt(0).toLocaleUpperCase('tr-TR') || '+'} foto={foto} boyut={96} yuvarlak={false} />
          <Text style={{ fontFamily: yazi.yariKalin, fontSize: 16, color: renk.kort }}>{foto ? 'Fotoğrafı değiştir' : 'Fotoğraf ekle'}</Text>
        </Pressable>
        {foto ? <View style={{ marginTop: 6 }}><MetinDugme yazi="Fotoğrafı kaldır" renkYazi={renk.soluk} onPress={() => { if (foto !== eskiFoto) fotoSil(foto); setFoto(null); }} /></View> : null}
        <Alan etiket="Ad soyad" value={ad} onChangeText={setAd} autoCapitalize="words" maxLength={80} />
        <Alan etiket="Unvan" value={unvan} onChangeText={setUnvan} placeholder="Örneğin Tenis antrenörü, 2. kademe" maxLength={80} />
        <Alan etiket="Kısa tanıtım" value={tanitim} onChangeText={setTanitim} multiline maxLength={1000} placeholder="Velilere kendini birkaç cümleyle anlat" />
        <Alan etiket="Deneyim" value={deneyim} onChangeText={setDeneyim} multiline maxLength={1500} placeholder="Çalıştığın kulüpler, yıllar, öğrencilerin başarıları" />
        <Alan etiket="Sertifikalar, her satıra bir tane" value={sertifika} onChangeText={setSertifika} multiline maxLength={1500} />
      </Bolum>
      <Bolum baslik="İletişim">
        <Alan etiket="WhatsApp numarası" value={telefon} onChangeText={setTelefon} keyboardType="phone-pad" hata={denendi ? telHata : null} />
        <Alan etiket="Instagram kullanıcı adı" value={instagram} onChangeText={setInstagram} autoCapitalize="none" autoCorrect={false} placeholder="kullaniciadi" maxLength={60} />
      </Bolum>
    </Ekran>
  );
}
