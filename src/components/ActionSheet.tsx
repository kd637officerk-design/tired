import React from 'react';
import { Check, X } from 'lucide-react';
import { SheetItem } from '../types/player';

export interface SheetChipGroup {
  type: 'chips';
  label: string;
  options: { value: string | number; label: string }[];
  current: string | number;
  onSelect: (val: string | number) => void;
}

export interface SheetSectionLabel {
  type: 'label';
  label: string;
}

export type SheetEntry = SheetItem | SheetChipGroup | SheetSectionLabel;

interface ActionSheetProps {
  open: boolean;
  title: string;
  entries: SheetEntry[];
  onClose: () => void;
}

export const ActionSheet: React.FC<ActionSheetProps> = ({ open, title, entries, onClose }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="mat-panel w-full max-w-lg rounded-t-3xl md:rounded-2xl max-h-[82vh] flex flex-col overflow-hidden pt-2 text-[var(--fg)]"
        role="dialog"
        aria-modal="true"
      >
        <div className="shrink-0 px-3">
          <div className="mx-auto my-2 h-1 w-10 rounded-full bg-white/25 md:hidden" />
          <div className="flex items-center justify-between px-3 pb-3 pt-1 border-b border-white/10">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="h-4 w-1 rounded-full bg-[var(--or)] shrink-0" />
              <h2 className="text-base font-bold truncate">{title || 'Actions'}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--mu)] hover:text-[var(--fg)] hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y px-3 pb-6 mt-2 space-y-1">
          {entries.map((entry, idx) => {
            if ('type' in entry && entry.type === 'label') {
              return (
                <div
                  key={idx}
                  className="px-3 pt-3 pb-1 text-xs font-bold uppercase tracking-wider text-[var(--pe)] opacity-85"
                >
                  {entry.label}
                </div>
              );
            }
            if ('type' in entry && entry.type === 'chips') {
              return (
                <div key={idx} className="px-3 py-1.5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[var(--mu)] mb-2">
                    {entry.label}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {entry.options.map((opt) => {
                      const active = String(opt.value) === String(entry.current);
                      return (
                        <button
                          key={String(opt.value)}
                          type="button"
                          onClick={() => entry.onSelect(opt.value)}
                          className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-semibold transition-all border ${
                            active
                              ? 'bg-[var(--or)] text-white border-transparent shadow-lg shadow-[var(--or)]/30'
                              : 'bg-white/5 text-[var(--fg)] border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }

            const item = entry as SheetItem;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (!item.keep) onClose();
                  item.fn?.();
                }}
                className={`w-full min-h-[48px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[15px] font-medium transition-colors ${
                  item.on
                    ? 'bg-[var(--or)]/18 text-[var(--fg)] border border-[var(--or)]/40'
                    : item.danger
                      ? 'text-red-400 hover:bg-red-500/10'
                      : 'hover:bg-white/8'
                }`}
              >
                <span className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center text-base shrink-0">
                  {item.on ? <Check className="w-4 h-4 text-[var(--or)]" /> : item.icon || '•'}
                </span>
                <span className="flex-1 min-w-0 break-words">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
