import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, Linking, Text, View } from 'react-native';
import { YedekHatasi } from '@/domain/yedek-semasi';
import { degisti, useVeri } from '@/db/olay';
import { ornekVeriYukle, tumVeriyiSil } from '@/db/ornek-veri';
import { AYAR, ayar, ayarKaydet, bildirimAyarlari } from '@/db/veri';
import { bildirimIzniIste, bildirimleriKur } from '@/bildirim';
import { Alan, Bolum, Dugme, Ekran, Etiket, MetinDugme, SaatAlani, Satir, Secenekler, Yukleniyor } from '@/ui/bilesenler';
import { renk, yazi } from '@/ui/tema';
import { supabase } from '@/yedek/supabase';
import { cikisYap, geriYukle, girisYap, oturum, simdiYedekle, yedekleriListele } from '@/yedek/yedek';

function zamanMetni(iso: string | null): string {
  if (!iso) return 'Henüz yedek alınmadı';
  const d = new Date(iso);
  return `Son yedek ${d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} ${d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
}

function hataMesaji(e: unknown): string {
  if (e instanceof YedekHatasi) return e.message;
  return 'İşlem tamamlanamadı, internet bağlantısını kontrol edip tekrar dene.';
}

export default function Ayarlar() {
  const db = useSQLiteContext();
  const { veri } = useVeri(async (d) => ({
    bildirim: await bildirimAyarlari(d),
    izin: (await Notifications.getPermissionsAsync()).granted,
    sonYedek: await ayar(d, AYAR.sonYedek),
    yedekHatasi: await ayar(d, AYAR.sonYedekHatasi),
    o: await oturum().catch(() => null),
  }));
  const [eposta, setEposta] = useState('');
  const [sifre, setSifre] = useState('');
  const [mesgul, setMesgul] = useState<string | null>(null);
  const [yedekler, setYedekler] = useState<{ ad: string; tarih: Date }[] | null>(null);
  if (!veri) return <Yukleniyor />;

  const bildirimDegisti = async (anahtar: string, deger: string) => {
    await ayarKaydet(db, anahtar, deger);
    await bildirimleriKur(db).catch(() => undefined);
  };

  const izinIste = async () => {
    const verildi = await bildirimIzniIste();
    if (!verildi) {
      Alert.alert('Bildirimler kapalı', 'Ayarlar > Kort Defteri > Bildirimler bölümünden açabilirsin.', [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Ayarları aç', onPress: () => void Linking.openSettings() },
      ]);
    } else {
      await bildirimleriKur(db);
      degisti();
    }
  };

  const islem = async (ad: string, is: () => Promise<void>) => {
    setMesgul(ad);
    try {
      await is();
    } catch (e) {
      Alert.alert('Olmadı', hataMesaji(e));
    } finally {
      setMesgul(null);
    }
  };

  const geriYukleSor = (ad: string, tarih: Date) =>
    Alert.alert(
      'Bu yedek geri yüklensin mi?',
      `${tarih.toLocaleString('tr-TR')} tarihli yedek telefondaki verinin yerine geçer. Telefonda bu tarihten sonra girilen kayıtlar silinir.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Geri yükle', style: 'destructive',
          onPress: () => void islem('geri', async () => {
            await geriYukle(db, ad);
            Alert.alert('Geri yüklendi', 'Veriler yedekten geri geldi.');
            router.dismissAll();
          }),
        },
      ],
    );

  const surum = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Ekran>
      <Stack.Screen options={{ title: 'Ayarlar' }} />
      <Bolum baslik="Bildirimler" stil={{ marginTop: 4 }}>
        {!veri.izin ? (
          <>
            <Text style={{ fontFamily: yazi.normal, fontSize: 15, color: renk.soluk, lineHeight: 21 }}>Sabah özeti ve ders hatırlatmaları için bildirim izni gerekiyor.</Text>
            <Dugme yazi="Bildirimlere izin ver" tur="mavi" onPress={() => void izinIste()} stil={{ marginTop: 12 }} />
          </>
        ) : null}
        <View style={{ flexDirection: 'row' }}>
          <SaatAlani etiket="Sabah özeti saati" deger={veri.bildirim.sabahSaati} degisti={(d) => void bildirimDegisti(AYAR.sabahSaati, d)} />
        </View>
        <Secenekler<number>
          etiket="Ders öncesi hatırlatma"
          secenekler={[{ deger: 0, yazi: 'Kapalı' }, { deger: 15, yazi: '15 dk' }, { deger: 30, yazi: '30 dk' }, { deger: 60, yazi: '1 saat' }]}
          deger={veri.bildirim.dersOncesiDakika}
          degisti={(d) => void bildirimDegisti(AYAR.dersOncesi, String(d ?? 0))}
        />
      </Bolum>

      <Bolum baslik="Performans">
        <Satir baslik="Metrikler" alt="Değerlendirmede puanlanan başlıklar" onPress={() => router.push('/metrikler')} son />
      </Bolum>

      <Bolum baslik="Yedek">
        {!supabase ? (
          <Text style={{ fontFamily: yazi.normal, fontSize: 15, color: renk.soluk, lineHeight: 21 }}>Bu kurulumda yedek ayarlanmamış.</Text>
        ) : !veri.o ? (
          <>
            <Text style={{ fontFamily: yazi.normal, fontSize: 15, color: renk.soluk, lineHeight: 21 }}>
              Giriş yaptığında veriler ve fotoğraflar her değişiklikten sonra kendiliğinden yedeklenir. Telefon değişirse ya da uygulama silinirse aynı hesapla girip geri yüklersin.
            </Text>
            <Alan etiket="E-posta" value={eposta} onChangeText={setEposta} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="username" autoComplete="email" />
            <Alan etiket="Şifre" value={sifre} onChangeText={setSifre} secureTextEntry textContentType="password" autoComplete="password" />
            <Dugme
              yazi="Giriş yap"
              tur="mavi"
              mesgul={mesgul === 'giris'}
              kapali={!eposta.trim() || !sifre}
              stil={{ marginTop: 14 }}
              onPress={() => void islem('giris', async () => {
                await girisYap(eposta, sifre);
                setSifre('');
                await simdiYedekle(db).catch(() => undefined);
                degisti();
              })}
            />
          </>
        ) : (
          <>
            <Satir baslik={veri.o.eposta} alt={zamanMetni(veri.sonYedek)} sag={veri.yedekHatasi ? <Etiket yazi="Sorun var" ton="kirmizi" /> : <Etiket yazi="Açık" ton="yesil" />} />
            {veri.yedekHatasi ? <Text style={{ fontFamily: yazi.normal, fontSize: 14, color: renk.gelmedi, marginTop: 6 }}>{veri.yedekHatasi}</Text> : null}
            <Dugme yazi="Şimdi yedekle" tur="ikincil" mesgul={mesgul === 'yedek'} stil={{ marginTop: 12 }} onPress={() => void islem('yedek', async () => { await simdiYedekle(db); Alert.alert('Yedeklendi'); })} />
            <Dugme yazi="Yedekten geri yükle" tur="ikincil" mesgul={mesgul === 'liste'} stil={{ marginTop: 10 }} onPress={() => void islem('liste', async () => setYedekler(await yedekleriListele()))} />
            {yedekler ? (
              yedekler.length === 0 ? (
                <Text style={{ fontFamily: yazi.normal, fontSize: 15, color: renk.soluk, marginTop: 10 }}>Bu hesapta yedek yok.</Text>
              ) : (
                yedekler.slice(0, 30).map((y, i) => (
                  <Satir key={y.ad} baslik={y.tarih.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} alt={y.tarih.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} sag={<MetinDugme yazi="Geri yükle" onPress={() => geriYukleSor(y.ad, y.tarih)} />} son={i === yedekler.length - 1} />
                ))
              )
            ) : null}
            <View style={{ marginTop: 14 }}>
              <MetinDugme yazi="Çıkış yap" renkYazi={renk.soluk} onPress={() => Alert.alert('Çıkış yapılsın mı?', 'Çıkış yaparsan otomatik yedek durur. Telefondaki veri silinmez.', [{ text: 'Vazgeç', style: 'cancel' }, { text: 'Çıkış yap', onPress: () => void islem('cikis', async () => { await cikisYap(); degisti(); }) }])} />
            </View>
          </>
        )}
      </Bolum>

      {__DEV__ ? (
        <Bolum baslik="Geliştirici">
          <Text style={{ fontFamily: yazi.normal, fontSize: 14, color: renk.soluk, lineHeight: 20 }}>Bu bölüm yalnızca geliştirme sürümünde görünür, hocanın telefonundaki uygulamada yoktur.</Text>
          <Dugme
            yazi="Örnek veri yükle"
            tur="ikincil"
            mesgul={mesgul === 'ornek'}
            stil={{ marginTop: 12 }}
            onPress={() => Alert.alert('Örnek veri yüklensin mi?', '14 sporcu, haftalık program, son üç haftanın yoklaması, ödemeler, değerlendirmeler ve turnuvalar eklenir. Mevcut kayıtlar silinmez.', [
              { text: 'Vazgeç', style: 'cancel' },
              { text: 'Yükle', onPress: () => void islem('ornek', async () => { await ornekVeriYukle(db); router.dismissAll(); }) },
            ])}
          />
          <Dugme
            yazi="Tüm veriyi sil"
            tur="tehlike"
            mesgul={mesgul === 'sil'}
            stil={{ marginTop: 10 }}
            onPress={() => Alert.alert('Tüm veri silinsin mi?', 'Sporcular, dersler, yoklamalar, ödemeler, değerlendirmeler, turnuvalar, profil ve fotoğraflar silinir. Metrikler ve bildirim ayarları kalır. Bu geri alınamaz.', [
              { text: 'Vazgeç', style: 'cancel' },
              { text: 'Sil', style: 'destructive', onPress: () => void islem('sil', async () => { await tumVeriyiSil(db); router.dismissAll(); }) },
            ])}
          />
        </Bolum>
      ) : null}

      <Text style={{ fontFamily: yazi.normal, fontSize: 13, color: renk.soluk, textAlign: 'center', marginTop: 36 }}>
        {`Kort Defteri ${surum}\n© ${new Date().getFullYear()} Miraç Deprem`}
      </Text>
    </Ekran>
  );
}
