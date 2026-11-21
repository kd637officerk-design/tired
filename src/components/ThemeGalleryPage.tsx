import React, { useRef } from 'react';
import {
  ArrowLeft,
  CloudRain,
  Download,
  Droplets,
  Edit3,
  Eye,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { AI_BACKDROPS, MATERIAL_FINISHES } from '../data/themes';
import { CornerStyle, FontStyle, PlayerState, ThemePreset } from '../types/player';

interface ThemeGalleryPageProps {
  open: boolean;
  allThemes: Record<string, ThemePreset>;
  state: PlayerState;
  onClose: () => void;
  onApplyTheme: (key: string) => void;
  onOpenDiyStudio: (editKey?: string) => void;
  onDeleteDiy: (key: string) => void;
  onExportDiy: () => void;
  onImportDiy: (file: File) => void;
  onUpdateState: (patch: Partial<PlayerState>) => void;
  onResetTweaks: () => void;
}

export const ThemeGalleryPage: React.FC<ThemeGalleryPageProps> = ({
  open,
  allThemes,
  state,
  onClose,
  onApplyTheme,
  onOpenDiyStudio,
  onDeleteDiy,
  onExportDiy,
  onImportDiy,
  onUpdateState,
  onResetTweaks,
}) => {
  const importRef = useRef<HTMLInputElement | null>(null);
  if (!open) return null;

  const activeTheme = allThemes[state.theme] || allThemes.bladerunner;
  const fxVal = state.fx == null ? 2 : state.fx;
  const wetGlassOn = state.wetGlass !== undefined ? state.wetGlass : activeTheme.wetGlass ?? true;
  const holoOn = state.holograms !== undefined ? state.holograms : activeTheme.holograms ?? true;
  const crowdOn = state.crowd !== undefined ? state.crowd : activeTheme.crowd ?? true;
  const crowdVal =
    !crowdOn
      ? 0
      : state.crowdLevel !== undefined
        ? state.crowdLevel
        : activeTheme.crowdDensity === 'dense'
          ? 3
          : activeTheme.crowdDensity === 'quiet'
            ? 1
            : 2;

  return (
    <div className="fixed inset-0 z-30 flex flex-col overflow-hidden bg-black/55 backdrop-blur-2xl text-[var(--fg)]">
      <div className="shrink-0 z-10 flex items-center gap-3 px-4 py-3 bg-black/65 backdrop-blur-xl border-b border-white/10">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/10"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold tracking-tight truncate">
            Interface & Hyper-Realistic DIY Themes
          </h1>
          <p className="text-xs text-[var(--mu)] truncate">
            Active: {activeTheme.label} ·{' '}
            {MATERIAL_FINISHES.find((m) => m.id === activeTheme.material)?.label || 'Wet Smoked Glass'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenDiyStudio()}
          className="min-h-[44px] px-4 rounded-xl bg-[var(--or)] text-white text-sm font-bold flex items-center gap-1.5 shadow-lg shadow-[var(--or)]/30 shrink-0"
        >
          <Plus className="w-4 h-4" /> DIY Studio
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-auto touch-pan-y">
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 pb-28">
        {/* Live Hyper-Realistic Environment Controls */}
        <section className="mat-panel rounded-2xl p-4 md:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--pe)] flex items-center gap-2">
              <CloudRain className="w-4 h-4" /> Atmospheric Realism & Material Controls
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onExportDiy}
                className="min-h-[40px] px-3 rounded-xl bg-white/8 hover:bg-white/14 text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export DIY JSON
              </button>
              <button
                type="button"
                onClick={() => importRef.current?.click()}
                className="min-h-[40px] px-3 rounded-xl bg-white/8 hover:bg-white/14 text-xs font-semibold flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> Import JSON
              </button>
              <button
                type="button"
                onClick={onResetTweaks}
                className="min-h-[40px] px-3 rounded-xl bg-white/8 hover:bg-white/14 text-xs font-semibold flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Tweaks
              </button>
              <input
                ref={importRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) onImportDiy(f);
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Rain / Weather Intensity */}
            <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-2">
              <div className="text-xs font-semibold text-[var(--mu)] flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-[var(--or)]" /> Rain & FX Intensity
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  [0, 'Off'],
                  [1, 'Low'],
                  [2, 'High'],
                  [3, 'Hyper'],
                ].map(([v, lbl]) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => onUpdateState({ fx: Number(v) })}
                    className={`min-h-[40px] rounded-lg text-xs font-bold transition-all ${
                      fxVal === v
                        ? 'bg-[var(--or)] text-white shadow-md shadow-[var(--or)]/30'
                        : 'bg-white/8 text-[var(--mu)] hover:bg-white/12'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Wet Camera Glass + Volumetric Holograms */}
            <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-2">
              <div className="text-xs font-semibold text-[var(--mu)] flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Wet Glass & Holograms
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateState({ wetGlass: !wetGlassOn })}
                  className={`min-h-[40px] rounded-lg text-xs font-bold border ${
                    wetGlassOn
                      ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
                      : 'bg-white/5 border-white/10 text-[var(--mu)]'
                  }`}
                >
                  Glass Drops: {wetGlassOn ? 'ON' : 'OFF'}
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateState({ holograms: !holoOn })}
                  className={`min-h-[40px] rounded-lg text-xs font-bold border ${
                    holoOn
                      ? 'bg-[var(--or)]/20 border-[var(--or)]/50 text-[var(--pe)]'
                      : 'bg-white/5 border-white/10 text-[var(--mu)]'
                  }`}
                >
                  Holograms: {holoOn ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* Walking People / Crowd */}
            <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-2 md:col-span-2 lg:col-span-4">
              <div className="text-xs font-semibold text-[var(--mu)] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[var(--or)]" /> Walking People & LED Umbrellas
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  [0, 'Off'],
                  [1, 'Quiet'],
                  [2, 'Active'],
                  [3, 'Crowded'],
                ].map(([v, lbl]) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() =>
                      onUpdateState({
                        crowd: Number(v) > 0,
                        crowdLevel: Number(v),
                      })
                    }
                    className={`min-h-[40px] rounded-lg text-xs font-bold transition-all ${
                      crowdVal === v
                        ? 'bg-[var(--or)] text-white shadow-md shadow-[var(--or)]/30'
                        : 'bg-white/8 text-[var(--mu)] hover:bg-white/12'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Typography & Corners */}
            <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-2">
              <div className="text-xs font-semibold text-[var(--mu)]">Typography & Geometry</div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={state.font || ''}
                  onChange={(e) => onUpdateState({ font: e.target.value as FontStyle })}
                  className="min-h-[40px] px-2 rounded-lg bg-black/60 border border-white/15 text-xs font-semibold"
                >
                  <option value="">Theme Font</option>
                  <option value="cinema">Cinema</option>
                  <option value="clean">Clean Sans</option>
                  <option value="serif">Serif</option>
                  <option value="medieval">Medieval</option>
                  <option value="gothic">Gothic 1999</option>
                  <option value="mono">Mono</option>
                </select>
                <select
                  value={state.corner || ''}
                  onChange={(e) => onUpdateState({ corner: e.target.value as CornerStyle })}
                  className="min-h-[40px] px-2 rounded-lg bg-black/60 border border-white/15 text-xs font-semibold"
                >
                  <option value="">Theme Corners</option>
                  <option value="sharp">Sharp</option>
                  <option value="round">Round</option>
                </select>
              </div>
            </div>

            {/* 4K Backdrop Override + Accent */}
            <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-2">
              <div className="text-xs font-semibold text-[var(--mu)] flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[var(--pe)]" /> 4K Scene & Accent
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateState({ scene: state.scene === 0 ? 1 : 0 })}
                  className={`flex-1 min-h-[40px] rounded-lg text-xs font-bold border ${
                    state.scene !== 0
                      ? 'bg-[var(--or)]/20 border-[var(--or)]/50 text-[var(--pe)]'
                      : 'bg-white/5 border-white/10 text-[var(--mu)]'
                  }`}
                >
                  4K Scene: {state.scene !== 0 ? 'ON' : 'OFF'}
                </button>
                <label className="min-h-[40px] px-2.5 rounded-lg bg-white/8 border border-white/15 flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                  <span>Color</span>
                  <input
                    type="color"
                    value={state.accent || activeTheme.accent}
                    onChange={(e) => onUpdateState({ accent: e.target.value })}
                    className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Quick 4K Blade Runner / AI Scene Switcher */}
          <div className="pt-1">
            <div className="text-xs font-semibold text-[var(--mu)] mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--or)]" /> Quick-Swap 4K AI-Generated Background Architecture
            </div>
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                onClick={() => onUpdateState({ backdropOverride: '' })}
                className={`shrink-0 min-h-[44px] px-3.5 rounded-xl border text-xs font-bold ${
                  !state.backdropOverride
                    ? 'border-[var(--or)] bg-[var(--or)]/20 text-white'
                    : 'border-white/12 bg-white/5 text-[var(--mu)]'
                }`}
              >
                Auto Theme Backdrop
              </button>
              {AI_BACKDROPS.map((b) => {
                const active = state.backdropOverride === b.landscape;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => onUpdateState({ backdropOverride: b.landscape, scene: 1 })}
                    className={`shrink-0 flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border text-left transition-all ${
                      active
                        ? 'border-[var(--or)] bg-[var(--or)]/20'
                        : 'border-white/12 bg-white/5 hover:border-white/25'
                    }`}
                  >
                    <img
                      src={b.landscape}
                      alt={b.label}
                      className="w-12 h-8 rounded-lg object-cover border border-white/15"
                    />
                    <span className="text-xs font-semibold whitespace-nowrap">{b.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Grid of All Themes */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">
              All Hyper-Realistic Themes ({Object.keys(allThemes).length})
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {Object.entries(allThemes).map(([key, t]) => {
              const active = state.theme === key;
              const matLabel =
                MATERIAL_FINISHES.find((m) => m.id === t.material)?.label || 'Wet Glass';
              return (
                <div
                  key={key}
                  className={`group relative overflow-hidden rounded-2xl border transition-all flex flex-col ${
                    active
                      ? 'border-[var(--or)] ring-2 ring-[var(--or)]/50 shadow-xl shadow-[var(--or)]/15'
                      : 'border-white/12 hover:border-white/30'
                  }`}
                  style={{ backgroundColor: t.bg }}
                >
                  {/* Visual Swatch Banner */}
                  <div className="relative h-28 overflow-hidden bg-black">
                    {t.backdropLandscape ? (
                      <img
                        src={t.backdropLandscape}
                        alt={t.label}
                        className="h-full w-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div
                        className="h-full w-full"
                        style={{
                          background: `radial-gradient(circle at 25% 25%, ${t.accent}55, ${t.bg} 75%)`,
                        }}
                      />
                    )}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(180deg, transparent 20%, ${t.bg}ee 100%)`,
                      }}
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-base backdrop-blur-md border border-white/20"
                        style={{ backgroundColor: `${t.accent}33` }}
                      >
                        {t.e}
                      </span>
                      {t.isCustom && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/70 text-[var(--pe)] border border-white/15">
                          DIY
                        </span>
                      )}
                      {t.layoutMode === 'thundercats' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/85 text-[#fbbf24] border border-[#e11d24]/80">
                          ThunderCats &apos;85
                        </span>
                      )}
                      {t.layoutMode === 'ghostintheshell' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/85 text-[#2df0d2] border border-[#2df0d2]/70">
                          攻殻機動隊
                        </span>
                      )}
                      {t.layoutMode === 'readyplayerone' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/85 text-[#38e0ff] border border-[#38e0ff]/70">
                          Ready Player One
                        </span>
                      )}
                      {t.layoutMode === 'dune' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/85 text-[#ffd175] border border-[#f09c2b]/65">
                          Dune
                        </span>
                      )}
                      {t.layoutMode === 'akira1988' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/85 text-[#ff5e66] border border-[#e61c24]/70">
                          Akira &apos;88
                        </span>
                      )}
                      {t.layoutMode === 'greenknight_crown' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/85 text-[#e8b954] border border-[#d91b0c]/65">
                          Green Knight
                        </span>
                      )}
                      {t.layoutMode === 'greenknight_wood' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/85 text-[#9be06c] border border-[#4ca638]/65">
                          Green Chapel
                        </span>
                      )}
                      {t.layoutMode === 'castlevania' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/85 text-[#ff4252] border border-[#d90b1c]/70">
                          Castlevania
                        </span>
                      )}
                      {t.layoutMode === 'batman2022' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/85 text-[#00e68a] border border-[#e31b23]/60">
                          Batman &apos;22
                        </span>
                      )}
                      {t.layoutMode === 'sleepyhollow' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/85 text-[#c8101c] border border-[#d8ceb8]/40">
                          Sleepy &apos;99
                        </span>
                      )}
                      {t.layoutMode === 'xmen90s' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#101628]/90 text-[#facc15] border border-[#ef4444]/80">
                          X-Men &apos;90s
                        </span>
                      )}
                      {t.layoutMode === 'matrixgreen' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-[#011205]/95 text-[#00ff41] border border-[#00ff41]/75">
                          Matrix Green
                        </span>
                      )}
                      {t.layoutMode === 'piratesabyss' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#020c12]/90 text-[#14b8a6] border border-[#f59e0b]/70">
                          Pirates · Kraken
                        </span>
                      )}
                      {t.layoutMode === 'steampunk_engine' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#180f07]/90 text-[#f59e0b] border border-[#d97706]/80">
                          Steampunk Engine
                        </span>
                      )}
                      {t.layoutMode === 'alienfarm' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-[#031206]/90 text-[#39ff14] border border-[#4ade80]/80">
                          Aliens · 🌽 Fields
                        </span>
                      )}
                      {t.layoutMode === 'dndtable' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#1b0e08]/92 text-[#fbbf24] border border-[#dc2626]/80 dnd-die-chip">
                          D&amp;D · Polyhedral Dice
                        </span>
                      )}
                      {t.layoutMode === 'templar_rain' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#0f172a]/92 text-[#cbd5e1] border border-[#b91c1c]/80">
                          Templar · Rain &amp; Steel
                        </span>
                      )}
                      {t.layoutMode === 'witcher_signs' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#111116]/94 text-[#fbbf24] border border-[#a855f7]/75 witcher-rune-chip">
                          Witcher · Signs &amp; Runes
                        </span>
                      )}
                    </div>
                    {active && (
                      <span
                        className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-white"
                        style={{ backgroundColor: t.accent }}
                      >
                        Active
                      </span>
                    )}
                  </div>

                  {/* Theme Meta + Actions */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <div className="font-bold text-sm truncate" style={{ color: t.fg }}>
                        {t.label}
                      </div>
                      <div className="text-xs mt-0.5 truncate" style={{ color: t.mu }}>
                        {matLabel} {t.holograms ? '· Holograms' : ''} {t.wetGlass ? '· Wet Glass' : ''}
                        {t.crowd ? ' · Walkers' : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onApplyTheme(key)}
                        className="flex-1 min-h-[42px] rounded-xl text-xs font-bold transition-all"
                        style={{
                          backgroundColor: active ? t.accent : `${t.accent}28`,
                          color: active ? (t.light ? '#fff' : '#fff') : t.fg,
                          border: `1px solid ${t.accent}66`,
                        }}
                      >
                        {active ? 'Applied' : 'Apply Theme'}
                      </button>
                      {t.isCustom && (
                        <>
                          <button
                            type="button"
                            onClick={() => onOpenDiyStudio(key)}
                            className="min-h-[42px] min-w-[42px] rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
                            title="Edit DIY theme"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteDiy(key)}
                            className="min-h-[42px] min-w-[42px] rounded-xl bg-red-500/15 hover:bg-red-500/30 text-red-300 flex items-center justify-center"
                            title="Delete DIY theme"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        </div>
      </div>
    </div>
  );
};
