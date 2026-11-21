import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpDown,
  BookOpen,
  CheckSquare,
  Compass,
  FolderPlus,
  Heart,
  Image as ImageIcon,
  Layers,
  ListMusic,
  MoreVertical,
  Music,
  Pause,
  Play,
  Plus,
  Search,
  Settings,
  SkipBack,
  SkipForward,
  Sparkles,
  Square,
  Trash2,
  Video as VideoIcon,
  X,
} from 'lucide-react';
import { ActionSheet, SheetEntry } from './components/ActionSheet';
import { BloodDripFringe } from './components/BloodDripFringe';
import { BrowserPage } from './components/BrowserPage';
import { DiyStudioModal } from './components/DiyStudioModal';
import { HyperScene } from './components/HyperScene';
import { NotesKeeperPage, TrackNotesModal } from './components/NotesKeeperPage';
import { NowPlayingView } from './components/NowPlayingView';
import {
  ArtViewerModal,
  LyricsEditorModal,
  PromptDialog,
  TagEditorModal,
} from './components/TagLyricsModals';
import { ThemeGalleryPage } from './components/ThemeGalleryPage';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { WallpapersPage } from './components/WallpapersPage';
import {
  BUILTIN_THEMES,
  DEFAULT_TABS,
  MATERIAL_FINISHES,
  deriveThemePaletteFromAccent,
  loadDIYThemes,
  saveDIYThemes,
} from './data/themes';
import {
  ActivePage,
  CornerStyle,
  FontStyle,
  KeeperEntry,
  MediaKind,
  PasswordRecord,
  PlayerState,
  Playlist,
  PostProcessFilter,
  TabKey,
  ThemePreset,
  Track,
} from './types/player';
import {
  deleteTrackRecord,
  getAllTracks,
  getMeta,
  getWallpaperAutoMeta,
  getWallpaperBlob,
  putMeta,
  putTrack,
  putWallpaperAutoMeta,
} from './utils/idb';
import {
  extractAudioMetadata,
  formatSize,
  formatTime,
  generateVideoThumb,
  knownVideo,
  oeName,
  readTextFile,
  ytId,
} from './utils/mediaParsers';

const EQ_BANDS = [60, 230, 910, 3600, 14000];
const EQ_PRESETS: { name: string; gains: number[] }[] = [
  { name: 'Flat / Studio', gains: [0, 0, 0, 0, 0] },
  { name: 'Sub-Bass Cinema', gains: [6, 4, 0, 1, 2] },
  { name: 'Blade Runner Synth', gains: [4, 2, -1, 3, 5] },
  { name: 'Vocal Clarity', gains: [-2, 0, 4, 4, 1] },
  { name: 'Rock & Analog', gains: [4, 2, -1, 3, 4] },
  { name: 'Electronic Club', gains: [5, 3, 0, 2, 5] },
  { name: 'Late Night', gains: [-3, -1, 2, 1, -2] },
];

const DEFAULT_STATE: PlayerState = {
  tab: 'music',
  mode: 'all',
  auto: true,
  shuf: false,
  rep: true,
  one: false,
  cur: {},
  pos: {},
  pls: [],
  sel: {},
  sort: { by: 'date', dir: -1, set: true },
  sortV: 2,
  fav: {},
  hid: {},
  st: {},
  npk: 'audio',
  theme: 'greenknight_crown',
  fx: 2,
  wetGlass: true,
  holograms: false,
  crowd: false,
  crowdLevel: 2,
  scene: 1,
  names: 1,
  rate: 1,
  vol: 0.9,
  eq: 0,
  minSec: 0,
  eng: 'brave',
  bm: ['https://archive.org', 'https://soundcloud.com'],
  bh: [],
  keep: [],
  vp: { auto: 1, rate: 1, mode: 0, scale: 0, style: 'glass', swipe: 1, badge: 1 },
  postProcess: 'none',
};

function fontCssFor(font?: FontStyle): string {
  switch (font) {
    case 'medieval':
      return "'IM Fell English', 'Cinzel', Georgia, serif";
    case 'gothic':
      return "'Cormorant Garamond', 'Cinzel', Georgia, serif";
    case 'serif':
      return "'Cinzel', Georgia, serif";
    case 'mono':
      return "'JetBrains Mono', ui-monospace, monospace";
    case 'cinema':
      return "'Rajdhani', 'Plus Jakarta Sans', system-ui, sans-serif";
    default:
      return "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
  }
}

function toRoman(num: number): string {
  const vals: [number, string][] = [
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let n = Math.max(1, num);
  let out = '';
  for (const [v, sym] of vals) {
    while (n >= v) {
      out += sym;
      n -= v;
    }
  }
  return out;
}

function EyeOfThunderaSvg({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#e11d24" stroke="#e2e8f0" strokeWidth="3.2" />
      <circle cx="32" cy="32" r="27" fill="none" stroke="#fbbf24" strokeWidth="1.2" opacity="0.8" />
      {/* Iconic snarling panther-head silhouette */}
      <path
        d="M32 11 C24 11 17 15 15 21 L12 14 L18 16 C21 12 26 10 32 10 C38 10 43 12 46 16 L52 14 L49 21 C47 15 40 11 32 11 Z"
        fill="#07080d"
      />
      <path
        d="M17 24 C17 16 24 12 32 12 C40 12 47 16 47 24 C47 29 44 33 39 36 C45 38 49 43 48 50 C44 45 39 42 32 42 C25 42 20 45 16 50 C15 43 19 38 25 36 C20 33 17 29 17 24 Z"
        fill="#07080d"
        stroke="#fbbf24"
        strokeWidth="1.1"
      />
      {/* Sharp fierce eye & fang highlight */}
      <path d="M23 23 L29 25 L24 27 Z" fill="#fbbf24" />
      <path d="M41 23 L35 25 L40 27 Z" fill="#fbbf24" />
      <path d="M26 32 Q32 29 38 32" stroke="#e11d24" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function XMenBadgeSvg({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="#facc15" stroke="#090a0f" strokeWidth="4" />
      <circle cx="32" cy="32" r="23" fill="#101829" stroke="#ef4444" strokeWidth="2.5" />
      <path
        d="M17 17 L25 17 L32 26 L39 17 L47 17 L37 32 L47 47 L39 47 L32 38 L25 47 L17 47 L27 32 Z"
        fill="#facc15"
        stroke="#090a0f"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function KrakenTentacleSvg({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="#041219" stroke="#f59e0b" strokeWidth="2.5" />
      <path
        d="M14 50 C14 34, 24 20, 38 18 C47 17, 52 24, 46 31 C42 36, 34 34, 34 27 C34 23, 38 22, 41 24"
        fill="none"
        stroke="#14b8a6"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="20" cy="40" r="2.2" fill="#fef3c7" />
      <circle cx="25" cy="31" r="2" fill="#fef3c7" />
      <circle cx="32" cy="23" r="1.8" fill="#fef3c7" />
      <circle cx="44" cy="22" r="1.6" fill="#fef3c7" />
    </svg>
  );
}

function SteampunkGearSvg({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path
        d="M27 6 L37 6 L39 13 C41 13.8 43 14.8 44.8 16 L51.5 12.2 L58.5 19.2 L54.7 25.9 C55.9 27.7 56.9 29.7 57.7 31.7 L62 34 L62 42 L56.4 44 C55.4 46.2 54.1 48.2 52.6 50 L56 56 L49 62 L43 58 C41 59 38.8 59.8 36.6 60.2 L34 62 L30 62 L27.4 60.2 C25.2 59.8 23 59 21 58 L15 62 L8 56 L11.4 50 C9.9 48.2 8.6 46.2 7.6 44 L2 42 L2 34 L6.3 31.7 C7.1 29.7 8.1 27.7 9.3 25.9 L5.5 19.2 L12.5 12.2 L19.2 16 C21 14.8 23 13.8 25 13 Z"
        fill="#b45309"
        stroke="#fde68a"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="35" r="13" fill="#2a1608" stroke="#f59e0b" strokeWidth="2.5" />
      <circle cx="32" cy="35" r="4.5" fill="#fde68a" />
    </svg>
  );
}

function SteampunkGaugeSvg({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="28" fill="#1e1107" stroke="#d97706" strokeWidth="4" />
      <circle cx="32" cy="32" r="22" fill="#2b190b" stroke="#fde68a" strokeWidth="1.2" opacity="0.7" />
      <path d="M16 42 A 20 20 0 1 1 48 42" fill="none" stroke="#f59e0b" strokeWidth="2.4" strokeDasharray="3 4" />
      <path d="M32 32 L46 21" stroke="#ef4444" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="32" cy="32" r="4" fill="#fde68a" />
    </svg>
  );
}

function AlienUfoSvg({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {/* Conical neon-green abduction tractor beam */}
      <polygon points="24,24 40,24 54,58 10,58" fill="#39ff14" opacity="0.28" />
      <polygon points="27,24 37,24 45,58 19,58" fill="#4ade80" opacity="0.24" />
      {/* Cornstalk silhouettes in beam */}
      <path d="M22 58 L22 44 M22 50 L17 46 M22 48 L27 45 M42 58 L42 43 M42 50 L37 47 M42 48 L47 44" stroke="#86efac" strokeWidth="1.8" strokeLinecap="round" />
      {/* Flying saucer hull */}
      <ellipse cx="32" cy="21" rx="23" ry="6.5" fill="#111d17" stroke="#4ade80" strokeWidth="2.2" />
      <path d="M21 19 A11 8 0 0 1 43 19 Z" fill="#38bdf8" opacity="0.55" stroke="#86efac" strokeWidth="1.5" />
      <circle cx="17" cy="21" r="1.8" fill="#39ff14" />
      <circle cx="24" cy="22.5" r="1.8" fill="#38bdf8" />
      <circle cx="32" cy="23" r="1.8" fill="#39ff14" />
      <circle cx="40" cy="22.5" r="1.8" fill="#38bdf8" />
      <circle cx="47" cy="21" r="1.8" fill="#39ff14" />
    </svg>
  );
}

function D20DieSvg({ className = 'w-6 h-6', label = '20' }: { className?: string; label?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {/* Outer icosahedron hexagon */}
      <polygon
        points="32,4 57,18 57,46 32,60 7,46 7,18"
        fill="#991b1b"
        stroke="#fbbf24"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Central triangle face */}
      <polygon
        points="32,14 48,42 16,42"
        fill="#dc2626"
        stroke="#fde68a"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Polyhedral facet lines */}
      <path
        d="M32,4 L32,14 M57,18 L48,42 M7,18 L16,42 M32,60 L48,42 M32,60 L16,42 M7,46 L16,42 M57,46 L48,42 M7,18 L32,14 M57,18 L32,14"
        stroke="#fbbf24"
        strokeWidth="1.3"
        opacity="0.82"
      />
      <text
        x="32"
        y="36"
        textAnchor="middle"
        fill="#fef3c7"
        fontSize="13"
        fontWeight="900"
        fontFamily="Cinzel, Georgia, serif"
      >
        {label}
      </text>
    </svg>
  );
}

function TemplarHelmSvg({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {/* Great Crusade Helm silhouette */}
      <path
        d="M16 22 C16 10, 48 10, 48 22 L50 52 C42 57, 22 57, 14 52 Z"
        fill="#1e293b"
        stroke="#cbd5e1"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      {/* Brass Crusade Cross */}
      <path d="M32 13 V52 M17 28 H47" stroke="#b91c1c" strokeWidth="4.2" strokeLinecap="round" />
      <path d="M32 13 V52 M17 28 H47" stroke="#fbbf24" strokeWidth="1.4" strokeLinecap="round" />
      {/* Visor Eye Slits */}
      <rect x="20" y="25" width="9" height="3.2" rx="1" fill="#020617" />
      <rect x="35" y="25" width="9" height="3.2" rx="1" fill="#020617" />
      {/* Breathing perforations */}
      <circle cx="22" cy="36" r="1.4" fill="#94a3b8" />
      <circle cx="26" cy="40" r="1.4" fill="#94a3b8" />
      <circle cx="22" cy="44" r="1.4" fill="#94a3b8" />
      <circle cx="42" cy="36" r="1.4" fill="#94a3b8" />
      <circle cx="38" cy="40" r="1.4" fill="#94a3b8" />
      <circle cx="42" cy="44" r="1.4" fill="#94a3b8" />
    </svg>
  );
}

function CrusaderShieldSvg({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path
        d="M12 10 L52 10 L52 33 C52 46, 32 58, 32 58 C32 58, 12 46, 12 33 Z"
        fill="#1e293b"
        stroke="#cbd5e1"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path d="M32 14 V52 M16 27 H48" stroke="#dc2626" strokeWidth="5.2" />
      <circle cx="17" cy="15" r="1.4" fill="#cbd5e1" />
      <circle cx="47" cy="15" r="1.4" fill="#cbd5e1" />
    </svg>
  );
}

function MedievalSwordSvg({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M48 8 L54 10 L29 41 L23 35 Z" fill="#cbd5e1" stroke="#f8fafc" strokeWidth="1.5" />
      <path d="M18 30 L34 46" stroke="#b91c1c" strokeWidth="4" strokeLinecap="round" />
      <path d="M22 42 L13 51" stroke="#78350f" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="11.5" cy="52.5" r="3" fill="#fbbf24" />
    </svg>
  );
}

function WolfMedallionSvg({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <polygon
        points="32,5 56,22 50,48 32,59 14,48 8,22"
        fill="#18181b"
        stroke="#cbd5e1"
        strokeWidth="2.2"
      />
      {/* Angular White Wolf Ears & Snout */}
      <polygon points="15,18 23,10 25,24" fill="#94a3b8" stroke="#f8fafc" strokeWidth="1.2" />
      <polygon points="49,18 41,10 39,24" fill="#94a3b8" stroke="#f8fafc" strokeWidth="1.2" />
      <polygon points="20,24 32,20 44,24 41,42 32,54 23,42" fill="#3f3f46" stroke="#e4e4e7" strokeWidth="1.4" />
      {/* Glowing Witcher Cat-Eyes */}
      <polygon points="22,30 29,33 23,35" fill="#f59e0b" />
      <polygon points="42,30 35,33 41,35" fill="#f59e0b" />
      {/* Snarl Fang Slit */}
      <path d="M26 43 L32 48 L38 43" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

type WitcherSignKind = 'IGNI' | 'AARD' | 'QUEN' | 'YRDEN' | 'AXII';

function WitcherSignSvg({
  sign,
  className = 'w-4 h-4',
}: {
  sign: WitcherSignKind;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      {sign === 'IGNI' && (
        <g stroke="#f97316" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="16,4 27,22 5,22" />
          <line x1="9" y1="27" x2="23" y2="27" />
        </g>
      )}
      {sign === 'AARD' && (
        <g stroke="#38bdf8" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="5,22 16,5 27,22" />
          <polyline points="9.5,22 16,12 22.5,22" />
          <line x1="8" y1="27" x2="24" y2="27" />
        </g>
      )}
      {sign === 'QUEN' && (
        <g stroke="#fbbf24" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5,7 27,7 16,27" />
          <line x1="10" y1="14" x2="22" y2="14" />
        </g>
      )}
      {sign === 'YRDEN' && (
        <g stroke="#a855f7" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="6,6 26,6 6,26 26,26" />
          <line x1="16" y1="4" x2="16" y2="28" />
        </g>
      )}
      {sign === 'AXII' && (
        <g stroke="#34d399" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5,7 27,7 16,27" />
        </g>
      )}
    </svg>
  );
}

export default function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [state, setState] = useState<PlayerState>(DEFAULT_STATE);
  const [diyThemes, setDiyThemes] = useState<Record<string, ThemePreset>>(() => loadDIYThemes());
  const [hydrated, setHydrated] = useState(false);

  // Active routes / overlays
  const [page, setPage] = useState<ActivePage>('');
  const [diyEditKey, setDiyEditKey] = useState<string | undefined>(undefined);
  const [diyStudioSeed, setDiyStudioSeed] = useState<ThemePreset | undefined>(undefined);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [dragOver, setDragOver] = useState(false);

  // Selection mode
  const [selMode, setSelMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Sheets & Modals
  const [sheet, setSheet] = useState<{ open: boolean; title: string; entries: SheetEntry[] }>({
    open: false,
    title: '',
    entries: [],
  });
  const [promptDlg, setPromptDlg] = useState<{
    open: boolean;
    title: string;
    subtitle?: string;
    placeholder?: string;
    defaultValue?: string;
    confirmLabel?: string;
    onConfirm: (val: string) => void;
  }>({
    open: false,
    title: '',
    onConfirm: () => {},
  });
  const [editTrackId, setEditTrackId] = useState<number | null>(null);
  const [artViewerTrackId, setArtViewerTrackId] = useState<number | null>(null);
  const [keeperUnlocked, setKeeperUnlocked] = useState(false);

  // Playback state
  const [playing, setPlaying] = useState(false);
  const [curTime, setCurTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [nextQueue, setNextQueue] = useState<number[]>([]);
  const [sleepEndAt, setSleepEndAt] = useState<number | null>(null);
  const [toast, setToast] = useState<string>('');
  const [dndRoll, setDndRoll] = useState<{ die: string; val: number }>({ die: 'd20', val: 20 });
  const [witcherSign, setWitcherSign] = useState<WitcherSignKind>('IGNI');
  const [templarTool, setTemplarTool] = useState<'HELM' | 'SWORD' | 'SHIELD'>('HELM');

  // Custom Wallpaper Object URL
  const [wallUrl, setWallUrl] = useState<string>('');
  const [wallIsVideo, setWallIsVideo] = useState(false);

  // Cover & thumb URLs cache
  const [coverUrls, setCoverUrls] = useState<Record<number, string>>({});
  const coverMapRef = useRef<Record<number, string>>({});
  const audUrlRef = useRef<string>('');
  const bkUrlRef = useRef<string>('');
  const vidUrlRef = useRef<string>('');
  const wallUrlRef = useRef<string>('');
  const toastTimerRef = useRef<number | null>(null);

  // Media Refs
  const audRef = useRef<HTMLAudioElement | null>(null);
  const bkRef = useRef<HTMLAudioElement | null>(null);
  const vidRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const backupInputRef = useRef<HTMLInputElement | null>(null);

  // WebAudio EQ refs
  const eqCtxRef = useRef<AudioContext | null>(null);
  const eqFiltersRef = useRef<BiquadFilterNode[]>([]);
  const eqWiredRef = useRef(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(''), 2600);
  }, []);

  const allThemes = useMemo(
    () => ({ ...BUILTIN_THEMES, ...diyThemes }),
    [diyThemes]
  );

  const activeTheme: ThemePreset = useMemo(() => {
    const base = allThemes[state.theme] || BUILTIN_THEMES.bladerunner;
    if (state.accent) {
      const p = deriveThemePaletteFromAccent(state.accent, !!base.light);
      return { ...base, accent: p.accent, pe: p.pe };
    }
    return base;
  }, [allThemes, state.theme, state.accent]);

  const layoutMode = activeTheme.layoutMode || 'default';
  const isBatman = layoutMode === 'batman2022';
  const isSleepy = layoutMode === 'sleepyhollow';
  const isGkCrown = layoutMode === 'greenknight_crown';
  const isGkWood = layoutMode === 'greenknight_wood';
  const isGreenKnight = isGkCrown || isGkWood;
  const isCastlevania = layoutMode === 'castlevania';
  const isDune = layoutMode === 'dune';
  const isAkira = layoutMode === 'akira1988';
  const isRpo = layoutMode === 'readyplayerone';
  const isGits = layoutMode === 'ghostintheshell';
  const isThundercats = layoutMode === 'thundercats';
  const isXmen = layoutMode === 'xmen90s';
  const isMatrix = layoutMode === 'matrixgreen';
  const isPirates = layoutMode === 'piratesabyss';
  const isSteampunk = layoutMode === 'steampunk_engine';
  const isAlien = layoutMode === 'alienfarm';
  const isDnd = layoutMode === 'dndtable';
  const isTemplar = layoutMode === 'templar_rain';
  const isWitcher = layoutMode === 'witcher_signs';

  const uiCopy = useMemo(() => {
    if (isGits) {
      return {
        addBtn: '追加',
        addFolderBtn: 'フォルダ取込',
        addUrlBtn: '電脳URL接続',
        featuresBtn: '電脳機能',
        wallTab: '壁紙網',
        explorerTab: '電脳網',
        keeperTab: '機密帳',
        searchPlaceholder: '>> 公安9課 // 電脳記憶・楽曲・映像・記録を検索…',
        smartHeading: '公安九課・自動記憶庫',
        customHeading: '電脳プレイリスト',
        newPlaylistBtn: '新規記憶集',
        favLabel: 'お気に入り',
        recentLabel: '再生履歴',
        mostLabel: '高頻度再生',
        hidLabel: '隔離領域',
        itemSingular: '件',
        itemPlural: '件',
      };
    }
    if (isGreenKnight) {
      return {
        addBtn: 'Inscribe',
        addFolderBtn: 'Gather Folio',
        addUrlBtn: 'Distant Heraldry',
        featuresBtn: 'Features',
        wallTab: 'Tapestries',
        explorerTab: 'Pilgrimage',
        keeperTab: 'Scriptorium',
        searchPlaceholder: 'Seek minstrelsy, ballads, chronicles…',
        smartHeading: 'Royal Archives & Scrolls',
        customHeading: 'Bound Scrolls',
        newPlaylistBtn: 'Bind Scroll',
        favLabel: 'Royal Favours',
        recentLabel: 'Recently Sung',
        mostLabel: 'Grandest Hymns',
        hidLabel: 'Sealed Vault',
        itemSingular: 'scroll',
        itemPlural: 'scrolls',
      };
    }
    if (isCastlevania) {
      return {
        addBtn: 'Summon',
        addFolderBtn: 'Harvest Tome',
        addUrlBtn: 'Night Portal',
        featuresBtn: 'Features',
        wallTab: 'Tapestries',
        explorerTab: 'Belmont Hold',
        keeperTab: 'Grimoires',
        searchPlaceholder: 'Hunt nocturnes, blood hymns, tomes…',
        smartHeading: 'Nocturnal Vaults & Bloodlines',
        customHeading: 'Crimson Grimoires',
        newPlaylistBtn: 'Bind Grimoire',
        favLabel: 'Blood Oaths',
        recentLabel: 'Recent Hunt',
        mostLabel: 'Darkest Hymns',
        hidLabel: 'Catacombs',
        itemSingular: 'relic',
        itemPlural: 'relics',
      };
    }
    if (isDune) {
      return {
        addBtn: 'Harvest',
        addFolderBtn: 'Ingest Sandreel',
        addUrlBtn: 'Relay Signal',
        featuresBtn: 'Features',
        wallTab: 'Mirages',
        explorerTab: 'Desert Recon',
        keeperTab: 'Sand Chronicles',
        searchPlaceholder: 'Seek tracks, sietch chants, wind-reels…',
        smartHeading: 'Sietch Vaults & Dune Archives',
        customHeading: 'Spice Collections',
        newPlaylistBtn: 'Bind Collection',
        favLabel: 'Solar Favours',
        recentLabel: 'Recent Crossing',
        mostLabel: 'Most Revered',
        hidLabel: 'Deep Sietch',
        itemSingular: 'reel',
        itemPlural: 'reels',
      };
    }
    if (isAkira) {
      return {
        addBtn: 'JACK IN',
        addFolderBtn: 'GARAGE DUMP',
        addUrlBtn: 'SECTOR LINK',
        featuresBtn: 'FEATURES',
        wallTab: 'Skylines',
        explorerTab: 'Neo-Tokyo Grid',
        keeperTab: 'Capsules',
        searchPlaceholder: '>> SCAN NEO-TOKYO SECTOR 28 / MOTO / TRACKS…',
        smartHeading: 'Neo-Tokyo Sectors & Towers',
        customHeading: 'Capsule Decks',
        newPlaylistBtn: 'New Capsule',
        favLabel: 'Bike Racks',
        recentLabel: 'Recent Run',
        mostLabel: 'High RPM',
        hidLabel: 'Sub-Level 0',
        itemSingular: 'disk',
        itemPlural: 'disks',
      };
    }
    if (isRpo) {
      return {
        addBtn: 'Loot Cache',
        addFolderBtn: 'Aech’s Garage',
        addUrlBtn: 'OASIS Warp',
        featuresBtn: 'Anorak’s Features',
        wallTab: 'Holo Cards',
        explorerTab: 'The OASIS',
        keeperTab: 'Halliday’s Vault',
        searchPlaceholder: 'Scan Anorak’s Almanac, Three Keys, Gunter Caches…',
        smartHeading: 'The Three Keys & Halliday Relics',
        customHeading: 'Gunter Caches',
        newPlaylistBtn: 'Forge Cache',
        favLabel: 'Copper Key Vault',
        recentLabel: 'Zemeckis Cube',
        mostLabel: 'High Score Table',
        hidLabel: 'IOI Sixer Lock',
        itemSingular: 'artifact',
        itemPlural: 'artifacts',
      };
    }
    if (isThundercats) {
      return {
        addBtn: 'Sword Charge',
        addFolderBtn: 'ThunderTank Load',
        addUrlBtn: 'Third Earth Relay',
        featuresBtn: 'Omens & DIY',
        wallTab: 'Cats Lair Art',
        explorerTab: 'Third Earth',
        keeperTab: 'Book of Omens',
        searchPlaceholder: '>> SIGHT BEYOND SIGHT — SCAN CATS LAIR / THIRD EARTH / MUTANTS…',
        smartHeading: 'Eye of Thundera & Cats Lair Vaults',
        customHeading: 'Third Earth Mixes',
        newPlaylistBtn: 'Forge Archive',
        favLabel: 'Lion-O’s Chosen',
        recentLabel: 'Sword Signal',
        mostLabel: 'Thundrillium Peak',
        hidLabel: 'Black Pyramid',
        itemSingular: 'omen',
        itemPlural: 'omens',
      };
    }
    if (isXmen) {
      return {
        addBtn: 'Danger Add',
        addFolderBtn: 'X-Jet Cargo',
        addUrlBtn: 'Cerebro Signal',
        featuresBtn: 'Cerebro & DIY',
        wallTab: '90s Cards',
        explorerTab: 'Cerebro Net',
        keeperTab: 'Xavier Files',
        searchPlaceholder: '>> CEREBRO SCAN — MUTANT SIGNATURES, TRACKS & VOLUMES…',
        smartHeading: 'Danger Room & Cerebro Vaults',
        customHeading: 'Mutant Mixes',
        newPlaylistBtn: 'New Briefing',
        favLabel: 'Omega Level',
        recentLabel: 'Blackbird Log',
        mostLabel: 'Danger Peak',
        hidLabel: 'Sub-Basement',
        itemSingular: 'issue',
        itemPlural: 'issues',
      };
    }
    if (isMatrix) {
      return {
        addBtn: 'LOAD CODE',
        addFolderBtn: 'CONSTRUCT DUMP',
        addUrlBtn: 'JACK IN URL',
        featuresBtn: 'MAINFRAME DIY',
        wallTab: 'CODE CARDS',
        explorerTab: 'ZION MATRIX',
        keeperTab: 'RED PILL LOG',
        searchPlaceholder: '>> TRACE MATRIX SIGNAL // CODE STREAMS & FILES…',
        smartHeading: 'Construct Subroutines & Streams',
        customHeading: 'Operator Programs',
        newPlaylistBtn: 'COMPILE PROGRAM',
        favLabel: 'THE ONE PICKS',
        recentLabel: 'RECENT TRACE',
        mostLabel: 'CORE CASCADE',
        hidLabel: 'BACKDOOR VAULT',
        itemSingular: 'node',
        itemPlural: 'nodes',
      };
    }
    if (isPirates) {
      return {
        addBtn: 'Plunder',
        addFolderBtn: 'Hoist Cargo',
        addUrlBtn: 'Compass Chart',
        featuresBtn: 'Kraken & DIY',
        wallTab: 'Sea Cards',
        explorerTab: 'Dark Seas',
        keeperTab: 'Captain’s Log',
        searchPlaceholder: 'Search sea shanties, abyssal logs, cursed galleons…',
        smartHeading: 'Abyssal Chests & Sea Logs',
        customHeading: 'Pirate Charts',
        newPlaylistBtn: 'Chart Course',
        favLabel: 'Doubloon Chest',
        recentLabel: 'Last Tide',
        mostLabel: 'Siren’s Call',
        hidLabel: 'Davy Jones Locker',
        itemSingular: 'cask',
        itemPlural: 'casks',
      };
    }
    if (isSteampunk) {
      return {
        addBtn: 'Valve Load',
        addFolderBtn: 'Boiler Intake',
        addUrlBtn: 'Telegraph Pipe',
        featuresBtn: 'Steam Valves & DIY',
        wallTab: 'Brass Plates',
        explorerTab: 'Airship Dock',
        keeperTab: 'Machinist Log',
        searchPlaceholder: '>> PRESSURE CHECK — SCAN PISTONS, BOILERS & CYLINDERS…',
        smartHeading: 'Boiler Chambers & Gear Assemblies',
        customHeading: 'Brass Cylinders',
        newPlaylistBtn: 'Forge Cylinder',
        favLabel: 'Prime Pressure',
        recentLabel: 'Piston Cycle',
        mostLabel: 'Peak RPM',
        hidLabel: 'Sealed Furnace',
        itemSingular: 'cog',
        itemPlural: 'cogs',
      };
    }
    if (isAlien) {
      return {
        addBtn: 'Beam Up',
        addFolderBtn: 'Crop Sector',
        addUrlBtn: 'SETI Signal',
        featuresBtn: 'UFO Features & DIY',
        wallTab: 'Field Cards',
        explorerTab: 'Radar Grid',
        keeperTab: 'Abduction Log',
        searchPlaceholder: '>> SCAN SECTOR 04 CORNFIELDS // UFO SIGNALS & TRANSMISSIONS…',
        smartHeading: 'Tractor Beam Caches & Field Scans',
        customHeading: 'Crop Circle Sets',
        newPlaylistBtn: 'Mark Crop Ring',
        favLabel: 'Prime Signals',
        recentLabel: 'Night Sightings',
        mostLabel: 'Peak Frequency',
        hidLabel: 'Hangar 51',
        itemSingular: 'signal',
        itemPlural: 'signals',
      };
    }
    if (isDnd) {
      return {
        addBtn: 'Roll & Add',
        addFolderBtn: 'Dice Bag',
        addUrlBtn: 'Spell Scroll URL',
        featuresBtn: 'd20 Features & DIY',
        wallTab: 'Campaign Cards',
        explorerTab: 'World Map',
        keeperTab: 'DM Ledger',
        searchPlaceholder: 'Search tavern ballads, dragon encounters, dungeon quests…',
        smartHeading: 'Dungeon Master Vault & Dice Sets',
        customHeading: 'Bound Campaign Ledgers',
        newPlaylistBtn: 'Inscribe Quest',
        favLabel: 'Nat 20 Favours',
        recentLabel: 'Last Encounter',
        mostLabel: 'Crit Rotation',
        hidLabel: 'Mimic Chest',
        itemSingular: 'scroll',
        itemPlural: 'scrolls',
      };
    }
    if (isTemplar) {
      return {
        addBtn: 'Rally & Add',
        addFolderBtn: 'Abbey Crate',
        addUrlBtn: 'Bell Signal',
        featuresBtn: 'Arsenal & DIY',
        wallTab: 'Tapestries',
        explorerTab: 'Crusade Map',
        keeperTab: 'Order Vows',
        searchPlaceholder: 'Search battle hymns, rainy siege chronicles, medieval tomes…',
        smartHeading: 'Templar Armory & Storm Vaults',
        customHeading: 'Crusader Orders',
        newPlaylistBtn: 'Forge Order',
        favLabel: 'Sworn Oaths',
        recentLabel: 'Night Watch',
        mostLabel: 'Battle Calls',
        hidLabel: 'Crypt Vault',
        itemSingular: 'relic',
        itemPlural: 'relics',
      };
    }
    if (isWitcher) {
      return {
        addBtn: 'Accept Contract',
        addFolderBtn: 'Alchemist Satchel',
        addUrlBtn: 'Megascope URL',
        featuresBtn: 'Signs & DIY',
        wallTab: 'Bestiary Cards',
        explorerTab: 'The Continent',
        keeperTab: 'Contract Board',
        searchPlaceholder: 'Trace contracts, Kaer Morhen ballads, Witcher runes…',
        smartHeading: 'School of the Wolf · Sign Vaults',
        customHeading: 'Witcher Contracts',
        newPlaylistBtn: 'Post Contract',
        favLabel: 'Trophy Rack',
        recentLabel: 'Fresh Trail',
        mostLabel: 'Most Hunted',
        hidLabel: 'Forbidden Chaos',
        itemSingular: 'contract',
        itemPlural: 'contracts',
      };
    }
    return {
      addBtn: isBatman ? 'INGEST' : 'Add',
      addFolderBtn: 'Import Folder',
      addUrlBtn: 'Play Stream URL',
      featuresBtn: isBatman ? 'FEATURES' : 'Features',
      wallTab: 'Wallpapers',
      explorerTab: 'Explorer',
      keeperTab: 'Notes Keeper',
      searchPlaceholder: isBatman
        ? '>> QUERY CIPHER / CASE TRACKS / ARTISTS…'
        : isSleepy
          ? 'Search ledger entries, recordings, chronicles…'
          : 'Filter tracks, artists, albums, folders…',
      smartHeading: 'Smart Lists & Archive',
      customHeading: 'Custom Playlists',
      newPlaylistBtn: 'New Playlist',
      favLabel: 'Favorites',
      recentLabel: 'Recently Played',
      mostLabel: 'Most Played',
      hidLabel: 'Hidden Vault',
      itemSingular: 'item',
      itemPlural: 'items',
    };
  }, [
    isGits,
    isGreenKnight,
    isCastlevania,
    isBatman,
    isSleepy,
    isDune,
    isAkira,
    isRpo,
    isThundercats,
    isXmen,
    isMatrix,
    isPirates,
    isSteampunk,
    isAlien,
    isDnd,
    isTemplar,
    isWitcher,
  ]);

  const cornerStyle: CornerStyle = state.corner ?? activeTheme.corner ?? '';
  const fontStyle: FontStyle = state.font || activeTheme.font || 'clean';

  const cardRadiusClass =
    isBatman || isCastlevania || isAkira || isRpo || isGits || isThundercats || isXmen || isMatrix
      ? 'rounded-[3px]'
      : isSleepy || isGreenKnight || isDune || isPirates || isSteampunk || isAlien || isDnd || isTemplar || isWitcher
        ? 'rounded-[4px]'
        : cornerStyle === 'sharp'
          ? 'rounded-md'
          : cornerStyle === 'round'
            ? 'rounded-3xl'
            : 'rounded-2xl';
  const chipRadiusClass =
    isBatman || isCastlevania || isAkira || isRpo || isGits || isThundercats || isXmen || isMatrix
      ? 'rounded-[3px]'
      : isSleepy || isGreenKnight || isDune || isPirates || isSteampunk || isAlien || isDnd || isTemplar || isWitcher
        ? 'rounded-[4px]'
        : cornerStyle === 'sharp'
          ? 'rounded'
          : cornerStyle === 'round'
            ? 'rounded-2xl'
            : 'rounded-xl';

  const materialTextureClass =
    activeTheme.material === 'anodized-titanium' || activeTheme.material === 'brushed-brass'
      ? 'material-brushed-metal'
      : activeTheme.material === 'forged-carbon'
        ? 'material-carbon'
        : activeTheme.material === 'volcanic-obsidian'
          ? 'material-obsidian'
          : '';

  const themePanelClass = isBatman
    ? 'batman-panel'
    : isSleepy
      ? 'sleepy-panel'
      : isGkCrown
        ? 'gk-crown-panel'
        : isGkWood
          ? 'gk-wood-panel'
          : isCastlevania
            ? 'castlevania-panel'
            : isDune
              ? 'dune-panel'
              : isAkira
                ? 'akira-panel'
                : isRpo
                  ? 'rpo-panel'
                  : isGits
                    ? 'gits-panel'
                    : isThundercats
                      ? 'thundercats-panel'
                      : isXmen
                        ? 'xmen-panel'
                        : isMatrix
                          ? 'matrix-panel'
                          : isPirates
                            ? 'pirates-panel'
                            : isSteampunk
                              ? 'steampunk-panel'
                              : isAlien
                                ? 'alien-panel'
                                : isDnd
                                  ? 'dnd-panel'
                                  : isTemplar
                                    ? 'templar-panel'
                                    : isWitcher
                                      ? 'witcher-panel'
                                      : `mat-panel ${materialTextureClass}`;

  const themeCardClass = isBatman
    ? 'batman-card'
    : isSleepy
      ? 'sleepy-card'
      : isGkCrown
        ? 'gk-crown-card'
        : isGkWood
          ? 'gk-wood-card'
          : isCastlevania
            ? 'castlevania-card'
            : isDune
              ? 'dune-card'
              : isAkira
                ? 'akira-card'
                : isRpo
                  ? 'rpo-card'
                  : isGits
                    ? 'gits-card'
                    : isThundercats
                      ? 'thundercats-card'
                      : isXmen
                        ? 'xmen-card'
                        : isMatrix
                          ? 'matrix-card'
                          : isPirates
                            ? 'pirates-card'
                            : isSteampunk
                              ? 'steampunk-card'
                              : isAlien
                                ? 'alien-card'
                                : isDnd
                                  ? 'dnd-card'
                                  : isTemplar
                                    ? 'templar-card'
                                    : isWitcher
                                      ? 'witcher-card'
                                      : `mat-surface ${materialTextureClass}`;

  // Sync CSS Variables to documentElement
  useEffect(() => {
    const root = document.documentElement.style;
    const mat =
      MATERIAL_FINISHES.find((m) => m.id === activeTheme.material) || MATERIAL_FINISHES[0];

    root.setProperty('--or', activeTheme.accent);
    root.setProperty('--pe', activeTheme.pe);
    root.setProperty('--bg', activeTheme.bg);
    root.setProperty('--chip', activeTheme.chip);
    root.setProperty('--mu', activeTheme.mu);
    root.setProperty('--np', activeTheme.np);
    root.setProperty('--sh', activeTheme.sh);
    root.setProperty('--fg', activeTheme.fg);
    root.setProperty('--ff', fontCssFor(fontStyle));
    root.setProperty('--mat-blur', `${mat.blur}px`);
    root.setProperty(
      '--mat-border',
      activeTheme.light
        ? `rgba(15, 23, 42, ${mat.borderAlpha})`
        : `color-mix(in srgb, ${activeTheme.accent} ${Math.round(mat.borderAlpha * 100)}%, rgba(255,255,255,0.22))`
    );
    root.setProperty(
      '--mat-highlight',
      `rgba(255, 255, 255, ${mat.highlightAlpha})`
    );
    root.colorScheme = activeTheme.light ? 'light' : 'dark';
  }, [activeTheme, fontStyle]);

  // Sync Global Cinematic Post-Processing filter to root HTML element
  useEffect(() => {
    const el = document.documentElement;
    el.classList.remove('post-fx-noir', 'post-fx-vellum', 'post-fx-cyber');
    const mode = state.postProcess || 'none';
    if (mode === 'noir-film-grain') el.classList.add('post-fx-noir');
    else if (mode === 'aged-vellum') el.classList.add('post-fx-vellum');
    else if (mode === 'cyber-blue-tint') el.classList.add('post-fx-cyber');
    return () => {
      el.classList.remove('post-fx-noir', 'post-fx-vellum', 'post-fx-cyber');
    };
  }, [state.postProcess]);

  // Apply custom wallpaper blob
  const applyWallBlob = useCallback((blob: Blob | null) => {
    if (wallUrlRef.current) {
      URL.revokeObjectURL(wallUrlRef.current);
      wallUrlRef.current = '';
    }
    if (!blob) {
      setWallUrl('');
      setWallIsVideo(false);
      return;
    }
    const url = URL.createObjectURL(blob);
    wallUrlRef.current = url;
    setWallUrl(url);
    setWallIsVideo(blob.type.startsWith('video/'));
  }, []);

  // Hydrate from IndexedDB on mount
  useEffect(() => {
    let alive = true;
    (async () => {
      const [loadedTracks, savedState, savedWall] = await Promise.all([
        getAllTracks(),
        getMeta<Partial<PlayerState>>('state'),
        getMeta<Blob>('wall'),
      ]);
      if (!alive) return;

      if (savedState) {
        setState((prev) => ({
          ...prev,
          ...savedState,
          sort: savedState.sort || prev.sort,
          vp: { ...prev.vp, ...savedState.vp },
        }));
      }
      setTracks(loadedTracks);
      if (savedWall instanceof Blob && savedWall.size > 0) {
        applyWallBlob(savedWall);
      }
      setHydrated(true);

      // Background metadata enrichment for tracks missing cover/dur/thumb
      for (const tr of loadedTracks) {
        if (!alive) break;
        if (tr.kind === 'video' && !tr.thumb && !tr.thumbTried && tr.blob) {
          tr.thumbTried = 1;
          await generateVideoThumb(tr);
          await putTrack(tr);
          if (alive) setTracks((prev) => prev.map((x) => (x.id === tr.id ? { ...tr } : x)));
        } else if (
          (tr.kind === 'audio' || tr.kind === 'book') &&
          !tr.artTried &&
          tr.blob &&
          (!tr.emb || !tr.dur)
        ) {
          tr.artTried = 1;
          await extractAudioMetadata(tr);
          await putTrack(tr);
          if (alive) setTracks((prev) => prev.map((x) => (x.id === tr.id ? { ...tr } : x)));
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [applyWallBlob]);

  // Persist state changes
  useEffect(() => {
    if (!hydrated) return;
    putMeta('state', state);
  }, [state, hydrated]);

  // Keep cover/thumb ObjectURLs synced with tracks
  useEffect(() => {
    const next: Record<number, string> = { ...coverMapRef.current };
    const activeIds = new Set<number>();

    for (const tr of tracks) {
      activeIds.add(tr.id);
      const blob = tr.cover || tr.emb || tr.thumb;
      if (blob && !next[tr.id]) {
        next[tr.id] = URL.createObjectURL(blob);
      } else if (!blob && next[tr.id]) {
        URL.revokeObjectURL(next[tr.id]);
        delete next[tr.id];
      }
    }

    for (const idStr of Object.keys(next)) {
      const id = Number(idStr);
      if (!activeIds.has(id)) {
        URL.revokeObjectURL(next[id]);
        delete next[id];
      }
    }

    coverMapRef.current = next;
    setCoverUrls(next);
  }, [tracks]);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(coverMapRef.current).forEach((u) => URL.revokeObjectURL(u));
      if (audUrlRef.current) URL.revokeObjectURL(audUrlRef.current);
      if (bkUrlRef.current) URL.revokeObjectURL(bkUrlRef.current);
      if (vidUrlRef.current) URL.revokeObjectURL(vidUrlRef.current);
      if (wallUrlRef.current) URL.revokeObjectURL(wallUrlRef.current);
    };
  }, []);

  // Wallpaper auto-rotation ticker
  useEffect(() => {
    const checkRotation = async () => {
      const meta = await getWallpaperAutoMeta();
      if (!meta || !meta.active || !meta.interval) return;
      const pl = meta.playlists.find((p) => p.id === meta.active);
      if (!pl || !pl.ids.length) return;
      if (Date.now() < (meta.nextAt || 0)) return;

      const idx = Math.max(0, pl.ids.indexOf(meta.lastId));
      const nextId = pl.ids[(idx + 1) % pl.ids.length];
      const blob = await getWallpaperBlob(nextId);
      if (blob) {
        await putMeta('wall', blob);
        applyWallBlob(blob);
        await putWallpaperAutoMeta({
          ...meta,
          lastId: nextId,
          nextAt: Date.now() + meta.interval,
        });
      }
    };
    const t = window.setInterval(checkRotation, 45000);
    return () => window.clearInterval(t);
  }, [applyWallBlob]);

  // Sleep timer
  useEffect(() => {
    if (!sleepEndAt) return;
    const t = window.setInterval(() => {
      if (Date.now() >= sleepEndAt) {
        setSleepEndAt(null);
        audRef.current?.pause();
        bkRef.current?.pause();
        vidRef.current?.pause();
        setPlaying(false);
        showToast('Sleep timer paused playback');
      }
    }, 1000);
    return () => window.clearInterval(t);
  }, [sleepEndAt, showToast]);

  const updateState = useCallback((patch: Partial<PlayerState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateTrack = useCallback((trackId: number, patch: Partial<Track>) => {
    setTracks((prev) =>
      prev.map((tr) => {
        if (tr.id !== trackId) return tr;
        const updated = { ...tr, ...patch };
        putTrack(updated);
        return updated;
      })
    );
  }, []);

  // Wire WebAudio 5-band Equalizer lazily on first audio play
  const ensureEq = useCallback(() => {
    if (eqWiredRef.current || !audRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const src = ctx.createMediaElementSource(audRef.current);
      const filters = EQ_BANDS.map((freq, idx) => {
        const f = ctx.createBiquadFilter();
        f.type = idx === 0 ? 'lowshelf' : idx === EQ_BANDS.length - 1 ? 'highshelf' : 'peaking';
        f.frequency.value = freq;
        f.Q.value = 1.1;
        f.gain.value = (EQ_PRESETS[state.eq || 0] || EQ_PRESETS[0]).gains[idx] || 0;
        return f;
      });
      let node: AudioNode = src;
      for (const f of filters) {
        node.connect(f);
        node = f;
      }
      node.connect(ctx.destination);
      eqCtxRef.current = ctx;
      eqFiltersRef.current = filters;
      eqWiredRef.current = true;
    } catch {
      // ignore if CORS / AudioContext restricted
    }
  }, [state.eq]);

  useEffect(() => {
    const preset = EQ_PRESETS[state.eq || 0] || EQ_PRESETS[0];
    eqFiltersRef.current.forEach((f, idx) => {
      f.gain.value = preset.gains[idx] || 0;
    });
  }, [state.eq]);

  // Apply volume & playbackRate to audio elements
  useEffect(() => {
    const v = state.vol ?? 0.9;
    const r = state.rate ?? 1;
    if (audRef.current) {
      audRef.current.volume = v;
      audRef.current.playbackRate = r;
    }
    if (bkRef.current) {
      bkRef.current.volume = v;
      bkRef.current.playbackRate = r;
    }
  }, [state.vol, state.rate]);

  // Current tracks by kind
  const activeKind: MediaKind =
    state.tab === 'video' ? 'video' : state.tab === 'books' ? 'book' : 'audio';

  const npKind: 'audio' | 'book' = state.npk === 'book' ? 'book' : 'audio';
  const currentAudioId = state.cur[npKind];
  const currentAudioTrack = useMemo(
    () => tracks.find((t) => t.id === currentAudioId) || null,
    [tracks, currentAudioId]
  );
  const currentVideoTrack = useMemo(
    () => tracks.find((t) => t.id === state.cur.video) || null,
    [tracks, state.cur.video]
  );
  const editTrack = useMemo(
    () => tracks.find((t) => t.id === editTrackId) || null,
    [tracks, editTrackId]
  );
  const artViewerTrack = useMemo(
    () => tracks.find((t) => t.id === artViewerTrackId) || null,
    [tracks, artViewerTrackId]
  );

  // Sorted & filtered track list for current tab
  const visibleTracks = useMemo(() => {
    const targetKind: MediaKind =
      state.tab === 'video' ? 'video' : state.tab === 'books' ? 'book' : 'audio';
    const selPl = state.sel[targetKind];
    const hidMap = state.hid || {};
    const favMap = state.fav || {};
    const stats = state.st || {};

    let list = tracks.filter((t) => {
      if (t.kind !== targetKind) return false;
      if (selPl === 'hid') return !!hidMap[t.id];
      if (hidMap[t.id]) return false;
      if (selPl === 'fav') return !!favMap[t.id];
      if (selPl === 'recent') return (stats[t.id]?.l || 0) > 0;
      if (selPl === 'most') return (stats[t.id]?.c || 0) > 0;
      if (typeof selPl === 'number') {
        const pl = state.pls.find((p) => p.id === selPl);
        return pl ? pl.ids.includes(t.id) : false;
      }
      return true;
    });

    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      list = list.filter((t) =>
        `${t.name} ${t.artist || ''} ${t.album || ''} ${t.genre || ''} ${t.nick || ''} ${t.folder || ''}`
          .toLowerCase()
          .includes(q)
      );
    }

    const by = state.sort?.by || 'date';
    const dir = state.sort?.dir || -1;

    list.sort((a, b) => {
      if (selPl === 'recent') return (stats[b.id]?.l || 0) - (stats[a.id]?.l || 0);
      if (selPl === 'most') return (stats[b.id]?.c || 0) - (stats[a.id]?.c || 0);
      let cmp = 0;
      if (by === 'name') cmp = (a.name || '').localeCompare(b.name || '');
      else if (by === 'artist') cmp = (a.artist || '').localeCompare(b.artist || '');
      else if (by === 'dur') cmp = (a.dur || a.vd || 0) - (b.dur || b.vd || 0);
      else if (by === 'size') cmp = (a.sz || 0) - (b.sz || 0);
      else cmp = (a.addedAt || a.id) - (b.addedAt || b.id);
      return cmp * dir;
    });

    return list;
  }, [tracks, state.tab, state.sel, state.hid, state.fav, state.st, state.pls, state.sort, searchQ]);

  const videoQueue = useMemo(
    () => tracks.filter((t) => t.kind === 'video' && !state.hid?.[t.id]),
    [tracks, state.hid]
  );

  // Start playing a specific track
  const playTrack = useCallback(
    async (trackId: number, resumePos?: number) => {
      const tr = tracks.find((t) => t.id === trackId);
      if (!tr) return;

      // Record stats
      setState((prev) => ({
        ...prev,
        cur: { ...prev.cur, [tr.kind]: tr.id },
        npk: tr.kind === 'book' ? 'book' : tr.kind === 'audio' ? 'audio' : prev.npk,
        st: {
          ...prev.st,
          [tr.id]: {
            c: (prev.st?.[tr.id]?.c || 0) + 1,
            l: Date.now(),
          },
        },
      }));

      if (tr.kind === 'video') {
        audRef.current?.pause();
        bkRef.current?.pause();
        setPlaying(false);

        const v = vidRef.current;
        if (v) {
          if (vidUrlRef.current) {
            URL.revokeObjectURL(vidUrlRef.current);
            vidUrlRef.current = '';
          }
          if (tr.blob) {
            const u = URL.createObjectURL(tr.blob);
            vidUrlRef.current = u;
            v.src = u;
            v.play().catch(() => {});
          } else if (tr.url && !ytId(tr.url)) {
            v.src = tr.url;
            v.play().catch(() => {});
          } else {
            v.removeAttribute('src');
          }
        }
        setPage('video');
        return;
      }

      // Audio or Audiobook
      const targetEl = tr.kind === 'book' ? bkRef.current : audRef.current;
      const otherEl = tr.kind === 'book' ? audRef.current : bkRef.current;
      otherEl?.pause();
      if (!targetEl) return;

      if (tr.kind === 'audio') {
        ensureEq();
        if (eqCtxRef.current?.state === 'suspended') {
          eqCtxRef.current.resume().catch(() => {});
        }
      }

      const refUrl = tr.kind === 'book' ? bkUrlRef : audUrlRef;
      if (refUrl.current) {
        URL.revokeObjectURL(refUrl.current);
        refUrl.current = '';
      }

      if (tr.blob) {
        const u = URL.createObjectURL(tr.blob);
        refUrl.current = u;
        targetEl.src = u;
      } else if (tr.url) {
        targetEl.src = tr.url;
      } else {
        showToast('No playable source for this track');
        return;
      }

      const startAt = resumePos !== undefined ? resumePos : state.pos?.[tr.id] || 0;
      targetEl.onloadedmetadata = () => {
        if (isFinite(targetEl.duration)) setDur(targetEl.duration);
        if (startAt > 1 && startAt < (targetEl.duration || Infinity) - 2) {
          try {
            targetEl.currentTime = startAt;
          } catch {
            // ignore
          }
        }
      };

      try {
        await targetEl.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    },
    [tracks, ensureEq, state.pos, showToast]
  );

  const togglePlay = useCallback(() => {
    const el = npKind === 'book' ? bkRef.current : audRef.current;
    if (!el || !currentAudioTrack) return;
    if (!el.src) {
      playTrack(currentAudioTrack.id);
      return;
    }
    if (el.paused) {
      if (npKind === 'audio' && eqCtxRef.current?.state === 'suspended') {
        eqCtxRef.current.resume().catch(() => {});
      }
      el.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      el.pause();
      setPlaying(false);
    }
  }, [npKind, currentAudioTrack, playTrack]);

  const stepTrack = useCallback(
    (delta: 1 | -1, fromEnded = false) => {
      if (fromEnded && state.mode === 'one') {
        const el = npKind === 'book' ? bkRef.current : audRef.current;
        if (el) {
          el.currentTime = 0;
          el.play().catch(() => {});
          return;
        }
      }

      if (delta === 1 && nextQueue.length > 0) {
        const [nextId, ...rest] = nextQueue;
        setNextQueue(rest);
        playTrack(nextId, 0);
        return;
      }

      const pool = tracks.filter((t) => t.kind === npKind && !state.hid?.[t.id]);
      if (!pool.length) return;

      if (state.mode === 'shuf' && pool.length > 1) {
        const choices = pool.filter((t) => t.id !== currentAudioId);
        const pick = choices[Math.floor(Math.random() * choices.length)] || pool[0];
        playTrack(pick.id, 0);
        return;
      }

      const idx = pool.findIndex((t) => t.id === currentAudioId);
      let nextIdx = idx + delta;
      if (nextIdx >= pool.length) {
        if (fromEnded && state.mode === 'seq') {
          setPlaying(false);
          return;
        }
        nextIdx = 0;
      }
      if (nextIdx < 0) nextIdx = pool.length - 1;
      playTrack(pool[nextIdx].id, 0);
    },
    [state.mode, state.hid, npKind, nextQueue, tracks, currentAudioId, playTrack]
  );

  const cyclePlayMode = useCallback(() => {
    const order: PlayerState['mode'][] = ['all', 'shuf', 'one', 'seq'];
    const labels: Record<PlayerState['mode'], string> = {
      all: 'Repeat All',
      shuf: 'Shuffle',
      one: 'Repeat One',
      seq: 'Sequential',
    };
    const next = order[(order.indexOf(state.mode) + 1) % order.length];
    updateState({ mode: next, shuf: next === 'shuf', rep: next === 'all', one: next === 'one' });
    showToast(`Mode: ${labels[next]}`);
  }, [state.mode, updateState, showToast]);

  // Import local files
  const importFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList || []);
      if (!files.length) return;

      let added = 0;
      const newTracks: Track[] = [];
      const baseId = Date.now();

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const lower = f.name.toLowerCase();
        const isVideo =
          f.type.startsWith('video/') || /\.(mp4|webm|mkv|mov|m4v|avi)$/i.test(lower);
        const isAudio =
          f.type.startsWith('audio/') ||
          /\.(mp3|m4a|m4b|flac|ogg|opus|wav|aac|wma)$/i.test(lower);

        if (!isVideo && !isAudio) continue;

        const cleanName = f.name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim();
        const relPath = (f as File & { webkitRelativePath?: string }).webkitRelativePath || '';
        const folder = relPath.includes('/') ? relPath.split('/').slice(0, -1).join('/') : '';
        const kind: MediaKind = isVideo
          ? 'video'
          : /\.m4b$/i.test(lower) || /audiobook/i.test(folder) || state.tab === 'books'
            ? 'book'
            : 'audio';

        const track: Track = {
          id: baseId + i,
          name: cleanName || f.name,
          fn: f.name,
          kind,
          blob: f,
          local: 1,
          folder,
          sz: f.size,
          mod: f.lastModified,
          addedAt: Date.now() + i,
        };

        if (kind === 'video') {
          await generateVideoThumb(track);
        } else {
          await extractAudioMetadata(track);
        }
        await putTrack(track);
        newTracks.push(track);
        added++;
      }

      if (added > 0) {
        setTracks((prev) => [...newTracks, ...prev]);
        showToast(`Added ${added} media file${added > 1 ? 's' : ''}`);
      } else {
        showToast('No supported audio/video files found');
      }
    },
    [state.tab, showToast]
  );

  // Import stream / YouTube / video URL
  const importStreamUrl = useCallback(
    async (rawUrl: string) => {
      const u = rawUrl.trim();
      if (!u) return;
      const known = knownVideo(u);
      const yid = ytId(u);
      let kind: MediaKind = 'video';
      if (known?.kind === 'file' && known.vk === 'audio') kind = 'audio';
      let title = await oeName(u);
      if (!title) {
        title = yid
          ? `YouTube Video (${yid})`
          : u.split('/').pop()?.split('?')[0] || 'Media Stream';
      }

      const tr: Track = {
        id: Date.now(),
        name: title,
        kind,
        url: u,
        yt: yid || undefined,
        addedAt: Date.now(),
      };
      await putTrack(tr);
      setTracks((prev) => [tr, ...prev]);
      showToast(`Added: ${title}`);
      if (kind === 'video') {
        setState((prev) => ({ ...prev, cur: { ...prev.cur, video: tr.id } }));
        setPage('video');
      } else {
        setTimeout(() => playTrack(tr.id, 0), 80);
      }
    },
    [playTrack, showToast]
  );

  // Global Keyboard Shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'Escape') {
        if (sheet.open) setSheet((s) => ({ ...s, open: false }));
        else if (promptDlg.open) setPromptDlg((p) => ({ ...p, open: false }));
        else if (page) setPage('');
        return;
      }
      if (e.key === ' ' && page !== 'video') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === '/' && !page) {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheet.open, promptDlg.open, page, togglePlay]);

  // Tab Labels
  const tabLabels = useMemo(() => {
    if (state.names !== 0 && activeTheme.tabs && activeTheme.tabs.length >= 4) {
      return activeTheme.tabs;
    }
    return DEFAULT_TABS;
  }, [state.names, activeTheme.tabs]);

  // Open Playlist Picker for 1 or many tracks
  const openPlaylistPicker = (ids: number[]) => {
    const entries: SheetEntry[] = [
      {
        icon: '➕',
        label: 'Create new playlist…',
        fn: () => {
          setPromptDlg({
            open: true,
            title: 'New Playlist',
            placeholder: 'Synthwave Night Drive…',
            confirmLabel: 'Create & Add',
            onConfirm: (name) => {
              const clean = name.trim();
              if (!clean) return;
              const newPl: Playlist = { id: Date.now(), name: clean, ids: [...ids] };
              updateState({ pls: [...state.pls, newPl] });
              setPromptDlg((p) => ({ ...p, open: false }));
              showToast(`Added to "${clean}"`);
            },
          });
        },
      },
      ...state.pls.map((pl) => ({
        icon: '🎶',
        label: `${pl.name} (${pl.ids.length})`,
        fn: () => {
          const nextPls = state.pls.map((p) =>
            p.id === pl.id ? { ...p, ids: Array.from(new Set([...p.ids, ...ids])) } : p
          );
          updateState({ pls: nextPls });
          showToast(`Added to "${pl.name}"`);
        },
      })),
    ];
    setSheet({ open: true, title: 'Add to Playlist', entries });
  };

  // Open Track Options Sheet
  const openTrackMenu = (tr: Track) => {
    const isFav = !!state.fav?.[tr.id];
    const isHid = !!state.hid?.[tr.id];
    const entries: SheetEntry[] = [
      {
        icon: '▶️',
        label: 'Play now',
        fn: () => playTrack(tr.id, 0),
      },
      ...(tr.kind !== 'video'
        ? [
            {
              icon: '⏭️',
              label: 'Play next in queue',
              fn: () => {
                setNextQueue((q) => [tr.id, ...q]);
                showToast('Queued next');
              },
            },
          ]
        : []),
      {
        icon: isFav ? '💔' : '❤️',
        label: isFav ? 'Remove from Favorites' : 'Add to Favorites',
        fn: () => {
          const next = { ...state.fav };
          if (isFav) delete next[tr.id];
          else next[tr.id] = 1;
          updateState({ fav: next });
        },
      },
      {
        icon: '➕',
        label: 'Add to playlist…',
        fn: () => openPlaylistPicker([tr.id]),
      },
      {
        icon: '🏷️',
        label: 'Edit tags & cover art',
        fn: () => {
          setEditTrackId(tr.id);
          setPage('tags');
        },
      },
      ...(tr.kind !== 'video'
        ? [
            {
              icon: '💬',
              label: tr.lyr ? 'Edit lyrics / .lrc' : 'Add lyrics / .lrc',
              fn: () => {
                setEditTrackId(tr.id);
                setPage('lyrics');
              },
            },
          ]
        : []),
      {
        icon: '📝',
        label: 'Links, custom name & notes',
        fn: () => {
          setEditTrackId(tr.id);
          setPage('notes');
        },
      },
      {
        icon: '☑️',
        label: 'Select multiple items',
        fn: () => {
          setSelMode(true);
          setSelectedIds(new Set([tr.id]));
        },
      },
      {
        icon: isHid ? '👁️' : '🙈',
        label: isHid ? 'Unhide track' : 'Hide from library',
        fn: () => {
          const next = { ...state.hid };
          if (isHid) delete next[tr.id];
          else next[tr.id] = 1;
          updateState({ hid: next });
          showToast(isHid ? 'Restored to library' : 'Hidden from library');
        },
      },
      {
        icon: '🗑️',
        label: 'Delete permanently',
        danger: true,
        fn: async () => {
          await deleteTrackRecord(tr.id);
          setTracks((prev) => prev.filter((x) => x.id !== tr.id));
          showToast('Deleted');
        },
      },
    ];
    setSheet({ open: true, title: tr.nick || tr.name, entries });
  };

  // Open Now Playing Options (Speed, EQ, Sleep Timer)
  const openNowPlayingOptions = () => {
    const entries: SheetEntry[] = [
      {
        type: 'chips',
        label: 'Playback Speed',
        options: [0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => ({ value: r, label: `${r}×` })),
        current: state.rate ?? 1,
        onSelect: (val) => updateState({ rate: Number(val) }),
      },
      {
        type: 'chips',
        label: '5-Band Equalizer',
        options: EQ_PRESETS.map((p, idx) => ({ value: idx, label: p.name })),
        current: state.eq ?? 0,
        onSelect: (val) => updateState({ eq: Number(val) }),
      },
      {
        type: 'chips',
        label: 'Sleep Timer',
        options: [
          { value: 0, label: 'Off' },
          { value: 15, label: '15m' },
          { value: 30, label: '30m' },
          { value: 45, label: '45m' },
          { value: 60, label: '60m' },
        ],
        current: sleepEndAt ? Math.max(15, Math.round((sleepEndAt - Date.now()) / 60000)) : 0,
        onSelect: (val) => {
          const mins = Number(val);
          if (!mins) {
            setSleepEndAt(null);
            showToast('Sleep timer off');
          } else {
            setSleepEndAt(Date.now() + mins * 60000);
            showToast(`Sleep timer set for ${mins} min`);
          }
        },
      },
    ];
    setSheet({ open: true, title: 'Audio & Studio Options', entries });
  };

  // Open Sort Sheet
  const openSortSheet = () => {
    const entries: SheetEntry[] = [
      {
        type: 'chips',
        label: 'Sort By',
        options: [
          { value: 'date', label: 'Date Added' },
          { value: 'name', label: 'Title' },
          { value: 'artist', label: 'Artist' },
          { value: 'dur', label: 'Duration' },
          { value: 'size', label: 'File Size' },
        ],
        current: state.sort?.by || 'date',
        onSelect: (val) =>
          updateState({ sort: { by: String(val), dir: state.sort?.dir || -1, set: true } }),
      },
      {
        type: 'chips',
        label: 'Order',
        options: [
          { value: -1, label: 'Descending ↓' },
          { value: 1, label: 'Ascending ↑' },
        ],
        current: state.sort?.dir || -1,
        onSelect: (val) =>
          updateState({ sort: { by: state.sort?.by || 'date', dir: Number(val), set: true } }),
      },
    ];
    setSheet({ open: true, title: 'Sort Library', entries });
  };

  const downloadStandaloneHtml = useCallback(async () => {
    try {
      const res = await fetch('/xi_deck.html');
      if (!res.ok) throw new Error('Failed to fetch standalone HTML');
      const rawHtml = await res.text();
      const origin = window.location.origin.startsWith('http') ? window.location.origin : '';
      const html = rawHtml.replace(
        "window.__XI_ASSET_BASE__ = '';",
        `window.__XI_ASSET_BASE__ = ${JSON.stringify(origin)};`
      );
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'xi_media_deck.html';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      showToast('Standalone HTML (.html) downloaded');
    } catch {
      showToast('Could not download standalone HTML');
    }
  }, [showToast]);

  const restartAllFeatures = useCallback(
    (keepSheetOpen = false) => {
      const featureReset: Partial<PlayerState> = {
        theme: DEFAULT_STATE.theme,
        accent: undefined,
        fx: DEFAULT_STATE.fx,
        wetGlass: DEFAULT_STATE.wetGlass,
        holograms: DEFAULT_STATE.holograms,
        crowd: DEFAULT_STATE.crowd,
        crowdLevel: DEFAULT_STATE.crowdLevel,
        scene: DEFAULT_STATE.scene,
        names: DEFAULT_STATE.names,
        font: undefined,
        corner: undefined,
        title: undefined,
        rate: DEFAULT_STATE.rate,
        vol: DEFAULT_STATE.vol,
        eq: DEFAULT_STATE.eq,
        minSec: DEFAULT_STATE.minSec,
        glassOpacity: undefined,
        blurStrength: undefined,
        glassDrops: undefined,
        backdropOverride: undefined,
        postProcess: 'none',
      };
      const nextSnap: PlayerState = { ...state, ...featureReset };
      updateState(featureReset);
      setSleepEndAt(null);
      if (keepSheetOpen) {
        const nextTheme = allThemes[DEFAULT_STATE.theme] || BUILTIN_THEMES.bladerunner;
        setSheet({
          open: true,
          title: `${nextTheme.e} Features & DIY`,
          entries: buildFeaturesEntries(nextSnap),
        });
      }
      showToast('All features restarted to defaults');
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, allThemes, updateState, showToast]
  );

  // Open Features Sheet (DIY Themes Studio, Featured Presets & Atmosphere Controls)
  const buildFeaturesEntries = (snap: PlayerState): SheetEntry[] => {
    const snapTheme = allThemes[snap.theme] || BUILTIN_THEMES.bladerunner;
    const curFx = snap.fx == null ? 2 : snap.fx;
    const curWet = snap.wetGlass !== undefined ? snap.wetGlass : snapTheme.wetGlass ?? true;
    const curHolo = snap.holograms !== undefined ? snap.holograms : snapTheme.holograms ?? true;

    return [
      {
        type: 'label',
        label: isGits
          ? '攻殻機動隊 DIY 電脳テーマ・機能'
          : isThundercats
            ? 'ThunderCats ’85 — Cats Lair & Book of Omens DIY'
            : isRpo
              ? 'Anorak’s Almanac & OASIS DIY Worlds'
              : isGreenKnight
                ? 'DIY Themes & Royal Heraldry'
                : isCastlevania
                  ? 'DIY Themes & Bloodcraft'
                  : isDune
                    ? 'DIY Themes & Arrakis Sietch'
                    : isAkira
                      ? 'DIY Themes & Neo-Tokyo 1988'
                      : 'DIY Themes & Studio',
      },
      {
        icon: '🎨',
        label: isGits
          ? 'DIY 電脳テーマ一覧を開く'
          : isThundercats
            ? 'Open Cats Lair DIY Themes Gallery'
            : isRpo
              ? 'Open Anorak’s Almanac DIY Gallery'
              : isGreenKnight
                ? 'Open DIY Gallery & Heraldry'
                : isCastlevania
                  ? 'Open DIY Gallery & Bloodcraft'
                  : 'Open DIY Themes Gallery',
        fn: () => setPage('interface'),
      },
      {
        icon: '🛠️',
        label: isGits
          ? 'カスタム電脳DIYテーマを作成…'
          : isThundercats
            ? 'Forge Custom Third Earth DIY Theme…'
            : isRpo
              ? 'Forge Custom OASIS Simulation…'
              : 'Create Custom DIY Theme…',
        fn: () => {
          setDiyEditKey(undefined);
          setDiyStudioSeed(activeTheme);
          setPage('diyStudio');
        },
      },
      {
        type: 'chips',
        label: isGits
          ? '攻殻機動隊・注目DIYテーマ'
          : isThundercats
            ? 'ThunderCats ’85 & Featured DIY Themes'
            : isRpo
              ? 'OASIS Sectors & Ready Player One DIY'
              : isXmen
                ? 'X-Men ’90s & Featured DIY Themes'
                : isMatrix
                  ? 'Matrix Mainframe & Featured DIY Themes'
                  : isPirates
                    ? 'Dark Seas Kraken & Featured DIY Themes'
                    : isSteampunk
                      ? 'Steam Machine Assemblies & DIY Themes'
                      : isAlien
                        ? 'Aliens Farm Invasion & Featured DIY Themes'
                        : isDnd
                          ? 'D&D Polyhedral Dice & Campaign Themes'
                          : isTemplar
                            ? 'Dark Fantasy Medieval · Templar & Rain'
                            : isWitcher
                              ? 'The Witcher (Netflix) · Signs & Runes'
                              : 'Featured DIY Themes',
        options: [
          { value: 'templar', label: '🛡️ Templar: Rainy Siege & Hearth' },
          { value: 'templar_chapel', label: '⚔️ Templar: Moonlit Storm Chapel' },
          { value: 'templar_watch', label: '⚜️ Templar: Crusader Watchtower' },
          { value: 'witcher', label: '🐺 The Witcher: White Wolf & Trophy' },
          { value: 'witcher_campfire', label: '🔥 The Witcher: Night Meditation Fire' },
          { value: 'witcher_conjunction', label: '✨ The Witcher: Chaos & Elder Blood' },
          { value: 'alien', label: '🛸 Aliens: Saucer Crash Fields' },
          { value: 'alien_beam', label: '🌽 Aliens: Night Tractor Beam' },
          { value: 'alien_cornfield', label: '👽 Aliens: Cornfield Spaceshop' },
          { value: 'dnd', label: '🎲 D&D: Polyhedral Dice Table' },
          { value: 'dnd_dragon', label: '🐉 D&D: Red Dragon Inferno' },
          { value: 'dnd_beholder', label: '👁️ D&D: Beholder Keep' },
          { value: 'dnd_pixel', label: '🛡️ D&D: Pixel Crimson Wyrm' },
          { value: 'dnd_initiative', label: '⚔️ D&D: Roll Initiative d20' },
          { value: 'dnd_dungeon', label: '🗝️ D&D: Dungeon Stairs' },
          { value: 'xmen90s', label: "❌ X-Men '90s TAS" },
          { value: 'xmen90s_uncanny', label: '🔥 X-Men Uncanny Phoenix' },
          { value: 'matrix', label: '🟩 The Matrix: Neo Rain' },
          { value: 'matrix_bullet', label: '💚 The Matrix: Bullet Time' },
          { value: 'matrix_zion', label: '🕶️ The Matrix: Zion Crew' },
          { value: 'pirate', label: '🐙 Pirates: Kraken & Sea' },
          { value: 'pirates_lantern', label: '🏴‍☠️ Pirates: Cursed Lantern' },
          { value: 'steampunk', label: '🚂 Steampunk: Boiler Viaduct' },
          { value: 'steampunk_astrolabe', label: '🕰️ Steampunk: Brass Astrolabe' },
          { value: 'steampunk_airships', label: '⚙️ Steampunk: Copper Sky Dock' },
          { value: 'thundercats', label: "⚔️ ThunderCats '85 (Sword of Omens)" },
          { value: 'thundercats_cliff', label: "⚡ ThunderCats '85 (Red Storm Cliff)" },
          { value: 'thundercats_mummra', label: "🦁 ThunderCats '85 (Mumm-Ra)" },
          { value: 'gits_newport', label: '🌃 攻殻機動隊: 新浜市' },
          { value: 'gits_1995', label: '🕶️ 攻殻機動隊: 1995' },
          { value: 'gits_shell', label: '🔌 攻殻機動隊: 義体接続' },
          { value: 'rpo_oasis', label: '🕶️ RPO: Parzival X1 OASIS' },
          { value: 'rpo_keys', label: '🗝️ RPO: The Three Keys' },
          { value: 'rpo_delorean', label: '🏎️ RPO: ECTO-88 DeLorean' },
          { value: 'dune', label: '☀️ Dune (Desert Sun)' },
          { value: 'akira', label: "🏍️ Akira '88 (Moto)" },
          { value: 'akira_slide', label: "⚡ Akira '88 (Slide)" },
          { value: 'akira_throne', label: "🏙️ Akira '88 (Towers)" },
          { value: 'akira_jacket', label: "💊 Akira '88 (Capsule)" },
          { value: 'greenknight_crown', label: '👑 Green Knight I' },
          { value: 'greenknight_wood', label: '🪓 Green Knight II' },
          { value: 'castlevania_citadel', label: '🏰 Castlevania I' },
          { value: 'castlevania_belmont', label: '🩸 Castlevania II' },
          { value: 'thebatman2022', label: "🦇 Batman '22" },
          { value: 'sleepyhollow', label: "🎃 Sleepy Hollow '99" },
          { value: 'bladerunner', label: '🌧️ Blade Runner' },
        ],
        current: snap.theme,
        onSelect: (val) => {
          handleApplyTheme(String(val));
          setSheet((s) => ({ ...s, open: false }));
        },
      },
      {
        type: 'label',
        label: isGits
          ? '義体光学フィルター・電脳音響設定'
          : isRpo
            ? 'X1 Haptic Suit & Halliday Relics'
            : 'Atmosphere & Audio Features',
      },
      {
        type: 'chips',
        label: isGits
          ? '視覚光学シェーダー (ポストプロセス)'
          : isRpo
            ? 'X1 Visor Optical Shader'
            : 'Cinematic Post-Processing',
        options: [
          { value: 'none', label: isGits ? '解除' : 'Off' },
          { value: 'noir-film-grain', label: isGits ? 'ノワール粒子' : 'Noir-Film-Grain' },
          { value: 'aged-vellum', label: isGits ? '経年羊皮紙' : 'Aged-Vellum' },
          { value: 'cyber-blue-tint', label: isGits ? '電脳蒼光' : 'Cyber-Blue-Tint' },
        ],
        current: snap.postProcess || 'none',
        onSelect: (val) => {
          const mode = String(val) as PostProcessFilter;
          const next = { ...snap, postProcess: mode };
          updateState({ postProcess: mode });
          setSheet((s) => ({ ...s, entries: buildFeaturesEntries(next) }));
          const labels: Record<PostProcessFilter, string> = {
            none: 'Off (Natural)',
            'noir-film-grain': 'Noir-Film-Grain',
            'aged-vellum': 'Aged-Vellum',
            'cyber-blue-tint': 'Cyber-Blue-Tint',
          };
          showToast(`Post-Processing: ${labels[mode]}`);
        },
      },
      {
        type: 'chips',
        label: isGits
          ? '電脳粒子・光学迷彩強度'
          : isRpo
            ? 'OASIS Physics & Key Particles'
            : 'Weather & FX Intensity',
        options: [
          { value: 0, label: isGits ? '停止' : 'Off' },
          { value: 1, label: isGits ? '弱' : 'Low' },
          { value: 2, label: isGits ? '高' : 'High' },
          { value: 3, label: isGits ? '極' : 'Hyper' },
        ],
        current: curFx,
        onSelect: (val) => {
          const next = { ...snap, fx: Number(val) };
          updateState({ fx: Number(val) });
          setSheet((s) => ({ ...s, entries: buildFeaturesEntries(next) }));
        },
      },
      {
        icon: snap.scene !== 0 ? '🌆' : '⬛',
        label: `${isGits ? '4K電脳背景' : isRpo ? 'OASIS 4K Horizon' : '4K Scene Backdrop'}: ${
          isGits ? (snap.scene !== 0 ? '稼働' : '停止') : snap.scene !== 0 ? 'On' : 'Off'
        }`,
        on: snap.scene !== 0,
        keep: true,
        fn: () => {
          const nextVal = snap.scene === 0 ? 1 : 0;
          const next = { ...snap, scene: nextVal };
          updateState({ scene: nextVal });
          setSheet((s) => ({ ...s, entries: buildFeaturesEntries(next) }));
        },
      },
      {
        icon: '💧',
        label: `${isGits ? '光学レンズ水滴屈折' : isRpo ? 'X1 Visor Refraction Drops' : 'Wet Camera Glass'}: ${
          isGits ? (curWet ? '稼働' : '停止') : curWet ? 'On' : 'Off'
        }`,
        on: curWet,
        keep: true,
        fn: () => {
          const nextVal = !curWet;
          const next = { ...snap, wetGlass: nextVal };
          updateState({ wetGlass: nextVal });
          setSheet((s) => ({ ...s, entries: buildFeaturesEntries(next) }));
        },
      },
      {
        icon: '✨',
        label: `${isGits ? '立体電脳ホログラム' : isRpo ? 'Halliday Holo-Projections' : 'Volumetric Holograms'}: ${
          isGits ? (curHolo ? '稼働' : '停止') : curHolo ? 'On' : 'Off'
        }`,
        on: curHolo,
        keep: true,
        fn: () => {
          const nextVal = !curHolo;
          const next = { ...snap, holograms: nextVal };
          updateState({ holograms: nextVal });
          setSheet((s) => ({ ...s, entries: buildFeaturesEntries(next) }));
        },
      },
      {
        icon: '🎚️',
        label: isGits
          ? '5バンドEQ・再生速度・タイマー設定…'
          : isRpo
            ? 'Aech’s Garage EQ, Zemeckis Cube & Timer…'
            : '5-Band EQ, Speed & Sleep Timer…',
        fn: () => openNowPlayingOptions(),
      },
      {
        icon: '📄',
        label: isGits ? '単体HTML (.html) をダウンロード' : 'Download Standalone HTML (.html)',
        fn: () => downloadStandaloneHtml(),
      },
      {
        icon: '🔄',
        label: isGits
          ? '全機能を初期状態へリセット (Restart)'
          : isRpo
            ? 'Cataclyst Reset — Restart All Features to Before'
            : 'Restart All Features to Before',
        keep: true,
        danger: true,
        fn: () => restartAllFeatures(true),
      },
    ];
  };

  const openFeaturesSheet = () => {
    const title = isGits
      ? `${activeTheme.e} 攻殻機動隊・電脳機能 & DIY`
      : isThundercats
        ? `${activeTheme.e} ThunderCats ’85 · Book of Omens & DIY`
        : isXmen
          ? `${activeTheme.e} X-Men ’90s · Cerebro & DIY`
          : isMatrix
            ? `${activeTheme.e} Matrix Construct · Mainframe & DIY`
            : isPirates
              ? `${activeTheme.e} Dark Seas · Kraken Watch & DIY`
              : isSteampunk
                ? `${activeTheme.e} Boiler #04 · Steam Machine Valves & DIY`
                : isAlien
                  ? `${activeTheme.e} Sector 04 · Cornfield UFO Features & DIY`
                  : isDnd
                    ? `${activeTheme.e} DM Table · Polyhedral Dice & Features`
                    : isTemplar
                      ? `${activeTheme.e} Templar Arsenal · Dark Medieval Features`
                      : isWitcher
                        ? `${activeTheme.e} School of the Wolf · Signs & Runes`
                        : isRpo
                      ? `${activeTheme.e} Anorak’s Almanac & OASIS Features`
                  : isGreenKnight
                    ? `${activeTheme.e} Royal Features & DIY`
                    : isCastlevania
                      ? `${activeTheme.e} Nocturnal Features & DIY`
                      : isDune
                        ? `${activeTheme.e} Arrakis Features & DIY`
                        : isAkira
                          ? `${activeTheme.e} Neo-Tokyo ’88 Features & DIY`
                          : `${activeTheme.e} Features & DIY`;
    setSheet({ open: true, title, entries: buildFeaturesEntries(state) });
  };

  // Open Global Settings Sheet
  const openSettingsSheet = () => {
    const entries: SheetEntry[] = [
      {
        icon: '✨',
        label: isGits ? '電脳機能 & DIY テーマスタジオ' : 'Features & DIY Themes Studio',
        fn: () => openFeaturesSheet(),
      },
      {
        icon: '🖼️',
        label: isGits ? '4K壁紙網・ホロカード収集' : '4K Wallpapers & Auto Rotation',
        fn: () => setPage('wallpapers'),
      },
      {
        icon: '🌐',
        label: isGits ? '電脳網エクスプローラー' : 'Web Explorer & Stream Importer',
        fn: () => setPage('browser'),
      },
      {
        icon: '📝',
        label: isGits ? '機密記録・名称ノート帳' : 'Notes & Names Keeper',
        fn: () => setPage('keeper'),
      },
      { type: 'label', label: isGits ? '公安九課・端末環境設定' : 'Deck Preferences' },
      {
        icon: state.scene !== 0 ? '🌆' : '⬛',
        label: `${isGits ? '4K電脳背景' : '4K Scene Backdrop'}: ${
          isGits ? (state.scene !== 0 ? '稼働' : '停止') : state.scene !== 0 ? 'On' : 'Off'
        }`,
        keep: true,
        fn: () => updateState({ scene: state.scene === 0 ? 1 : 0 }),
      },
      {
        icon: '🔄',
        label: isGits ? '全機能を初期状態へリセット' : 'Restart All Features to Before',
        danger: true,
        fn: () => restartAllFeatures(false),
      },
      {
        icon: '📄',
        label: isGits ? '単体HTML (.html) をダウンロード' : 'Download Standalone HTML (.html)',
        fn: () => downloadStandaloneHtml(),
      },
      {
        icon: '💾',
        label: isGits ? '記憶メタデータを書き出す (.json)' : 'Export Library Metadata Backup (.json)',
        fn: () => {
          const payload = {
            version: 2,
            exportedAt: Date.now(),
            state,
            diyThemes,
            tracksMeta: tracks.map(({ blob: _b, cover: _c, emb: _e, thumb: _th, ...rest }) => rest),
          };
          const b = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(b);
          a.download = `xi_backup_${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 1500);
          showToast('Backup exported');
        },
      },
      {
        icon: '📥',
        label: isGits ? 'バックアップを復元する (.json)' : 'Restore Metadata Backup (.json)',
        fn: () => backupInputRef.current?.click(),
      },
    ];
    setSheet({
      open: true,
      title: isGits ? `${activeTheme.e} 公安9課 端末設定` : `${activeTheme.e} Deck Settings`,
      entries,
    });
  };

  // Add Media Sheet
  const openAddSheet = () => {
    const entries: SheetEntry[] = [
      {
        icon: '🎵',
        label: 'Add Audio / Video Files…',
        fn: () => fileInputRef.current?.click(),
      },
      {
        icon: '📁',
        label: 'Import Entire Folder…',
        fn: () => folderInputRef.current?.click(),
      },
      {
        icon: '🔗',
        label: 'Add Stream / YouTube / Direct URL…',
        fn: () => {
          setPromptDlg({
            open: true,
            title: 'Import Stream or Video URL',
            subtitle: 'Supports direct MP4/MP3/HLS, YouTube, Vimeo, Dailymotion',
            placeholder: 'https://…',
            confirmLabel: 'Import',
            onConfirm: (val) => {
              setPromptDlg((p) => ({ ...p, open: false }));
              importStreamUrl(val);
            },
          });
        },
      },
    ];
    setSheet({ open: true, title: 'Add to Library', entries });
  };

  // Multi-select Actions
  const toggleSelectId = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) await deleteTrackRecord(id);
    setTracks((prev) => prev.filter((t) => !selectedIds.has(t.id)));
    setSelMode(false);
    setSelectedIds(new Set());
    showToast(`Deleted ${ids.length} item(s)`);
  };

  const handleBulkHide = () => {
    const next = { ...state.hid };
    selectedIds.forEach((id) => {
      if (next[id]) delete next[id];
      else next[id] = 1;
    });
    updateState({ hid: next });
    setSelMode(false);
    setSelectedIds(new Set());
    showToast('Updated visibility');
  };

  // Theme Gallery Actions
  const handleApplyTheme = (key: string) => {
    const preset = allThemes[key];
    if (!preset) return;
    updateState({
      theme: key,
      accent: undefined,
      backdropOverride: undefined,
      wetGlass: preset.wetGlass ?? false,
      holograms: preset.holograms ?? false,
      crowd: preset.crowd ?? false,
      crowdLevel:
        preset.crowdDensity === 'dense' ? 3 : preset.crowdDensity === 'quiet' ? 1 : 2,
    });
    showToast(`${preset.e} ${preset.label}`);
  };

  const handleSaveDiyTheme = (key: string, built: ThemePreset) => {
    const nextDiy = { ...diyThemes, [key]: built };
    setDiyThemes(nextDiy);
    saveDIYThemes(nextDiy);
    updateState({
      theme: key,
      accent: undefined,
      backdropOverride: undefined,
      wetGlass: built.wetGlass ?? true,
      holograms: built.holograms ?? true,
      crowd: built.crowd ?? true,
      crowdLevel:
        built.crowdDensity === 'dense' ? 3 : built.crowdDensity === 'quiet' ? 1 : 2,
    });
    setPage('interface');
    showToast(`Saved "${built.label}"`);
  };

  const handleDeleteDiyTheme = (key: string) => {
    const next = { ...diyThemes };
    delete next[key];
    setDiyThemes(next);
    saveDIYThemes(next);
    if (state.theme === key) updateState({ theme: 'bladerunner' });
    showToast('Deleted custom theme');
  };

  const handleExportDiy = () => {
    const data = Object.entries(diyThemes).map(([key, theme]) => ({ key, theme }));
    const b = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = 'xi_diy_themes.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    showToast('DIY themes exported');
  };

  const handleImportDiy = async (file: File) => {
    try {
      const txt = await readTextFile(file);
      const parsed = JSON.parse(txt);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      const next = { ...diyThemes };
      let count = 0;
      for (const item of arr) {
        if (item?.key && item?.theme) {
          const k = String(item.key).startsWith('custom_') ? item.key : `custom_${Date.now()}_${count}`;
          next[k] = { ...item.theme, isCustom: true };
          count++;
        }
      }
      setDiyThemes(next);
      saveDIYThemes(next);
      showToast(`Imported ${count} theme(s)`);
    } catch {
      showToast('Invalid DIY themes JSON');
    }
  };

  const activeFilterLabel = useMemo(() => {
    const s = state.sel[activeKind];
    if (!s) return null;
    if (s === 'fav') return uiCopy.favLabel;
    if (s === 'recent') return uiCopy.recentLabel;
    if (s === 'most') return uiCopy.mostLabel;
    if (s === 'hid') return uiCopy.hidLabel;
    if (typeof s === 'number') {
      return (
        state.pls.find((p) => p.id === s)?.name ||
        (isGits ? '記憶集' : isThundercats ? 'Third Earth Mix' : 'Playlist')
      );
    }
    return null;
  }, [state.sel, activeKind, state.pls, isGits, isThundercats, uiCopy]);

  const tracksWithNotes = useMemo(
    () => tracks.filter((t) => !!(t.nick?.trim() || t.links?.trim() || t.notes?.trim())),
    [tracks]
  );

  const fxLevel = state.fx == null ? 2 : state.fx;
  const wetGlassOn =
    state.wetGlass !== undefined ? state.wetGlass : activeTheme.wetGlass ?? true;
  const hologramsOn =
    state.holograms !== undefined ? state.holograms : activeTheme.holograms ?? true;
  const crowdOn =
    state.crowd !== undefined ? state.crowd : activeTheme.crowd ?? true;
  const crowdLevel =
    state.crowdLevel !== undefined
      ? state.crowdLevel
      : activeTheme.crowdDensity === 'dense'
        ? 3
        : activeTheme.crowdDensity === 'quiet'
          ? 1
          : 2;

  return (
    <div
      className={`relative min-h-[100dvh] flex flex-col overflow-x-clip text-[var(--fg)] selection:bg-[var(--or)] selection:text-white ${
        isMatrix ? 'matrix-green-mode' : ''
      }`}
    >
      {/* 4K Hyper-Realistic Atmospheric Scene, Holograms, Walking Crowd & Multi-Plane Rain */}
      <HyperScene
        theme={activeTheme}
        sceneOn={state.scene !== 0}
        fxLevel={fxLevel}
        wetGlass={wetGlassOn}
        holograms={hologramsOn}
        crowd={crowdOn}
        crowdLevel={crowdLevel}
        wallUrl={wallUrl || undefined}
        wallIsVideo={wallIsVideo}
        backdropOverride={state.backdropOverride}
      />

      {/* Hidden Audio Engines */}
      <audio
        ref={audRef}
        onTimeUpdate={(e) => {
          if (npKind !== 'audio') return;
          const t = e.currentTarget.currentTime;
          setCurTime(t);
          if (currentAudioId && Math.floor(t) % 3 === 0) {
            setState((prev) => ({ ...prev, pos: { ...prev.pos, [currentAudioId]: t } }));
          }
        }}
        onLoadedMetadata={(e) => {
          if (npKind === 'audio' && isFinite(e.currentTarget.duration)) {
            setDur(e.currentTarget.duration);
          }
        }}
        onPlay={() => {
          if (npKind === 'audio') setPlaying(true);
        }}
        onPause={() => {
          if (npKind === 'audio') setPlaying(false);
        }}
        onEnded={() => {
          if (npKind === 'audio') stepTrack(1, true);
        }}
      />
      <audio
        ref={bkRef}
        onTimeUpdate={(e) => {
          if (npKind !== 'book') return;
          const t = e.currentTarget.currentTime;
          setCurTime(t);
          if (currentAudioId && Math.floor(t) % 3 === 0) {
            setState((prev) => ({ ...prev, pos: { ...prev.pos, [currentAudioId]: t } }));
          }
        }}
        onLoadedMetadata={(e) => {
          if (npKind === 'book' && isFinite(e.currentTarget.duration)) {
            setDur(e.currentTarget.duration);
          }
        }}
        onPlay={() => {
          if (npKind === 'book') setPlaying(true);
        }}
        onPause={() => {
          if (npKind === 'book') setPlaying(false);
        }}
        onEnded={() => {
          if (npKind === 'book') stepTrack(1, true);
        }}
      />

      {/* Hidden File Pickers */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*,video/*,.mkv,.m4b,.flac,.opus"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) importFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        // @ts-expect-error non-standard folder selection attribute
        webkitdirectory=""
        className="hidden"
        onChange={(e) => {
          if (e.target.files) importFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={backupInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          try {
            const parsed = JSON.parse(await readTextFile(f));
            if (parsed.state) setState((prev) => ({ ...prev, ...parsed.state }));
            if (parsed.diyThemes) {
              setDiyThemes(parsed.diyThemes);
              saveDIYThemes(parsed.diyThemes);
            }
            showToast('Backup restored');
          } catch {
            showToast('Invalid backup JSON');
          }
        }}
      />

      {/* Main Content Shell */}
      <div
        className="relative z-10 flex-1 flex flex-col"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) importFiles(e.dataTransfer.files);
        }}
      >
        {/* Top Sticky Header */}
        <header
          className={`sticky top-0 z-20 px-3 sm:px-6 pt-3 pb-2 transition-colors ${
            isBatman
              ? 'batman-panel border-b border-[#e31b23]/45'
              : isSleepy
                ? 'sleepy-panel border-b border-[#d8ceb8]/20'
                : isGkCrown
                  ? 'gk-crown-panel border-b border-[#e4b248]/45'
                  : isGkWood
                    ? 'gk-wood-panel border-b border-[#9be06c]/35'
                    : isCastlevania
                      ? 'castlevania-panel border-b-2 border-[#d90b1c]'
                      : isDune
                        ? 'dune-panel border-b border-[#ffd175]/45'
                        : isAkira
                          ? 'akira-panel border-b border-[#e61c24]/60'
                          : isRpo
                            ? 'rpo-panel border-b border-[#38e0ff]/55'
                            : isGits
                              ? 'gits-panel border-b border-[#2df0d2]/55'
                              : isThundercats
                                ? 'thundercats-panel border-b-2 border-[#e11d24]/80'
                                : 'backdrop-blur-xl bg-black/40 border-b border-white/10'
          }`}
        >
          {isCastlevania && <BloodDripFringe />}

          {/* Batman 2022 Tactical Riddler Cipher Top Telemetry Bar */}
          {isBatman && (
            <div className="max-w-7xl mx-auto mb-2 pb-1.5 border-b border-[#00e68a]/25 flex items-center justify-between gap-2 text-[11px] font-mono tracking-wider">
              <div className="flex items-center gap-2 min-w-0 truncate">
                <span className="px-1.5 py-0.5 bg-[#00e68a]/15 text-[#00e68a] border border-[#00e68a]/40 font-bold">
                  [ ? ]
                </span>
                <span className="text-[#00e68a] font-semibold truncate">
                  &gt;&gt; RATA ALADA // GOTHAM FORENSIC DECK — V02.22
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="hidden sm:inline text-[#e31b23] font-bold">FLARE: ACTIVE</span>
                <span className="text-[#9eb7aa]">{tracks.length} FILES</span>
              </div>
            </div>
          )}

          {/* Sleepy Hollow 1999 Ceremonial Gothic Crest Bar */}
          {isSleepy && (
            <div className="max-w-7xl mx-auto mb-2 flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d8ceb8]/35 to-[#c8101c]/55" />
              <div className="text-center px-2">
                <div className="sleepy-title text-xl sm:text-2xl leading-none">
                  Sleepy Hollow
                </div>
                <div className="text-[10px] tracking-[0.26em] uppercase text-[#d8ceb8]/80 mt-0.5">
                  Tarrytown Archive · A.D. 1799
                </div>
              </div>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#d8ceb8]/35 to-[#c8101c]/55" />
            </div>
          )}

          {/* The Green Knight Medieval Heraldry Banner */}
          {isGreenKnight && (
            <div className="max-w-7xl mx-auto mb-2 flex items-center gap-3">
              <div
                className={`h-px flex-1 bg-gradient-to-r from-transparent ${
                  isGkCrown ? 'via-[#e4b248]/55 to-[#d91b0c]/75' : 'via-[#9be06c]/45 to-[#d9c484]/55'
                }`}
              />
              <div className="text-center px-2">
                <div
                  className={`gk-blackletter text-xl sm:text-2xl leading-none ${
                    isGkCrown ? 'text-[#e8b954]' : 'text-[#dce8cb]'
                  }`}
                >
                  The Green Knight
                </div>
                <div
                  className={`text-[11px] italic mt-0.5 ${
                    isGkCrown ? 'text-[#f8edd6]/80' : 'text-[#9be06c]/85'
                  }`}
                >
                  {isGkCrown
                    ? 'When honor was everything · When courage made kings'
                    : 'One year hence at the Green Chapel · Anno Domini'}
                </div>
              </div>
              <div
                className={`h-px flex-1 bg-gradient-to-l from-transparent ${
                  isGkCrown ? 'via-[#e4b248]/55 to-[#d91b0c]/75' : 'via-[#9be06c]/45 to-[#d9c484]/55'
                }`}
              />
            </div>
          )}

          {/* Netflix Castlevania Blood Moon Banner */}
          {isCastlevania && (
            <div className="max-w-7xl mx-auto mb-2 flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d90b1c]/70 to-[#ff4d5a]" />
              <div className="text-center px-2">
                <div className="castlevania-title text-lg sm:text-2xl leading-none font-black uppercase">
                  Castlevania
                </div>
                <div className="text-[10px] tracking-[0.26em] uppercase text-[#e69ca3] mt-0.5">
                  Wallachia · Night of the Blood Moon
                </div>
              </div>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#d90b1c]/70 to-[#ff4d5a]" />
            </div>
          )}

          {/* Dune Scorching Arrakis Sun & Sand Horizon Banner */}
          {isDune && (
            <div className="max-w-7xl mx-auto mb-2 pb-1.5 border-b border-[#ffd175]/35 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#fff5cc] via-[#ffbe42] to-[#d97914] shadow-[0_0_16px_rgba(255,190,66,0.9)] shrink-0" />
                <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#ffd175] truncate">
                  ARRAKIS · HIGH SOLAR ZENITH · DEEP DESERT SIETCH
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase text-[#ffd175]/80 shrink-0">
                <span>SECOND MOON RISING</span>
              </div>
            </div>
          )}

          {/* Akira (1988) Neo-Tokyo Buildings + Kaneda Superbike HUD Banner */}
          {isAkira && (
            <div className="max-w-7xl mx-auto mb-2 pb-1.5 border-b border-[#e61c24]/45 flex items-center justify-between gap-2 overflow-hidden">
              <div className="flex items-center gap-2.5 min-w-0">
                <svg
                  viewBox="0 0 96 28"
                  className="w-20 h-6 shrink-0"
                  aria-hidden="true"
                >
                  {/* 1988 Neo-Tokyo Towers */}
                  <rect x="2" y="8" width="8" height="20" fill="#182032" stroke="#2b8cff" strokeWidth="0.6" />
                  <rect x="12" y="2" width="10" height="26" fill="#211219" stroke="#e61c24" strokeWidth="0.7" />
                  <rect x="24" y="6" width="7" height="22" fill="#182032" stroke="#ffd24d" strokeWidth="0.5" />
                  <line x1="17" y1="0" x2="17" y2="2" stroke="#ff2e38" strokeWidth="1" />
                  {/* Kaneda Red Superbike Silhouette & Tail Trail */}
                  <line x1="34" y1="22" x2="56" y2="22" stroke="#ff2e38" strokeWidth="2.2" />
                  <line x1="39" y1="19" x2="54" y2="19" stroke="#2b8cff" strokeWidth="1.2" />
                  <path
                    d="M54 22 L63 14 L76 14 L84 18 L89 22 Z"
                    fill="#e61c24"
                    stroke="#ffb3b7"
                    strokeWidth="0.7"
                  />
                  <circle cx="59" cy="22" r="4" fill="#111" stroke="#ffd24d" strokeWidth="1.2" />
                  <circle cx="82" cy="22" r="4" fill="#111" stroke="#ff2e38" strokeWidth="1.2" />
                  <circle cx="87" cy="17" r="2" fill="#d9f3ff" />
                </svg>
                <span className="akira-title text-xs sm:text-sm font-black uppercase truncate">
                  NEO-TOKYO ’88 // KANEDA MOTO &amp; TOWER GRID
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#2b8cff]/18 border border-[#2b8cff]/50 text-[#8dc3ff]">
                  <span className="inline-block w-2.5 h-1.5 rounded-full bg-gradient-to-r from-[#ff2e38] to-[#2b8cff]" />
                  GOOD FOR HEALTH
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#e61c24]/20 border border-[#e61c24]/60 text-[#ff8f94]">
                  A.D. 2019 / ’88
                </span>
              </div>
            </div>
          )}

          {/* Ready Player One OASIS X1 Visor & The Three Keys HUD Banner */}
          {isRpo && (
            <div className="max-w-7xl mx-auto mb-2 pb-1.5 border-b border-[#38e0ff]/40 flex items-center justify-between gap-2 overflow-hidden">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-1.5 py-0.5 bg-[#38e0ff]/18 border border-[#38e0ff]/60 text-[#7cebff] font-mono text-[10px] font-bold shrink-0">
                  X1 // OASIS
                </span>
                <span className="rpo-title text-xs sm:text-sm font-black uppercase truncate">
                  ANORAK’S ALMANAC · THE STACKS · HALLIDAY’S EGG
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px] font-bold">
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/60 text-amber-300">
                  🗝️ COPPER
                </span>
                <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/60 text-emerald-300">
                  🗝️ JADE
                </span>
                <span className="hidden md:inline px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/60 text-cyan-200">
                  🗝️ CRYSTAL
                </span>
              </div>
            </div>
          )}

          {/* Ghost in the Shell (攻殻機動隊) Japanese Cyberbrain Telemetry HUD Banner */}
          {isGits && (
            <div className="max-w-7xl mx-auto mb-2 pb-1.5 border-b border-[#2df0d2]/45 flex items-center justify-between gap-2 overflow-hidden">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-1.5 py-0.5 bg-[#2df0d2]/18 border border-[#2df0d2]/60 text-[#75ffea] font-mono text-[10px] font-bold shrink-0">
                  公安9課 // 電脳網
                </span>
                <span className="gits-title text-xs sm:text-sm font-black truncate">
                  攻殻機動隊 · 新浜市電脳通信 · 草薙素子
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px] font-bold">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/60 text-emerald-200">
                  光学迷彩: 稼働
                </span>
                <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-400/60 text-rose-200">
                  義体同期 100%
                </span>
                <span className="hidden md:inline text-[#75ffea]">{tracks.length} 件</span>
              </div>
            </div>
          )}

          {/* ThunderCats '85 Cats Lair & Eye of Thundera Telemetry HUD Banner */}
          {isThundercats && (
            <div className="max-w-7xl mx-auto mb-2 pb-1.5 border-b border-[#fbbf24]/45 flex items-center justify-between gap-2 overflow-hidden">
              <div className="flex items-center gap-2 min-w-0">
                <EyeOfThunderaSvg className="w-5 h-5 shrink-0 drop-shadow-[0_0_8px_rgba(225,29,36,0.85)]" />
                <span className="thundercats-title text-xs sm:text-sm font-black uppercase truncate">
                  THUNDERCATS ’85 // CATS LAIR · THIRD EARTH
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px] font-bold">
                <span className="px-1.5 py-0.5 rounded bg-[#fbbf24]/20 border border-[#fbbf24]/70 text-[#fde68a]">
                  SWORD OF OMENS
                </span>
                <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-[#e11d24]/25 border border-[#e11d24]/70 text-[#fecdd3]">
                  THUNDERTANK READY
                </span>
                <span className="hidden md:inline text-[#fde68a]">{tracks.length} OMENS</span>
              </div>
            </div>
          )}

          {/* X-Men '90s Animated Series / Danger Room HUD Banner */}
          {isXmen && (
            <div className="max-w-7xl mx-auto mb-2 pb-1.5 border-b-2 border-[#facc15]/60 flex items-center justify-between gap-2 overflow-hidden">
              <div className="flex items-center gap-2 min-w-0">
                <XMenBadgeSvg className="w-5 h-5 shrink-0 drop-shadow-[0_0_8px_rgba(250,204,21,0.75)]" />
                <span className="xmen-title text-xs sm:text-sm font-black uppercase truncate">
                  X-MEN ’92 // DANGER ROOM · CEREBRO ’90S EDITION
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px] font-bold">
                <span className="px-1.5 py-0.5 bg-[#facc15] text-[#090a0f] border border-[#090a0f]">
                  CEREBRO: ONLINE
                </span>
                <span className="hidden sm:inline px-1.5 py-0.5 bg-[#2563eb] text-white border border-[#facc15]">
                  SENTINEL ALERT
                </span>
                <span className="hidden md:inline text-[#facc15]">{tracks.length} ISSUES</span>
              </div>
            </div>
          )}

          {/* The Matrix Pure Phosphor-Green Mainframe Banner */}
          {isMatrix && (
            <div className="max-w-7xl mx-auto mb-2 pb-1.5 border-b border-[#00ff41]/55 flex items-center justify-between gap-2 overflow-hidden font-mono">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-1.5 py-0.5 bg-[#00ff41]/20 border border-[#00ff41] text-[#00ff41] text-[10px] font-bold shrink-0">
                  TRACE://01
                </span>
                <span className="matrix-title text-xs sm:text-sm font-black uppercase truncate">
                  THE MATRIX // CONSTRUCT CODE CASCADE · ZION MAINFRAME
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-bold text-[#00ff41]">
                <span className="px-1.5 py-0.5 bg-[#00ff41]/15 border border-[#00ff41]/70">
                  SYS: GREEN
                </span>
                <span className="hidden sm:inline px-1.5 py-0.5 bg-[#00ff41]/15 border border-[#00ff41]/70">
                  RAIN: CASCADE
                </span>
                <span className="hidden md:inline">{tracks.length} NODES</span>
              </div>
            </div>
          )}

          {/* Pirates of the Dark Seas & Kraken Watch HUD Banner */}
          {isPirates && (
            <div className="max-w-7xl mx-auto mb-2 pb-1.5 border-b border-[#14b8a6]/45 flex items-center justify-between gap-2 overflow-hidden">
              <div className="flex items-center gap-2 min-w-0">
                <KrakenTentacleSvg className="w-5 h-5 shrink-0 drop-shadow-[0_0_8px_rgba(20,184,166,0.75)]" />
                <span className="pirates-title text-xs sm:text-sm font-black uppercase truncate">
                  DARK SEAS // KRAKEN WATCH · LEVIATHAN ABYSS
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px] font-bold">
                <span className="px-1.5 py-0.5 bg-[#14b8a6]/20 border border-[#14b8a6]/65 text-[#99f6e4]">
                  KRAKEN STIRRING
                </span>
                <span className="hidden sm:inline px-1.5 py-0.5 bg-[#f59e0b]/20 border border-[#f59e0b]/65 text-[#fde68a]">
                  BLACK SAILS
                </span>
                <span className="hidden md:inline text-[#99f6e4]">{tracks.length} CASKS</span>
              </div>
            </div>
          )}

          {/* Steampunk Hyper-Realistic Steam Machine Boiler Telemetry Banner */}
          {isSteampunk && (
            <div className="max-w-7xl mx-auto mb-2 pb-1.5 border-b border-[#d97706]/55 flex items-center justify-between gap-2 overflow-hidden">
              <div className="flex items-center gap-2 min-w-0">
                <SteampunkGearSvg className="w-5 h-5 shrink-0 cog-spin" />
                <SteampunkGearSvg className="w-4 h-4 -ml-2.5 shrink-0 cog-spin-rev" />
                <span className="steampunk-title text-xs sm:text-sm font-black uppercase truncate">
                  STEAM MACHINE // BOILER #04 · PRESSURE &amp; PISTON DECK
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px] font-bold">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#d97706]/25 border border-[#fbbf24]/70 text-[#fde68a]">
                  <SteampunkGaugeSvg className="w-3.5 h-3.5" />
                  185 PSI
                </span>
                <span className="hidden sm:inline px-1.5 py-0.5 bg-[#9a3412]/35 border border-[#f59e0b]/60 text-[#fed7aa]">
                  STEAM VENT: OPEN
                </span>
                <span className="hidden md:inline text-[#fde68a]">{tracks.length} COGS</span>
              </div>
            </div>
          )}

          {/* Aliens Night Cornfield & UFO Tractor Beam Radar Banner */}
          {isAlien && (
            <div className="max-w-7xl mx-auto mb-2 pb-1.5 border-b border-[#39ff14]/50 flex items-center justify-between gap-2 overflow-hidden font-mono">
              <div className="flex items-center gap-2 min-w-0">
                <AlienUfoSvg className="w-6 h-6 shrink-0 drop-shadow-[0_0_8px_rgba(57,255,20,0.75)]" />
                <span className="alien-title text-xs sm:text-sm font-black uppercase truncate">
                  SECTOR 04 // NIGHT CORNFIELDS · UFO TRACTOR BEAM LOCK
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-bold">
                <span className="px-1.5 py-0.5 bg-[#39ff14]/20 border border-[#39ff14]/75 text-[#86efac]">
                  BEAM: ACTIVE
                </span>
                <span className="hidden sm:inline px-1.5 py-0.5 bg-[#15803d]/35 border border-[#4ade80]/65 text-[#dcfce7]">
                  🌽 NIGHT FIELDS
                </span>
                <span className="hidden md:inline text-[#86efac]">{tracks.length} SIGNALS</span>
              </div>
            </div>
          )}

          {/* Dungeons & Dragons Carved Oak Tabletop & Interactive Polyhedral Dice Tray */}
          {isDnd && (
            <div className="max-w-7xl mx-auto mb-2 p-2 rounded-[4px] dnd-table-felt flex flex-wrap items-center justify-between gap-2 overflow-hidden">
              <div className="flex items-center gap-2 min-w-0">
                <D20DieSvg className="w-6 h-6 shrink-0 drop-shadow-[0_0_10px_rgba(220,38,38,0.75)]" label={String(dndRoll.val)} />
                <span className="dnd-title text-xs sm:text-sm font-black uppercase truncate">
                  DM TABLETOP // ROLL INITIATIVE · POLYHEDRAL DICE TRAY
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['d4', 'd6', 'd8', 'd10', 'd12', 'd20'] as const).map((die) => {
                  const maxSides = Number(die.slice(1));
                  const isActiveDie = dndRoll.die === die;
                  return (
                    <button
                      key={die}
                      type="button"
                      onClick={() => {
                        const val = Math.floor(Math.random() * maxSides) + 1;
                        setDndRoll({ die, val });
                        showToast(
                          val === maxSides && die === 'd20'
                            ? '🎲 NAT 20! CRITICAL HIT!'
                            : val === 1 && die === 'd20'
                              ? '🎲 NAT 1! CRITICAL MISS!'
                              : `🎲 Rolled ${die}: ${val}`
                        );
                      }}
                      className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
                        die === 'd20' || die === 'd12'
                          ? 'dnd-die-btn'
                          : 'dnd-die-chip border border-[#fbbf24]/60 bg-[#2a150c]/90 text-[#fef3c7] hover:bg-[#7f1d1d]'
                      } ${isActiveDie ? 'ring-1 ring-[#fbbf24]' : ''}`}
                      title={`Roll ${die}`}
                    >
                      {die}
                    </button>
                  );
                })}
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-[#7f1d1d]/75 border border-[#fbbf24]/70 text-[#fef3c7] text-[10px] font-bold dnd-die-chip">
                  {dndRoll.die.toUpperCase()}: {dndRoll.val}
                </span>
              </div>
            </div>
          )}

          {/* Templar Dark Fantasy Medieval Rain & Crusade Armory Bar */}
          {isTemplar && (
            <div className="max-w-7xl mx-auto mb-2 p-2 rounded-[4px] bg-[#0d131c]/90 border border-[#94a3b8]/45 flex flex-wrap items-center justify-between gap-2 overflow-hidden">
              <div className="flex items-center gap-2 min-w-0">
                <TemplarHelmSvg className="w-6 h-6 shrink-0" />
                <span className="templar-title text-xs sm:text-sm font-black uppercase truncate">
                  TEMPLAR ORDER // DARK RAINY SIEGE · MEDIEVAL ARMORY
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(
                  [
                    { id: 'HELM', label: 'Crusade Helm', msg: '🛡️ Great Crusade Helm visor lowered against storm rain.' },
                    { id: 'SWORD', label: 'Broad Sword', msg: '⚔️ Templar Longsword drawn — tempered steel gleaming.' },
                    { id: 'SHIELD', label: 'Cross Shield', msg: '⚜️ Heater Cross Shield raised — siege line fortified.' },
                  ] as const
                ).map((tool) => {
                  const activeTool = templarTool === tool.id;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => {
                        setTemplarTool(tool.id);
                        showToast(tool.msg);
                      }}
                      className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-all rounded-[3px] border ${
                        activeTool
                          ? 'templar-btn border-[#cbd5e1]'
                          : 'bg-[#17202e] border-[#64748b]/55 text-[#cbd5e1] hover:border-[#dc2626]'
                      }`}
                    >
                      {tool.id === 'HELM' && <TemplarHelmSvg className="w-3.5 h-3.5" />}
                      {tool.id === 'SWORD' && <MedievalSwordSvg className="w-3.5 h-3.5" />}
                      {tool.id === 'SHIELD' && <CrusaderShieldSvg className="w-3.5 h-3.5" />}
                      <span>{tool.label}</span>
                    </button>
                  );
                })}
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 bg-[#1e293b]/85 border border-[#94a3b8]/50 text-[#e2e8f0] text-[10px] font-mono">
                  STORM: HEAVY RAIN
                </span>
              </div>
            </div>
          )}

          {/* The Witcher (Netflix) Wolf Medallion & Interactive Sign Altar */}
          {isWitcher && (
            <div className="max-w-7xl mx-auto mb-2 p-2 rounded-[4px] bg-[#0b0b0f]/92 border border-[#f59e0b]/45 flex flex-wrap items-center justify-between gap-2 overflow-hidden">
              <div className="flex items-center gap-2 min-w-0">
                <WolfMedallionSvg className="w-6 h-6 shrink-0 drop-shadow-[0_0_8px_rgba(245,158,11,0.55)]" />
                <span className="witcher-title text-xs sm:text-sm font-black uppercase truncate">
                  WITCHER // MEDALLION HUMMING · SIGNS &amp; ELDER RUNES
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(
                  [
                    { id: 'IGNI', desc: 'Pyrokinetic Flame Burst' },
                    { id: 'AARD', desc: 'Telekinetic Shockwave' },
                    { id: 'QUEN', desc: 'Runic Shield Ward' },
                    { id: 'YRDEN', desc: 'Chaos Bind Rune' },
                    { id: 'AXII', desc: 'Mind Hex Charm' },
                  ] as const
                ).map((s) => {
                  const activeSign = witcherSign === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setWitcherSign(s.id);
                        showToast(`Cast ${s.id} Sign — ${s.desc}`);
                      }}
                      className={`witcher-rune-chip inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        activeSign
                          ? 'witcher-btn border-[#fbbf24]'
                          : 'bg-[#18181b]/90 border-[#52525b] text-[#e4e4e7] hover:border-[#f59e0b]'
                      }`}
                      title={`Cast ${s.id}: ${s.desc}`}
                    >
                      <WitcherSignSvg sign={s.id} className="w-3.5 h-3.5" />
                      <span>{s.id}</span>
                    </button>
                  );
                })}
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 bg-[#18181b]/90 border border-[#a855f7]/60 text-[#d8b4fe] text-[10px] font-mono witcher-rune-chip">
                  ᚠᚢᚦ · {witcherSign} ACTIVE
                </span>
              </div>
            </div>
          )}

          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-10 h-10 ${chipRadiusClass} ${
                  isBatman
                    ? 'bg-[#050809] border border-[#00e68a]/50 text-[#e31b23] font-mono font-bold'
                    : isSleepy
                      ? 'bg-[#080708] border border-[#d8ceb8]/35 text-[#c8101c]'
                      : isGkCrown
                        ? 'bg-[#1a0604] border border-[#e4b248]/65 text-[#e8b954] gk-blackletter'
                        : isGkWood
                          ? 'bg-[#0e190c] border border-[#9be06c]/50 text-[#9be06c] gk-blackletter'
                          : isCastlevania
                            ? 'castlevania-blood-btn'
                            : isDune
                              ? 'dune-sun-btn'
                              : isAkira
                                ? 'akira-btn'
                                : isRpo
                                  ? 'rpo-btn'
                                  : isGits
                                    ? 'gits-btn'
                                    : isThundercats
                                      ? 'thundercats-btn'
                                      : isXmen
                                        ? 'xmen-btn'
                                        : isMatrix
                                          ? 'matrix-btn font-mono'
                                          : isPirates
                                            ? 'pirates-btn'
                                            : isSteampunk
                                              ? 'steampunk-btn'
                                              : isAlien
                                                ? 'alien-btn font-mono'
                                                : isDnd
                                                  ? 'dnd-die-btn'
                                                  : isTemplar
                                                    ? 'templar-btn'
                                                    : isWitcher
                                                      ? 'witcher-btn'
                                                      : `mat-surface ${materialTextureClass}`
                } flex items-center justify-center text-lg shrink-0`}
                style={{
                  boxShadow: isBatman
                    ? '0 0 18px rgba(227,27,35,0.35), inset 0 0 10px rgba(0,230,138,0.18)'
                    : isSleepy
                      ? '0 0 18px rgba(200,16,28,0.3)'
                      : isCastlevania
                        ? '0 0 20px rgba(217,11,28,0.55)'
                        : isDune
                          ? '0 0 20px rgba(240,156,43,0.55)'
                          : isAkira
                            ? '0 0 20px rgba(230,28,36,0.55)'
                            : isRpo
                              ? '0 0 22px rgba(56,224,255,0.55)'
                              : isGits
                                ? '0 0 22px rgba(45,240,210,0.55)'
                                : isThundercats
                                  ? '0 0 22px rgba(225,29,36,0.65), 0 0 12px rgba(251,191,36,0.4)'
                                  : isXmen
                                    ? '3px 3px 0 #ef4444'
                                    : isMatrix
                                      ? '0 0 22px rgba(0,255,65,0.65)'
                                      : isPirates
                                        ? '0 0 22px rgba(20,184,166,0.55)'
                                        : isSteampunk
                                          ? '0 0 22px rgba(217,119,6,0.55)'
                                          : isAlien
                                            ? '0 0 22px rgba(57,255,20,0.55)'
                                            : isDnd
                                              ? '0 0 22px rgba(220,38,38,0.55)'
                                              : isTemplar
                                                ? '0 0 20px rgba(153,27,27,0.55), inset 0 0 8px rgba(148,163,184,0.28)'
                                                : isWitcher
                                                  ? '0 0 22px rgba(245,158,11,0.55), 0 0 10px rgba(168,85,247,0.35)'
                                                  : `0 0 18px ${activeTheme.accent}44`,
                }}
              >
                {isBatman ? (
                  '[?]'
                ) : isThundercats ? (
                  <EyeOfThunderaSvg className="w-7 h-7" />
                ) : isXmen ? (
                  <XMenBadgeSvg className="w-7 h-7" />
                ) : isPirates ? (
                  <KrakenTentacleSvg className="w-7 h-7" />
                ) : isSteampunk ? (
                  <SteampunkGearSvg className="w-7 h-7 cog-spin" />
                ) : isAlien ? (
                  <AlienUfoSvg className="w-7 h-7" />
                ) : isDnd ? (
                  <D20DieSvg className="w-7 h-7" label={String(dndRoll.val)} />
                ) : isTemplar ? (
                  <TemplarHelmSvg className="w-7 h-7" />
                ) : isWitcher ? (
                  <WolfMedallionSvg className="w-7 h-7" />
                ) : (
                  activeTheme.e
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight truncate flex items-center gap-1.5">
                  <span
                    className={`opacity-90 ${
                      isBatman
                        ? 'text-[#00e68a] font-mono text-sm'
                        : isMatrix
                          ? 'text-[#00ff41] font-mono text-sm'
                          : isWitcher
                            ? 'text-[#fbbf24] font-serif text-sm'
                            : 'text-[var(--pe)]'
                    }`}
                  >
                    {activeTheme.l || ''}
                  </span>
                  <span
                    className={
                      isSleepy
                        ? 'tracking-wide text-[#f2ece0]'
                        : isGreenKnight
                          ? 'gk-blackletter text-xl font-normal tracking-wide'
                          : isCastlevania
                            ? 'text-[#fff0f0] tracking-wider uppercase'
                            : isDune
                              ? 'text-[#fff3d1] tracking-widest uppercase'
                              : isAkira
                                ? 'akira-title tracking-widest uppercase'
                                : isRpo
                                  ? 'rpo-title tracking-wider uppercase'
                                  : isGits
                                    ? 'gits-title tracking-wider'
                                    : isThundercats
                                      ? 'thundercats-title tracking-widest uppercase'
                                      : isXmen
                                        ? 'xmen-title tracking-widest uppercase'
                                        : isMatrix
                                          ? 'matrix-title font-mono uppercase'
                                          : isPirates
                                            ? 'pirates-title tracking-wider uppercase'
                                            : isSteampunk
                                              ? 'steampunk-title tracking-wider uppercase'
                                              : isAlien
                                                ? 'alien-title tracking-wider uppercase'
                                                : isDnd
                                                  ? 'dnd-title tracking-wider uppercase'
                                                  : isTemplar
                                                    ? 'templar-title tracking-widest uppercase'
                                                    : isWitcher
                                                      ? 'witcher-title tracking-widest uppercase'
                                                      : ''
                    }
                  >
                    {state.title ||
                      (isBatman
                        ? 'THE BATMAN'
                        : isSleepy
                          ? 'ICHABOD ARCHIVE'
                          : isGreenKnight
                            ? 'Royal Folio'
                            : isCastlevania
                              ? 'Dracula’s Archive'
                              : isDune
                                ? 'ARRAKIS DECK'
                                : isAkira
                                  ? 'AKIRA ’88'
                                  : isRpo
                                    ? 'THE OASIS'
                                    : isGits
                                      ? '攻殻機動隊・九課'
                                      : isThundercats
                                        ? 'THUNDERCATS ’85'
                                        : isXmen
                                          ? 'X-MEN ’92'
                                          : isMatrix
                                            ? 'THE MATRIX'
                                            : isPirates
                                              ? 'DARK SEAS'
                                              : isSteampunk
                                                ? 'AETHER ENGINE'
                                                : isAlien
                                                  ? 'CROP INVASION'
                                                  : isDnd
                                                    ? 'DUNGEONS & DRAGONS'
                                                    : isTemplar
                                                      ? 'TEMPLAR CITADEL'
                                                      : isWitcher
                                                        ? 'THE WITCHER'
                                                        : '#XI')}
                  </span>
                  <span
                    className={`opacity-90 ${
                      isBatman
                        ? 'text-[#e31b23] font-mono text-sm'
                        : isMatrix
                          ? 'text-[#00ff41] font-mono text-sm'
                          : isAlien
                            ? 'text-[#39ff14] font-mono text-sm'
                            : isDnd
                              ? 'text-[#fbbf24] font-bold text-sm'
                              : isTemplar
                                ? 'text-[#f87171] font-bold text-sm'
                                : isWitcher
                                  ? 'text-[#c084fc] font-serif text-sm'
                                  : 'text-[var(--pe)]'
                    }`}
                  >
                    {activeTheme.r || ''}
                  </span>
                </h1>
                <p
                  className={`text-[11px] truncate ${
                    isBatman
                      ? 'text-[#00e68a]/85 font-mono'
                      : isSleepy || isGreenKnight
                        ? 'text-[var(--mu)] italic'
                        : isCastlevania
                          ? 'text-[#ff7582]'
                          : isDune
                            ? 'text-[#ffd175]'
                            : isAkira
                              ? 'text-[#7db9ff] font-mono'
                              : isRpo
                                ? 'text-[#7cebff] font-mono'
                                : isGits
                                  ? 'text-[#75ffea] font-mono'
                                  : isThundercats
                                    ? 'text-[#fde68a] font-mono'
                                    : isXmen
                                      ? 'text-[#fef08a] font-bold'
                                      : isMatrix
                                        ? 'text-[#4dff79] font-mono'
                                        : isPirates
                                          ? 'text-[#99f6e4] font-mono'
                                          : isSteampunk
                                            ? 'text-[#fde68a] font-mono'
                                            : isAlien
                                              ? 'text-[#86efac] font-mono'
                                              : isDnd
                                                ? 'text-[#fde68a] font-semibold'
                                                : isTemplar
                                                  ? 'text-[#cbd5e1] font-mono'
                                                  : isWitcher
                                                    ? 'text-[#d4d4d8] font-serif tracking-wide'
                                                    : 'text-[var(--mu)]'
                  }`}
                >
                  {activeTheme.label} · {tracks.length}{' '}
                  {tracks.length === 1 ? uiCopy.itemSingular : uiCopy.itemPlural}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={openAddSheet}
                className={`relative min-h-[44px] min-w-[44px] px-3 ${chipRadiusClass} ${
                  isBatman
                    ? 'bg-[#e31b23] border border-[#00e68a]/45 text-white font-mono'
                    : isSleepy
                      ? 'bg-[#c8101c] border border-[#d8ceb8]/40 text-[#f2ece0]'
                      : isGkCrown
                        ? 'bg-[#d91b0c] border border-[#e4b248]/70 text-[#f8edd6] shadow-[0_0_16px_rgba(217,27,12,0.4)]'
                        : isGkWood
                          ? 'bg-[#3d8c2b] border border-[#d9c484]/60 text-[#f5f8ee] shadow-[0_0_14px_rgba(76,166,56,0.35)]'
                          : isCastlevania
                            ? 'castlevania-blood-btn'
                            : isDune
                              ? 'dune-sun-btn'
                              : isAkira
                                ? 'akira-btn font-mono'
                                : isRpo
                                  ? 'rpo-btn font-mono'
                                  : isGits
                                    ? 'gits-btn font-mono'
                                    : isThundercats
                                      ? 'thundercats-btn'
                                      : isXmen
                                        ? 'xmen-btn'
                                        : isMatrix
                                          ? 'matrix-btn font-mono'
                                          : isPirates
                                            ? 'pirates-btn'
                                            : isSteampunk
                                              ? 'steampunk-btn'
                                              : isAlien
                                                ? 'alien-btn font-mono'
                                                : isDnd
                                                  ? 'dnd-die-btn'
                                                  : isTemplar
                                                    ? 'templar-btn'
                                                    : isWitcher
                                                      ? 'witcher-btn'
                                                      : 'bg-[var(--or)] text-white shadow-lg shadow-[var(--or)]/30'
                } font-bold text-xs flex items-center gap-1.5 hover:brightness-110 transition-all whitespace-nowrap shrink-0`}
                title={uiCopy.addBtn}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{uiCopy.addBtn}</span>
                {isCastlevania && <BloodDripFringe compact />}
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen((v) => !v)}
                className={`min-h-[44px] min-w-[44px] ${chipRadiusClass} ${themeCardClass} ${
                  isDnd ? 'dnd-die-chip' : isWitcher ? 'witcher-rune-chip' : ''
                } ${
                  isBatman
                    ? 'text-[#00e68a]'
                    : isCastlevania
                      ? 'text-[#ff4d5a]'
                      : isDune
                        ? 'text-[#ffd175]'
                        : isAkira
                          ? 'text-[#2b8cff]'
                          : isRpo
                            ? 'text-[#38e0ff]'
                            : isGits
                              ? 'text-[#2df0d2]'
                              : isThundercats
                                ? 'text-[#fbbf24]'
                                : isXmen
                                  ? 'text-[#facc15]'
                                  : isMatrix
                                    ? 'text-[#00ff41]'
                                    : isPirates
                                      ? 'text-[#14b8a6]'
                                      : isSteampunk
                                        ? 'text-[#fbbf24]'
                                        : isAlien
                                          ? 'text-[#39ff14]'
                                          : isDnd
                                            ? 'text-[#fbbf24]'
                                            : isTemplar
                                              ? 'text-[#e2e8f0]'
                                              : isWitcher
                                                ? 'text-[#fbbf24]'
                                                : 'text-[var(--pe)]'
                } flex items-center justify-center hover:brightness-110 shrink-0`}
                aria-label={isGits ? '電脳検索' : 'Search library'}
                title={isGits ? '検索' : isGreenKnight ? 'Seek' : isCastlevania ? 'Hunt' : 'Search'}
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={openSortSheet}
                className={`min-h-[44px] min-w-[44px] ${chipRadiusClass} ${themeCardClass} ${
                  isDnd ? 'dnd-die-chip' : isWitcher ? 'witcher-rune-chip' : ''
                } ${
                  isBatman
                    ? 'text-[#00e68a]'
                    : isCastlevania
                      ? 'text-[#ff4d5a]'
                      : isDune
                        ? 'text-[#ffd175]'
                        : isAkira
                          ? 'text-[#2b8cff]'
                          : isRpo
                            ? 'text-[#38e0ff]'
                            : isGits
                              ? 'text-[#2df0d2]'
                              : isThundercats
                                ? 'text-[#fbbf24]'
                                : isXmen
                                  ? 'text-[#facc15]'
                                  : isMatrix
                                    ? 'text-[#00ff41]'
                                    : isPirates
                                      ? 'text-[#14b8a6]'
                                      : isSteampunk
                                        ? 'text-[#fbbf24]'
                                        : isAlien
                                          ? 'text-[#39ff14]'
                                          : isDnd
                                            ? 'text-[#fbbf24]'
                                            : isTemplar
                                              ? 'text-[#e2e8f0]'
                                              : isWitcher
                                                ? 'text-[#fbbf24]'
                                                : 'text-[var(--pe)]'
                } flex items-center justify-center hover:brightness-110 shrink-0`}
                aria-label={isGits ? '並び替え' : 'Sort library'}
                title={isGits ? '並び替え' : isGreenKnight || isCastlevania ? 'Order' : 'Sort'}
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={openFeaturesSheet}
                className={`min-h-[44px] min-w-[44px] px-3 ${chipRadiusClass} ${
                  isDnd
                    ? 'dnd-die-btn'
                    : isTemplar
                      ? 'templar-btn'
                      : isWitcher
                        ? 'witcher-rune-chip ' + themeCardClass
                        : themeCardClass
                } flex items-center justify-center gap-1.5 text-xs font-bold hover:brightness-110 whitespace-nowrap shrink-0`}
                title={`${uiCopy.featuresBtn} & DIY`}
                aria-label={isGits ? '電脳機能とDIY' : 'Features & DIY'}
              >
                {isSteampunk ? (
                  <SteampunkGaugeSvg className="w-4 h-4 shrink-0" />
                ) : isAlien ? (
                  <AlienUfoSvg className="w-4 h-4 shrink-0" />
                ) : isDnd ? (
                  <D20DieSvg className="w-4 h-4 shrink-0" label={String(dndRoll.val)} />
                ) : isTemplar ? (
                  <MedievalSwordSvg className="w-4 h-4 shrink-0" />
                ) : isWitcher ? (
                  <WitcherSignSvg sign={witcherSign} className="w-4 h-4 shrink-0" />
                ) : (
                  <Sparkles className="w-4 h-4 text-[var(--or)]" />
                )}
                <span className="hidden sm:inline">{uiCopy.featuresBtn}</span>
              </button>
              <button
                type="button"
                onClick={openSettingsSheet}
                className={`min-h-[44px] min-w-[44px] ${chipRadiusClass} ${themeCardClass} ${
                  isDnd ? 'dnd-die-chip' : isWitcher ? 'witcher-rune-chip' : ''
                } ${
                  isBatman
                    ? 'text-[#e31b23]'
                    : isSleepy || isCastlevania
                      ? 'text-[#ff3b4a]'
                      : isDune
                        ? 'text-[#ffd175]'
                        : isAkira
                          ? 'text-[#ff2e38]'
                          : isRpo
                            ? 'text-[#e879f9]'
                            : isGits
                              ? 'text-[#ff3b52]'
                              : isThundercats
                                ? 'text-[#e11d24]'
                                : isXmen
                                  ? 'text-[#ef4444]'
                                  : isMatrix
                                    ? 'text-[#00ff41]'
                                    : isPirates
                                      ? 'text-[#f59e0b]'
                                      : isSteampunk
                                        ? 'text-[#f59e0b]'
                                        : isAlien
                                          ? 'text-[#39ff14]'
                                          : isDnd
                                            ? 'text-[#fbbf24]'
                                            : isTemplar
                                              ? 'text-[#f87171]'
                                              : isWitcher
                                                ? 'text-[#fbbf24]'
                                                : 'text-[var(--pe)]'
                } flex items-center justify-center hover:brightness-110 shrink-0`}
                aria-label={isGits ? '端末設定' : 'Deck Settings'}
                title={isGits ? '端末設定' : isGreenKnight ? 'Steward' : isCastlevania ? 'Night Council' : 'Settings'}
              >
                {isSteampunk ? (
                  <SteampunkGearSvg className="w-4 h-4 cog-spin" />
                ) : isDnd ? (
                  <D20DieSvg className="w-4 h-4" label="⚙" />
                ) : isTemplar ? (
                  <CrusaderShieldSvg className="w-4 h-4" />
                ) : isWitcher ? (
                  <WolfMedallionSvg className="w-4 h-4" />
                ) : (
                  <Settings className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Inline Search Bar */}
          {searchOpen && (
            <div className="max-w-7xl mx-auto mt-2.5 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[var(--mu)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  autoFocus
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder={uiCopy.searchPlaceholder}
                  className={`w-full min-h-[44px] pl-10 pr-9 ${chipRadiusClass} bg-black/75 border ${
                    isBatman
                      ? 'border-[#00e68a]/40 font-mono text-[#00e68a]'
                      : isCastlevania
                        ? 'border-[#d90b1c]/60 text-[#fff0f0]'
                        : isGkCrown
                          ? 'border-[#e4b248]/50 text-[#f8edd6]'
                          : isGkWood
                            ? 'border-[#9be06c]/45 text-[#eef3e4]'
                            : isSleepy
                              ? 'border-[#d8ceb8]/35 text-[#f2ece0]'
                              : isDune
                                ? 'border-[#ffd175]/50 text-[#fff4d4]'
                                : isAkira
                                  ? 'border-[#e61c24]/60 font-mono text-[#fff4f4]'
                                  : isRpo
                                    ? 'border-[#38e0ff]/60 font-mono text-[#e0f7ff]'
                                    : isGits
                                      ? 'border-[#2df0d2]/60 font-mono text-[#d8fff9]'
                                      : isThundercats
                                        ? 'border-[#fbbf24]/60 font-mono text-[#fffbeb]'
                                        : isXmen
                                          ? 'border-[#facc15]/80 font-bold text-[#fef9c3]'
                                          : isMatrix
                                            ? 'border-[#00ff41]/75 font-mono text-[#00ff41]'
                                            : isPirates
                                              ? 'border-[#14b8a6]/65 font-mono text-[#ccfbf1]'
                                              : isSteampunk
                                                ? 'border-[#d97706]/70 font-mono text-[#fde68a]'
                                                : isAlien
                                                  ? 'border-[#39ff14]/70 font-mono text-[#dcfce7]'
                                                  : isDnd
                                                    ? 'border-[#fbbf24]/70 text-[#fef3c7]'
                                                    : isTemplar
                                                      ? 'border-[#94a3b8]/65 text-[#e2e8f0]'
                                                      : isWitcher
                                                        ? 'border-[#f59e0b]/65 text-[#fef3c7]'
                                                        : 'border-white/15'
                  } text-sm`}
                />
                {searchQ && (
                  <button
                    type="button"
                    onClick={() => setSearchQ('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[var(--mu)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Horizontal Category & Tools Navigation Bar */}
          <nav className="max-w-7xl mx-auto mt-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
            {(
              [
                { key: 'video', label: tabLabels[0], icon: VideoIcon },
                { key: 'music', label: tabLabels[1], icon: Music },
                { key: 'lists', label: tabLabels[2], icon: ListMusic },
                { key: 'books', label: tabLabels[3], icon: BookOpen },
              ] as { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[]
            ).map(({ key, label, icon: Icon }) => {
              const active = state.tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateState({ tab: key })}
                  className={`relative min-h-[44px] px-4 ${chipRadiusClass} ${
                    isDnd
                      ? active
                        ? 'dnd-die-btn'
                        : 'dnd-die-chip'
                      : isWitcher
                        ? 'witcher-rune-chip'
                        : ''
                  } text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all shrink-0 border ${
                    active
                      ? isBatman
                        ? 'bg-[#e31b23] text-white border-[#00e68a]/75 shadow-[0_0_16px_rgba(227,27,35,0.45)] font-mono'
                        : isSleepy
                          ? 'bg-[#c8101c] text-[#f2ece0] border-[#d8ceb8]/60 shadow-[0_0_16px_rgba(200,16,28,0.4)]'
                          : isGkCrown
                            ? 'bg-[#d91b0c] text-[#f8edd6] border-[#e4b248] shadow-[0_0_16px_rgba(217,27,12,0.45)]'
                            : isGkWood
                              ? 'bg-[#3d8c2b] text-[#f5f8ee] border-[#d9c484] shadow-[0_0_16px_rgba(76,166,56,0.4)]'
                              : isCastlevania
                                ? 'castlevania-blood-btn'
                                : isDune
                                  ? 'dune-sun-btn'
                                  : isAkira
                                    ? 'akira-btn font-mono'
                                    : isRpo
                                      ? 'rpo-btn font-mono'
                                      : isGits
                                        ? 'gits-btn font-mono'
                                        : isThundercats
                                          ? 'thundercats-btn'
                                          : isXmen
                                            ? 'xmen-btn'
                                            : isMatrix
                                              ? 'matrix-btn font-mono'
                                              : isPirates
                                                ? 'pirates-btn'
                                                : isSteampunk
                                                  ? 'steampunk-btn'
                                                  : isAlien
                                                    ? 'alien-btn font-mono'
                                                    : isDnd
                                                      ? 'dnd-die-btn border-[#fbbf24]'
                                                      : isTemplar
                                                        ? 'templar-btn border-[#cbd5e1]'
                                                        : isWitcher
                                                          ? 'witcher-btn border-[#fbbf24]'
                                                          : 'bg-[var(--or)] text-white border-transparent shadow-lg shadow-[var(--or)]/30'
                      : `${themeCardClass} text-[var(--fg)] hover:brightness-110 ${
                          isBatman || isMatrix || isAlien ? 'font-mono' : ''
                        } ${isMatrix ? 'text-[#00ff41]' : ''}`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                  {active && isCastlevania && <BloodDripFringe compact />}
                </button>
              );
            })}

            <div className="h-6 w-px bg-white/15 mx-1 shrink-0" />

            <button
              type="button"
              onClick={() => setPage('wallpapers')}
              className={`min-h-[44px] px-3.5 ${chipRadiusClass} ${themeCardClass} ${
                isDnd ? 'dnd-die-chip' : isWitcher ? 'witcher-rune-chip' : ''
              } text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 hover:brightness-110`}
            >
              <ImageIcon className="w-4 h-4 text-[var(--pe)]" />
              <span>{uiCopy.wallTab}</span>
            </button>

            <button
              type="button"
              onClick={() => setPage('browser')}
              className={`min-h-[44px] px-3.5 ${chipRadiusClass} ${themeCardClass} ${
                isDnd ? 'dnd-die-chip' : isWitcher ? 'witcher-rune-chip' : ''
              } text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 hover:brightness-110`}
            >
              <Compass className="w-4 h-4 text-[var(--pe)]" />
              <span>{uiCopy.explorerTab}</span>
            </button>

            <button
              type="button"
              onClick={() => setPage('keeper')}
              className={`min-h-[44px] px-3.5 ${chipRadiusClass} ${themeCardClass} ${
                isDnd ? 'dnd-die-chip' : isWitcher ? 'witcher-rune-chip' : ''
              } text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 hover:brightness-110`}
            >
              <Layers className="w-4 h-4 text-[var(--pe)]" />
              <span>{uiCopy.keeperTab}</span>
            </button>
          </nav>
        </header>

        {/* Main Scrollable Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-4 pb-52">
          {/* Active Playlist / Smart Filter Chip */}
          {state.tab !== 'lists' && activeFilterLabel && (
            <div
              className={`mb-3 flex items-center justify-between gap-2 px-3.5 py-2.5 ${chipRadiusClass} ${themeCardClass}`}
            >
              <span className="text-xs font-bold">
                {isGits ? '表示中:' : 'Showing:'}{' '}
                <span className="text-[var(--or)]">{activeFilterLabel}</span> ({visibleTracks.length})
              </span>
              <button
                type="button"
                onClick={() => updateState({ sel: { ...state.sel, [activeKind]: null } })}
                className="min-h-[36px] px-3 rounded-lg bg-white/10 text-xs font-bold"
              >
                {isGits ? 'すべて表示' : 'Show All'}
              </button>
            </div>
          )}

          {/* Playlists Hub View */}
          {state.tab === 'lists' ? (
            <div className="space-y-6">
              {/* Smart Lists Grid */}
              <section>
                <div className="flex items-center justify-between mb-2.5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--pe)]">
                    {uiCopy.smartHeading}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      id: 'fav',
                      title: uiCopy.favLabel,
                      sub: `${Object.keys(state.fav || {}).length} ${uiCopy.itemPlural}`,
                      icon: isCastlevania ? '🩸' : isGreenKnight ? '👑' : '❤️',
                      tab: 'music' as TabKey,
                    },
                    {
                      id: 'recent',
                      title: uiCopy.recentLabel,
                      sub: isGits
                        ? '公安九課・再生ログ'
                        : isThundercats
                          ? 'Cats Lair telemetry'
                          : isGreenKnight
                            ? 'Minstrelsy annals'
                            : isCastlevania
                              ? 'Nocturnal trail'
                              : 'Playback history',
                      icon: isGreenKnight ? '📜' : isCastlevania ? '🕯️' : isThundercats ? '⚔️' : '🕘',
                      tab: 'music' as TabKey,
                    },
                    {
                      id: 'most',
                      title: uiCopy.mostLabel,
                      sub: isGits
                        ? '電脳解析・高頻度順'
                        : isThundercats
                          ? 'Sword of Omens surge'
                          : isGreenKnight
                            ? 'Most revered'
                            : isCastlevania
                              ? 'Echoes in the hall'
                              : 'Top rotation',
                      icon: isGreenKnight ? '⚔️' : isCastlevania ? '🦇' : isThundercats ? '⚡' : '🔥',
                      tab: 'music' as TabKey,
                    },
                    {
                      id: 'hid',
                      title: uiCopy.hidLabel,
                      sub: isGits
                        ? `${Object.keys(state.hid || {}).length} 件隔離`
                        : `${Object.keys(state.hid || {}).length} sealed`,
                      icon: isGreenKnight ? '🗝️' : isCastlevania ? '⚰️' : isThundercats ? '🔺' : '🙈',
                      tab: 'music' as TabKey,
                    },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        updateState({
                          tab: item.tab,
                          sel: { ...state.sel, audio: item.id },
                        })
                      }
                      className={`p-4 ${cardRadiusClass} ${themeCardClass} text-left flex items-center gap-3.5 hover:brightness-110 transition-all`}
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate">{item.title}</div>
                        <div className="text-xs text-[var(--mu)]">{item.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Custom Playlists */}
              <section>
                <div className="flex items-center justify-between mb-2.5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--pe)]">
                    {uiCopy.customHeading} ({state.pls.length})
                  </h2>
                  <button
                    type="button"
                    onClick={() =>
                      setPromptDlg({
                        open: true,
                        title: uiCopy.newPlaylistBtn,
                        placeholder: isGits
                          ? '公安9課・新浜市深夜記録…'
                          : isThundercats
                            ? 'Cats Lair Defense Mix…'
                            : isGreenKnight
                              ? 'Arthurian Winter Ballads…'
                              : isCastlevania
                                ? 'Dracula’s Castle Nocturnes…'
                                : 'Rainy Drive Mix…',
                        confirmLabel: isGits ? '作成' : 'Create',
                        onConfirm: (val) => {
                          const clean = val.trim();
                          if (!clean) return;
                          updateState({
                            pls: [...state.pls, { id: Date.now(), name: clean, ids: [] }],
                          });
                          setPromptDlg((p) => ({ ...p, open: false }));
                          showToast(`Created "${clean}"`);
                        },
                      })
                    }
                    className={`relative min-h-[44px] px-4 ${chipRadiusClass} ${
                      isCastlevania
                        ? 'castlevania-blood-btn'
                        : isGits
                          ? 'gits-btn'
                          : isThundercats
                            ? 'thundercats-btn'
                            : isXmen
                              ? 'xmen-btn'
                              : isMatrix
                                ? 'matrix-btn font-mono'
                                : isPirates
                                  ? 'pirates-btn'
                                  : isSteampunk
                                    ? 'steampunk-btn'
                                    : isAlien
                                      ? 'alien-btn font-mono'
                                      : isDnd
                                        ? 'dnd-die-btn'
                                        : isTemplar
                                          ? 'templar-btn'
                                          : isWitcher
                                            ? 'witcher-btn'
                                            : 'bg-[var(--or)] text-white'
                    } text-xs font-bold flex items-center gap-1.5`}
                  >
                    <Plus className="w-4 h-4" /> {uiCopy.newPlaylistBtn}
                    {isCastlevania && <BloodDripFringe compact />}
                  </button>
                </div>

                {state.pls.length === 0 ? (
                  <div
                    className={`p-6 ${cardRadiusClass} ${themeCardClass} text-center text-sm text-[var(--mu)]`}
                  >
                    {isGits
                      ? '記憶集がまだありません。「新規記憶集」または各ファイルメニューから作成してください。'
                      : isThundercats
                        ? 'No Third Earth mixes yet. Forge an archive or assign tracks from Cats Lair.'
                        : isGreenKnight
                          ? 'No scrolls bound yet. Bind a scroll or inscribe minstrelsy from the hall.'
                          : isCastlevania
                            ? 'No grimoires bound yet. Summon hymns or bind a crimson grimoire.'
                            : isTemplar
                              ? 'No Crusader orders forged yet. Rally chronicles from the armory.'
                              : isWitcher
                                ? 'No Witcher contracts posted yet. Consult the Continent notice board.'
                                : 'No playlists yet. Create one or add tracks from the library menu.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {state.pls.map((pl) => (
                      <div
                        key={pl.id}
                        className={`p-4 ${cardRadiusClass} ${themeCardClass} flex items-center justify-between gap-3`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            updateState({
                              tab: 'music',
                              sel: { ...state.sel, audio: pl.id },
                            })
                          }
                          className="flex-1 min-w-0 text-left"
                        >
                          <div className="text-sm font-bold truncate">{pl.name}</div>
                          <div className="text-xs text-[var(--mu)] mt-0.5">
                            {pl.ids.length} {pl.ids.length === 1 ? uiCopy.itemSingular : uiCopy.itemPlural}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updateState({
                              pls: state.pls.filter((x) => x.id !== pl.id),
                            });
                            showToast(`Deleted "${pl.name}"`);
                          }}
                          className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-red-300 hover:bg-white/10"
                          aria-label="Delete playlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          ) : visibleTracks.length === 0 ? (
            /* Clean Interactive Empty State — Styled per Cinema Layout */
            <div
              className={`relative max-w-xl mx-auto mt-8 p-7 ${cardRadiusClass} ${themePanelClass} text-center space-y-5`}
            >
              {isCastlevania && <BloodDripFringe />}
              {isBatman ? (
                <>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00e68a]/12 border border-[#00e68a]/45 text-[#00e68a] font-mono text-xs font-bold tracking-widest">
                    [ ? ] // CASE FILE 02-22
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold font-mono tracking-wide text-[#e8f5ee]">
                      &gt;&gt; AWAITING EVIDENCE SIGNAL
                    </h2>
                    <p className="text-sm text-[#9eb7aa] mt-1.5 font-mono">
                      {activeTheme.empty || 'Drop audio or video evidence anywhere to decrypt.'}
                    </p>
                  </div>
                </>
              ) : isSleepy ? (
                <>
                  <div className="flex items-center gap-3 justify-center">
                    <div className="h-px w-12 bg-[#d8ceb8]/40" />
                    <span className="sleepy-title text-3xl">Sleepy Hollow</span>
                    <div className="h-px w-12 bg-[#d8ceb8]/40" />
                  </div>
                  <div>
                    <h2 className="text-sm uppercase tracking-[0.22em] text-[#d8ceb8] font-semibold">
                      Constable&apos;s Ledger — No Entries Recorded
                    </h2>
                    <p className="text-base italic text-[#d8ceb8]/80 mt-1.5">
                      {activeTheme.empty || 'Import recordings or chronicles into the moonlit fog.'}
                    </p>
                  </div>
                </>
              ) : isGreenKnight ? (
                <>
                  <div className="flex items-center gap-3 justify-center">
                    <div className="h-px w-10 bg-[var(--pe)]/50" />
                    <span className="gk-blackletter text-3xl text-[var(--pe)]">
                      The Green Knight
                    </span>
                    <div className="h-px w-10 bg-[var(--pe)]/50" />
                  </div>
                  <div>
                    <h2 className="text-sm uppercase tracking-[0.18em] text-[var(--fg)] font-semibold">
                      {isGkCrown ? 'Camelot Royal Scriptorium' : 'The Green Chapel · Woodland Trial'}
                    </h2>
                    <p className="text-base italic text-[var(--mu)] mt-1.5">
                      {activeTheme.empty}
                    </p>
                  </div>
                </>
              ) : isCastlevania ? (
                <>
                  <div className="flex items-center gap-3 justify-center">
                    <div className="h-px w-10 bg-[#d90b1c]/65" />
                    <span className="castlevania-title text-2xl sm:text-3xl font-black uppercase">
                      Castlevania
                    </span>
                    <div className="h-px w-10 bg-[#d90b1c]/65" />
                  </div>
                  <div>
                    <h2 className="text-xs uppercase tracking-[0.24em] text-[#ff6673] font-bold">
                      Wallachia Grimoire — Unopened
                    </h2>
                    <p className="text-sm text-[#e6b8bd] mt-1.5">
                      {activeTheme.empty}
                    </p>
                  </div>
                </>
              ) : isDune ? (
                <>
                  <div className="flex items-center gap-3 justify-center">
                    <div className="h-px w-10 bg-[#ffd175]/55" />
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#fff5cc] via-[#ffbe42] to-[#d97914] shadow-[0_0_20px_rgba(255,190,66,0.9)]" />
                    <div className="h-px w-10 bg-[#ffd175]/55" />
                  </div>
                  <div>
                    <h2 className="text-sm uppercase tracking-[0.26em] text-[#ffd175] font-extrabold">
                      Arrakis Sietch Archive — Awaiting Reels
                    </h2>
                    <p className="text-sm text-[#f8d79b] mt-1.5">
                      {activeTheme.empty}
                    </p>
                  </div>
                </>
              ) : isAkira ? (
                <>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#e61c24]/18 border border-[#e61c24]/60 text-[#ff8f94] font-mono text-xs font-bold tracking-widest">
                    AKIRA ’88 // SECTOR 28 MOTO BAY
                  </div>
                  <div>
                    <h2 className="akira-title text-xl font-black uppercase">
                      NEO-TOKYO GARAGE — STANDBY
                    </h2>
                    <p className="text-sm text-[#9ec4ff] font-mono mt-1.5">
                      {activeTheme.empty}
                    </p>
                  </div>
                </>
              ) : isRpo ? (
                <>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#38e0ff]/16 border border-[#38e0ff]/60 text-[#7cebff] font-mono text-xs font-bold tracking-widest">
                    🗝️ OASIS // ANORAK’S ALMANAC · X1 HAPTIC RIG
                  </div>
                  <div>
                    <h2 className="rpo-title text-xl font-black uppercase">
                      HALLIDAY’S VAULT — AWAITING KEYHOLDER
                    </h2>
                    <p className="text-sm text-[#a5d8ff] font-mono mt-1.5">
                      {activeTheme.empty}
                    </p>
                  </div>
                </>
              ) : isGits ? (
                <>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2df0d2]/16 border border-[#2df0d2]/60 text-[#75ffea] font-mono text-xs font-bold tracking-widest">
                    公安9課 // 電脳待機中 · 義体接続
                  </div>
                  <div>
                    <h2 className="gits-title text-xl font-black">
                      攻殻機動隊 — 記憶領域待機中
                    </h2>
                    <p className="text-sm text-[#9ef7ea] font-mono mt-1.5">
                      {activeTheme.empty}
                    </p>
                  </div>
                </>
              ) : isThundercats ? (
                <>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#e11d24]/20 border border-[#fbbf24]/70 text-[#fde68a] font-mono text-xs font-bold tracking-widest">
                    <EyeOfThunderaSvg className="w-4 h-4" />
                    CATS LAIR // EYE OF THUNDERA · THIRD EARTH
                  </div>
                  <div>
                    <h2 className="thundercats-title text-xl font-black uppercase">
                      THUNDER, THUNDER, THUNDERCATS HOOO!
                    </h2>
                    <p className="text-sm text-[#fde68a] font-mono mt-1.5">
                      {activeTheme.empty}
                    </p>
                  </div>
                </>
              ) : isXmen ? (
                <>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#facc15] text-[#090a0f] border-2 border-[#090a0f] font-black text-xs tracking-widest uppercase">
                    <XMenBadgeSvg className="w-4 h-4" />
                    X-MEN ’92 // DANGER ROOM · CEREBRO
                  </div>
                  <div>
                    <h2 className="xmen-title text-xl font-black uppercase">
                      TO ME, MY X-MEN! — ’90S EDITION
                    </h2>
                    <p className="text-sm text-[#fef08a] font-bold mt-1.5">
                      {activeTheme.empty}
                    </p>
                  </div>
                </>
              ) : isMatrix ? (
                <>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00ff41]/15 border border-[#00ff41] text-[#00ff41] font-mono text-xs font-bold tracking-widest">
                    SYSTEM://MATRIX_CASCADE_01 · GREEN TRACE
                  </div>
                  <div>
                    <h2 className="matrix-title text-xl font-black font-mono uppercase">
                      WAKE UP, NEO… THE MATRIX HAS YOU
                    </h2>
                    <p className="text-sm text-[#6bff8f] font-mono mt-1.5">
                      {activeTheme.empty}
                    </p>
                  </div>
                </>
              ) : isPirates ? (
                <>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#14b8a6]/18 border border-[#f59e0b]/70 text-[#99f6e4] font-mono text-xs font-bold tracking-widest">
                    <KrakenTentacleSvg className="w-4 h-4" />
                    DARK SEAS // KRAKEN ABYSS · BLACK SAILS
                  </div>
                  <div>
                    <h2 className="pirates-title text-xl font-black uppercase">
                      RELEASE THE KRAKEN OF THE DARK SEAS
                    </h2>
                    <p className="text-sm text-[#99f6e4] mt-1.5">
                      {activeTheme.empty}
                    </p>
                  </div>
                </>
              ) : isSteampunk ? (
                <>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#d97706]/25 border border-[#fbbf24]/70 text-[#fde68a] font-mono text-xs font-bold tracking-widest">
                    <SteampunkGearSvg className="w-4 h-4 cog-spin" />
                    BOILER #04 // 185 PSI STEAM ENGINE READY
                    <SteampunkGaugeSvg className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="steampunk-title text-xl font-black uppercase">
                      AETHER FOUNDRY · CLOCKWORK STEAM MACHINE
                    </h2>
                    <p className="text-sm text-[#fed7aa] font-mono mt-1.5">
                      {activeTheme.empty}
                    </p>
                  </div>
                </>
              ) : isAlien ? (
                <>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#39ff14]/18 border border-[#4ade80]/75 text-[#86efac] font-mono text-xs font-bold tracking-widest">
                    <AlienUfoSvg className="w-4 h-4" />
                    SECTOR 04 // UFO NIGHT CORNFIELDS 🌽
                  </div>
                  <div>
                    <h2 className="alien-title text-xl font-black uppercase font-mono">
                      TRACTOR BEAM LOCKED ON NORTH FIELDS
                    </h2>
                    <p className="text-sm text-[#86efac] font-mono mt-1.5">
                      {activeTheme.empty}
                    </p>
                  </div>
                </>
              ) : isDnd ? (
                <>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#7f1d1d]/80 border border-[#fbbf24]/80 text-[#fef3c7] text-xs font-bold tracking-widest dnd-die-chip">
                    <D20DieSvg className="w-4 h-4" label={String(dndRoll.val)} />
                    DUNGEONS &amp; DRAGONS · POLYHEDRAL DM TABLE
                  </div>
                  <div>
                    <h2 className="dnd-title text-xl font-black uppercase">
                      ROLL INITIATIVE — CAMPAIGN TABLE READY
                    </h2>
                    <p className="text-sm text-[#fde68a] mt-1.5">
                      {activeTheme.empty}
                    </p>
                  </div>
                </>
              ) : isTemplar ? (
                <>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1e293b]/90 border border-[#94a3b8]/70 text-[#e2e8f0] text-xs font-bold tracking-widest uppercase">
                    <TemplarHelmSvg className="w-4 h-4" />
                    TEMPLAR CITADEL // DARK RAINY SIEGE · ARMORY
                    <MedievalSwordSvg className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="templar-title text-xl font-black uppercase">
                      HEARTH &amp; IRON PLATE — STORM AT THE SPIRE
                    </h2>
                    <p className="text-sm text-[#cbd5e1] mt-1.5">
                      {activeTheme.empty}
                    </p>
                  </div>
                </>
              ) : isWitcher ? (
                <>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#18181b]/90 border border-[#f59e0b]/75 text-[#fcd34d] text-xs font-bold tracking-widest witcher-rune-chip uppercase">
                    <WolfMedallionSvg className="w-4 h-4" />
                    SCHOOL OF THE WOLF · ᚠᚢᚦ WITCHER SIGNS &amp; RUNES
                    <WitcherSignSvg sign={witcherSign} className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="witcher-title text-xl font-black uppercase">
                      TOSS A COIN · DRAW SILVER FOR MONSTERS
                    </h2>
                    <p className="text-sm text-[#d4d4d8] mt-1.5">
                      {activeTheme.empty}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-4xl">{activeTheme.e}</div>
                  <div>
                    <h2 className="text-lg font-extrabold">{activeTheme.label}</h2>
                    <p className="text-sm text-[var(--mu)] mt-1">
                      {activeTheme.empty || 'Drop audio/video files anywhere or import from your device.'}
                    </p>
                  </div>
                </>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative min-h-[48px] px-4 ${chipRadiusClass} ${
                    isBatman
                      ? 'bg-[#e31b23] border border-[#00e68a]/50 text-white font-mono'
                      : isSleepy
                        ? 'bg-[#c8101c] border border-[#d8ceb8]/45 text-[#f2ece0]'
                        : isGkCrown
                          ? 'bg-[#d91b0c] border border-[#e4b248]/70 text-[#f8edd6]'
                          : isGkWood
                            ? 'bg-[#3d8c2b] border border-[#d9c484]/60 text-[#f5f8ee]'
                            : isCastlevania
                              ? 'castlevania-blood-btn'
                              : isDune
                                ? 'dune-sun-btn'
                                : isAkira
                                  ? 'akira-btn font-mono'
                                  : isRpo
                                    ? 'rpo-btn font-mono'
                                    : isGits
                                      ? 'gits-btn font-mono'
                                      : isThundercats
                                        ? 'thundercats-btn'
                                        : isXmen
                                          ? 'xmen-btn'
                                          : isMatrix
                                            ? 'matrix-btn font-mono'
                                            : isPirates
                                              ? 'pirates-btn'
                                              : isSteampunk
                                                ? 'steampunk-btn'
                                                : isAlien
                                                  ? 'alien-btn font-mono'
                                                  : isDnd
                                                    ? 'dnd-die-btn'
                                                    : isTemplar
                                                      ? 'templar-btn'
                                                      : isWitcher
                                                        ? 'witcher-btn'
                                                        : 'bg-[var(--or)] text-white shadow-lg shadow-[var(--or)]/30'
                  } text-sm font-bold flex items-center justify-center gap-2 hover:brightness-110`}
                >
                  <Plus className="w-4 h-4" />{' '}
                  {isBatman
                    ? 'INGEST EVIDENCE'
                    : isGreenKnight
                      ? 'Inscribe Ballads & Reels'
                      : isCastlevania
                        ? 'Summon Hymns & Reels'
                        : isDune
                          ? 'Harvest Sand Reels'
                          : isAkira
                            ? 'JACK IN DISKS'
                            : isRpo
                              ? 'LOOT GUNTER CACHE'
                              : isGits
                                ? '音声・映像を追加'
                                : isThundercats
                                  ? 'CHARGE SWORD OF OMENS'
                                  : isXmen
                                    ? 'DEPLOY DANGER FILES'
                                    : isMatrix
                                      ? 'INJECT CODE STREAMS'
                                      : isPirates
                                        ? 'HOIST CARGO ABOARD'
                                        : isSteampunk
                                          ? 'FEED BOILER CYLINDERS'
                                          : isAlien
                                            ? 'BEAM TRACKS ABOARD'
                                            : isDnd
                                              ? 'CAST SCROLLS & AUDIO'
                                              : isTemplar
                                                ? 'RALLY WAR CHRONICLES'
                                                : isWitcher
                                                  ? 'ACCEPT WITCHER CONTRACT'
                                                  : 'Add Audio / Video'}
                  {isCastlevania && <BloodDripFringe compact />}
                </button>
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  className={`min-h-[48px] px-4 ${chipRadiusClass} ${themeCardClass} ${
                    isDnd ? 'dnd-die-chip' : isWitcher ? 'witcher-rune-chip' : ''
                  } ${
                    isBatman
                      ? 'text-[#00e68a] font-mono'
                      : isAkira
                        ? 'font-mono text-[#fff4f4]'
                        : isGits
                          ? 'font-mono text-[#d8fff9]'
                          : isThundercats
                            ? 'font-mono text-[#fde68a]'
                            : isMatrix
                              ? 'font-mono text-[#00ff41]'
                              : isSteampunk
                                ? 'font-mono text-[#fde68a]'
                                : isAlien
                                  ? 'font-mono text-[#86efac]'
                                  : 'text-[var(--fg)]'
                  } text-sm font-bold flex items-center justify-center gap-2`}
                >
                  <FolderPlus className="w-4 h-4 text-[var(--pe)]" /> {uiCopy.addFolderBtn}
                </button>
                <button
                  type="button"
                  onClick={openFeaturesSheet}
                  className={`min-h-[48px] px-4 ${chipRadiusClass} ${
                    isDnd ? 'dnd-die-btn' : isWitcher ? 'witcher-rune-chip ' + themeCardClass : themeCardClass
                  } ${
                    isBatman || isAkira || isGits || isMatrix || isSteampunk || isAlien ? 'font-mono' : ''
                  } text-sm font-bold flex items-center justify-center gap-2`}
                >
                  {isSteampunk ? (
                    <SteampunkGaugeSvg className="w-4 h-4 shrink-0" />
                  ) : isAlien ? (
                    <AlienUfoSvg className="w-4 h-4 shrink-0" />
                  ) : isDnd ? (
                    <D20DieSvg className="w-4 h-4 shrink-0" label={String(dndRoll.val)} />
                  ) : isTemplar ? (
                    <CrusaderShieldSvg className="w-4 h-4 shrink-0" />
                  ) : isWitcher ? (
                    <WitcherSignSvg sign={witcherSign} className="w-4 h-4 shrink-0" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-[var(--or)]" />
                  )}{' '}
                  {uiCopy.featuresBtn} &amp; DIY
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPromptDlg({
                      open: true,
                      title: isGits ? '電脳ストリーム / 映像URL接続' : 'Import Stream / Video URL',
                      placeholder: 'https://…',
                      confirmLabel: isGits ? '読込' : 'Load',
                      onConfirm: (val) => {
                        setPromptDlg((p) => ({ ...p, open: false }));
                        importStreamUrl(val);
                      },
                    });
                  }}
                  className={`min-h-[48px] px-4 ${chipRadiusClass} ${themeCardClass} ${
                    isDnd ? 'dnd-die-chip' : isWitcher ? 'witcher-rune-chip' : ''
                  } ${
                    isBatman || isAkira || isGits || isMatrix || isSteampunk || isAlien ? 'font-mono' : ''
                  } text-sm font-bold flex items-center justify-center gap-2`}
                >
                  <Compass className="w-4 h-4 text-[var(--pe)]" /> {uiCopy.addUrlBtn}
                </button>
              </div>
            </div>
          ) : (
            /* Responsive Multi-Column Media Track Grid */
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {visibleTracks.map((tr, idx) => {
                const isCur =
                  (tr.kind === 'video' && state.cur.video === tr.id) ||
                  (tr.kind !== 'video' && currentAudioId === tr.id);
                const isSelected = selectedIds.has(tr.id);
                const art = coverUrls[tr.id];
                const dSec = tr.dur || tr.vd || 0;

                const cardClass = isBatman
                  ? isCur
                    ? 'batman-card-active'
                    : 'batman-card hover:border-[#00e68a]/65'
                  : isSleepy
                    ? isCur
                      ? 'sleepy-card-active'
                      : 'sleepy-card hover:border-[#d8ceb8]/45'
                    : isGkCrown
                      ? isCur
                        ? 'gk-crown-card-active'
                        : 'gk-crown-card hover:border-[#e4b248]/60'
                      : isGkWood
                        ? isCur
                          ? 'gk-wood-card-active'
                          : 'gk-wood-card hover:border-[#9be06c]/55'
                        : isCastlevania
                          ? isCur
                            ? 'castlevania-card-active'
                            : 'castlevania-card hover:border-[#ff2e40]/70'
                          : isDune
                            ? isCur
                              ? 'dune-card-active'
                              : 'dune-card hover:border-[#ffd175]/65'
                            : isAkira
                              ? isCur
                                ? 'akira-card-active'
                                : 'akira-card hover:border-[#e61c24]/75'
                              : isRpo
                                ? isCur
                                  ? 'rpo-card-active'
                                  : 'rpo-card hover:border-[#38e0ff]/75'
                                : isGits
                                  ? isCur
                                    ? 'gits-card-active'
                                    : 'gits-card hover:border-[#2df0d2]/75'
                                  : isThundercats
                                    ? isCur
                                      ? 'thundercats-card-active'
                                      : 'thundercats-card hover:border-[#fbbf24]/75'
                                    : isXmen
                                      ? isCur
                                        ? 'xmen-card-active'
                                        : 'xmen-card hover:border-[#facc15]'
                                      : isMatrix
                                        ? isCur
                                          ? 'matrix-card-active'
                                          : 'matrix-card hover:border-[#00ff41]'
                                        : isPirates
                                          ? isCur
                                            ? 'pirates-card-active'
                                            : 'pirates-card hover:border-[#14b8a6]'
                                          : isSteampunk
                                            ? isCur
                                              ? 'steampunk-card-active'
                                              : 'steampunk-card hover:border-[#fbbf24]/80'
                                            : isAlien
                                              ? isCur
                                                ? 'alien-card-active'
                                                : 'alien-card hover:border-[#39ff14]/80'
                                              : isDnd
                                                ? isCur
                                                  ? 'dnd-card-active'
                                                  : 'dnd-card hover:border-[#fbbf24]/80'
                                                : isTemplar
                                                  ? isCur
                                                    ? 'templar-card-active'
                                                    : 'templar-card hover:border-[#cbd5e1]/80'
                                                  : isWitcher
                                                    ? isCur
                                                      ? 'witcher-card-active'
                                                      : 'witcher-card hover:border-[#fbbf24]/80'
                                                    : `mat-surface ${materialTextureClass} ${
                                                        isCur ? 'ring-2 ring-[var(--or)]' : 'hover:brightness-110'
                                                      }`;

                return (
                  <div
                    key={tr.id}
                    className={`relative group flex items-center gap-3 p-2.5 ${cardRadiusClass} transition-all ${cardClass}`}
                  >
                    {isCastlevania && isCur && <BloodDripFringe compact />}

                    {selMode && (
                      <button
                        type="button"
                        onClick={() => toggleSelectId(tr.id)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--or)] shrink-0"
                        aria-label="Select track"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5 text-[var(--mu)]" />
                        )}
                      </button>
                    )}

                    {/* Art / Video Thumb */}
                    <button
                      type="button"
                      onClick={() => (selMode ? toggleSelectId(tr.id) : playTrack(tr.id))}
                      className={`relative w-14 h-14 ${chipRadiusClass} ${
                        isDnd ? 'dnd-die-chip' : isWitcher ? 'witcher-rune-chip' : ''
                      } overflow-hidden bg-black/70 shrink-0 flex items-center justify-center border ${
                        isBatman
                          ? isCur
                            ? 'border-[#e31b23]'
                            : 'border-[#00e68a]/35'
                          : isSleepy
                            ? isCur
                              ? 'border-[#c8101c]'
                              : 'border-[#d8ceb8]/25'
                            : isGkCrown
                              ? isCur
                                ? 'border-[#e4b248]'
                                : 'border-[#e4b248]/40'
                              : isGkWood
                                ? isCur
                                  ? 'border-[#9be06c]'
                                  : 'border-[#9be06c]/35'
                                : isCastlevania
                                  ? isCur
                                    ? 'border-[#ff2e40]'
                                    : 'border-[#d90b1c]/45'
                                  : isDune
                                    ? isCur
                                      ? 'border-[#ffd175]'
                                      : 'border-[#f09c2b]/45'
                                    : isAkira
                                      ? isCur
                                        ? 'border-[#ff2e38]'
                                        : 'border-[#2b8cff]/45'
                                      : isRpo
                                        ? isCur
                                          ? 'border-[#38e0ff]'
                                          : 'border-[#d946ef]/45'
                                        : isGits
                                          ? isCur
                                            ? 'border-[#2df0d2]'
                                            : 'border-[#00f5c8]/45'
                                          : isThundercats
                                            ? isCur
                                              ? 'border-[#fbbf24]'
                                              : 'border-[#e11d24]/60'
                                            : isXmen
                                              ? isCur
                                                ? 'border-[#ef4444]'
                                                : 'border-[#facc15]/80'
                                              : isMatrix
                                                ? isCur
                                                  ? 'border-[#00ff41]'
                                                  : 'border-[#00ff41]/45'
                                                : isPirates
                                                  ? isCur
                                                    ? 'border-[#f59e0b]'
                                                    : 'border-[#14b8a6]/55'
                                                  : isSteampunk
                                                    ? isCur
                                                      ? 'border-[#fbbf24]'
                                                      : 'border-[#d97706]/65'
                                                    : isAlien
                                                      ? isCur
                                                        ? 'border-[#39ff14]'
                                                        : 'border-[#4ade80]/55'
                                                      : isDnd
                                                        ? isCur
                                                          ? 'border-[#fbbf24]'
                                                          : 'border-[#dc2626]/70'
                                                        : isTemplar
                                                          ? isCur
                                                            ? 'border-[#f87171]'
                                                            : 'border-[#94a3b8]/65'
                                                          : isWitcher
                                                            ? isCur
                                                              ? 'border-[#fbbf24]'
                                                              : 'border-[#a855f7]/60'
                                                            : 'border-white/10'
                      }`}
                    >
                      {art ? (
                        <img
                          src={art}
                          alt={tr.name}
                          className={`w-full h-full object-cover transition-all ${
                            isSleepy && !isCur ? 'grayscale-[65%] sepia-[22%] contrast-110' : ''
                          }`}
                        />
                      ) : tr.kind === 'video' ? (
                        <VideoIcon className="w-6 h-6 text-[var(--mu)]" />
                      ) : tr.kind === 'book' ? (
                        <BookOpen className="w-6 h-6 text-[var(--mu)]" />
                      ) : isSteampunk ? (
                        <SteampunkGearSvg className={`w-7 h-7 ${isCur ? 'cog-spin' : ''}`} />
                      ) : isAlien ? (
                        <AlienUfoSvg className="w-7 h-7" />
                      ) : isDnd ? (
                        <D20DieSvg className="w-8 h-8" label={String(((idx % 20) + 1))} />
                      ) : isTemplar ? (
                        <CrusaderShieldSvg className="w-7 h-7" />
                      ) : isWitcher ? (
                        <WolfMedallionSvg className="w-7 h-7" />
                      ) : (
                        <Music className="w-6 h-6 text-[var(--mu)]" />
                      )}

                      {isCur && playing && tr.kind !== 'video' && (
                        <div className="absolute inset-0 bg-black/60 flex items-end justify-center gap-1 p-2.5">
                          <span className="w-1 h-4 bg-[var(--or)] rounded-full eq-bar" />
                          <span
                            className="w-1 h-6 bg-[var(--pe)] rounded-full eq-bar"
                            style={{ animationDelay: '0.18s' }}
                          />
                          <span
                            className="w-1 h-3 bg-[var(--or)] rounded-full eq-bar"
                            style={{ animationDelay: '0.36s' }}
                          />
                        </div>
                      )}
                    </button>

                    {/* Track Meta */}
                    <button
                      type="button"
                      onClick={() => (selMode ? toggleSelectId(tr.id) : playTrack(tr.id))}
                      className="flex-1 min-w-0 text-left py-1"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {(isBatman ||
                          isDune ||
                          isAkira ||
                          isRpo ||
                          isGits ||
                          isThundercats ||
                          isXmen ||
                          isMatrix ||
                          isPirates ||
                          isSteampunk ||
                          isAlien ||
                          isDnd ||
                          isTemplar ||
                          isWitcher) && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 shrink-0 border ${
                              isDune
                                ? 'bg-[#f09c2b]/15 text-[#ffd175] border-[#ffd175]/35'
                                : isAkira
                                  ? 'bg-[#e61c24]/18 text-[#ff8f94] border-[#e61c24]/45'
                                  : isRpo
                                    ? 'bg-[#38e0ff]/16 text-[#7cebff] border-[#38e0ff]/45'
                                    : isGits
                                      ? 'bg-[#2df0d2]/15 text-[#75ffea] border-[#2df0d2]/45'
                                      : isThundercats
                                        ? 'bg-[#e11d24]/25 text-[#fde68a] border-[#fbbf24]/55'
                                        : isXmen
                                          ? 'bg-[#facc15] text-[#090a0f] border-[#090a0f] font-black'
                                          : isMatrix
                                            ? 'bg-[#00ff41]/15 text-[#00ff41] border-[#00ff41]/60'
                                            : isPirates
                                              ? 'bg-[#14b8a6]/18 text-[#99f6e4] border-[#f59e0b]/45'
                                              : isSteampunk
                                                ? 'bg-[#d97706]/25 text-[#fde68a] border-[#fbbf24]/60'
                                                : isAlien
                                                  ? 'bg-[#39ff14]/15 text-[#86efac] border-[#4ade80]/60'
                                                  : isDnd
                                                    ? 'bg-[#991b1b]/85 text-[#fef3c7] border-[#fbbf24]/75 dnd-d20-badge px-2 font-serif'
                                                    : isTemplar
                                                      ? 'bg-[#1e293b]/90 text-[#f1f5f9] border-[#94a3b8]/70 templar-shield-badge px-2 font-bold'
                                                      : isWitcher
                                                        ? 'bg-[#18181b]/95 text-[#fbbf24] border-[#a855f7]/70 witcher-rune-chip px-2 font-serif'
                                                        : 'bg-[#00e68a]/12 text-[#00e68a] border-[#00e68a]/30'
                            }`}
                          >
                            {isDune
                              ? `SOL-${String(idx + 1).padStart(2, '0')}`
                              : isAkira
                                ? `M-${String(idx + 1).padStart(2, '0')}`
                                : isRpo
                                  ? `KEY-${String(idx + 1).padStart(2, '0')}`
                                  : isGits
                                    ? `九課-${String(idx + 1).padStart(2, '0')}`
                                    : isThundercats
                                      ? `THUNDER-${String(idx + 1).padStart(2, '0')}`
                                      : isXmen
                                        ? `X92-#${String(idx + 1).padStart(2, '0')}`
                                        : isMatrix
                                          ? `MTX-${String(idx + 1).padStart(2, '0')}`
                                          : isPirates
                                            ? `SEA-${String(idx + 1).padStart(2, '0')}`
                                            : isSteampunk
                                              ? `GEAR-${String(idx + 1).padStart(2, '0')}`
                                              : isAlien
                                                ? `UFO-${String(idx + 1).padStart(2, '0')}`
                                                : isDnd
                                                  ? `d20:${(idx % 20) + 1}`
                                                  : isTemplar
                                                    ? `CRUS-${String(idx + 1).padStart(2, '0')}`
                                                    : isWitcher
                                                      ? `${['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ'][idx % 6]} WOLF-${String(idx + 1).padStart(2, '0')}`
                                                      : `#${String(idx + 1).padStart(2, '0')}`}
                          </span>
                        )}
                        {(isSleepy || isGreenKnight || isCastlevania) && (
                          <span
                            className={`text-xs font-bold shrink-0 ${
                              isGreenKnight
                                ? 'gk-blackletter text-sm text-[var(--pe)]'
                                : isCastlevania
                                  ? 'text-[#ff4d5a]'
                                  : 'text-[#d8ceb8]/75'
                            }`}
                          >
                            {isGreenKnight ? `Folio ${toRoman(idx + 1)} ·` : `${toRoman(idx + 1)}.`}
                          </span>
                        )}
                        <span
                          className={`text-sm font-bold truncate ${
                            isCur
                              ? isBatman
                                ? 'text-[#00e68a]'
                                : isSleepy
                                  ? 'text-[#c8101c]'
                                  : isGkCrown
                                    ? 'text-[#e8b954]'
                                    : isGkWood
                                      ? 'text-[#9be06c]'
                                      : isCastlevania
                                        ? 'text-[#ff3b4a]'
                                        : isDune
                                          ? 'text-[#ffd175]'
                                          : isAkira
                                            ? 'text-[#ff2e38]'
                                            : isRpo
                                              ? 'text-[#38e0ff]'
                                              : isGits
                                                ? 'text-[#2df0d2]'
                                                : isThundercats
                                                  ? 'text-[#fbbf24]'
                                                  : isXmen
                                                    ? 'text-[#facc15]'
                                                    : isMatrix
                                                      ? 'text-[#00ff41]'
                                                      : isPirates
                                                        ? 'text-[#14b8a6]'
                                                        : isSteampunk
                                                          ? 'text-[#fbbf24]'
                                                          : isAlien
                                                            ? 'text-[#39ff14]'
                                                            : isDnd
                                                              ? 'text-[#fbbf24]'
                                                              : isTemplar
                                                                ? 'text-[#fca5a5]'
                                                                : isWitcher
                                                                  ? 'text-[#fbbf24]'
                                                                  : 'text-[var(--or)]'
                              : isMatrix
                                ? 'text-[#9effb5]'
                                : ''
                          }`}
                        >
                          {tr.nick || tr.name}
                        </span>
                        {!!state.fav?.[tr.id] && (
                          <Heart className="w-3.5 h-3.5 text-[var(--or)] fill-current shrink-0" />
                        )}
                      </div>
                      <div
                        className={`text-xs truncate mt-0.5 ${
                          isBatman
                            ? 'text-[#9eb7aa] font-mono text-[11px]'
                            : isSleepy || isGreenKnight
                              ? 'text-[var(--mu)] italic'
                              : isCastlevania
                                ? 'text-[#d99ca2]'
                                : isDune
                                  ? 'text-[#f0c678]'
                                  : isAkira
                                    ? 'text-[#9ec4ff] font-mono text-[11px]'
                                    : isRpo
                                      ? 'text-[#94c6eb] font-mono text-[11px]'
                                      : isGits
                                        ? 'text-[#89cbc8] font-mono text-[11px]'
                                        : isThundercats
                                          ? 'text-[#fde68a]/85 font-mono text-[11px]'
                                          : isXmen
                                            ? 'text-[#fef08a]/85 font-semibold text-[11px]'
                                            : isMatrix
                                              ? 'text-[#4dff79]/85 font-mono text-[11px]'
                                              : isPirates
                                                ? 'text-[#99f6e4]/85 font-mono text-[11px]'
                                                : isSteampunk
                                                  ? 'text-[#fed7aa]/85 font-mono text-[11px]'
                                                  : isAlien
                                                    ? 'text-[#86efac]/85 font-mono text-[11px]'
                                                    : isDnd
                                                      ? 'text-[#fde68a]/85 text-[11px]'
                                                      : isTemplar
                                                        ? 'text-[#cbd5e1]/85 font-mono text-[11px]'
                                                        : isWitcher
                                                          ? 'text-[#d4d4d8]/85 text-[11px]'
                                                          : 'text-[var(--mu)]'
                        }`}
                      >
                        {[
                          tr.artist ||
                            (tr.yt
                              ? 'YouTube'
                              : tr.folder ||
                                (isGits
                                  ? tr.kind === 'video'
                                    ? '映像'
                                    : tr.kind === 'book'
                                      ? '電脳書籍'
                                      : '音声'
                                  : tr.kind.toUpperCase())),
                          dSec > 0 ? formatTime(dSec) : '',
                          tr.sz ? formatSize(tr.sz) : '',
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    </button>

                    {/* Track More Menu */}
                    <button
                      type="button"
                      onClick={() => openTrackMenu(tr)}
                      className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[var(--mu)] hover:text-[var(--fg)] hover:bg-white/10 shrink-0"
                      aria-label={isGits ? '記録オプション' : 'Track options'}
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Multi-Select Floating Action Bar */}
      {selMode && (
        <div
          className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-30 w-[94%] max-w-xl ${themePanelClass} ${cardRadiusClass} p-2.5 flex items-center justify-between gap-2`}
        >
          <span className="text-xs font-bold px-2">
            {selectedIds.size} {isGits ? '件選択中' : 'selected'}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => openPlaylistPicker(Array.from(selectedIds))}
              disabled={selectedIds.size === 0}
              className="min-h-[40px] px-3 rounded-xl bg-white/10 text-xs font-bold disabled:opacity-40"
            >
              +{' '}
              {isGits
                ? '記憶集'
                : isGreenKnight
                  ? 'Scroll'
                  : isCastlevania
                    ? 'Grimoire'
                    : isThundercats
                      ? 'Third Earth Mix'
                      : 'Playlist'}
            </button>
            <button
              type="button"
              onClick={handleBulkHide}
              disabled={selectedIds.size === 0}
              className="min-h-[40px] px-3 rounded-xl bg-white/10 text-xs font-bold disabled:opacity-40"
            >
              {isGits ? '隔離' : isGreenKnight ? 'Seal' : 'Hide'}
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={selectedIds.size === 0}
              className="min-h-[40px] px-3 rounded-xl bg-red-500/20 text-red-300 text-xs font-bold disabled:opacity-40"
            >
              {isGits ? '削除' : 'Delete'}
            </button>
            <button
              type="button"
              onClick={() => {
                setSelMode(false);
                setSelectedIds(new Set());
              }}
              className="min-h-[40px] min-w-[40px] rounded-xl bg-white/10 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Quick-Scroll Horizontal Playlist Thumbnail Strip at Bottom of Library View */}
      {state.tab !== 'lists' && !page && !selMode && (
        <div
          className={`fixed ${
            currentAudioTrack ? 'bottom-[78px]' : 'bottom-3'
          } inset-x-3 sm:inset-x-6 z-20 max-w-5xl mx-auto transition-all`}
        >
          <div
            className={`${themePanelClass} ${cardRadiusClass} px-2.5 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar`}
            aria-label="Quick-scroll playlist thumbnails"
          >
            {(
              [
                {
                  key: 'all',
                  selVal: null as string | number | null,
                  title: isGits ? 'すべて' : isThundercats ? 'All Omens' : isAlien ? 'All Sectors' : isDnd ? 'All Quests' : isTemplar ? 'All Chronicles' : isWitcher ? 'All Contracts' : 'All',
                  icon: isDune ? '☀️' : isAkira ? '🏍️' : isGits ? '👁️' : isThundercats ? '⚔️' : isAlien ? '🛸' : isDnd ? '🎲' : isTemplar ? '🛡️' : isWitcher ? '🐺' : '🎵',
                  ids: tracks.filter((t) => t.kind === activeKind && !state.hid?.[t.id]).map((t) => t.id),
                },
                {
                  key: 'fav',
                  selVal: 'fav',
                  title: uiCopy.favLabel,
                  icon: isCastlevania ? '🩸' : isGreenKnight ? '👑' : isThundercats ? '🦁' : isAlien ? '🌽' : isDnd ? '🐉' : isTemplar ? '⚔️' : isWitcher ? '🜂' : '❤️',
                  ids: tracks
                    .filter((t) => t.kind === activeKind && !state.hid?.[t.id] && !!state.fav?.[t.id])
                    .map((t) => t.id),
                },
                {
                  key: 'recent',
                  selVal: 'recent',
                  title: uiCopy.recentLabel,
                  icon: isGreenKnight ? '📜' : isCastlevania ? '🕯️' : isThundercats ? '👁️' : isAlien ? '📡' : isDnd ? '🗺️' : isTemplar ? '🌧️' : isWitcher ? '🔥' : '🕘',
                  ids: tracks
                    .filter((t) => t.kind === activeKind && !state.hid?.[t.id] && (state.st?.[t.id]?.l || 0) > 0)
                    .map((t) => t.id),
                },
                {
                  key: 'most',
                  selVal: 'most',
                  title: uiCopy.mostLabel,
                  icon: isGreenKnight ? '⚔️' : isCastlevania ? '🦇' : isThundercats ? '⚡' : isAlien ? '👽' : isDnd ? '⚔️' : isTemplar ? '⚜️' : isWitcher ? '✨' : '🔥',
                  ids: tracks
                    .filter((t) => t.kind === activeKind && !state.hid?.[t.id] && (state.st?.[t.id]?.c || 0) > 0)
                    .map((t) => t.id),
                },
                ...state.pls.map((pl) => ({
                  key: `pl-${pl.id}`,
                  selVal: pl.id as string | number | null,
                  title: pl.name,
                  icon: isAkira ? '💊' : isDune ? '🏜️' : isGits ? '💿' : isThundercats ? '🛡️' : isAlien ? '🛸' : isDnd ? '🎲' : isTemplar ? '🏰' : isWitcher ? '🐺' : '📀',
                  ids: pl.ids,
                })),
              ]
            ).map((col) => {
              const curSel = state.sel?.[activeKind] ?? null;
              const isActive = curSel === col.selVal;
              const thumbs = col.ids
                .map((id) => coverUrls[id])
                .filter((u): u is string => Boolean(u))
                .slice(0, 4);

              return (
                <button
                  key={col.key}
                  type="button"
                  onClick={() => updateState({ sel: { ...state.sel, [activeKind]: col.selVal } })}
                  className={`group flex items-center gap-2 pr-2.5 pl-1.5 py-1 ${isDnd ? 'dnd-die-chip' : isWitcher ? 'witcher-rune-chip' : chipRadiusClass} border shrink-0 transition-all ${
                    isActive
                      ? isBatman
                        ? 'bg-[#e31b23]/25 border-[#00e68a] text-white'
                        : isDune
                          ? 'bg-[#f09c2b]/28 border-[#ffd175] text-[#fff4d4]'
                          : isAkira
                            ? 'bg-[#e61c24]/28 border-[#2b8cff] text-white'
                            : isCastlevania
                              ? 'bg-[#d90b1c]/30 border-[#ff4d5a] text-white'
                              : isGits
                                ? 'bg-[#2df0d2]/22 border-[#2df0d2] text-[#e8fffb]'
                                : isThundercats
                                  ? 'bg-[#e11d24]/30 border-[#fbbf24] text-[#fffbeb]'
                                  : isXmen
                                    ? 'bg-[#2563eb]/35 border-[#facc15] text-[#fef08a]'
                                    : isMatrix
                                      ? 'bg-[#00ff41]/22 border-[#00ff41] text-[#b8ffca]'
                                      : isPirates
                                        ? 'bg-[#14b8a6]/25 border-[#f59e0b] text-[#ccfbf1]'
                                        : isSteampunk
                                          ? 'bg-[#d97706]/30 border-[#fbbf24] text-[#fde68a]'
                                          : isAlien
                                            ? 'bg-[#22c55e]/25 border-[#39ff14] text-[#dcfce7]'
                                            : isDnd
                                              ? 'bg-[#dc2626]/30 border-[#fbbf24] text-[#fef3c7]'
                                              : isTemplar
                                                ? 'bg-[#b91c1c]/30 border-[#cbd5e1] text-[#f8fafc]'
                                                : isWitcher
                                                  ? 'bg-[#f59e0b]/25 border-[#f59e0b] text-[#fef3c7]'
                                                  : 'bg-[var(--or)]/25 border-[var(--or)] text-white'
                      : 'bg-black/45 border-white/10 text-[var(--fg)] hover:border-white/30'
                  }`}
                >
                  <div
                    className={`w-9 h-9 ${isDnd ? 'dnd-die-chip' : isWitcher ? 'witcher-rune-chip' : chipRadiusClass} overflow-hidden bg-black/70 border border-white/15 shrink-0 flex items-center justify-center`}
                  >
                    {thumbs.length >= 2 ? (
                      <div className="w-full h-full grid grid-cols-2 grid-rows-2">
                        {Array.from({ length: 4 }).map((_, i) =>
                          thumbs[i] ? (
                            <img
                              key={i}
                              src={thumbs[i]}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span key={i} className="bg-white/5" />
                          )
                        )}
                      </div>
                    ) : thumbs.length === 1 ? (
                      <img src={thumbs[0]} alt={col.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-base leading-none">{col.icon}</span>
                    )}
                  </div>
                  <div className="text-left min-w-0 max-w-[110px]">
                    <div className="text-[11px] font-bold truncate leading-tight">
                      {col.title}
                    </div>
                    <div className="text-[10px] text-[var(--mu)] leading-tight">
                      {col.ids.length}
                    </div>
                  </div>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => updateState({ tab: 'lists' })}
              className={`min-h-[44px] px-2.5 ${chipRadiusClass} border border-dashed border-white/25 bg-black/40 text-[11px] font-bold text-[var(--pe)] whitespace-nowrap shrink-0 hover:border-[var(--or)]`}
              title={isGits ? '全記憶集一覧を開く' : 'Open all playlists'}
            >
              {isGits ? '+ 一覧' : '+ All Lists'}
            </button>
          </div>
        </div>
      )}

      {/* Persistent Tactile Mini Player Bar */}
      {currentAudioTrack && !page && (
        <div className="fixed bottom-3 inset-x-3 sm:inset-x-6 z-20 max-w-4xl mx-auto">
          <div
            className={`relative ${themePanelClass} ${
              isBatman
                ? 'border-[#e31b23]/65'
                : isSleepy
                  ? 'border-[#d8ceb8]/35'
                  : isCastlevania
                    ? 'border-[#d90b1c]'
                    : isDune
                      ? 'border-[#ffd175]/65'
                      : isAkira
                        ? 'border-[#e61c24]/75'
                        : isRpo
                          ? 'border-[#38e0ff]/75'
                          : isGits
                            ? 'border-[#2df0d2]/75'
                            : isThundercats
                              ? 'border-[#fbbf24]/80'
                              : isXmen
                                ? 'border-[#facc15]'
                                : isMatrix
                                  ? 'border-[#00ff41]'
                                  : isPirates
                                    ? 'border-[#14b8a6]/80'
                                    : isSteampunk
                                      ? 'border-[#d97706]/90'
                                      : isAlien
                                        ? 'border-[#39ff14]/85'
                                        : isDnd
                                          ? 'border-[#d97706]/85'
                                          : isTemplar
                                            ? 'border-[#94a3b8]/75'
                                            : isWitcher
                                              ? 'border-[#f59e0b]/75'
                                              : ''
            } ${cardRadiusClass} p-2.5 flex items-center gap-3`}
          >
            {isCastlevania && <BloodDripFringe compact />}
            <button
              type="button"
              onClick={() => setPage('np')}
              className="flex items-center gap-3 flex-1 min-w-0 text-left"
            >
              <div
                className={`w-12 h-12 ${isDnd ? 'dnd-die-chip' : isWitcher ? 'witcher-rune-chip' : chipRadiusClass} overflow-hidden bg-black/60 shrink-0 flex items-center justify-center border ${
                  isBatman
                    ? 'border-[#00e68a]/45'
                    : isSleepy
                      ? 'border-[#d8ceb8]/35'
                      : isCastlevania
                        ? 'border-[#d90b1c]/70'
                        : isGkCrown
                          ? 'border-[#e4b248]/55'
                          : isGkWood
                            ? 'border-[#9be06c]/45'
                            : isDune
                              ? 'border-[#ffd175]/60'
                              : isAkira
                                ? 'border-[#e61c24]/70'
                                : isRpo
                                  ? 'border-[#38e0ff]/70'
                                  : isGits
                                    ? 'border-[#2df0d2]/70'
                                    : isThundercats
                                      ? 'border-[#fbbf24]/80'
                                      : isXmen
                                        ? 'border-[#facc15]'
                                        : isMatrix
                                          ? 'border-[#00ff41]'
                                          : isPirates
                                            ? 'border-[#14b8a6]'
                                            : isSteampunk
                                              ? 'border-[#fbbf24]'
                                              : isAlien
                                                ? 'border-[#39ff14]'
                                                : isDnd
                                                  ? 'border-[#fbbf24]'
                                                  : isTemplar
                                                    ? 'border-[#cbd5e1]'
                                                    : isWitcher
                                                      ? 'border-[#f59e0b]'
                                                      : 'border-white/15'
                }`}
              >
                {coverUrls[currentAudioTrack.id] ? (
                  <img
                    src={coverUrls[currentAudioTrack.id]}
                    alt={currentAudioTrack.name}
                    className={`w-full h-full object-cover ${isSleepy ? 'sepia-[18%] contrast-110' : ''}`}
                  />
                ) : isThundercats ? (
                  <EyeOfThunderaSvg className="w-7 h-7" />
                ) : isXmen ? (
                  <XMenBadgeSvg className="w-7 h-7" />
                ) : isPirates ? (
                  <KrakenTentacleSvg className="w-7 h-7" />
                ) : isSteampunk ? (
                  <SteampunkGearSvg className={`w-7 h-7 ${playing ? 'cog-spin' : ''}`} />
                ) : isAlien ? (
                  <AlienUfoSvg className="w-7 h-7" />
                ) : isDnd ? (
                  <D20DieSvg className="w-7 h-7" />
                ) : isTemplar ? (
                  <TemplarHelmSvg className="w-7 h-7" />
                ) : isWitcher ? (
                  <WolfMedallionSvg className="w-7 h-7" />
                ) : (
                  <Music className="w-5 h-5 text-[var(--mu)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm font-bold truncate ${
                    isBatman
                      ? 'text-[#00e68a] font-mono'
                      : isSleepy
                        ? 'text-[#f2ece0]'
                        : isCastlevania
                          ? 'text-[#ff5966]'
                          : isGkCrown
                            ? 'text-[#e8b954]'
                            : isDune
                              ? 'text-[#ffd175]'
                              : isAkira
                                ? 'text-[#ff404a]'
                                : isRpo
                                  ? 'text-[#7cebff]'
                                  : isGits
                                    ? 'text-[#2df0d2]'
                                    : isThundercats
                                      ? 'text-[#fbbf24]'
                                      : isXmen
                                        ? 'text-[#facc15]'
                                        : isMatrix
                                          ? 'text-[#00ff41] font-mono'
                                          : isPirates
                                            ? 'text-[#14b8a6]'
                                            : isSteampunk
                                              ? 'text-[#fbbf24] font-mono'
                                              : isAlien
                                                ? 'text-[#39ff14] font-mono'
                                                : isDnd
                                                  ? 'text-[#fbbf24]'
                                                  : isTemplar
                                                    ? 'text-[#f8fafc]'
                                                    : isWitcher
                                                      ? 'text-[#fbbf24]'
                                                      : ''
                  }`}
                >
                  {currentAudioTrack.nick || currentAudioTrack.name}
                </div>
                <div
                  className={`text-xs truncate ${
                    isBatman
                      ? 'text-[#e31b23] font-mono'
                      : isSleepy || isGreenKnight
                        ? 'text-[var(--mu)] italic'
                        : isCastlevania
                          ? 'text-[#e09ca3]'
                          : isDune
                            ? 'text-[#f0c678]'
                            : isAkira
                              ? 'text-[#9ec4ff] font-mono'
                              : isRpo
                                ? 'text-[#a5d8ff] font-mono'
                                : isGits
                                  ? 'text-[#89cbc8] font-mono'
                                  : isThundercats
                                    ? 'text-[#fde68a]/85 font-mono'
                                    : isXmen
                                      ? 'text-[#fef08a]/90 font-semibold'
                                      : isMatrix
                                        ? 'text-[#4dff79] font-mono'
                                        : isPirates
                                          ? 'text-[#99f6e4] font-mono'
                                          : isSteampunk
                                            ? 'text-[#fed7aa] font-mono'
                                            : isAlien
                                              ? 'text-[#86efac] font-mono'
                                              : isDnd
                                                ? 'text-[#fde68a]'
                                                : isTemplar
                                                  ? 'text-[#cbd5e1]'
                                                  : isWitcher
                                                    ? 'text-[#d4d4d8]'
                                                    : 'text-[var(--mu)]'
                  }`}
                >
                  {currentAudioTrack.artist ||
                    (isGits
                      ? 'タップして再生画面へ'
                      : isThundercats
                        ? 'CATS LAIR // SIGHT BEYOND SIGHT'
                        : isXmen
                          ? 'CEREBRO // DANGER ROOM DECK'
                          : isMatrix
                            ? 'MATRIX // CASCADE STREAM'
                            : isPirates
                              ? 'DARK SEAS // KRAKEN DECK'
                              : isSteampunk
                                ? 'BOILER #04 // 185 PSI ENGINE'
                                : isAlien
                                  ? 'CORNFIELD SECTOR // TRACTOR BEAM ACTIVE'
                                  : isDnd
                                    ? `TABLETOP SESSION // d20 INITIATIVE (${dndRoll.val})`
                                    : isTemplar
                                      ? `TEMPLAR SIEGE // STORM RAIN (${templarTool})`
                                      : isWitcher
                                        ? `WOLF MEDALLION HUMMING // SIGN: ${witcherSign}`
                                        : 'Tap to expand Now Playing')}{' '}
                  · {formatTime(curTime)} / {formatTime(dur)}
                </div>
              </div>
            </button>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => stepTrack(-1)}
                className="min-h-[44px] min-w-[44px] hidden sm:flex items-center justify-center rounded-xl hover:bg-white/10"
                aria-label={isGits ? '前の記録' : 'Previous track'}
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={togglePlay}
                className={`relative min-h-[44px] min-w-[44px] ${chipRadiusClass} ${
                  isBatman
                    ? 'bg-[#e31b23] border border-[#00e68a]/55 text-white'
                    : isSleepy
                      ? 'bg-[#c8101c] border border-[#d8ceb8]/45 text-[#f2ece0]'
                      : isCastlevania
                        ? 'castlevania-blood-btn'
                        : isGkCrown
                          ? 'bg-[#d91b0c] border border-[#e4b248]/70 text-[#f8edd6]'
                          : isGkWood
                            ? 'bg-[#3d8c2b] border border-[#d9c484]/60 text-[#f5f8ee]'
                            : isDune
                              ? 'dune-sun-btn'
                              : isAkira
                                ? 'akira-btn'
                                : isRpo
                                  ? 'rpo-btn'
                                  : isGits
                                    ? 'gits-btn'
                                    : isThundercats
                                      ? 'thundercats-btn'
                                      : isXmen
                                        ? 'xmen-btn'
                                        : isMatrix
                                          ? 'matrix-btn'
                                          : isPirates
                                            ? 'pirates-btn'
                                            : isSteampunk
                                              ? 'steampunk-btn'
                                              : isAlien
                                                ? 'alien-btn'
                                                : isDnd
                                                  ? 'dnd-die-btn'
                                                  : isTemplar
                                                    ? 'templar-btn'
                                                    : isWitcher
                                                      ? 'witcher-btn'
                                                      : 'bg-[var(--or)] text-white shadow-lg shadow-[var(--or)]/30'
                } flex items-center justify-center`}
                aria-label={playing ? (isGits ? '一時停止' : 'Pause') : isGits ? '再生' : 'Play'}
              >
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={() => stepTrack(1)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/10"
                aria-label={isGits ? '次の記録' : 'Next track'}
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drag & Drop Glass Overlay */}
      {dragOver && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-6 pointer-events-none">
          <div className="mat-panel rounded-3xl p-10 text-center border-2 border-dashed border-[var(--or)]">
            <div className="text-3xl mb-2">{activeTheme.e}</div>
            <div className="text-lg font-extrabold">
              {isGits ? '音声・映像ファイルをドロップして電脳取り込み' : 'Drop Audio or Video Files to Import'}
            </div>
            <div className="text-xs text-[var(--mu)] mt-1">
              Supports MP3, FLAC, M4A, M4B, WAV, MP4, WebM, MKV
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Now Playing View */}
      <NowPlayingView
        open={page === 'np'}
        track={currentAudioTrack}
        coverUrl={currentAudioTrack ? coverUrls[currentAudioTrack.id] : undefined}
        playing={playing}
        currentTime={curTime}
        duration={dur}
        volume={state.vol ?? 0.9}
        isFav={!!(currentAudioTrack && state.fav?.[currentAudioTrack.id])}
        playMode={state.mode}
        onClose={() => setPage('')}
        onTogglePlay={togglePlay}
        onPrev={() => stepTrack(-1)}
        onNext={() => stepTrack(1)}
        onSeek={(sec) => {
          const el = npKind === 'book' ? bkRef.current : audRef.current;
          if (el) el.currentTime = sec;
          setCurTime(sec);
        }}
        onVolumeChange={(v) => updateState({ vol: v })}
        onToggleFav={() => {
          if (!currentAudioTrack) return;
          const next = { ...state.fav };
          if (next[currentAudioTrack.id]) delete next[currentAudioTrack.id];
          else next[currentAudioTrack.id] = 1;
          updateState({ fav: next });
        }}
        onCycleMode={cyclePlayMode}
        onOpenOptions={openNowPlayingOptions}
        onOpenMore={() => currentAudioTrack && openTrackMenu(currentAudioTrack)}
        onOpenNotes={() => {
          if (!currentAudioTrack) return;
          setEditTrackId(currentAudioTrack.id);
          setPage('notes');
        }}
        onOpenArtViewer={() => {
          if (!currentAudioTrack) return;
          setArtViewerTrackId(currentAudioTrack.id);
        }}
        onEditLyrics={() => {
          if (!currentAudioTrack) return;
          setEditTrackId(currentAudioTrack.id);
          setPage('lyrics');
        }}
        onSaveAutoLyrics={(tid, lyr) => updateTrack(tid, { lyr })}
        onToast={showToast}
      />

      {/* Symphony 6th Video Player */}
      <VideoPlayerModal
        open={page === 'video'}
        track={currentVideoTrack}
        videoRef={vidRef}
        settings={state.vp || {}}
        queue={videoQueue}
        onClose={() => {
          vidRef.current?.pause();
          setPage('');
        }}
        onPrev={() => {
          if (!videoQueue.length || !currentVideoTrack) return;
          const idx = videoQueue.findIndex((x) => x.id === currentVideoTrack.id);
          const prevTr = videoQueue[(idx - 1 + videoQueue.length) % videoQueue.length];
          playTrack(prevTr.id);
        }}
        onNext={() => {
          if (!videoQueue.length || !currentVideoTrack) return;
          const idx = videoQueue.findIndex((x) => x.id === currentVideoTrack.id);
          const nextTr = videoQueue[(idx + 1) % videoQueue.length];
          playTrack(nextTr.id);
        }}
        onSelectTrack={(id) => playTrack(id)}
        onUpdateSettings={(patch) =>
          updateState({ vp: { ...(state.vp || {}), ...patch } })
        }
        onOpenMore={() => currentVideoTrack && openTrackMenu(currentVideoTrack)}
        onToast={showToast}
      />

      {/* Hyper-Realistic Theme Gallery & Atmospheric Controls */}
      <ThemeGalleryPage
        open={page === 'interface'}
        allThemes={allThemes}
        state={state}
        onClose={() => setPage('')}
        onApplyTheme={handleApplyTheme}
        onOpenDiyStudio={(editKey) => {
          setDiyEditKey(editKey);
          setDiyStudioSeed(editKey ? allThemes[editKey] : activeTheme);
          setPage('diyStudio');
        }}
        onDeleteDiy={handleDeleteDiyTheme}
        onExportDiy={handleExportDiy}
        onImportDiy={handleImportDiy}
        onUpdateState={updateState}
        onResetTweaks={() => {
          updateState({
            accent: undefined,
            backdropOverride: undefined,
            font: undefined,
            corner: undefined,
            fx: 2,
            wetGlass: true,
            holograms: true,
            crowd: true,
            crowdLevel: 2,
            names: 1,
            postProcess: 'none',
          });
          showToast('Reset realism tweaks to active theme defaults');
        }}
      />

      {/* Hyper-Realistic DIY Theme Studio */}
      <DiyStudioModal
        key={diyEditKey || 'new-diy'}
        open={page === 'diyStudio'}
        initialKey={diyEditKey}
        initialTheme={diyStudioSeed}
        onClose={() => setPage('interface')}
        onSaveTheme={handleSaveDiyTheme}
      />

      {/* 4K Wallpapers & Collectible Pokémon Card Deck */}
      <WallpapersPage
        open={page === 'wallpapers'}
        activeBackdropOverride={state.backdropOverride}
        onClose={() => setPage('')}
        onSetWallBlob={applyWallBlob}
        onSelectBackdropUrl={(url) =>
          updateState({
            backdropOverride: url || undefined,
            scene: 1,
          })
        }
        onToast={showToast}
      />

      {/* Browser / Explorer */}
      <BrowserPage
        open={page === 'browser'}
        engine={state.eng || 'brave'}
        bookmarks={state.bm || []}
        history={state.bh || []}
        onClose={() => setPage('')}
        onChangeEngine={(eng) => updateState({ eng })}
        onAddHistory={(u) =>
          updateState({
            bh: [u, ...(state.bh || []).filter((x) => x !== u)].slice(0, 40),
          })
        }
        onToggleBookmark={(u) => {
          const cur = state.bm || [];
          const next = cur.includes(u) ? cur.filter((x) => x !== u) : [u, ...cur];
          updateState({ bm: next });
        }}
        onClearHistory={() => updateState({ bh: [] })}
        onPlayUrl={(u) => {
          setPage('');
          importStreamUrl(u);
        }}
      />

      {/* Notes & Names Keeper */}
      <NotesKeeperPage
        open={page === 'keeper'}
        entries={state.keep || []}
        tracksWithNotes={tracksWithNotes}
        pwRecord={state.pw}
        unlocked={keeperUnlocked}
        onUnlock={() => setKeeperUnlocked(true)}
        onLockNow={() => setKeeperUnlocked(false)}
        onSetPwRecord={(pw: PasswordRecord | undefined) => updateState({ pw })}
        onEraseAllOnForgot={() => {
          updateState({ keep: [], pw: undefined });
          setKeeperUnlocked(false);
        }}
        onSaveEntries={(keep: KeeperEntry[]) => updateState({ keep })}
        onClose={() => setPage('')}
        onToast={showToast}
      />

      {/* Tag, Lyrics, Notes & Art Viewer Modals */}
      <TagEditorModal
        open={page === 'tags'}
        track={editTrack}
        coverUrl={editTrack ? coverUrls[editTrack.id] : undefined}
        onClose={() => setPage('')}
        onSave={updateTrack}
        onOpenLyrics={() => setPage('lyrics')}
        onOpenNotes={() => setPage('notes')}
        onViewArt={() => editTrack && setArtViewerTrackId(editTrack.id)}
        onToast={showToast}
      />

      <LyricsEditorModal
        open={page === 'lyrics'}
        track={editTrack}
        onClose={() => setPage('')}
        onSave={(tid, lyr) => updateTrack(tid, { lyr })}
        onToast={showToast}
      />

      <TrackNotesModal
        open={page === 'notes'}
        track={editTrack}
        onClose={() => setPage('')}
        onSave={updateTrack}
        onToast={showToast}
      />

      <ArtViewerModal
        open={artViewerTrackId !== null}
        blob={artViewerTrack ? artViewerTrack.cover || artViewerTrack.emb || artViewerTrack.thumb || null : null}
        title={artViewerTrack?.name || ''}
        onClose={() => setArtViewerTrackId(null)}
      />

      {/* Unified Bottom Sheet & Prompt Dialog */}
      <ActionSheet
        open={sheet.open}
        title={sheet.title}
        entries={sheet.entries}
        onClose={() => setSheet((s) => ({ ...s, open: false }))}
      />

      <PromptDialog
        open={promptDlg.open}
        title={promptDlg.title}
        subtitle={promptDlg.subtitle}
        placeholder={promptDlg.placeholder}
        defaultValue={promptDlg.defaultValue}
        confirmLabel={promptDlg.confirmLabel}
        onCancel={() => setPromptDlg((p) => ({ ...p, open: false }))}
        onConfirm={promptDlg.onConfirm}
      />

      {/* Transient Notification Pill */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-black/85 border border-white/20 text-xs font-bold shadow-2xl backdrop-blur-md pointer-events-none">
          {toast}
        </div>
      )}

      {/* Global Cinematic Post-Processing Optical Overlay (UI + Wallpaper) */}
      {state.postProcess && state.postProcess !== 'none' && (
        <div
          aria-hidden="true"
          className={`pointer-events-none fixed inset-0 z-[70] transition-opacity duration-300 ${
            state.postProcess === 'noir-film-grain'
              ? 'post-overlay-noir'
              : state.postProcess === 'aged-vellum'
                ? 'post-overlay-vellum'
                : 'post-overlay-cyber'
          }`}
        />
      )}
    </div>
  );
}
