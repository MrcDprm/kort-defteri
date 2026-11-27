import { router } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { tarihMetni } from '@/domain/tarih';
import { adSoyad, basHarfler, sporcuAltYazisi } from '@/domain/tipler';
import { useVeri } from '@/db/olay';
import { sporcular } from '@/db/veri';
import { sporcuyaGit } from '@/gezinme';
import { Avatar, Bolum, Bos, Ekran, Etiket, MetinDugme, Satir, s, SekmeBasligi, Secenekler, Yukleniyor } from '@/ui/bilesenler';
import { renk } from '@/ui/tema';

export default function Sporcular() {
  const { veri } = useVeri(sporcular);
  const [arama, setArama] = useState('');
  const [grup, setGrup] = useState<string | null>(null);
  const [pasif, setPasif] = useState(false);
  if (!veri) return <Yukleniyor />;

  const bugun = tarihMetni(new Date());
  const gruplar = [...new Set(veri.map((x) => x.group_name).filter((x): x is string => !!x))].sort((a, b) => a.localeCompare(b, 'tr'));
  const aranan = arama.trim().toLocaleLowerCase('tr-TR');
  const liste = veri.filter(
    (x) =>
      (pasif || x.active === 1) &&
      (!grup || x.group_name === grup) &&
      (!aranan || `${adSoyad(x)} ${x.parent_name ?? ''}`.toLocaleLowerCase('tr-TR').includes(aranan)),
  );
  const pasifSayisi = veri.filter((x) => x.active !== 1).length;

  return (
    <Ekran ustBosluk>
      <SekmeBasligi
        baslik="Sporcular"
        sag={
          <View style={{ flexDirection: 'row', gap: 18 }}>
            <MetinDugme yazi="Turnuvalar" onPress={() => router.push('/turnuvalar')} />
            <MetinDugme yazi="Ekle" onPress={() => router.push('/sporcu/duzenle')} />
          </View>
        }
      />
      {veri.length > 0 ? (
        <View style={{ paddingHorizontal: 16 }}>
          <TextInput
            value={arama}
            onChangeText={setArama}
            placeholder="Sporcu ya da veli ara"
            placeholderTextColor="#9AA2AA"
            style={s.girdi}
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
          {gruplar.length > 0 ? (
            <Secenekler secenekler={gruplar.map((g) => ({ deger: g, yazi: g }))} deger={grup} degisti={setGrup} bosOlabilir />
          ) : null}
        </View>
      ) : null}

      <Bolum>
        {veri.length === 0 ? (
          <Bos yazi="Henüz sporcu yok. İlk sporcunu ekleyerek başla; fotoğraf, veli bilgisi ve top evresi sonra da eklenebilir." dugme="Sporcu ekle" onPress={() => router.push('/sporcu/duzenle')} />
        ) : liste.length === 0 ? (
          <Bos yazi="Aramaya uyan sporcu yok." />
        ) : (
          liste.map((x, i) => (
            <Satir
              key={x.id}
              sol={<Avatar ad={basHarfler(x)} foto={x.photo} top={x.ball} />}
              baslik={adSoyad(x)}
              alt={sporcuAltYazisi(x, bugun) || null}
              sag={x.active !== 1 ? <Etiket yazi="Pasif" ton="gri" /> : x.tournament === 1 ? <Etiket yazi="Turnuva" ton="mavi" /> : undefined}
              onPress={() => sporcuyaGit(x.id)}
              son={i === liste.length - 1}
            />
          ))
        )}
        {pasifSayisi > 0 ? (
          <View style={{ marginTop: 12 }}>
            <MetinDugme yazi={pasif ? 'Pasif sporcuları gizle' : `Pasif sporcuları göster, ${pasifSayisi}`} renkYazi={renk.soluk} onPress={() => setPasif(!pasif)} />
          </View>
        ) : null}
      </Bolum>
    </Ekran>
  );
}
