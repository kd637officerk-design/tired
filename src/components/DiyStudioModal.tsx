import React, { useRef, useState } from 'react';
import { ArrowLeft, Check, Layers, Sparkles, Upload, CloudRain, Eye } from 'lucide-react';
import {
  AI_BACKDROPS,
  DEFAULT_TABS,
  MATERIAL_FINISHES,
  WEATHER_OPTIONS,
  deriveThemePaletteFromAccent,
} from '../data/themes';
import {
  CornerStyle,
  FontStyle,
  LayoutMode,
  MaterialFinish,
  ThemePreset,
  WeatherFxType,
} from '../types/player';

interface DiyStudioModalProps {
  open: boolean;
  initialTheme?: ThemePreset;
  initialKey?: string;
  onClose: () => void;
  onSaveTheme: (key: string, theme: ThemePreset) => void;
}

const ACCENT_SWATCHES = [
  { name: 'Templar Crusade Crimson', hex: '#b91c1c' },
  { name: 'Forged Rain Steel', hex: '#94a3b8' },
  { name: 'Witcher Wolf Amber', hex: '#f59e0b' },
  { name: 'Yennefer Chaos Violet', hex: '#a855f7' },
  { name: 'Alien Cornfield Green', hex: '#39ff14' },
  { name: 'Tractor Beam Emerald', hex: '#22c55e' },
  { name: 'D&D Crit Crimson', hex: '#dc2626' },
  { name: 'D20 Crown Gold', hex: '#fbbf24' },
  { name: 'X-Men ’92 Gold', hex: '#facc15' },
  { name: 'X-Men ’92 Blue', hex: '#2563eb' },
  { name: 'Matrix Phosphor Green', hex: '#00ff41' },
  { name: 'Abyssal Kraken Teal', hex: '#14b8a6' },
  { name: 'Boiler Brass', hex: '#d97706' },
  { name: 'Furnace Copper', hex: '#f59e0b' },
  { name: 'Eye of Thundera Red', hex: '#e11d24' },
  { name: 'Sword of Omens Gold', hex: '#fbbf24' },
  { name: 'GITS Thermoptic Teal', hex: '#2df0d2' },
  { name: 'GITS Major Cyan', hex: '#00f5c8' },
  { name: 'OASIS X1 Cyan', hex: '#38e0ff' },
  { name: 'Three Keys Gold', hex: '#f59e0b' },
  { name: 'ECTO-88 Magenta', hex: '#d946ef' },
  { name: 'Dune Desert Sun', hex: '#f09c2b' },
  { name: 'Akira Kaneda Red', hex: '#e61c24' },
  { name: 'Akira Capsule Blue', hex: '#2b8cff' },
  { name: 'Green Knight Vermilion', hex: '#d91b0c' },
  { name: 'Royal Halo Gold', hex: '#e4b248' },
  { name: 'Green Chapel Moss', hex: '#4ca638' },
  { name: 'Castlevania Blood', hex: '#d90b1c' },
  { name: 'Tyrell Amber', hex: '#ff7a1a' },
];

export const DiyStudioModal: React.FC<DiyStudioModalProps> = ({
  open,
  initialTheme,
  initialKey,
  onClose,
  onSaveTheme,
}) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [label, setLabel] = useState(initialTheme?.label || 'Off-World Sector');
  const [emblem, setEmblem] = useState(initialTheme?.e || '🌧️');
  const [accent, setAccent] = useState(initialTheme?.accent || '#ff7a1a');
  const [secondaryAccent, setSecondaryAccent] = useState(
    initialTheme?.secondaryAccent || '#2fd6d0'
  );
  const [material, setMaterial] = useState<MaterialFinish>(
    initialTheme?.material || 'wet-glass'
  );
  const [fx, setFx] = useState<WeatherFxType>(initialTheme?.fx || 'acid');
  const [holograms, setHolograms] = useState(initialTheme?.holograms ?? true);
  const [wetGlass, setWetGlass] = useState(initialTheme?.wetGlass ?? true);
  const [crowd, setCrowd] = useState(initialTheme?.crowd ?? true);
  const [crowdDensity, setCrowdDensity] = useState<'quiet' | 'active' | 'dense'>(
    initialTheme?.crowdDensity || 'active'
  );
  const [backdropLandscape, setBackdropLandscape] = useState(
    initialTheme?.backdropLandscape || AI_BACKDROPS[0].landscape
  );
  const [backdropPortrait, setBackdropPortrait] = useState(
    initialTheme?.backdropPortrait || AI_BACKDROPS[0].portrait
  );
  const [font, setFont] = useState<FontStyle>(initialTheme?.font || 'cinema');
  const [corner, setCorner] = useState<CornerStyle>(initialTheme?.corner || 'sharp');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(initialTheme?.layoutMode || 'default');
  const [prefix, setPrefix] = useState(initialTheme?.l || '⟦ ');
  const [suffix, setSuffix] = useState(initialTheme?.r || ' ⟧');
  const [tabs, setTabs] = useState<string[]>(
    initialTheme?.tabs?.slice(0, 4) || DEFAULT_TABS
  );
  const [emptyText, setEmptyText] = useState(
    initialTheme?.empty || 'Rain falls across the megacity. Add media to play.'
  );
  const [lightMode, setLightMode] = useState(!!initialTheme?.light);

  if (!open) return null;

  const palette = deriveThemePaletteFromAccent(accent, lightMode);

  const handleBackdropUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBackdropLandscape(reader.result);
        setBackdropPortrait(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const cleanName = label.trim().slice(0, 48) || 'Custom Studio';
    const key =
      initialKey && initialKey.startsWith('custom_')
        ? initialKey
        : `custom_${cleanName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 26)}_${Date.now().toString(36)}`;

    const built: ThemePreset = {
      label: cleanName,
      e: emblem.trim().slice(0, 6) || '✦',
      accent: palette.accent,
      secondaryAccent,
      bg: palette.bg,
      chip: palette.chip,
      np: palette.np,
      sh: palette.sh,
      fg: palette.fg,
      pe: palette.pe,
      mu: palette.mu,
      light: lightMode,
      material,
      fx,
      holograms,
      wetGlass,
      crowd,
      crowdDensity,
      backdropLandscape,
      backdropPortrait,
      l: prefix.slice(0, 12),
      r: suffix.slice(0, 12),
      tabs: tabs.map((t, i) => t.trim().slice(0, 24) || DEFAULT_TABS[i]),
      empty: emptyText.trim().slice(0, 110) || 'Nothing here yet.',
      font,
      corner,
      layoutMode,
      isCustom: true,
    };
    onSaveTheme(key, built);
    onClose();
  };

  const matInfo = MATERIAL_FINISHES.find((m) => m.id === material) || MATERIAL_FINISHES[0];

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-black/85 backdrop-blur-xl text-[var(--fg)]">
      <div className="shrink-0 z-10 flex items-center justify-between gap-3 px-4 py-3 bg-black/80 backdrop-blur-md border-b border-white/10">
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
            Hyper-Realistic DIY Theme Studio
          </h1>
          <p className="text-xs text-[var(--mu)] truncate">
            Craft physical materials, 4K AI cityscapes, holograms & rain physics
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="min-h-[44px] px-4 rounded-xl bg-[var(--or)] text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-[var(--or)]/30"
        >
          <Check className="w-4 h-4" />
          Save & Apply
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-auto touch-pan-y">
        <div className="max-w-5xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-24">
        {/* Live Hyper-Realistic Preview Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="lg:sticky lg:top-4 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--pe)] flex items-center gap-2">
              <Eye className="w-4 h-4" /> Live Material & 4K Atmosphere Preview
            </div>

            <div
              className="relative overflow-hidden rounded-2xl border aspect-[16/11] shadow-2xl"
              style={{
                borderColor: `${accent}66`,
                backgroundColor: palette.bg,
                fontFamily:
                  font === 'medieval'
                    ? '"IM Fell English", "UnifrakturMaguntia", Georgia, serif'
                    : font === 'gothic'
                      ? '"Cormorant Garamond", "Cinzel Decorative", Georgia, serif'
                      : font === 'serif'
                        ? 'Cinzel, Georgia, serif'
                        : font === 'mono'
                          ? '"JetBrains Mono", monospace'
                          : font === 'cinema'
                            ? 'Rajdhani, sans-serif'
                            : '"Plus Jakarta Sans", sans-serif',
              }}
            >
              {backdropLandscape && (
                <img
                  src={backdropLandscape}
                  alt="4K theme backdrop preview"
                  className="absolute inset-0 h-full w-full object-cover opacity-85"
                />
              )}
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(ellipse at 50% 100%, ${accent}44, transparent 70%), linear-gradient(180deg, rgba(4,7,11,0.35), rgba(4,7,11,0.75))`,
                }}
              />

              {/* Simulated Hologram beam */}
              {holograms && (
                <div
                  className="absolute inset-y-0 right-6 w-24 opacity-30 blur-md"
                  style={{
                    background: `linear-gradient(180deg, ${secondaryAccent}, transparent)`,
                  }}
                />
              )}

              {/* Simulated Rain Streaks */}
              {fx !== 'none' && (
                <div
                  className="absolute inset-0 opacity-45 pointer-events-none"
                  style={{
                    backgroundImage: `repeating-linear-gradient(104deg, transparent 0px, transparent 18px, ${secondaryAccent}44 19px, transparent 20px)`,
                  }}
                />
              )}

              {/* Animated Miniature Walking Pedestrians with LED Umbrellas */}
              {crowd && (
                <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none overflow-hidden">
                  {(crowdDensity === 'dense' ? [0, 1, 2, 3, 4] : crowdDensity === 'active' ? [0, 1, 2] : [0, 1]).map(
                    (idx) => (
                      <div
                        key={idx}
                        className={`absolute bottom-1 ${idx % 2 === 0 ? 'walk-ltr' : 'walk-rtl'}`}
                        style={{
                          animationDuration: `${11 + idx * 3}s`,
                          animationDelay: `${-idx * 2.7}s`,
                          opacity: 0.78 + (idx % 2) * 0.18,
                        }}
                      >
                        <svg width="26" height="44" viewBox="0 0 26 44" className="drop-shadow">
                          <path
                            d="M4 12 Q14 3 24 12 Z"
                            fill="rgba(16,24,34,0.9)"
                            stroke={idx % 2 === 0 ? secondaryAccent : accent}
                            strokeWidth="1.2"
                          />
                          <line x1="15" y1="10" x2="15" y2="21" stroke="#d8f4ff" strokeWidth="0.9" />
                          {/* Hair, Head & Skin profile */}
                          <circle cx="11.5" cy="15.5" r="2.6" fill="#c99e82" />
                          <path d="M8.8 15.5 A2.8 2.8 0 0 1 13.8 13.8 L11 13.8 L9.2 16.5 Z" fill="#181515" />
                          {/* Neck & Tailored Jacket */}
                          <rect x="10.6" y="17.8" width="1.8" height="2" fill="#c99e82" />
                          <path d="M8.5 19.5 Q11.5 18.8 14.2 19.5 L14.5 29 L8.2 29 Z" fill="#131922" />
                          {/* Forearm holding umbrella */}
                          <path d="M12.5 20.5 L15 23 L15 21" stroke="#131922" strokeWidth="2.1" strokeLinecap="round" fill="none" />
                          {/* Trousers & Boots */}
                          <path d="M9.5 29 L7.5 36 L6.2 41.5" stroke="#0d1117" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                          <path d="M12.8 29 L14.8 35.5 L16 41.5" stroke="#131820" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                          <ellipse cx="7.4" cy="42" rx="2.1" ry="1" fill="#080a0d" />
                          <ellipse cx="16.8" cy="42" rx="2.1" ry="1" fill="#080a0d" />
                        </svg>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Foreground UI Card using Selected Material */}
              <div className="relative z-10 h-full flex flex-col justify-between p-4">
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm font-bold tracking-widest uppercase"
                    style={{
                      color: palette.pe,
                      textShadow: `0 0 14px ${accent}`,
                    }}
                  >
                    {prefix}
                    #XI
                    {suffix}
                  </span>
                  <span
                    className="text-xs px-2.5 py-1 font-semibold"
                    style={{
                      backgroundColor: palette.chip,
                      color: palette.fg,
                      border: `1px solid ${accent}55`,
                      borderRadius: corner === 'sharp' ? '4px' : corner === 'round' ? '999px' : '10px',
                      backdropFilter: `blur(${matInfo.blur}px)`,
                    }}
                  >
                    {matInfo.label}
                  </span>
                </div>

                <div
                  className="p-3.5 shadow-xl"
                  style={{
                    backgroundColor: palette.np,
                    border: `1px solid ${accent}55`,
                    borderRadius: corner === 'sharp' ? '6px' : corner === 'round' ? '22px' : '14px',
                    backdropFilter: `blur(${matInfo.blur}px)`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,${matInfo.highlightAlpha}), 0 12px 30px rgba(0,0,0,0.6)`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 flex items-center justify-center text-xl font-bold shrink-0"
                      style={{
                        backgroundColor: `${accent}22`,
                        border: `1px solid ${accent}88`,
                        borderRadius: corner === 'sharp' ? '4px' : corner === 'round' ? '999px' : '10px',
                      }}
                    >
                      {emblem}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold truncate" style={{ color: palette.fg }}>
                        {label || 'Custom Studio'}
                      </div>
                      <div className="text-xs truncate" style={{ color: palette.mu }}>
                        {WEATHER_OPTIONS.find((w) => w.id === fx)?.label}
                        {wetGlass ? ' · Wet Glass' : ''}
                        {crowd ? ' · Walkers' : ''}
                      </div>
                    </div>
                    <div
                      className="px-3 py-1.5 text-xs font-bold text-white"
                      style={{
                        backgroundColor: accent,
                        borderRadius: corner === 'sharp' ? '4px' : '999px',
                      }}
                    >
                      PLAY
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mat-surface rounded-2xl p-4 text-xs text-[var(--mu)] leading-relaxed">
              <strong className="text-[var(--fg)] block mb-1">Material Shader: {matInfo.label}</strong>
              {matInfo.desc}
            </div>
          </div>
        </div>

        {/* Configuration Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. 4K AI Backdrop Selection */}
          <section className="mat-surface rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--pe)] flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> 4K AI-Generated Scene Backdrop
              </h2>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="min-h-[40px] px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Custom 4K
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBackdropUpload}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AI_BACKDROPS.map((b) => {
                const selected = backdropLandscape === b.landscape;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setBackdropLandscape(b.landscape);
                      setBackdropPortrait(b.portrait);
                    }}
                    className={`relative overflow-hidden rounded-xl border text-left p-2.5 flex items-center gap-3 min-h-[68px] transition-all ${
                      selected
                        ? 'border-[var(--or)] bg-[var(--or)]/15 ring-1 ring-[var(--or)]'
                        : 'border-white/10 bg-black/30 hover:border-white/25'
                    }`}
                  >
                    <img
                      src={b.landscape}
                      alt={b.label}
                      className="w-16 h-12 rounded-lg object-cover shrink-0 border border-white/15"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">{b.label}</div>
                      <div className="text-[11px] text-white/65 line-clamp-2">{b.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Physical Material Finish & Lighting */}
          <section className="mat-surface rounded-2xl p-4 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--pe)] flex items-center gap-2">
              <Layers className="w-4 h-4" /> Physical Material & Cinema Lighting
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MATERIAL_FINISHES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setMaterial(m.id);
                    if (m.id === 'daylight-porcelain') setLightMode(true);
                    else setLightMode(false);
                  }}
                  className={`min-h-[54px] px-3 py-2 rounded-xl border text-left transition-all ${
                    material === m.id
                      ? 'border-[var(--or)] bg-[var(--or)]/15'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="text-sm font-bold">{m.label}</div>
                  <div className="text-[11px] text-[var(--mu)] line-clamp-1">{m.desc}</div>
                </button>
              ))}
            </div>

            <div className="pt-2 space-y-2.5">
              <div className="text-xs font-semibold text-[var(--mu)]">Primary & Hologram Accent Lighting</div>
              <div className="flex flex-wrap gap-2 items-center">
                {ACCENT_SWATCHES.map((sw) => (
                  <button
                    key={sw.hex}
                    type="button"
                    onClick={() => setAccent(sw.hex)}
                    title={sw.name}
                    className={`w-10 h-10 rounded-xl border-2 transition-transform ${
                      accent.toLowerCase() === sw.hex ? 'scale-110 border-white' : 'border-white/20'
                    }`}
                    style={{ backgroundColor: sw.hex }}
                  />
                ))}
                <label className="min-h-[44px] px-3 rounded-xl bg-white/5 border border-white/15 flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <span>Primary</span>
                  <input
                    type="color"
                    value={accent}
                    onChange={(e) => setAccent(e.target.value)}
                    className="w-7 h-7 rounded bg-transparent border-0 cursor-pointer"
                  />
                </label>
                <label className="min-h-[44px] px-3 rounded-xl bg-white/5 border border-white/15 flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <span>Hologram</span>
                  <input
                    type="color"
                    value={secondaryAccent}
                    onChange={(e) => setSecondaryAccent(e.target.value)}
                    className="w-7 h-7 rounded bg-transparent border-0 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </section>

          {/* 3. Hyper-Realistic Rain & Hologram Physics */}
          <section className="mat-surface rounded-2xl p-4 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--pe)] flex items-center gap-2">
              <CloudRain className="w-4 h-4" /> Weather Physics & Holograms
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWetGlass(!wetGlass)}
                className={`min-h-[48px] px-3.5 py-2 rounded-xl border text-left flex items-center justify-between ${
                  wetGlass
                    ? 'border-[var(--or)] bg-[var(--or)]/15'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <div>
                  <div className="text-sm font-bold">Wet Camera Glass Drops</div>
                  <div className="text-[11px] text-[var(--mu)]">Refractive water beads & rivulets</div>
                </div>
                <span className="text-xs font-bold uppercase">{wetGlass ? 'ON' : 'OFF'}</span>
              </button>

              <button
                type="button"
                onClick={() => setHolograms(!holograms)}
                className={`min-h-[48px] px-3.5 py-2 rounded-xl border text-left flex items-center justify-between ${
                  holograms
                    ? 'border-[var(--or)] bg-[var(--or)]/15'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <div>
                  <div className="text-sm font-bold">Volumetric Holograms & Spinners</div>
                  <div className="text-[11px] text-[var(--mu)]">Searchlights, projection planes & craft</div>
                </div>
                <span className="text-xs font-bold uppercase">{holograms ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* Walking Pedestrians / Street Crowd Controls */}
            <div className="p-3.5 rounded-xl bg-black/30 border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-bold">Walking People & Umbrellas</div>
                  <div className="text-[11px] text-[var(--mu)]">
                    Silhouettes walking wet streets with neon umbrella reflections
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCrowd(!crowd)}
                  className={`min-h-[40px] px-3.5 rounded-lg text-xs font-bold border ${
                    crowd
                      ? 'bg-[var(--or)] text-white border-transparent'
                      : 'bg-white/5 text-[var(--mu)] border-white/10'
                  }`}
                >
                  {crowd ? 'ON' : 'OFF'}
                </button>
              </div>
              {crowd && (
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ['quiet', 'Quiet Stroll'],
                      ['active', 'City Boulevard'],
                      ['dense', 'Rush Hour'],
                    ] as const
                  ).map(([id, text]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setCrowdDensity(id)}
                      className={`min-h-[38px] rounded-lg text-xs font-bold border transition-all ${
                        crowdDensity === id
                          ? 'border-[var(--or)] bg-[var(--or)]/20 text-white'
                          : 'border-white/10 bg-white/5 text-[var(--mu)] hover:bg-white/10'
                      }`}
                    >
                      {text}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {WEATHER_OPTIONS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setFx(w.id)}
                  className={`min-h-[48px] px-3 py-2 rounded-xl border text-left ${
                    fx === w.id
                      ? 'border-[var(--or)] bg-[var(--or)]/15'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="text-sm font-semibold">{w.label}</div>
                  <div className="text-[11px] text-[var(--mu)] truncate">{w.desc}</div>
                </button>
              ))}
            </div>
          </section>

          {/* 4. Identity, Geometry & Typography */}
          <section className="mat-surface rounded-2xl p-4 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--pe)]">
              Identity, Typography & Tab Nomenclature
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[var(--mu)] mb-1">Theme Name</label>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-black/40 border border-white/15 text-sm"
                  placeholder="Blade Runner Sector 7"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--mu)] mb-1">Icon / Emblem</label>
                <input
                  value={emblem}
                  onChange={(e) => setEmblem(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-black/40 border border-white/15 text-sm text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--mu)] mb-1">Title Prefix</label>
                <input
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-black/40 border border-white/15 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--mu)] mb-1">Title Suffix</label>
                <input
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-black/40 border border-white/15 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--mu)] mb-1">Typography</label>
                <select
                  value={font}
                  onChange={(e) => setFont(e.target.value as FontStyle)}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-black/60 border border-white/15 text-sm"
                >
                  <option value="cinema">Cinema Condensed</option>
                  <option value="clean">Clean Sans</option>
                  <option value="serif">Editorial Serif</option>
                  <option value="medieval">Medieval Blackletter &amp; Fell</option>
                  <option value="gothic">Sleepy Hollow Gothic 1999</option>
                  <option value="mono">Terminal Mono</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--mu)] mb-1">Corners</label>
                <select
                  value={corner}
                  onChange={(e) => setCorner(e.target.value as CornerStyle)}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-black/60 border border-white/15 text-sm"
                >
                  <option value="sharp">Chamfered Sharp</option>
                  <option value="">Architectural</option>
                  <option value="round">Soft Rounded</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--mu)] mb-1">
                Cinematic Layout Architecture
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(
                  [
                    ['default', 'Standard Studio'],
                    ['templar_rain', 'Templar (Dark Medieval Rain & Steel)'],
                    ['witcher_signs', 'The Witcher (Netflix Dark, Signs & Runes)'],
                    ['alienfarm', 'Aliens (Night Cornfields & UFO Beam)'],
                    ['dndtable', 'D&D (Polyhedral Dice & DM Table)'],
                    ['xmen90s', "X-Men '90s (Halftone & Danger Room)"],
                    ['matrixgreen', 'The Matrix (Everything Phosphor Green)'],
                    ['piratesabyss', 'Pirates (Dark Seas & Kraken Tentacles)'],
                    ['steampunk_engine', 'Steampunk (Steam Machine & Live Gears)'],
                    ['thundercats', "ThunderCats '85 (Cats Lair & Sword of Omens)"],
                    ['ghostintheshell', 'Ghost in the Shell (攻殻機動隊・日本語)'],
                    ['readyplayerone', 'Ready Player One (OASIS)'],
                    ['dune', 'Dune (Hot Sun & Sand)'],
                    ['akira1988', 'Akira 1988 (Motos & Towers)'],
                    ['greenknight_crown', 'Green Knight (Crimson/Gold)'],
                    ['greenknight_wood', 'Green Knight (Chapel Moss)'],
                    ['castlevania', 'Castlevania (Melting Blood)'],
                    ['batman2022', "The Batman '22 (Black/Green/Red)"],
                    ['sleepyhollow', "Sleepy Hollow '99 (Gothic)"],
                  ] as const
                ).map(([id, title]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setLayoutMode(id)}
                    className={`min-h-[42px] px-3 rounded-xl border text-xs font-bold transition-all ${
                      layoutMode === id
                        ? 'border-[var(--or)] bg-[var(--or)]/20 text-white'
                        : 'border-white/10 bg-white/5 text-[var(--mu)] hover:bg-white/10'
                    }`}
                  >
                    {title}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {tabs.map((tab, idx) => (
                <div key={idx}>
                  <label className="block text-[11px] font-semibold text-[var(--mu)] mb-1">
                    Tab {idx + 1} ({DEFAULT_TABS[idx]})
                  </label>
                  <input
                    value={tab}
                    onChange={(e) => {
                      const next = [...tabs];
                      next[idx] = e.target.value;
                      setTabs(next);
                    }}
                    className="w-full min-h-[42px] px-2.5 rounded-xl bg-black/40 border border-white/15 text-xs"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--mu)] mb-1">
                Empty Library Message
              </label>
              <input
                value={emptyText}
                onChange={(e) => setEmptyText(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-black/40 border border-white/15 text-sm"
              />
            </div>
          </section>
        </div>
        </div>
      </div>
    </div>
  );
};
