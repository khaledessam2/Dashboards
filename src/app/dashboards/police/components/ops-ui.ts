import { Level } from '../../../shared/services/police-store';

export { LEVEL_HEX } from '../../../shared/services/police-store';
export type { Level };

/** Shared status palette (same colours as the original police dashboard). */
export const PILL: Record<Level, string> = { ok: 'bg-[#ecfdf5] text-[#059669]', warn: 'bg-[#fffbeb] text-[#d97706]', bad: 'bg-[#fff1f2] text-[#e11d48]' };
export const TEXT: Record<Level, string> = { ok: 'text-[#059669]', warn: 'text-[#d97706]', bad: 'text-[#e11d48]' };
export const TINT: Record<Level, string> = { ok: '', warn: 'bg-[#fffdf6]', bad: 'bg-[#fff8f8]' };
export const LEVEL_WORD: Record<Level, string> = { ok: 'طبيعي', warn: 'تحذيري', bad: 'حرج' };
export const fmt = (n: number) => n.toLocaleString('en-US');
