import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { gunEkle, GUNLER, haftaBasi, kisaTarih, tarihMetni } from '@/domain/tarih';
import { useVeri } from '@/db/olay';
import { aralikDersleri, sablonlar } from '@/db/veri';
import { yoklamayaGit } from '@/gezinme';
import { Bolum, Bos, Ekran, Etiket, MetinDugme, Satir, SekmeBasligi, Yukleniyor } from '@/ui/bilesenler';
import { renk, yazi } from '@/ui/tema';

export default function Takvim() {
  const bugun = tarihMetni(new Date());
  const [hafta, setHafta] = useState(haftaBasi(bugun));
  const { veri } = useVeri(async (db) => ({ gunler: await aralikDersleri(db, hafta, 7), sablon: await sablonlar(db) }), [hafta]);
  if (!veri) return <Yukleniyor />;

  const toplam = [...veri.gunler.values()].reduce((t, g) => t + g.filter((d) => d.status !== 'iptal').length, 0);
  const buHafta = hafta === haftaBasi(bugun);

  return (
    <Ekran ustBosluk>
      <SekmeBasligi baslik="Takvim" sag={<MetinDugme yazi="Ders ekle" onPress={() => router.push('/ders/duzenle')} />} />
      <View style={st.haftaCubugu}>
        <MetinDugme yazi="Önceki" onPress={() => setHafta(gunEkle(hafta, -7))} />
        <View style={{ alignItems: 'center' }}>
          <Text style={st.haftaYazi}>{`${kisaTarih(hafta)} - ${kisaTarih(gunEkle(hafta, 6))}`}</Text>
          <Text style={st.haftaAlt}>{buHafta ? `Bu hafta, ${toplam} ders` : `${toplam} ders`}</Text>
        </View>
        <MetinDugme yazi="Sonraki" onPress={() => setHafta(gunEkle(hafta, 7))} />
      </View>
      {!buHafta ? (
        <View style={{ alignItems: 'center', marginTop: 4 }}>
          <MetinDugme yazi="Bu haftaya dön" renkYazi={renk.soluk} onPress={() => setHafta(haftaBasi(bugun))} />
        </View>
      ) : null}

      {[...veri.gunler.entries()].map(([gun, dersler], i) => (
        <Bolum
          key={gun}
          baslik={`${GUNLER[i]}, ${kisaTarih(gun)}`}
          sag={gun === bugun ? <Etiket yazi="Bugün" ton="mavi" /> : <MetinDugme yazi="Ekle" renkYazi={renk.soluk} onPress={() => router.push({ pathname: '/ders/duzenle', params: { tarih: gun } })} />}
          stil={{ marginTop: 18 }}
        >
          {dersler.length === 0 ? (
            <Text style={st.bos}>Ders yok</Text>
          ) : (
            dersler.map((d, j) => (
              <Satir
                key={d.anahtar}
                sol={<Text style={[st.saat, d.status === 'iptal' && { color: renk.soluk, textDecorationLine: 'line-through' }]}>{d.start}</Text>}
                baslik={d.title}
                alt={[d.court, d.template_id ? null : 'Tek seferlik', d.status === 'iptal' ? d.note : null].filter(Boolean).join(', ') || null}
                sag={d.status === 'iptal' ? <Etiket yazi="İptal" ton="gri" /> : d.status === 'yapildi' ? <Etiket yazi="Yoklama alındı" ton="yesil" /> : undefined}
                onPress={() => yoklamayaGit(d)}
                son={j === dersler.length - 1}
              />
            ))
          )}
        </Bolum>
      ))}

      <Bolum baslik="Haftalık program">
        {veri.sablon.length === 0 ? (
          <Bos yazi="Her hafta tekrar eden grup ve özel dersleri bir kez ekle, takvim her haftaya kendiliğinden yerleştirsin." dugme="Haftalık ders ekle" onPress={() => router.push('/ders/duzenle')} />
        ) : (
          veri.sablon.map((x, i) => (
            <Satir
              key={x.id}
              sol={<Text style={st.gunKisa}>{GUNLER[x.weekday - 1]?.slice(0, 3)}</Text>}
              baslik={x.title}
              alt={[`${x.start} - ${x.end}`, x.court, x.kind === 'ozel' ? 'Özel ders' : 'Grup dersi'].filter(Boolean).join(', ')}
              sag={x.active !== 1 ? <Etiket yazi="Durduruldu" ton="gri" /> : undefined}
              onPress={() => router.push({ pathname: '/ders/duzenle', params: { sablon: x.id } })}
              son={i === veri.sablon.length - 1}
            />
          ))
        )}
      </Bolum>
    </Ekran>
  );
}

const st = StyleSheet.create({
  haftaCubugu: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8, marginHorizontal: 16, backgroundColor: renk.beyaz, borderRadius: 14 },
  haftaYazi: { fontFamily: yazi.kalin, fontSize: 16, color: renk.murekkep },
  haftaAlt: { fontFamily: yazi.normal, fontSize: 13, color: renk.soluk, marginTop: 2 },
  saat: { fontFamily: yazi.sayi, fontSize: 20, color: renk.murekkep, width: 54 },
  gunKisa: { fontFamily: yazi.sayi, fontSize: 17, color: renk.murekkep, width: 54 },
  bos: { fontFamily: yazi.normal, fontSize: 14, color: renk.soluk, paddingVertical: 8 },
});
