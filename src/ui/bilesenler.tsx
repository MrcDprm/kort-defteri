import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'react-native';
import type { ReactNode } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tarihMetni, tarihten, saatMetni } from '@/domain/tarih';
import type { TopEvresi } from '@/domain/tipler';
import { fotoAdresi } from '@/foto';
import { renk, yazi } from './tema';
import { Top } from './Top';

export function Ekran({ children, altDugme, ustBosluk = false, kaydir = true }: { children: ReactNode; altDugme?: ReactNode; ustBosluk?: boolean; kaydir?: boolean }) {
  const ic = useSafeAreaInsets();
  const icerik = kaydir ? (
    <ScrollView contentContainerStyle={{ paddingTop: ustBosluk ? ic.top : 0, paddingBottom: 32 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
      {children}
    </ScrollView>
  ) : (
    <View style={{ flex: 1, paddingTop: ustBosluk ? ic.top : 0 }}>{children}</View>
  );
  return (
    <KeyboardAvoidingView style={s.ekran} behavior="padding">
      {icerik}
      {altDugme ? <View style={[s.alt, { paddingBottom: Math.max(ic.bottom, 12) }]}>{altDugme}</View> : null}
    </KeyboardAvoidingView>
  );
}

export function SekmeBasligi({ baslik, sag }: { baslik: string; sag?: ReactNode }) {
  return (
    <View style={s.sekmeBasligi}>
      <Text style={s.sekmeBaslikYazi} accessibilityRole="header">{baslik}</Text>
      {sag}
    </View>
  );
}

export function Bolum({ baslik, sag, children, stil }: { baslik?: string; sag?: ReactNode; children: ReactNode; stil?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.bolum, stil]}>
      {baslik ? (
        <View style={s.bolumUst}>
          <Text style={s.bolumBaslik} accessibilityRole="header">{baslik}</Text>
          {sag}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function Satir({ sol, baslik, alt, sag, onPress, son = false }: { sol?: ReactNode; baslik: string; alt?: string | null; sag?: ReactNode; onPress?: () => void; son?: boolean }) {
  const icerik = (
    <>
      {sol}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.satirBaslik} numberOfLines={1}>{baslik}</Text>
        {alt ? <Text style={s.satirAlt} numberOfLines={2}>{alt}</Text> : null}
      </View>
      {sag}
    </>
  );
  const stil = [s.satir, !son && s.satirCizgi];
  return onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => [...stil, pressed && { opacity: 0.6 }]} accessibilityRole="button">
      {icerik}
    </Pressable>
  ) : (
    <View style={stil}>{icerik}</View>
  );
}

type DugmeTuru = 'ana' | 'ikincil' | 'tehlike' | 'mavi';

export function Dugme({ yazi: metin, onPress, tur = 'ana', mesgul = false, kapali = false, stil }: { yazi: string; onPress: () => void; tur?: DugmeTuru; mesgul?: boolean; kapali?: boolean; stil?: StyleProp<ViewStyle> }) {
  const zemin = { ana: renk.top, ikincil: renk.gri, tehlike: renk.gelmediZemin, mavi: renk.kort }[tur];
  const renkYazi = { ana: renk.murekkep, ikincil: renk.murekkep, tehlike: renk.gelmedi, mavi: renk.beyaz }[tur];
  return (
    <Pressable
      onPress={onPress}
      disabled={kapali || mesgul}
      accessibilityRole="button"
      accessibilityState={{ disabled: kapali || mesgul, busy: mesgul }}
      style={({ pressed }) => [s.dugme, { backgroundColor: zemin, opacity: kapali ? 0.45 : pressed ? 0.75 : 1 }, stil]}
    >
      {mesgul ? <ActivityIndicator color={renkYazi} /> : <Text style={[s.dugmeYazi, { color: renkYazi }]}>{metin}</Text>}
    </Pressable>
  );
}

/** Küçük metin düğmesi, örneğin başlık yanındaki Ekle. */
export function MetinDugme({ yazi: metin, onPress, renkYazi = renk.kort }: { yazi: string; onPress: () => void; renkYazi?: string }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button" style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, paddingVertical: 4 })}>
      <Text style={{ fontFamily: yazi.yariKalin, fontSize: 16, color: renkYazi }}>{metin}</Text>
    </Pressable>
  );
}

export type EtiketTonu = 'yesil' | 'kirmizi' | 'sari' | 'gri' | 'mavi';

export function Etiket({ yazi: metin, ton }: { yazi: string; ton: EtiketTonu }) {
  const t = {
    yesil: [renk.geldiZemin, renk.geldi],
    kirmizi: [renk.gelmediZemin, renk.gelmedi],
    sari: [renk.bekliyorZemin, renk.bekliyor],
    gri: [renk.gri, renk.soluk],
    mavi: ['#E3ECF5', renk.kort],
  }[ton];
  return (
    <View style={[s.etiket, { backgroundColor: t[0] }]}>
      <Text style={[s.etiketYazi, { color: t[1] }]}>{metin}</Text>
    </View>
  );
}

export function Alan({ etiket, hata, ...p }: TextInputProps & { etiket: string; hata?: string | null }) {
  return (
    <View style={s.alan}>
      <Text style={s.alanEtiket}>{etiket}</Text>
      <TextInput placeholderTextColor="#9AA2AA" {...p} style={[s.girdi, p.multiline && { minHeight: 96, textAlignVertical: 'top', paddingTop: 12 }, hata ? { borderColor: renk.gelmedi } : null]} />
      {hata ? <Text style={s.hata}>{hata}</Text> : null}
    </View>
  );
}

export function Secenekler<T extends string | number>({ etiket, secenekler, deger, degisti, bosOlabilir = false }: { etiket?: string; secenekler: { deger: T; yazi: string; sol?: ReactNode }[]; deger: T | null; degisti: (d: T | null) => void; bosOlabilir?: boolean }) {
  return (
    <View style={s.alan}>
      {etiket ? <Text style={s.alanEtiket}>{etiket}</Text> : null}
      <View style={s.secenekler}>
        {secenekler.map((x) => {
          const secili = x.deger === deger;
          return (
            <Pressable
              key={String(x.deger)}
              onPress={() => degisti(secili && bosOlabilir ? null : x.deger)}
              accessibilityRole="radio"
              accessibilityState={{ checked: secili }}
              style={[s.secenek, secili && s.secenekSecili]}
            >
              {x.sol}
              <Text style={[s.secenekYazi, secili && { color: renk.beyaz }]}>{x.yazi}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Anahtar({ etiket, deger, degisti }: { etiket: string; deger: boolean; degisti: (d: boolean) => void }) {
  return (
    <Pressable onPress={() => degisti(!deger)} style={s.anahtar} accessibilityRole="switch" accessibilityState={{ checked: deger }}>
      <Text style={s.anahtarYazi}>{etiket}</Text>
      <View style={[s.anahtarKutu, deger && { backgroundColor: renk.kort }]}>
        <View style={[s.anahtarTop, deger && { transform: [{ translateX: 20 }] }]} />
      </View>
    </Pressable>
  );
}

export function TarihAlani({ etiket, deger, degisti, bosOlabilir = false }: { etiket: string; deger: string | null; degisti: (d: string | null) => void; bosOlabilir?: boolean }) {
  return (
    <View style={s.alan}>
      <Text style={s.alanEtiket}>{etiket}</Text>
      <View style={s.tarihSatir}>
        {deger ? (
          <DateTimePicker
            value={tarihten(deger)}
            mode="date"
            display="compact"
            locale="tr-TR"
            accentColor={renk.kort}
            onChange={(_, d) => d && degisti(tarihMetni(d))}
          />
        ) : (
          <MetinDugme yazi="Tarih seç" onPress={() => degisti(tarihMetni(new Date()))} />
        )}
        {bosOlabilir && deger ? <MetinDugme yazi="Temizle" renkYazi={renk.soluk} onPress={() => degisti(null)} /> : null}
      </View>
    </View>
  );
}

export function SaatAlani({ etiket, deger, degisti }: { etiket: string; deger: string; degisti: (d: string) => void }) {
  const [sa, dk] = deger.split(':').map(Number);
  const d = new Date();
  d.setHours(sa ?? 10, dk ?? 0, 0, 0);
  return (
    <View style={[s.alan, { flex: 1 }]}>
      <Text style={s.alanEtiket}>{etiket}</Text>
      <View style={s.tarihSatir}>
        <DateTimePicker value={d} mode="time" display="compact" locale="tr-TR" minuteInterval={5} accentColor={renk.kort} onChange={(_, y) => y && degisti(saatMetni(y))} />
      </View>
    </View>
  );
}

export function Avatar({ ad, foto, top, boyut = 46, yuvarlak = true }: { ad: string; foto?: string | null; top?: TopEvresi | null; boyut?: number; yuvarlak?: boolean }) {
  const uri = fotoAdresi(foto);
  const yaricap = yuvarlak ? boyut / 2 : boyut * 0.28;
  return (
    <View style={{ width: boyut, height: boyut }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: boyut, height: boyut, borderRadius: yaricap, backgroundColor: renk.gri }} accessibilityIgnoresInvertColors />
      ) : (
        <View style={{ width: boyut, height: boyut, borderRadius: yaricap, backgroundColor: '#DDE3DA', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: yazi.kalin, fontSize: boyut * 0.33, color: '#56635A' }}>{ad}</Text>
        </View>
      )}
      {top ? (
        <View style={{ position: 'absolute', right: -3, bottom: -3 }}>
          <Top evre={top} boyut={Math.max(16, boyut * 0.38)} />
        </View>
      ) : null}
    </View>
  );
}

export function Bos({ yazi: metin, dugme, onPress }: { yazi: string; dugme?: string; onPress?: () => void }) {
  return (
    <View style={s.bos}>
      <Text style={s.bosYazi}>{metin}</Text>
      {dugme && onPress ? <Dugme yazi={dugme} onPress={onPress} tur="ikincil" stil={{ alignSelf: 'flex-start', paddingHorizontal: 18 }} /> : null}
    </View>
  );
}

export function Yukleniyor() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <ActivityIndicator color={renk.kort} />
    </View>
  );
}

export function Sayaclar({ ogeler }: { ogeler: { sayi: string; ek?: string; etiket: string }[] }) {
  return (
    <View style={s.sayaclar}>
      {ogeler.map((o, i) => (
        <View key={o.etiket} style={[s.sayac, i > 0 && s.sayacCizgi]} accessible accessibilityLabel={`${o.etiket}: ${o.sayi}${o.ek ?? ''}`}>
          <Text style={s.sayacSayi} numberOfLines={1} adjustsFontSizeToFit>
            {o.sayi}
            {o.ek ? <Text style={s.sayacEk}>{o.ek}</Text> : null}
          </Text>
          <Text style={s.sayacEtiket} numberOfLines={2}>{o.etiket}</Text>
        </View>
      ))}
    </View>
  );
}

export const s = StyleSheet.create({
  ekran: { flex: 1, backgroundColor: renk.kirec },
  alt: { paddingHorizontal: 16, paddingTop: 10, backgroundColor: renk.kirec, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: renk.cizgi },
  sekmeBasligi: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  sekmeBaslikYazi: { fontFamily: yazi.baslik, fontSize: 30, color: renk.murekkep, letterSpacing: -0.3 },
  bolum: { marginTop: 22, paddingHorizontal: 16 },
  bolumUst: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  bolumBaslik: { fontFamily: yazi.kalin, fontSize: 18, color: renk.murekkep },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, minHeight: 56 },
  satirCizgi: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: renk.cizgi },
  satirBaslik: { fontFamily: yazi.yariKalin, fontSize: 16, color: renk.murekkep },
  satirAlt: { fontFamily: yazi.normal, fontSize: 14, color: renk.soluk, marginTop: 2 },
  dugme: { minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  dugmeYazi: { fontFamily: yazi.kalin, fontSize: 17 },
  etiket: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  etiketYazi: { fontFamily: yazi.yariKalin, fontSize: 13 },
  alan: { marginTop: 14 },
  alanEtiket: { fontFamily: yazi.yariKalin, fontSize: 14, color: renk.soluk, marginBottom: 6 },
  girdi: { minHeight: 50, borderRadius: 12, borderWidth: 1, borderColor: renk.cizgi, backgroundColor: renk.beyaz, paddingHorizontal: 14, fontFamily: yazi.normal, fontSize: 17, color: renk.murekkep },
  hata: { fontFamily: yazi.orta, fontSize: 13, color: renk.gelmedi, marginTop: 4 },
  secenekler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  secenek: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 14, borderRadius: 12, backgroundColor: renk.gri },
  secenekSecili: { backgroundColor: renk.kort },
  secenekYazi: { fontFamily: yazi.yariKalin, fontSize: 15, color: renk.murekkep },
  anahtar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52, marginTop: 10 },
  anahtarYazi: { fontFamily: yazi.yariKalin, fontSize: 16, color: renk.murekkep, flex: 1, paddingRight: 12 },
  anahtarKutu: { width: 50, height: 30, borderRadius: 15, backgroundColor: '#C9CEC6', padding: 3 },
  anahtarTop: { width: 24, height: 24, borderRadius: 12, backgroundColor: renk.beyaz },
  tarihSatir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  bos: { paddingVertical: 18, gap: 12 },
  bosYazi: { fontFamily: yazi.normal, fontSize: 15, color: renk.soluk, lineHeight: 21 },
  sayaclar: { flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: renk.cizgi },
  sayac: { flex: 1, paddingHorizontal: 8 },
  sayacCizgi: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: renk.cizgi },
  sayacSayi: { fontFamily: yazi.sayi, fontSize: 32, color: renk.murekkep },
  sayacEk: { fontFamily: yazi.sayiOrta, fontSize: 18, color: renk.soluk },
  sayacEtiket: { fontFamily: yazi.normal, fontSize: 12, color: renk.soluk, marginTop: 4, lineHeight: 15 },
});
