import { router } from 'expo-router';
import type { SQLiteDatabase } from 'expo-sqlite';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { yaklasanDogumGunleri } from '@/domain/dogumgunu';
import { ayOzeti, gecikenler, tl } from '@/domain/odeme';
import { siradakiDers } from '@/domain/program';
import { ayAnahtari, dakikaFarki, GUNLER_KISA, gunluTarih, haftaninGunu, kisaTarih, saatMetni, tarihMetni, tarihSaatten } from '@/domain/tarih';
import { adSoyad, type DersOlayi } from '@/domain/tipler';
import { odemeHatirlatmaMetni, waBaglantisi, waNumarasi } from '@/domain/whatsapp';
import { useVeri } from '@/db/olay';
import { aralikDersleri, AYAR, ayar, hoca, odemeler, sporcular } from '@/db/veri';
import { yoklamayaGit, sporcuyaGit } from '@/gezinme';
import { Bolum, Bos, Dugme, Ekran, Etiket, MetinDugme, Satir, Sayaclar, Yukleniyor } from '@/ui/bilesenler';
import { KortBasligi } from '@/ui/cizimler';
import { renk, yazi } from '@/ui/tema';
import { oturum } from '@/yedek/yedek';

async function yukle(db: SQLiteDatabase) {
  const bugun = tarihMetni(new Date());
  const [sp, od, dersler, h, sonYedek, yedekHatasi, o] = await Promise.all([
    sporcular(db), odemeler(db), aralikDersleri(db, bugun, 1), hoca(db), ayar(db, AYAR.sonYedek), ayar(db, AYAR.sonYedekHatasi), oturum().catch(() => null),
  ]);
  const bugunku = dersler.get(bugun) ?? [];
  const kayitli = bugunku.map((d) => d.lesson_id).filter((x): x is string => !!x);
  const yoklama = kayitli.length
    ? await db.getAllAsync<{ lesson_id: string; present: number }>(`SELECT lesson_id, present FROM attendance WHERE lesson_id IN (${kayitli.map(() => '?').join(',')})`, ...kayitli)
    : [];
  const sayilar = new Map<string, number>();
  for (const d of bugunku) {
    if (d.template_id && !d.lesson_id) {
      const r = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM template_athletes WHERE template_id = ?', d.template_id);
      sayilar.set(d.anahtar, r?.n ?? 0);
    } else if (d.lesson_id) {
      const r = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM lesson_athletes WHERE lesson_id = ?', d.lesson_id);
      sayilar.set(d.anahtar, r?.n ?? 0);
    }
  }
  return { bugun, sp, od, bugunku, yoklama, sayilar, hocaAdi: h.name, sonYedek, yedekHatasi, girisVar: !!o };
}

export default function Bugun() {
  const ic = useSafeAreaInsets();
  const { veri } = useVeri(yukle);
  if (!veri) return <Yukleniyor />;

  const { bugun, sp, od, bugunku, yoklama, sayilar } = veri;
  const simdi = saatMetni(new Date());
  const aktif = sp.filter((s) => s.active === 1);
  const ad = new Map(sp.map((s) => [s.id, s]));
  const ozet = ayOzeti(od, ayAnahtari(bugun));
  const odeyenAktif = new Set(od.filter((o) => o.paid === 1 && ayAnahtari(o.due_date) === ayAnahtari(bugun)).map((o) => o.athlete_id).filter((id) => ad.get(id)?.active === 1)).size;
  const gecerli = bugunku.filter((d) => d.status !== 'iptal');
  const biten = gecerli.filter((d) => d.status === 'yapildi' || d.end <= simdi).length;
  const kalan = gecerli.filter((d) => d.status === 'planli' && d.end > simdi).length;
  const siradaki = siradakiDers(bugunku, simdi);
  const digerleri = bugunku.filter((d) => d.anahtar !== siradaki?.anahtar);
  const dogum = yaklasanDogumGunleri(aktif, bugun, 7);
  const geciken = gecikenler(od, bugun);
  const yedekUyarisi = yedekDurumu(veri.girisVar, veri.sonYedek, veri.yedekHatasi);

  const baslik = gecerli.length === 0 ? 'Bugün ders yok' : `Bugün ${gecerli.length} ders`;
  const alt = gecerli.length === 0 ? undefined : siradaki ? `${biten > 0 ? `${biten} ders bitti, ` : ''}sıradaki ${siradaki.start}` : 'Günün dersleri bitti';

  return (
    <Ekran>
      <KortBasligi ustBosluk={ic.top} ust={gunluTarih(bugun)} baslik={baslik} alt={alt} />
      <Sayaclar
        ogeler={[
          { sayi: String(aktif.length), etiket: 'Aktif sporcu' },
          { sayi: String(odeyenAktif), ek: `/${aktif.length}`, etiket: 'Bu ay ödedi' },
          { sayi: String(aktif.filter((s) => s.tournament === 1).length), etiket: 'Turnuva sporcusu' },
          { sayi: String(kalan), etiket: 'Kalan ders' },
        ]}
      />

      {siradaki ? (
        <SiradakiKart ders={siradaki} simdi={simdi} sayi={sayilar.get(siradaki.anahtar) ?? 0} />
      ) : (
        <View style={st.kart}>
          <Text style={st.kartBaslik}>{bugunku.length === 0 ? 'Bugün için ders yok' : 'Bugünün dersleri tamam'}</Text>
          <Text style={st.kartAlt}>{sp.length === 0 ? 'Başlamak için önce sporcularını ekle, sonra haftalık programı Takvim sekmesinden kur.' : 'Haftalık programı ve tek seferlik dersleri Takvim sekmesinden düzenleyebilirsin.'}</Text>
          {sp.length === 0 ? <Dugme yazi="Sporcu ekle" onPress={() => router.push('/sporcu/duzenle')} stil={{ marginTop: 14 }} /> : null}
        </View>
      )}

      {digerleri.length > 0 ? (
        <Bolum baslik={siradaki ? 'Programın geri kalanı' : 'Bugünün programı'}>
          {digerleri.map((d, i) => (
            <DersSatiri key={d.anahtar} ders={d} sayi={sayilar.get(d.anahtar) ?? 0} yoklama={yoklama.filter((y) => y.lesson_id === d.lesson_id)} son={i === digerleri.length - 1} />
          ))}
        </Bolum>
      ) : null}

      {dogum.length > 0 || geciken.length > 0 || yedekUyarisi ? (
        <Bolum baslik="Dikkat">
          {yedekUyarisi ? (
            <Satir baslik={yedekUyarisi.baslik} alt={yedekUyarisi.alt} sol={<Etiket yazi="Yedek" ton="kirmizi" />} onPress={() => router.push('/ayarlar')} />
          ) : null}
          {dogum.map((d) => (
            <Satir
              key={d.kisi.id}
              sol={<Text style={st.gun}>{d.tarih === bugun ? 'Bugün' : GUNLER_KISA[haftaninGunu(d.tarih) - 1]}</Text>}
              baslik={`${adSoyad(d.kisi)} ${d.yeniYas} yaşına giriyor`}
              alt={`Doğum günü, ${kisaTarih(d.tarih)}`}
              onPress={() => sporcuyaGit(d.kisi.id)}
            />
          ))}
          {geciken.slice(0, 5).map((o) => {
            const s = ad.get(o.athlete_id);
            const numara = waNumarasi(s?.parent_phone ?? s?.phone);
            return (
              <Satir
                key={o.id}
                sol={<Etiket yazi="Gecikti" ton="kirmizi" />}
                baslik={s ? adSoyad(s) : 'Sporcu'}
                alt={`${tl(o.amount)}, ${kisaTarih(o.due_date)}`}
                onPress={() => router.push({ pathname: '/odeme/duzenle', params: { id: o.id } })}
                sag={
                  numara && s ? (
                    <MetinDugme yazi="WhatsApp" renkYazi={renk.geldi} onPress={() => void Linking.openURL(waBaglantisi(numara, odemeHatirlatmaMetni(s.parent_name, adSoyad(s), o.amount, o.due_date, veri.hocaAdi)))} />
                  ) : undefined
                }
              />
            );
          })}
          {geciken.length > 5 ? <MetinDugme yazi={`Tüm gecikmiş ödemeler, ${geciken.length}`} onPress={() => router.push('/odemeler')} /> : null}
        </Bolum>
      ) : null}

      {ozet.bekleyen > 0 || ozet.alinan > 0 ? (
        <Bolum baslik="Bu ay">
          <Satir baslik={`Alınan ${tl(ozet.alinan)}`} alt={`Bekleyen ${tl(ozet.bekleyen)}`} onPress={() => router.push('/odemeler')} son />
        </Bolum>
      ) : null}
    </Ekran>
  );
}

function yedekDurumu(giris: boolean, son: string | null, hata: string | null): { baslik: string; alt: string } | null {
  if (!giris) return { baslik: 'Otomatik yedek kapalı', alt: 'Telefon değişirse ya da uygulama silinirse veri kaybolmasın diye Ayarlar\'dan giriş yap.' };
  if (hata) return { baslik: 'Son yedek alınamadı', alt: hata };
  if (son && Date.now() - new Date(son).getTime() > 3 * 86_400_000) return { baslik: 'Üç gündür yedek alınmadı', alt: 'İnternete bağlanınca yedek kendiliğinden alınır; Ayarlar\'dan elle de alabilirsin.' };
  return null;
}

function SiradakiKart({ ders, simdi, sayi }: { ders: DersOlayi; simdi: string; sayi: number }) {
  const fark = dakikaFarki(new Date(), tarihSaatten(ders.date, ders.start));
  const ne = ders.start <= simdi ? 'Şimdi sürüyor' : fark < 60 ? `${fark} dakika sonra` : `${Math.floor(fark / 60)} saat ${fark % 60 ? `${fark % 60} dakika ` : ''}sonra`;
  const yer = [ders.court, `${sayi} sporcu`].filter(Boolean).join(', ');
  return (
    <View style={st.kart}>
      <View style={st.kartUst}>
        <Text style={st.saat}>{ders.start}</Text>
        <Text style={st.kartAlt}>{ne}</Text>
      </View>
      <Text style={st.kartBaslik} numberOfLines={1}>{ders.title}</Text>
      <Text style={st.kartAlt}>{yer}</Text>
      <Dugme yazi="Yoklamayı aç" onPress={() => yoklamayaGit(ders)} stil={{ marginTop: 14 }} />
    </View>
  );
}

function DersSatiri({ ders, sayi, yoklama, son }: { ders: DersOlayi; sayi: number; yoklama: { present: number }[]; son: boolean }) {
  const yer = [ders.court, `${sayi} sporcu`].filter(Boolean).join(', ');
  const sag =
    ders.status === 'iptal' ? (
      <Etiket yazi="İptal" ton="gri" />
    ) : ders.status === 'yapildi' ? (
      <View style={st.noktalar} accessible accessibilityLabel={`${yoklama.filter((y) => y.present === 1).length} geldi, ${yoklama.filter((y) => y.present !== 1).length} gelmedi`}>
        {yoklama.slice(0, 10).map((y, i) => (
          <View key={i} style={[st.nokta, { backgroundColor: y.present === 1 ? renk.geldi : renk.gelmedi }]} />
        ))}
      </View>
    ) : undefined;
  return (
    <Satir
      sol={<Text style={[st.satirSaat, ders.status !== 'planli' && { color: renk.soluk }]}>{ders.start}</Text>}
      baslik={ders.title}
      alt={ders.status === 'iptal' && ders.note ? `${yer}. ${ders.note}` : yer}
      sag={sag}
      onPress={() => yoklamayaGit(ders)}
      son={son}
    />
  );
}

const st = StyleSheet.create({
  kart: { marginHorizontal: 16, marginTop: 18, padding: 16, backgroundColor: renk.beyaz, borderRadius: 18 },
  kartUst: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  saat: { fontFamily: yazi.sayi, fontSize: 40, color: renk.murekkep },
  kartBaslik: { fontFamily: yazi.kalin, fontSize: 19, color: renk.murekkep, marginTop: 6 },
  kartAlt: { fontFamily: yazi.normal, fontSize: 14, color: renk.soluk, marginTop: 2, lineHeight: 20 },
  satirSaat: { fontFamily: yazi.sayi, fontSize: 20, color: renk.murekkep, width: 54 },
  gun: { fontFamily: yazi.sayi, fontSize: 16, color: renk.murekkep, width: 54 },
  noktalar: { flexDirection: 'row', gap: 3, maxWidth: 110, flexWrap: 'wrap', justifyContent: 'flex-end' },
  nokta: { width: 8, height: 8, borderRadius: 4 },
});
