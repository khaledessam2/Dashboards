import type { Tone } from '../../shared/services/traffic-command-store';

export const PILL: Record<Tone, string> = {
  ok: 'bg-[#ecfdf5] text-[#059669]',
  warn: 'bg-[#fffbeb] text-[#d97706]',
  bad: 'bg-[#fff1f2] text-[#e11d48]',
  info: 'bg-[#ecfdf5] text-[#059669]',
};
export const TEXT: Record<Tone, string> = { ok: 'text-[#059669]', warn: 'text-[#d97706]', bad: 'text-[#e11d48]', info: 'text-[#059669]' };
export const BAR: Record<Tone, string> = { ok: 'bg-[#10b981]', warn: 'bg-[#f59e0b]', bad: 'bg-[#e11d48]', info: 'bg-[#059669]' };
export const fmt = (n: number) => n.toLocaleString('en-US');
