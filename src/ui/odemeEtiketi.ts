import type { OdemeDurumu } from '@/domain/odeme';
import type { EtiketTonu } from './bilesenler';

export const DURUM_ETIKETI: Record<OdemeDurumu, { yazi: string; ton: EtiketTonu }> = {
  odendi: { yazi: 'Ödendi', ton: 'yesil' },
  bekliyor: { yazi: 'Ödenmedi', ton: 'sari' },
  gecikti: { yazi: 'Gecikti', ton: 'kirmizi' },
};
