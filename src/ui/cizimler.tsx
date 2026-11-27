import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { renk, yazi } from './tema';
import { Top } from './Top';

/** Sert kortun üstten görünüşü; bugün ekranının başlığı. Top açılışta bir kez servis kutusuna seker. */
export function KortBasligi({ ustBosluk, ust, baslik, alt }: { ustBosluk: number; ust: string; baslik: string; alt?: string }) {
  const { width: g } = useWindowDimensions();
  const y = ustBosluk + 208;
  const ic = 20;
  const tekli = Math.round(g * 0.113);
  const servis = ustBosluk + 66;
  const taban = y - 30;
  const ilerleme = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let iptal = false;
    AccessibilityInfo.isReduceMotionEnabled().then((azalt) => {
      if (iptal) return;
      if (azalt) ilerleme.setValue(1);
      else Animated.timing(ilerleme, { toValue: 1, duration: 1100, delay: 250, easing: Easing.linear, useNativeDriver: true }).start();
    });
    return () => {
      iptal = true;
    };
  }, [ilerleme]);

  const topX = g * 0.68;
  const topY = servis - 30;
  const tx = ilerleme.interpolate({ inputRange: [0, 0.45, 0.72, 1], outputRange: [-g * 0.32, 0, 22, 0] });
  const ty = ilerleme.interpolate({ inputRange: [0, 0.45, 0.72, 1], outputRange: [-70, 0, -16, 0] });
  const op = ilerleme.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 1] });

  return (
    <View style={{ height: y }}>
      <Svg width={g} height={y} style={StyleSheet.absoluteFill}>
        <Rect width={g} height={y} fill={renk.saha} />
        <Rect x={ic} y={-10} width={g - ic * 2} height={taban + 10} fill={renk.kort} />
        <G stroke="#fff" strokeWidth={2.5} fill="none">
          <Rect x={ic} y={-10} width={g - ic * 2} height={taban + 10} />
          <Line x1={ic + tekli} y1={-10} x2={ic + tekli} y2={taban} />
          <Line x1={g - ic - tekli} y1={-10} x2={g - ic - tekli} y2={taban} />
          <Line x1={ic + tekli} y1={servis} x2={g - ic - tekli} y2={servis} />
          <Line x1={g / 2} y1={-10} x2={g / 2} y2={servis} />
          <Line x1={g / 2} y1={taban - 10} x2={g / 2} y2={taban} />
        </G>
      </Svg>
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: topX - 10, top: topY, opacity: op, transform: [{ translateX: tx }, { translateY: ty }] }}>
        <Top evre="sari" boyut={20} />
      </Animated.View>
      <View style={{ position: 'absolute', left: ic + tekli + 14, right: ic + tekli + 14, top: servis + 22 }}>
        <Text style={k.ust}>{ust}</Text>
        <Text style={k.baslik} numberOfLines={1} adjustsFontSizeToFit accessibilityRole="header">{baslik}</Text>
        {alt ? <Text style={k.alt} numberOfLines={1}>{alt}</Text> : null}
      </View>
    </View>
  );
}

const k = StyleSheet.create({
  ust: { fontFamily: yazi.orta, fontSize: 15, color: 'rgba(255,255,255,0.9)' },
  baslik: { fontFamily: yazi.baslik, fontSize: 28, color: '#fff', marginTop: 4, letterSpacing: -0.2 },
  alt: { fontFamily: yazi.normal, fontSize: 15, color: 'rgba(255,255,255,0.9)', marginTop: 6 },
});

/** Mavi bir şerit üzerinde kort çizgileri; alt ekranların başlığı. */
export function SeritBaslik({ ustBosluk, ust, baslik, alt }: { ustBosluk: number; ust?: string; baslik: string; alt?: string }) {
  const { width: g } = useWindowDimensions();
  return (
    <View style={{ backgroundColor: renk.kort, paddingTop: ustBosluk + 14, paddingHorizontal: 20, paddingBottom: 16, overflow: 'hidden' }}>
      <Svg width={120} height={200} style={{ position: 'absolute', right: -10, top: 0 }}>
        <G stroke="rgba(255,255,255,0.35)" strokeWidth={2.5}>
          <Line x1={30} y1={0} x2={30} y2={200} />
          <Line x1={30} y1={ustBosluk + 50} x2={130} y2={ustBosluk + 50} />
          <Line x1={80} y1={0} x2={80} y2={ustBosluk + 50} />
        </G>
      </Svg>
      {ust ? <Text style={[k.ust, { maxWidth: g - 140 }]}>{ust}</Text> : null}
      <Text style={[k.baslik, { fontSize: 26, marginRight: 70 }]} accessibilityRole="header">{baslik}</Text>
      {alt ? <Text style={[k.alt, { marginTop: 4 }]}>{alt}</Text> : null}
    </View>
  );
}

export interface RadarSerisi {
  degerler: number[];
  renk: string;
}

/** Performans radarı; değerler 1-5 arası, eksik değer 0 sayılır. */
export function Radar({ etiketler, seriler, genislik }: { etiketler: string[]; seriler: RadarSerisi[]; genislik: number }) {
  const n = etiketler.length;
  // Yandaki etiketler için her iki kenarda yaklaşık 70 piksel bırakılır.
  const r = Math.max(50, (genislik / 2 - 70) / 1.23);
  const yukseklik = Math.round(2 * r * 1.23 + 30);
  const cx = genislik / 2;
  const cy = yukseklik / 2;
  if (n < 3) return null;
  const nokta = (i: number, v: number): [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + Math.cos(a) * r * (v / 5), cy + Math.sin(a) * r * (v / 5)];
  };
  const cokgen = (vs: number[]) => vs.map((v, i) => nokta(i, v).join(',')).join(' ');
  return (
    <Svg width={genislik} height={yukseklik}>
      {[1, 2, 3, 4, 5].map((kat) => (
        <Polygon key={kat} points={cokgen(Array(n).fill(kat))} fill="none" stroke={renk.cizgi} strokeWidth={kat === 5 ? 1.5 : 1} />
      ))}
      {etiketler.map((et, i) => {
        const [x, y] = nokta(i, 5);
        const [lx, ly] = nokta(i, 6.15);
        const hiza = Math.abs(lx - cx) < 8 ? 'middle' : lx > cx ? 'start' : 'end';
        return (
          <G key={et + i}>
            <Line x1={cx} y1={cy} x2={x} y2={y} stroke={renk.cizgi} />
            <SvgText x={lx} y={ly + 4} fontSize={11.5} fontFamily={yazi.normal} fill={renk.soluk} textAnchor={hiza}>{et}</SvgText>
          </G>
        );
      })}
      {seriler.map((sr, j) => (
        <G key={j}>
          <Polygon points={cokgen(sr.degerler)} fill={sr.renk} fillOpacity={0.14} stroke={sr.renk} strokeWidth={2.2} strokeLinejoin="round" />
          {j === seriler.length - 1
            ? sr.degerler.map((v, i) => {
                const [x, y] = nokta(i, v);
                return <Circle key={i} cx={x} cy={y} r={3.2} fill={sr.renk} />;
              })
            : null}
        </G>
      ))}
    </Svg>
  );
}

/** Boy ve kilo gelişimi için sade çizgi grafik. */
export function CizgiGrafik({ noktalar, genislik, yukseklik = 120, birim }: { noktalar: { etiket: string; deger: number }[]; genislik: number; yukseklik?: number; birim: string }) {
  if (noktalar.length < 2) return null;
  const kenar = { sol: 8, sag: 8, ust: 22, alt: 22 };
  const min = Math.min(...noktalar.map((n) => n.deger));
  const max = Math.max(...noktalar.map((n) => n.deger));
  const aralik = max - min || 1;
  const x = (i: number) => kenar.sol + (i * (genislik - kenar.sol - kenar.sag)) / (noktalar.length - 1);
  const y = (v: number) => kenar.ust + (1 - (v - min) / aralik) * (yukseklik - kenar.ust - kenar.alt);
  const d = noktalar.map((n, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(n.deger)}`).join(' ');
  const son = noktalar[noktalar.length - 1]!;
  return (
    <Svg width={genislik} height={yukseklik}>
      <Line x1={kenar.sol} y1={yukseklik - kenar.alt} x2={genislik - kenar.sag} y2={yukseklik - kenar.alt} stroke={renk.cizgi} />
      <Path d={d} fill="none" stroke={renk.kort} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
      {noktalar.map((n, i) => (
        <Circle key={i} cx={x(i)} cy={y(n.deger)} r={3.4} fill={renk.kort} />
      ))}
      <SvgText x={x(noktalar.length - 1)} y={y(son.deger) - 9} fontSize={12} fontFamily={yazi.yariKalin} fill={renk.murekkep} textAnchor="end">
        {`${son.deger.toLocaleString('tr-TR')} ${birim}`}
      </SvgText>
      <SvgText x={x(0)} y={yukseklik - 6} fontSize={11} fontFamily={yazi.normal} fill={renk.soluk} textAnchor="start">{noktalar[0]!.etiket}</SvgText>
      <SvgText x={x(noktalar.length - 1)} y={yukseklik - 6} fontSize={11} fontFamily={yazi.normal} fill={renk.soluk} textAnchor="end">{son.etiket}</SvgText>
    </Svg>
  );
}

type IkonAdi = 'bugun' | 'sporcular' | 'takvim' | 'odemeler' | 'profil';

export function SekmeIkonu({ ad, renk: r }: { ad: IkonAdi; renk: string }) {
  const p = { fill: 'none', stroke: r, strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      {ad === 'bugun' ? (
        <>
          <Rect x={3.5} y={4} width={17} height={16.5} rx={2} {...p} />
          <Path d="M3.5 12.2h17M12 4v8.2" {...p} />
        </>
      ) : ad === 'sporcular' ? (
        <>
          <Circle cx={9} cy={8.5} r={3.5} {...p} />
          <Path d="M3 19.5c.7-3.2 3-5 6-5s5.3 1.8 6 5" {...p} />
          <Circle cx={17.5} cy={9.5} r={2.5} {...p} />
          <Path d="M16.5 14.6c2.3.2 3.9 1.7 4.5 4" {...p} />
        </>
      ) : ad === 'takvim' ? (
        <>
          <Rect x={3.5} y={5} width={17} height={15.5} rx={2} {...p} />
          <Path d="M3.5 10h17M8 3v4M16 3v4" {...p} />
        </>
      ) : ad === 'odemeler' ? (
        <>
          <Rect x={3} y={6} width={18} height={13} rx={2} {...p} />
          <Path d="M3 10.5h18M7 15h4" {...p} />
        </>
      ) : (
        <>
          <Circle cx={12} cy={12} r={8.5} {...p} />
          <Path d="M4.5 8.5c4 1.6 4 5.4 0 7M19.5 8.5c-4 1.6-4 5.4 0 7" {...p} />
        </>
      )}
    </Svg>
  );
}
