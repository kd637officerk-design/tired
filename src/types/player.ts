export type MediaKind = 'audio' | 'video' | 'book' | 'photo' | 'pdf';
export type TabKey = 'music' | 'video' | 'lists' | 'books';
export type ActivePage =
  | ''
  | 'np'
  | 'video'
  | 'interface'
  | 'wallpapers'
  | 'tags'
  | 'lyrics'
  | 'browser'
  | 'keeper'
  | 'keeperEdit'
  | 'notes'
  | 'diyStudio';

export type WeatherFxType =
  | 'acid'
  | 'rain'
  | 'dragon'
  | 'ember'
  | 'spark'
  | 'snow'
  | 'bats'
  | 'spore'
  | 'petal'
  | 'gear'
  | 'bubble'
  | 'code'
  | 'rune'
  | 'batflare'
  | 'fog'
  | 'bloodrain'
  | 'meadow'
  | 'sandstorm'
  | 'akira88'
  | 'oasis'
  | 'gits'
  | 'thundercats'
  | 'xmen90s'
  | 'matrixrain'
  | 'kraken'
  | 'steamengine'
  | 'alienfarm'
  | 'dndtable'
  | 'templar_rain'
  | 'witcher_signs'
  | 'none';

export type MaterialFinish =
  | 'wet-glass'
  | 'anodized-titanium'
  | 'brushed-brass'
  | 'volcanic-obsidian'
  | 'forged-carbon'
  | 'matte-ceramic'
  | 'daylight-porcelain';

export type CornerStyle = '' | 'sharp' | 'round';
export type FontStyle = '' | 'clean' | 'serif' | 'mono' | 'cinema' | 'gothic' | 'medieval';
export type LayoutMode =
  | 'default'
  | 'batman2022'
  | 'sleepyhollow'
  | 'greenknight_crown'
  | 'greenknight_wood'
  | 'castlevania'
  | 'dune'
  | 'akira1988'
  | 'readyplayerone'
  | 'ghostintheshell'
  | 'thundercats'
  | 'xmen90s'
  | 'matrixgreen'
  | 'piratesabyss'
  | 'steampunk_engine'
  | 'alienfarm'
  | 'dndtable'
  | 'templar_rain'
  | 'witcher_signs';

export type PostProcessFilter =
  | 'none'
  | 'noir-film-grain'
  | 'aged-vellum'
  | 'cyber-blue-tint';

export interface Track {
  id: number;
  name: string;
  fn?: string;
  kind: MediaKind;
  blob?: Blob | null;
  cover?: Blob | null;
  emb?: Blob | null;
  thumb?: Blob | null;
  thumbTried?: number;
  artTried?: number;
  artv?: number;
  chk?: number;
  url?: string;
  web?: string;
  yt?: string;
  orig?: string;
  local?: number;
  path?: string;
  folder?: string;
  artist?: string;
  album?: string;
  aa?: string;
  comp?: string;
  genre?: string;
  lyr?: string;
  lyTried?: number;
  nick?: string;
  links?: string;
  notes?: string;
  nameSet?: number;
  dur?: number;
  vd?: number;
  sz?: number;
  mod?: number;
  addedAt?: number;
}

export interface Playlist {
  id: number;
  name: string;
  ids: number[];
}

export interface TrackStats {
  c: number;
  l: number;
}

export interface KeeperEntry {
  id: number;
  name: string;
  links: string;
  notes: string;
  ts: number;
}

export interface PasswordRecord {
  s: string;
  h: string;
}

export interface VideoPlayerSettings {
  auto?: number;
  rate?: number;
  mode?: number;
  scale?: number;
  style?: 'classic' | 'glass' | 'neon' | 'square';
  swipe?: number;
  badge?: number;
}

export interface PlayerState {
  tab: TabKey;
  mode: 'seq' | 'all' | 'one' | 'shuf';
  auto: boolean;
  shuf: boolean;
  rep: boolean;
  one: boolean;
  cur: Partial<Record<MediaKind, number>>;
  pos: Record<number, number>;
  pls: Playlist[];
  sel: Partial<Record<MediaKind, string | number | null>>;
  sort: { by: string; dir: number; set?: boolean };
  sortV?: number;
  fav: Record<number, number>;
  hid: Record<number, number>;
  st: Record<number, TrackStats>;
  npk: 'audio' | 'book';
  theme: string;
  accent?: string;
  fx?: number; // 0=Off, 1=Subtle, 2=High, 3=Hyper
  wetGlass?: boolean;
  holograms?: boolean;
  crowd?: boolean;
  crowdLevel?: number; // 0=Off, 1=Quiet, 2=Bustling, 3=Dense
  scene?: number; // 1=on, 0=off
  names?: number; // 1=on, 0=off
  font?: FontStyle;
  corner?: CornerStyle;
  title?: string;
  season?: number;
  rate?: number;
  vol?: number;
  eq?: number;
  smartOff?: boolean;
  minSec?: number;
  eng?: string;
  bm?: string[];
  bh?: string[];
  burl?: string;
  bmode?: 'in' | 'ext';
  nb?: number;
  keep?: KeeperEntry[];
  pw?: PasswordRecord;
  vp?: VideoPlayerSettings;
  glassOpacity?: number;
  blurStrength?: number;
  glassDrops?: boolean;
  backdropOverride?: string;
  postProcess?: PostProcessFilter;
}

export interface ThemePreset {
  label: string;
  e: string;
  accent: string;
  secondaryAccent?: string;
  bg: string;
  chip: string;
  np: string;
  sh: string;
  fg: string;
  pe: string;
  mu: string;
  light?: boolean;
  material: MaterialFinish;
  fx?: WeatherFxType;
  holograms?: boolean;
  wetGlass?: boolean;
  crowd?: boolean;
  crowdDensity?: 'quiet' | 'active' | 'dense';
  backdropLandscape?: string;
  backdropPortrait?: string;
  l?: string;
  r?: string;
  tabs?: string[];
  empty?: string;
  font?: FontStyle;
  corner?: CornerStyle;
  layoutMode?: LayoutMode;
  isCustom?: boolean;
}

export interface WallpaperThumb {
  id: string;
  name: string;
  type: string;
  size: number;
  w: number;
  h: number;
  thumb: Blob | null;
  added: number;
}

export interface WallpaperPlaylist {
  id: string;
  name: string;
  ids: string[];
}

export interface WallpaperAutoMeta {
  playlists: WallpaperPlaylist[];
  active: string;
  interval: number;
  nextAt: number;
  lastId: string;
}

export interface SheetItem {
  icon?: string;
  label: string;
  on?: boolean;
  keep?: boolean;
  danger?: boolean;
  fn?: () => void;
}
