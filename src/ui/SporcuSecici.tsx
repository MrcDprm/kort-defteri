import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { adSoyad, basHarfler, type Sporcu } from '@/domain/tipler';
import { Avatar, s as ortak } from './bilesenler';
import { renk, yazi } from './tema';

/** Çoklu sporcu seçimi; grup adına dokununca o gruptakilerin hepsi seçilir. */
export function SporcuSecici({ sporcular, secili, degisti, tekli = false }: { sporcular: Sporcu[]; secili: string[]; degisti: (d: string[]) => void; tekli?: boolean }) {
  const [arama, setArama] = useState('');
  const aktif = sporcular.filter((x) => x.active === 1 || secili.includes(x.id));
  const aranan = arama.trim().toLocaleLowerCase('tr-TR');
  const liste = aktif.filter((x) => !aranan || adSoyad(x).toLocaleLowerCase('tr-TR').includes(aranan));
  const gruplar = tekli ? [] : [...new Set(aktif.map((x) => x.group_name).filter((x): x is string => !!x))];

  const degistir = (id: string) => {
    if (tekli) degisti([id]);
    else degisti(secili.includes(id) ? secili.filter((x) => x !== id) : [...secili, id]);
  };

  if (aktif.length === 0) {
    return <Text style={st.bos}>Önce Sporcular sekmesinden sporcu ekle.</Text>;
  }

  return (
    <View>
      {aktif.length > 6 ? <TextInput value={arama} onChangeText={setArama} placeholder="Sporcu ara" placeholderTextColor="#9AA2AA" style={[ortak.girdi, { marginBottom: 8 }]} autoCorrect={false} /> : null}
      {gruplar.length > 0 ? (
        <View style={st.gruplar}>
          {gruplar.map((g) => (
            <Pressable key={g} onPress={() => degisti([...new Set([...secili, ...aktif.filter((x) => x.group_name === g).map((x) => x.id)])])} style={st.grup} accessibilityRole="button" accessibilityLabel={`${g} grubunun hepsini seç`}>
              <Text style={st.grupYazi}>{`${g}, hepsi`}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {liste.map((x) => {
        const var_ = secili.includes(x.id);
        return (
          <Pressable key={x.id} onPress={() => degistir(x.id)} style={st.satir} accessibilityRole={tekli ? 'radio' : 'checkbox'} accessibilityState={{ checked: var_ }}>
            <Avatar ad={basHarfler(x)} foto={x.photo} top={x.ball} boyut={38} />
            <Text style={st.ad} numberOfLines={1}>{adSoyad(x)}</Text>
            <View style={[st.kutu, var_ && { backgroundColor: renk.kort, borderColor: renk.kort }]}>
              {var_ ? <Text style={st.tik}>✓</Text> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  bos: { fontFamily: yazi.normal, fontSize: 15, color: renk.soluk, paddingVertical: 8 },
  gruplar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  grup: { minHeight: 36, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#E3ECF5', justifyContent: 'center' },
  grupYazi: { fontFamily: yazi.yariKalin, fontSize: 14, color: renk.kort },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: renk.cizgi },
  ad: { flex: 1, fontFamily: yazi.yariKalin, fontSize: 16, color: renk.murekkep },
  kutu: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: '#B9C0B6', alignItems: 'center', justifyContent: 'center' },
  tik: { color: '#fff', fontFamily: yazi.kalin, fontSize: 15, marginTop: -1 },
});
