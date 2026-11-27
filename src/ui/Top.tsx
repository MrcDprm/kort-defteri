import Svg, { Circle, ClipPath, Defs, G, Path, Rect } from 'react-native-svg';
import type { TopEvresi } from '@/domain/tipler';
import { renk } from './tema';

const RENK: Record<TopEvresi, string | null> = {
  kirmizi: renk.topKirmizi,
  turuncu: renk.topTuruncu,
  yesil: null,
  sari: null,
};

/** ITF top evresi: kırmızı ve turuncu top iki renkli keçe, yeşil top yeşil noktalı, sarı top tek renk. */
export function Top({ evre, boyut = 18 }: { evre: TopEvresi; boyut?: number }) {
  const ust = RENK[evre];
  const id = `kesit-${evre}`;
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 20 20">
      <Defs>
        <ClipPath id={id}>
          <Circle cx="10" cy="10" r="9" />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${id})`}>
        <Rect width="20" height="20" fill={renk.top} />
        {ust ? <Rect width="20" height="10" fill={ust} /> : null}
      </G>
      {evre === 'yesil' ? <Circle cx="10" cy="10" r="3.2" fill={renk.topYesil} /> : null}
      <Path d="M2.5 5.5c4 2 4 7 0 9M17.5 5.5c-4 2-4 7 0 9" fill="none" stroke="#fff" strokeWidth={1.3} />
      <Circle cx="10" cy="10" r="9" fill="none" stroke="#fff" strokeWidth={1.5} />
    </Svg>
  );
}
