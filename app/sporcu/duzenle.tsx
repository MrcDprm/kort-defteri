import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { sayiOku } from '@/domain/sayi';
import { tarihMetni } from '@/domain/tarih';
import type { Backhand, El, TopEvresi } from '@/domain/tipler';
import { TOP_ADLARI } from '@/domain/tipler';
import { waNumarasi } from '@/domain/whatsapp';
import { gruplar, olcumEkle, sporcu, sporcuKaydet, sporcuSil } from '@/db/veri';
import { fotoSec, fotoSil } from '@/foto';
import { Alan, Anahtar, Avatar, Bolum, Dugme, Ekran, MetinDugme, Secenekler, TarihAlani, Yukleniyor } from '@/ui/bilesenler';
import { renk, yazi } from '@/ui/tema';
import { Top } from '@/ui/Top';

const TOPLAR: TopEvresi[] = ['kirmizi', 'turuncu', 'yesil', 'sari'];

export default function SporcuDuzenle() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [hazir, setHazir] = useState(!id);
  const [ad, setAd] = useState('');
  const [soyad, setSoyad] = useState('');
  const [dogum, setDogum] = useState<string | null>(null);
  const [top, setTop] = useState<TopEvresi | null>(null);
  const [el, setEl] = useState<El | null>(null);
  const [backhand, setBackhand] = useState<Backhand | null>(null);
  const [grup, setGrup] = useState('');
  const [baslama, setBaslama] = useState<string | null>(null);
  const [telefon, setTelefon] = useState('');
  const [veli, setVeli] = useState('');
  const [veliTel, setVeliTel] = useState('');
  const [turnuva, setTurnuva] = useState(false);
  const [aktif, setAktif] = useState(true);
  const [not, setNot] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [eskiFoto, setEskiFoto] = useState<string | null>(null);
  const [boy, setBoy] = useState('');
  const [kilo, setKilo] = useState('');
  const [mevcutGruplar, setMevcutGruplar] = useState<string[]>([]);
  const [denendi, setDenendi] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  useEffect(() => {
    void gruplar(db).then(setMevcutGruplar);
    if (!id) return;
    void sporcu(db, id).then((x) => {
      if (!x) return;
      setAd(x.first_name); setSoyad(x.last_name); setDogum(x.birth_date); setTop(x.ball); setEl(x.hand); setBackhand(x.backhand);
      setGrup(x.group_name ?? ''); setBaslama(x.started_on); setTelefon(x.phone ?? ''); setVeli(x.parent_name ?? ''); setVeliTel(x.parent_phone ?? '');
      setTurnuva(x.tournament === 1); setAktif(x.active === 1); setNot(x.notes ?? ''); setFoto(x.photo); setEskiFoto(x.photo);
      setHazir(true);
    });
  }, [db, id]);

  if (!hazir) return <Yukleniyor />;

  const hatalar = {
    ad: !ad.trim() ? 'Ad gerekli.' : null,
    soyad: !soyad.trim() ? 'Soyad gerekli.' : null,
    telefon: telefon.trim() && !waNumarasi(telefon) ? 'Telefon numarası geçersiz.' : null,
    veliTel: veliTel.trim() && !waNumarasi(veliTel) ? 'Telefon numarası geçersiz.' : null,
    boy: sayiOku(boy, 50, 230) === 'hata' ? 'Boy 50 ile 230 cm arasında olmalı.' : null,
    kilo: sayiOku(kilo, 10, 200) === 'hata' ? 'Kilo 10 ile 200 kg arasında olmalı.' : null,
  };
  const gecerli = Object.values(hatalar).every((h) => !h);
  const goster = (h: string | null) => (denendi ? h : null);
  const bosIse = (v: string) => (v.trim() ? v.trim() : null);

  async function kaydet() {
    setDenendi(true);
    if (!gecerli) return;
    setKaydediliyor(true);
    try {
      const yeniId = await sporcuKaydet(db, id ?? null, {
        first_name: ad.trim(), last_name: soyad.trim(), parent_name: bosIse(veli), phone: bosIse(telefon), parent_phone: bosIse(veliTel),
        birth_date: dogum, ball: top, hand: el, backhand, group_name: bosIse(grup), started_on: baslama, photo: foto,
        active: aktif ? 1 : 0, tournament: turnuva ? 1 : 0, notes: bosIse(not),
      });
      const b = sayiOku(boy, 50, 230);
      const k = sayiOku(kilo, 10, 200);
      if (!id && (typeof b === 'number' || typeof k === 'number')) {
        await olcumEkle(db, { athlete_id: yeniId, date: tarihMetni(new Date()), height_cm: typeof b === 'number' ? b : null, weight_kg: typeof k === 'number' ? k : null });
      }
      if (eskiFoto && eskiFoto !== foto) fotoSil(eskiFoto);
      router.back();
    } catch {
      Alert.alert('Kaydedilemedi', 'Sporcu kaydedilirken bir sorun çıktı, tekrar dene.');
      setKaydediliyor(false);
    }
  }

  function sil() {
    if (!id) return;
    Alert.alert('Sporcu silinsin mi?', `${ad} ${soyad} ve ona ait ödeme, yoklama, ölçüm ve değerlendirme kayıtları silinir. Bu geri alınamaz. Sporcu bıraktıysa silmek yerine pasif yapabilirsin.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => {
          await sporcuSil(db, id);
          fotoSil(eskiFoto);
          router.dismissTo('/sporcular');
        },
      },
    ]);
  }

  return (
    <Ekran altDugme={<Dugme yazi={id ? 'Değişiklikleri kaydet' : 'Sporcuyu kaydet'} onPress={() => void kaydet()} mesgul={kaydediliyor} />}>
      <Stack.Screen options={{ title: id ? 'Sporcuyu düzenle' : 'Yeni sporcu' }} />
      <Bolum stil={{ marginTop: 8 }}>
        <Pressable onPress={async () => { const f = await fotoSec(); if (f) { if (foto && foto !== eskiFoto) fotoSil(foto); setFoto(f); } }} style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }} accessibilityRole="button" accessibilityLabel="Fotoğraf ekle">
          <Avatar ad={`${ad.charAt(0)}${soyad.charAt(0)}`.toLocaleUpperCase('tr-TR') || '+'} foto={foto} boyut={84} yuvarlak={false} top={top} />
          <Text style={{ fontFamily: yazi.yariKalin, fontSize: 16, color: renk.kort }}>{foto ? 'Fotoğrafı değiştir' : 'Fotoğraf ekle'}</Text>
        </Pressable>
        {foto ? <View style={{ marginTop: 6 }}><MetinDugme yazi="Fotoğrafı kaldır" renkYazi={renk.soluk} onPress={() => { if (foto !== eskiFoto) fotoSil(foto); setFoto(null); }} /></View> : null}

        <Alan etiket="Ad" value={ad} onChangeText={setAd} autoCapitalize="words" maxLength={60} hata={goster(hatalar.ad)} />
        <Alan etiket="Soyad" value={soyad} onChangeText={setSoyad} autoCapitalize="words" maxLength={60} hata={goster(hatalar.soyad)} />
        <TarihAlani etiket="Doğum tarihi" deger={dogum} degisti={setDogum} bosOlabilir />
        <Secenekler<TopEvresi>
          etiket="Oynadığı top"
          secenekler={TOPLAR.map((t) => ({ deger: t, yazi: TOP_ADLARI[t].replace(' top', ''), sol: <Top evre={t} boyut={18} /> }))}
          deger={top}
          degisti={setTop}
          bosOlabilir
        />
        <Secenekler<El> etiket="Oynadığı el" secenekler={[{ deger: 'sag', yazi: 'Sağ el' }, { deger: 'sol', yazi: 'Sol el' }]} deger={el} degisti={setEl} bosOlabilir />
        <Secenekler<Backhand> etiket="Backhand" secenekler={[{ deger: 'tek', yazi: 'Tek el' }, { deger: 'cift', yazi: 'Çift el' }]} deger={backhand} degisti={setBackhand} bosOlabilir />
        <Alan etiket="Grup" value={grup} onChangeText={setGrup} placeholder="Örneğin Performans grubu" maxLength={60} />
        {mevcutGruplar.length > 0 ? (
          <Secenekler secenekler={mevcutGruplar.map((g) => ({ deger: g, yazi: g }))} deger={grup || null} degisti={(g) => setGrup(g ?? '')} bosOlabilir />
        ) : null}
        <TarihAlani etiket="Tenise başlama tarihi" deger={baslama} degisti={setBaslama} bosOlabilir />
        {!id ? (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><Alan etiket="Boy, cm" value={boy} onChangeText={setBoy} keyboardType="decimal-pad" hata={goster(hatalar.boy)} /></View>
            <View style={{ flex: 1 }}><Alan etiket="Kilo, kg" value={kilo} onChangeText={setKilo} keyboardType="decimal-pad" hata={goster(hatalar.kilo)} /></View>
          </View>
        ) : null}
      </Bolum>

      <Bolum baslik="İletişim">
        <Alan etiket="Sporcunun telefonu" value={telefon} onChangeText={setTelefon} keyboardType="phone-pad" textContentType="telephoneNumber" hata={goster(hatalar.telefon)} />
        <Alan etiket="Veli adı soyadı" value={veli} onChangeText={setVeli} autoCapitalize="words" maxLength={80} />
        <Alan etiket="Veli telefonu" value={veliTel} onChangeText={setVeliTel} keyboardType="phone-pad" textContentType="telephoneNumber" hata={goster(hatalar.veliTel)} />
      </Bolum>

      <Bolum baslik="Durum">
        <Anahtar etiket="Turnuva sporcusu" deger={turnuva} degisti={setTurnuva} />
        <Anahtar etiket="Aktif, derslere devam ediyor" deger={aktif} degisti={setAktif} />
        <Alan etiket="Notlar" value={not} onChangeText={setNot} multiline maxLength={2000} />
        {denendi && !gecerli ? <Text style={{ fontFamily: yazi.orta, color: renk.gelmedi, marginTop: 12 }}>Kırmızı işaretli alanları düzelt.</Text> : null}
        {id ? <Dugme yazi="Sporcuyu sil" tur="tehlike" onPress={sil} stil={{ marginTop: 28 }} /> : null}
      </Bolum>
    </Ekran>
  );
}
