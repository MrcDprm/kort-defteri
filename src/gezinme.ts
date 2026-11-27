import { router } from 'expo-router';
import type { DersOlayi } from '@/domain/tipler';

export function yoklamayaGit(o: Pick<DersOlayi, 'lesson_id' | 'template_id' | 'date'>): void {
  router.push({ pathname: '/yoklama', params: { ders: o.lesson_id ?? '', sablon: o.template_id ?? '', tarih: o.date } });
}

export function sporcuyaGit(id: string): void {
  router.push({ pathname: '/sporcu/[id]', params: { id } });
}
