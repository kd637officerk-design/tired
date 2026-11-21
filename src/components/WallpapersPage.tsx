import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ImagePlus,
  Play,
  Plus,
  Shuffle,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  deleteWallpapers,
  getAllWallpaperThumbs,
  getWallpaperAutoMeta,
  getWallpaperBlob,
  putMeta,
  putWallpaperAutoMeta,
  saveWallpaperRecord,
} from '../utils/idb';
import { formatSize } from '../utils/mediaParsers';
import { WallpaperPlaylist, WallpaperThumb } from '../types/player';

interface WallpapersPageProps {
  open: boolean;
  activeBackdropOverride?: string;
  onClose: () => void;
  onSetWallBlob: (blob: Blob | null) => void;
  onSelectBackdropUrl: (url: string) => void;
  onToast: (msg: string) => void;
}

interface PokemonCardMeta {
  id: string;
  no: string;
  name: string;
  stage: string;
  hp: number;
  typeLabel: string;
  typeIcon: string;
  src: string;
  cardBg: string;
  accentHex: string;
  specLine: string;
  move1Name: string;
  move1Dmg: string;
  move1Desc: string;
  move2Name: string;
  move2Dmg: string;
  move2Desc: string;
  lore: string;
  weakness: string;
  resistance: string;
  retreat: number;
}

const UPLOADED_POKEMON_CARDS: PokemonCardMeta[] = [
  {
    id: 'rpo-visor',
    no: '001/041',
    name: 'PARZIVAL X1',
    stage: 'VMAX',
    hp: 310,
    typeLabel: 'CYBER',
    typeIcon: '⚡',
    src: '/assets/aistudio/efe30ce11e59d42933b451f21e019b37_59027ace.jpg',
    cardBg: 'linear-gradient(155deg, #0b2452 0%, #103b7a 48%, #1e1345 100%)',
    accentHex: '#38e0ff',
    specLine: 'NO. 001  OASIS Avatar · The Stacks  2045 Edition',
    move1Name: 'X1 Visor Scan',
    move1Dmg: '90',
    move1Desc: 'Reveal Anorak’s Almanac clues across Planet Doom.',
    move2Name: 'Iron Giant Surge',
    move2Dmg: '210',
    move2Desc: 'Calls giant mech support; ignores IOI Sixer shields.',
    lore: 'Logged into the OASIS from Columbus stacks with a glowing haptic visor.',
    weakness: '⚡×2',
    resistance: '🌑-30',
    retreat: 2,
  },
  {
    id: 'rpo-keys',
    no: '002/041',
    name: 'THREE KEYS HUNT',
    stage: 'LEGEND',
    hp: 330,
    typeLabel: 'PRISM',
    typeIcon: '🗝️',
    src: '/assets/aistudio/d58db09c8da0dd58866b320acb632d80_2a5590ca.jpg',
    cardBg: 'linear-gradient(155deg, #3b2406 0%, #1b2852 52%, #4a0e19 100%)',
    accentHex: '#f59e0b',
    specLine: 'NO. 002  Copper · Jade · Crystal Keys  Gunter Relic',
    move1Name: 'Haptic Glove',
    move1Dmg: '120',
    move1Desc: 'Draws Copper Key & Extra-Life Quarter from cache.',
    move2Name: 'Halliday’s Egg',
    move2Dmg: '260+',
    move2Desc: 'Unlocks vault control when all Three Keys align.',
    lore: 'Copper Key, DeLorean, Kaneda Bike & Sixers clash for the Easter Egg.',
    weakness: '🌑×2',
    resistance: '🔥-30',
    retreat: 3,
  },
  {
    id: 'rpo-delorean',
    no: '003/041',
    name: 'ECTO-88 DELOREAN',
    stage: 'STAGE 2',
    hp: 270,
    typeLabel: 'FLUX',
    typeIcon: '✨',
    src: '/assets/aistudio/6935ffc0abef761173675c4cee8896cf_f1bb7df6.jpg',
    cardBg: 'linear-gradient(155deg, #2b0f47 0%, #132c60 52%, #0e4a63 100%)',
    accentHex: '#e879f9',
    specLine: 'NO. 003  Pure Imagination · 88 MPH Synth Grid',
    move1Name: 'Zemeckis Cube',
    move1Dmg: '80',
    move1Desc: 'Rewinds track state 60 seconds through neon grid.',
    move2Name: 'Flux Overdrive',
    move2Dmg: '190',
    move2Desc: 'Blasts across OASIS Sector 1 leaving neon tire trails.',
    lore: 'Modified time machine roaring above a glowing synthwave horizon.',
    weakness: '⚙️×2',
    resistance: '💧-20',
    retreat: 1,
  },
  {
    id: 'batman-22',
    no: '004/041',
    name: 'THE BATMAN ’22',
    stage: 'STAGE 2',
    hp: 280,
    typeLabel: 'DARK',
    typeIcon: '🦇',
    src: '/assets/aistudio/3a467991197aa196f424a6c3849562c8_35672b1e.jpg',
    cardBg: 'linear-gradient(155deg, #160508 0%, #091813 55%, #2b060b 100%)',
    accentHex: '#e31b23',
    specLine: 'NO. 004  Gotham Rain · Signal Flare Red',
    move1Name: 'Riddler Cipher',
    move1Dmg: '70',
    move1Desc: 'Reveals encrypted tracks in the forensic deck.',
    move2Name: 'Crimson Flare',
    move2Dmg: '180',
    move2Desc: 'Leads survivors through flooded nocturnal streets.',
    lore: 'Vengeance cuts through Gotham’s green rain beneath a red flare.',
    weakness: '🌿×2',
    resistance: '🔮-30',
    retreat: 2,
  },
  {
    id: 'sleepy-99',
    no: '005/041',
    name: 'SLEEPY HOLLOW',
    stage: 'STAGE 1',
    hp: 240,
    typeLabel: 'MIST',
    typeIcon: '🎃',
    src: '/assets/aistudio/22cb584dfc0d0b3cd56b3695669a8942_77e65d36.jpg',
    cardBg: 'linear-gradient(155deg, #1c1916 0%, #0b0b0d 58%, #36080e 100%)',
    accentHex: '#d8ceb8',
    specLine: 'NO. 005  Tarrytown Ledger · A.D. 1799',
    move1Name: 'Cemetery Fog',
    move1Dmg: '60',
    move1Desc: 'Envelops the deck in pale silver-sepia mist.',
    move2Name: 'Headless Charge',
    move2Dmg: '160',
    move2Desc: 'Gallops out of the Western Woods under blood moon.',
    lore: 'Ichabod Crane’s 1799 investigation beneath twisted dead trees.',
    weakness: '🔥×2',
    resistance: '🌑-30',
    retreat: 2,
  },
  {
    id: 'gk-crown',
    no: '006/041',
    name: 'GAWAIN CROWN',
    stage: 'STAGE 2',
    hp: 290,
    typeLabel: 'ROYAL',
    typeIcon: '👑',
    src: '/assets/aistudio/2bf9a933807234cba875c27cb8a4b0d2_bc8e3197.jpg',
    cardBg: 'linear-gradient(155deg, #520a05 0%, #240704 55%, #5c3f0c 100%)',
    accentHex: '#e4b248',
    specLine: 'NO. 006  Camelot Honor · Hammered Halo Gold',
    move1Name: 'Royal Decree',
    move1Dmg: '90',
    move1Desc: 'Gilds UI borders in illuminated vermilion & gold.',
    move2Name: 'Crowned Valor',
    move2Dmg: '200',
    move2Desc: 'When honor was everything, when courage made kings.',
    lore: 'Chainmail and hammered gold halo forged in Arthurian crimson.',
    weakness: '💧×2',
    resistance: '🌿-30',
    retreat: 2,
  },
  {
    id: 'gk-chapel',
    no: '007/041',
    name: 'GREEN KNIGHT',
    stage: 'STAGE 2',
    hp: 300,
    typeLabel: 'GRASS',
    typeIcon: '🪓',
    src: '/assets/aistudio/c5f3cf7343e14f16e60e1c60afe15883_bfb13f6f.jpg',
    cardBg: 'linear-gradient(155deg, #163310 0%, #0c1b0a 56%, #2f381b 100%)',
    accentHex: '#9be06c',
    specLine: 'NO. 007  Green Chapel · Woodland Giant',
    move1Name: 'Woodland Mist',
    move1Dmg: '80',
    move1Desc: 'Summons hearth embers & moss across aged vellum.',
    move2Name: 'One Year Hence',
    move2Dmg: '210',
    move2Desc: 'Delivers the fateful return blow at the Green Chapel.',
    lore: 'Moss-clad giant leaning upon a great battle axe in misty timber.',
    weakness: '🔥×2',
    resistance: '💧-30',
    retreat: 3,
  },
  {
    id: 'castlevania-citadel',
    no: '008/041',
    name: 'DRACULA CITADEL',
    stage: 'VMAX',
    hp: 320,
    typeLabel: 'BLOOD',
    typeIcon: '🏰',
    src: '/assets/aistudio/56f3ccd6ff9123810b3a6b5c2ed83eec_ffc11c78.jpg',
    cardBg: 'linear-gradient(155deg, #47040b 0%, #160205 56%, #590712 100%)',
    accentHex: '#ff3b4a',
    specLine: 'NO. 008  Wallachia · Night of the Blood Moon',
    move1Name: 'Melting Blood',
    move1Dmg: '110',
    move1Desc: 'Coats active deck controls in dripping crimson.',
    move2Name: 'Blood Moon Spires',
    move2Dmg: '240',
    move2Desc: 'Summons bat swarms beneath the towering red moon.',
    lore: 'Castlevania’s impossible gothic spires silhouetted against crimson.',
    weakness: '⚡×2',
    resistance: '🌑-30',
    retreat: 3,
  },
  {
    id: 'castlevania-belmont',
    no: '009/041',
    name: 'TREVOR BELMONT',
    stage: 'STAGE 2',
    hp: 260,
    typeLabel: 'FIGHT',
    typeIcon: '🩸',
    src: '/assets/aistudio/81528a2d5c317cd516d7bc776594020c_556df5b8.jpg',
    cardBg: 'linear-gradient(155deg, #3d050a 0%, #140305 54%, #381116 100%)',
    accentHex: '#ff4d5a',
    specLine: 'NO. 009  Belmont Hold · Morning Star Whip',
    move1Name: 'Vampire Killer',
    move1Dmg: '100',
    move1Desc: 'Strikes with consecrated crimson chain lash.',
    move2Name: 'Tepes Duel',
    move2Dmg: '190',
    move2Desc: 'Faces Vlad Dracula beneath a blood-stained sky.',
    lore: 'The last scion of House Belmont stands defiant before Dracula.',
    weakness: '🔮×2',
    resistance: '🌑-20',
    retreat: 2,
  },
  {
    id: 'sector9-neon',
    no: '010/041',
    name: 'SECTOR 9 RAIN',
    stage: 'BASIC',
    hp: 220,
    typeLabel: 'WATER',
    typeIcon: '🌧️',
    src: '/assets/aistudio/1795210863038_63aba7cd.jpg',
    cardBg: 'linear-gradient(155deg, #101f3d 0%, #160929 55%, #072c38 100%)',
    accentHex: '#00f5ff',
    specLine: 'NO. 010  Cyberpunk Wet Street · Neon Crosswalk',
    move1Name: 'Wet Asphalt',
    move1Dmg: '50',
    move1Desc: 'Refracts magenta & cyan signs onto rain puddles.',
    move2Name: 'Holo Downpour',
    move2Dmg: '140',
    move2Desc: 'Triggers multi-depth street rain and glass drops.',
    lore: 'Rain-soaked neon canyon glowing after midnight in Sector 9.',
    weakness: '⚡×2',
    resistance: '🔥-20',
    retreat: 1,
  },
  {
    id: 'gits-newport',
    no: '011/041',
    name: '新浜市 NEW PORT',
    stage: 'VMAX',
    hp: 310,
    typeLabel: '電脳',
    typeIcon: '🌃',
    src: '/assets/aistudio/24ddf2a1ae40344c1050d29e295fad09_e007711c.jpg',
    cardBg: 'linear-gradient(155deg, #05262e 0%, #0d1638 54%, #2b0c2e 100%)',
    accentHex: '#2df0d2',
    specLine: 'NO. 011  新浜市高層電脳街 · 光学迷彩夜景',
    move1Name: '電脳網走査',
    move1Dmg: '110',
    move1Desc: 'Searches New Port City neon kanji telemetry streams.',
    move2Name: '光学迷彩展開',
    move2Dmg: '230',
    move2Desc: 'Refracts rooftop holograms across falling rain.',
    lore: '新浜市のネオン看板と電脳球体が夜空に浮かぶ屋上からの展望。',
    weakness: '⚡×2',
    resistance: '🌑-30',
    retreat: 2,
  },
  {
    id: 'gits-1995',
    no: '012/041',
    name: '草薙素子 1995',
    stage: 'LEGEND',
    hp: 340,
    typeLabel: '公安9課',
    typeIcon: '🕶️',
    src: '/assets/aistudio/ec24975a546327f42edd355f2e0054ac_d6eebfd0.jpg',
    cardBg: 'linear-gradient(155deg, #06182b 0%, #0c2c38 52%, #190d29 100%)',
    accentHex: '#00f5c8',
    specLine: 'NO. 012  公安9課少佐 · 1995年劇場版',
    move1Name: 'ゴースト囁き',
    move1Dmg: '130',
    move1Desc: 'Synchronizes cyberbrain intuition across all decks.',
    move2Name: 'セブロ弾幕',
    move2Dmg: '250',
    move2Desc: 'Strikes from high-rise shadows overlooking New Port.',
    lore: '全身義体の少佐・草薙素子が新浜市の高層ビル群を背に立つ。',
    weakness: '🔮×2',
    resistance: '⚡-30',
    retreat: 1,
  },
  {
    id: 'gits-shell',
    no: '013/041',
    name: '電脳義体 SHELL',
    stage: 'VSTAR',
    hp: 320,
    typeLabel: '義体',
    typeIcon: '🔌',
    src: '/assets/aistudio/20e70fcb7aa441778d058390b6901156_2dbb6e15.jpg',
    cardBg: 'linear-gradient(155deg, #092033 0%, #1b2838 54%, #3d0f18 100%)',
    accentHex: '#ff3b52',
    specLine: 'NO. 013  義体接続殻 · 有線ダイブ機構',
    move1Name: '有線プラグイン',
    move1Dmg: '100',
    move1Desc: 'Jacks neural cables directly into Puppet Master net.',
    move2Name: 'ネットの深淵',
    move2Dmg: '240',
    move2Desc: 'Merges ghost and shell inside the infinite data ring.',
    lore: '無数の電脳ケーブルに吊られた素子の義体が、深層ネットへダイブする。',
    weakness: '🔥×2',
    resistance: '💧-30',
    retreat: 2,
  },
  {
    id: 'thundercats-1985',
    no: '014/041',
    name: 'THUNDERCATS ’85',
    stage: 'LEGEND',
    hp: 350,
    typeLabel: 'OMENS',
    typeIcon: '⚔️',
    src: '/assets/aistudio/2f7f434e046ebdfce5449ed519087bd5_4dfe0308.jpg',
    cardBg: 'linear-gradient(155deg, #1b2442 0%, #3d0b14 54%, #381847 100%)',
    accentHex: '#fbbf24',
    specLine: 'NO. 014  Third Earth · Sword of Omens  1985 Edition',
    move1Name: 'Sight Beyond Sight',
    move1Dmg: '140',
    move1Desc: 'Projects the Eye of Thundera across Cats Lair & Mumm-Ra.',
    move2Name: 'ThunderCats HOOO!',
    move2Dmg: '280',
    move2Desc: 'Summons Lion-O, Panthro, Cheetara & ThunderTank.',
    lore: 'Lion-O raises the blazing Sword of Omens against Mumm-Ra the Ever-Living.',
    weakness: '🌑×2',
    resistance: '⚡-30',
    retreat: 2,
  },
  {
    id: 'thundercats-cliff',
    no: '015/041',
    name: 'LION-O RED CLIFF',
    stage: 'VMAX',
    hp: 340,
    typeLabel: 'FIRE',
    typeIcon: '⚡',
    src: '/assets/aistudio/8614f63e7a4da6fccfef084387aaaae1_e8a2a1dc.jpg',
    cardBg: 'linear-gradient(155deg, #3b080a 0%, #1c0507 56%, #451014 100%)',
    accentHex: '#ef4444',
    specLine: 'NO. 015  Red Storm Cliff · Panthro · Cheetara · Tygra',
    move1Name: 'Sword Beacon',
    move1Dmg: '130',
    move1Desc: 'Projects crimson Eye of Thundera lightning across Third Earth.',
    move2Name: 'Lords of Thundera',
    move2Dmg: '270',
    move2Desc: 'Unites Lion-O, Panthro, Cheetara, Tygra, WilyKit & Snarf.',
    lore: 'Standing atop the crimson cliff, Lion-O calls the ThunderCats to battle.',
    weakness: '💧×2',
    resistance: '🔥-30',
    retreat: 2,
  },
  {
    id: 'thundercats-mummra',
    no: '016/041',
    name: 'MUMM-RA EVER-LIVING',
    stage: 'VSTAR',
    hp: 360,
    typeLabel: 'PSYCHIC',
    typeIcon: '🦁',
    src: '/assets/aistudio/4f87a097b859aac2413b567183545e09_2112eb2f.jpg',
    cardBg: 'linear-gradient(155deg, #2d0d47 0%, #170826 56%, #4a0b2c 100%)',
    accentHex: '#e11d48',
    specLine: 'NO. 016  Black Pyramid · Claw Shield vs Ancient Spirits',
    move1Name: 'Claw Shield',
    move1Dmg: '120',
    move1Desc: 'Deflects magenta spirit bolts with golden gauntlet armor.',
    move2Name: 'Ancient Spirits',
    move2Dmg: '290',
    move2Desc: 'Transforms decayed mummy form into Mumm-Ra the Ever-Living.',
    lore: 'Crackling plasma arcs off the Sword of Omens before Mumm-Ra’s towering shadow.',
    weakness: '⚡×2',
    resistance: '🌑-30',
    retreat: 3,
  },
  {
    id: 'xmen-92-team',
    no: '017/041',
    name: 'X-MEN ’92 TAS',
    stage: 'LEGEND',
    hp: 340,
    typeLabel: 'LIGHTNING',
    typeIcon: '❌',
    src: '/assets/aistudio/efeab5cd3b0b06fe8cc607787db666a9_184b8c98.jpg',
    cardBg: 'linear-gradient(155deg, #2b1d04 0%, #102a5c 54%, #4f0912 100%)',
    accentHex: '#facc15',
    specLine: 'NO. 017  Danger Room · Xavier’s School  1992 Edition',
    move1Name: 'Optic Blast',
    move1Dmg: '130',
    move1Desc: 'Fires ruby quartz Cyclops beam across comic halftone dots.',
    move2Name: 'Uncanny Charge',
    move2Dmg: '270',
    move2Desc: 'Wolverine, Storm, Jean Grey, Rogue, Gambit & Beast strike together.',
    lore: 'Saturday-morning 90s X-Men charge across golden Ben-Day ink halftones.',
    weakness: '🌑×2',
    resistance: '⚡-30',
    retreat: 2,
  },
  {
    id: 'xmen-ross-painted',
    no: '018/041',
    name: 'UNCANNY PHOENIX',
    stage: 'VMAX',
    hp: 350,
    typeLabel: 'FIRE',
    typeIcon: '🔥',
    src: '/assets/aistudio/1dcc8b045ef46e661b678f7ab2f5c461_19f9f57e.jpg',
    cardBg: 'linear-gradient(155deg, #1b2238 0%, #0d1221 54%, #4a1e07 100%)',
    accentHex: '#fbbf24',
    specLine: 'NO. 018  Cerebro Painted Roster · Giant-Size Tribute',
    move1Name: 'Cosmic Phoenix',
    move1Dmg: '140',
    move1Desc: 'Engulfs deck borders in blazing yellow-gold comic aura.',
    move2Name: 'Fastball Special',
    move2Dmg: '280',
    move2Desc: 'Colossus hurls Wolverine alongside Nightcrawler and Storm.',
    lore: 'Hyper-detailed painted roster with Phoenix flames and Colossus steel.',
    weakness: '💧×2',
    resistance: '🌿-30',
    retreat: 2,
  },
  {
    id: 'matrix-neo-hand',
    no: '019/041',
    name: 'THE ONE · NEO',
    stage: 'LEGEND',
    hp: 360,
    typeLabel: 'CODE',
    typeIcon: '💚',
    src: '/assets/aistudio/3f18c7e8fcc58a323db5630e76228fc7_079d857d.jpg',
    cardBg: 'linear-gradient(155deg, #021c07 0%, #010a02 58%, #043810 100%)',
    accentHex: '#00ff41',
    specLine: 'NO. 019  Source Code Cascade · Construct Mainframe',
    move1Name: 'There Is No Spoon',
    move1Dmg: '120',
    move1Desc: 'Rewrites UI chrome into pure falling Matrix green code.',
    move2Name: 'Stop Bullets',
    move2Dmg: '300',
    move2Desc: 'Halts hostile signals in mid-air inside green digital rain.',
    lore: 'Neo parts a glowing green waterfall of living Matrix machine code.',
    weakness: '⚡×2',
    resistance: '🔮-30',
    retreat: 1,
  },
  {
    id: 'matrix-bullet-time',
    no: '020/041',
    name: 'BULLET TIME 1999',
    stage: 'VSTAR',
    hp: 330,
    typeLabel: 'CYBER',
    typeIcon: '🟩',
    src: '/assets/aistudio/5ea15c81930a54c51b6225bcf7c7456d_5f649c25.jpg',
    cardBg: 'linear-gradient(155deg, #02240a 0%, #010d04 58%, #064215 100%)',
    accentHex: '#00ff41',
    specLine: 'NO. 020  Red Pill Awakening · Simulation Cascade',
    move1Name: 'Operator Dial-In',
    move1Dmg: '110',
    move1Desc: 'Drops continuous cascading green Katakana across the deck.',
    move2Name: 'Zion Override',
    move2Dmg: '250',
    move2Desc: 'Dodges incoming fire at 12,000 frames per second.',
    lore: 'Green rain cascades behind Neo suspended mid-air above the rooftop.',
    weakness: '🔥×2',
    resistance: '🌿-30',
    retreat: 1,
  },
  {
    id: 'matrix-zion-crew',
    no: '021/041',
    name: 'MORPHEUS & TRINITY',
    stage: 'VMAX',
    hp: 340,
    typeLabel: 'CODE',
    typeIcon: '🕶️',
    src: '/assets/aistudio/32b89497de901fe3335cdb1f7b9d2778_851bac28.jpg',
    cardBg: 'linear-gradient(155deg, #031f09 0%, #010803 58%, #073b13 100%)',
    accentHex: '#22c55e',
    specLine: 'NO. 021  Nebuchadnezzar · Sentinel Alert',
    move1Name: 'Red Pill Choice',
    move1Dmg: '130',
    move1Desc: 'Unlocks deep Construct telemetry and green terminal scanlines.',
    move2Name: 'EMP Discharge',
    move2Dmg: '260',
    move2Desc: 'Disables pursuing Sentinels inside the sewer tunnels.',
    lore: 'Morpheus, Neo, Trinity, Agent Smith and looming Sentinels in green rain.',
    weakness: '⚡×2',
    resistance: '💧-30',
    retreat: 2,
  },
  {
    id: 'pirates-cursed-lantern',
    no: '022/041',
    name: 'CURSED CAPTAIN',
    stage: 'VMAX',
    hp: 320,
    typeLabel: 'ABYSS',
    typeIcon: '🏴‍☠️',
    src: '/assets/aistudio/a150a30638494f77369f8f937f35fff4_cd82fd9a.jpg',
    cardBg: 'linear-gradient(155deg, #061822 0%, #03090e 58%, #211507 100%)',
    accentHex: '#14b8a6',
    specLine: 'NO. 022  Locker of the Deep · Spectral Lantern',
    move1Name: 'Dead Man’s Lantern',
    move1Dmg: '120',
    move1Desc: 'Calls deep-sea anglerfish and glowing jellyfish to the surface.',
    move2Name: 'Kraken Grasp',
    move2Dmg: '250',
    move2Desc: 'Sends six giant tentacles surging up from midnight waters.',
    lore: 'Undead skeletal buccaneer raises an amber lantern above spectral sailors.',
    weakness: '⚡×2',
    resistance: '💧-30',
    retreat: 3,
  },
  {
    id: 'pirates-burning-galleon',
    no: '023/041',
    name: 'BURNING GALLEON',
    stage: 'LEGEND',
    hp: 350,
    typeLabel: 'WATER',
    typeIcon: '🐙',
    src: '/assets/aistudio/1b53152a1631be9df5e3cef18dee1e78_aa0c69e5.jpg',
    cardBg: 'linear-gradient(155deg, #071921 0%, #03080d 55%, #381408 100%)',
    accentHex: '#f59e0b',
    specLine: 'NO. 023  Kraken Tempest · Black Sails & Abyss',
    move1Name: 'Broadside Volley',
    move1Dmg: '140',
    move1Desc: 'Rattles stormy black waves with cannon smoke and sea spray.',
    move2Name: 'Leviathan Wake',
    move2Dmg: '280',
    move2Desc: 'Summons the Kraken and terrifying sea beasts onto the screen.',
    lore: 'A blazing man-of-war bears down through pitch-black storm swells.',
    weakness: '🌿×2',
    resistance: '🔥-30',
    retreat: 3,
  },
  {
    id: 'steampunk-viaduct',
    no: '024/041',
    name: 'BRASS LOCOMOTIVE',
    stage: 'VMAX',
    hp: 330,
    typeLabel: 'STEAM',
    typeIcon: '⚙️',
    src: '/assets/aistudio/8cdedfc74d681b60c1c6cab60dcf42fe_1ac69ff2.jpg',
    cardBg: 'linear-gradient(155deg, #2b180a 0%, #140c06 58%, #382210 100%)',
    accentHex: '#d97706',
    specLine: 'NO. 024  Victorian Viaduct · Boiler 185 PSI',
    move1Name: 'Piston Overdrive',
    move1Dmg: '120',
    move1Desc: 'Spins interlocking brass cogs and copper boiler valves.',
    move2Name: 'Exhaust Whiteout',
    move2Dmg: '240',
    move2Desc: 'Vents billowing pressurized live steam across every deck panel.',
    lore: 'Iron steam locomotive thunders across stone arches beneath clocktowers.',
    weakness: '💧×2',
    resistance: '⚙️-30',
    retreat: 3,
  },
  {
    id: 'steampunk-astrolabe',
    no: '025/041',
    name: 'BRASS ASTROLABE',
    stage: 'VSTAR',
    hp: 340,
    typeLabel: 'STEEL',
    typeIcon: '🕰️',
    src: '/assets/aistudio/18a258d2946d870eea519edc4ebbcc8a_bbe42278.jpg',
    cardBg: 'linear-gradient(155deg, #301c0b 0%, #170e07 58%, #42260d 100%)',
    accentHex: '#f59e0b',
    specLine: 'NO. 025  Aether Foundry · Clockwork Street',
    move1Name: 'Aether Dial',
    move1Dmg: '130',
    move1Desc: 'Calibrates live pressure gauges across copper pipework.',
    move2Name: 'Chrono Boiler',
    move2Dmg: '260',
    move2Desc: 'Drives massive street-level brass astrolabe rings with furnace heat.',
    lore: 'Towering brass armillary spheres whir beside steam-driven carriages.',
    weakness: '🔥×2',
    resistance: '⚙️-30',
    retreat: 3,
  },
  {
    id: 'steampunk-airships',
    no: '026/041',
    name: 'COPPER SKY DOCK',
    stage: 'LEGEND',
    hp: 360,
    typeLabel: 'STEAM',
    typeIcon: '🎈',
    src: '/assets/aistudio/f99a84106855c79a4e958a87d20ce8eb_c3a5be0c.jpg',
    cardBg: 'linear-gradient(155deg, #2e1909 0%, #140b05 56%, #45230b 100%)',
    accentHex: '#fbbf24',
    specLine: 'NO. 026  Dirigible Citadel · Copper Clockwork',
    move1Name: 'Valve Purge',
    move1Dmg: '140',
    move1Desc: 'Releases twin plumes of scalding steam from copper smokestacks.',
    move2Name: 'Clockwork Armada',
    move2Dmg: '290',
    move2Desc: 'Launches brass dirigibles from vaulted mechanical domes.',
    lore: 'Bronze cupolas, exposed giant gears and airships soar through boiler smoke.',
    weakness: '⚡×2',
    resistance: '⚙️-40',
    retreat: 2,
  },
  {
    id: 'alien-ufo-crash',
    no: '027/041',
    name: 'SAUCER CRASH',
    stage: 'STAGE 2',
    hp: 310,
    typeLabel: 'GRASS',
    typeIcon: '🛸',
    src: '/assets/aistudio/438593196e8386d0020e5e213acebede_424a3a18.jpg',
    cardBg: 'linear-gradient(155deg, #062b10 0%, #031208 58%, #102a1d 100%)',
    accentHex: '#39ff14',
    specLine: 'NO. 027  Moonlit Grainfield · Farmer Blaster & Cyber-Dog',
    move1Name: 'Lantern Flare',
    move1Dmg: '110',
    move1Desc: 'Reveals etched alien glyphs across burning saucer hull.',
    move2Name: 'Cornfield Defense',
    move2Dmg: '240',
    move2Desc: 'Fires plasma shell across lush night wheat beneath string lights.',
    lore: 'Farmer and cyber-hound confront a smoldering glyph-ringed saucer in tall stalks.',
    weakness: '🔥×2',
    resistance: '🌿-30',
    retreat: 2,
  },
  {
    id: 'alien-tractor-beam',
    no: '028/041',
    name: 'TRACTOR BEAM UFO',
    stage: 'VMAX',
    hp: 340,
    typeLabel: 'PSYCHIC',
    typeIcon: '🌽',
    src: '/assets/aistudio/81ff3022b85f5aee3c6f5600843edeb9_273abf60.jpg',
    cardBg: 'linear-gradient(155deg, #0b2b18 0%, #160c2b 58%, #041c13 100%)',
    accentHex: '#22c55e',
    specLine: 'NO. 028  Sector 4 Farmhouse · Violet Cosmos',
    move1Name: 'Crop Row Scan',
    move1Dmg: '120',
    move1Desc: 'Sweeps emerald tractor light over white barn and green furrows.',
    move2Name: 'Gravity Lift',
    move2Dmg: '260',
    move2Desc: 'Levitates farm equipment and audio tracks into the saucer core.',
    lore: 'A gleaming saucer hovers beneath purple nebulae locking its green beam on crop rows.',
    weakness: '⚡×2',
    resistance: '🌿-30',
    retreat: 2,
  },
  {
    id: 'alien-cornfield-abduction',
    no: '029/041',
    name: 'SPACESHOP CORNFIELD',
    stage: 'LEGEND',
    hp: 350,
    typeLabel: 'ALIEN',
    typeIcon: '👽',
    src: '/assets/aistudio/d6783dc306e6e081dbf3485ceed09517_defa1659.jpg',
    cardBg: 'linear-gradient(155deg, #072611 0%, #031108 58%, #102b18 100%)',
    accentHex: '#4ade80',
    specLine: 'NO. 029  Tall Stalks & Herd · Spaceshop Drop',
    move1Name: 'Crop Circle',
    move1Dmg: '130',
    move1Desc: 'Illuminates flooded night puddle amidst towering green cornstalks.',
    move2Name: 'Spaceshop Descent',
    move2Dmg: '270',
    move2Desc: 'Beams down an emerald visitor before stunned midnight livestock.',
    lore: 'Beneath tall corn leaves, a green tractor beam reflects off rainwater in the dark.',
    weakness: '🔥×2',
    resistance: '🌿-40',
    retreat: 2,
  },
  {
    id: 'dnd-polyhedral-table',
    no: '030/041',
    name: 'POLYHEDRAL POUCH',
    stage: 'LEGEND',
    hp: 360,
    typeLabel: 'D20',
    typeIcon: '🎲',
    src: '/assets/aistudio/db2f84aabfb7b938a0acbb88a886f14b_3edf27cf.jpg',
    cardBg: 'linear-gradient(155deg, #3b180e 0%, #1a0b06 58%, #47122a 100%)',
    accentHex: '#ec4899',
    specLine: 'NO. 030  Campaign Map · d20 · d12 · d10 · d8 · d6 · d4',
    move1Name: 'Crystal d4 Spike',
    move1Dmg: '90+',
    move1Desc: 'Spills glowing emerald & magenta polyhedral dice onto the tabletop.',
    move2Name: 'Natural Twenty',
    move2Dmg: '300',
    move2Desc: 'Critical roll doubles every track & campaign stat across the table.',
    lore: 'Weathered leather dice bag spills luminous polyhedral gems across parchment maps.',
    weakness: '🌑×2',
    resistance: '🔥-30',
    retreat: 2,
  },
  {
    id: 'dnd-red-dragon',
    no: '031/041',
    name: 'RED DRAGON INFERNO',
    stage: 'VMAX',
    hp: 370,
    typeLabel: 'FIRE',
    typeIcon: '🐉',
    src: '/assets/aistudio/35aec614d7932ac901bf75c620ca3d91_41acc18b.jpg',
    cardBg: 'linear-gradient(155deg, #4f0909 0%, #1c0505 58%, #42160a 100%)',
    accentHex: '#dc2626',
    specLine: 'NO. 031  Ancient Wyrm · Paladin · Sorceress',
    move1Name: 'Arcane Orbit',
    move1Dmg: '140',
    move1Desc: 'Shields the adventuring party from blazing dragonfire waves.',
    move2Name: 'Wyrm Breath DC 20',
    move2Dmg: '310',
    move2Desc: 'Unleashes scorching ember torrent across shattered crags.',
    lore: 'A colossal red dragon unleashes fire as heroes raise magic and steel below.',
    weakness: '💧×2',
    resistance: '🔥-40',
    retreat: 3,
  },
  {
    id: 'dnd-beholder-keep',
    no: '032/041',
    name: 'BEHOLDER’S KEEP',
    stage: 'VSTAR',
    hp: 340,
    typeLabel: 'DARK',
    typeIcon: '👁️',
    src: '/assets/aistudio/32dc35be6c2d477f8c8226629aebc007_fad33e71.jpg',
    cardBg: 'linear-gradient(155deg, #331909 0%, #140b06 58%, #421116 100%)',
    accentHex: '#d97706',
    specLine: 'NO. 032  Eye Tyrant · Stone Watchtower',
    move1Name: 'Antimagic Cone',
    move1Dmg: '120',
    move1Desc: 'Disrupts rival playlists with central Beholder glare.',
    move2Name: 'Eye Ray Barrage',
    move2Dmg: '270',
    move2Desc: 'Strikes fleeing adventurers while red meteors tear the sky.',
    lore: 'Painted adventurers dash down stone ruins pursued by a hovering ten-eyed Beholder.',
    weakness: '⚡×2',
    resistance: '🌑-30',
    retreat: 3,
  },
  {
    id: 'dnd-pixel-dragon',
    no: '033/041',
    name: 'PIXEL CRIMSON WYRM',
    stage: 'STAGE 2',
    hp: 330,
    typeLabel: 'RETRO',
    typeIcon: '🛡️',
    src: '/assets/aistudio/b49d70d1ac77b1fe5cd3c2a228e28537_9e3fbd5b.jpg',
    cardBg: 'linear-gradient(155deg, #16261e 0%, #09110d 58%, #450b0b 100%)',
    accentHex: '#ef4444',
    specLine: 'NO. 033  16-Bit Clearing · Full Moon Raid',
    move1Name: 'Party Formation',
    move1Dmg: '110',
    move1Desc: 'Grants Torch & Shield buff to rogue, cleric and knight.',
    move2Name: 'Boss Encounter',
    move2Dmg: '260',
    move2Desc: 'Rears towering crimson wings under the midnight forest moon.',
    lore: 'Crisp pixel-art heroes face a towering red dragon in a moonlit forest clearing.',
    weakness: '💧×2',
    resistance: '🌿-30',
    retreat: 2,
  },
  {
    id: 'dnd-roll-initiative',
    no: '034/041',
    name: 'ROLL INITIATIVE D20',
    stage: 'LEGEND',
    hp: 380,
    typeLabel: 'DICE',
    typeIcon: '⚔️',
    src: '/assets/aistudio/0d0a896ad0dda195be2917edd34a750c_3f2d0a5b.jpg',
    cardBg: 'linear-gradient(155deg, #361d09 0%, #140a05 58%, #4a1212 100%)',
    accentHex: '#fbbf24',
    specLine: 'NO. 034  Wizard · Barbarian · Paladin · Druid',
    move1Name: 'Advantage Roll',
    move1Dmg: '150',
    move1Desc: 'Tosses twin golden d20 dice across the carved tabletop tray.',
    move2Name: 'Critical Party Strike',
    move2Dmg: '320',
    move2Desc: 'Combines Wizard d6, Barbarian d4 & Paladin winged d20.',
    lore: 'An arsenal of jewel-crafted class polyhedral dice ready to roll initiative.',
    weakness: '🌑×2',
    resistance: '🔥-40',
    retreat: 2,
  },
  {
    id: 'dnd-dungeon-descent',
    no: '035/041',
    name: 'DUNGEON DESCENT',
    stage: 'STAGE 2',
    hp: 320,
    typeLabel: 'CRYPT',
    typeIcon: '🗝️',
    src: '/assets/aistudio/9d85482c25d19427f0fe58dc8d861488_bd2ccd41.jpg',
    cardBg: 'linear-gradient(155deg, #2e1508 0%, #110804 58%, #361b0b 100%)',
    accentHex: '#ea580c',
    specLine: 'NO. 035  Lantern Stairs · Hidden Beholder',
    move1Name: 'Perception Check',
    move1Dmg: '100',
    move1Desc: 'Lantern light reveals the Beholder lurking above hanging cages.',
    move2Name: 'Dungeon Delve',
    move2Dmg: '250',
    move2Desc: 'Guides torchbearers past ancient flagstones to hidden loot.',
    lore: 'Brave explorers creep down stone steps while an Eye Tyrant hovers in ambush.',
    weakness: '⚡×2',
    resistance: '🌑-30',
    retreat: 3,
  },
  {
    id: 'templar-rainy-hearth',
    no: '036/041',
    name: 'TEMPLAR HEARTH',
    stage: 'STAGE 2',
    hp: 340,
    typeLabel: 'STEEL',
    typeIcon: '🛡️',
    src: '/assets/aistudio/830b6be98a5075e2ff36e93fea0cdb9c_37e18bcd.jpg',
    cardBg: 'linear-gradient(155deg, #1b222d 0%, #0b0e14 58%, #3b1315 100%)',
    accentHex: '#b91c1c',
    specLine: 'NO. 036  Plate Helm · Broadsword · Rainy Spire',
    move1Name: 'Iron Vigil',
    move1Dmg: '110',
    move1Desc: 'Rests in full Templar plate beside hearth embers as rain batters the spire.',
    move2Name: 'Crusader Shieldwall',
    move2Dmg: '240',
    move2Desc: 'Blocks 80 incoming damage during wet stormy siege turns.',
    lore: 'An exhausted plate-armored knight grips his hilt beside the hearth while storm rain falls.',
    weakness: '⚡×2',
    resistance: '💧-30',
    retreat: 3,
  },
  {
    id: 'templar-moon-chapel',
    no: '037/041',
    name: 'ABBEY OF MIST',
    stage: 'VSTAR',
    hp: 330,
    typeLabel: 'DARK',
    typeIcon: '⛪',
    src: '/assets/aistudio/ba0a0ead75b6f37c0600390e1a363113_43fe993a.jpg',
    cardBg: 'linear-gradient(155deg, #0f1c2e 0%, #060b14 58%, #15251e 100%)',
    accentHex: '#64748b',
    specLine: 'NO. 037  Moss Sanctuary · Pale Moon · Fog Trail',
    move1Name: 'Cloaked Pilgrimage',
    move1Dmg: '100',
    move1Desc: 'Slips unseen through knee-deep hill mist under full lunar light.',
    move2Name: 'Bell of Ash',
    move2Dmg: '260',
    move2Desc: 'Tolls the ruined abbey arch, drenching the battlefield in cold storm rain.',
    lore: 'A hooded traveler ascends a wet muddy path toward a solitary stone chapel.',
    weakness: '🔥×2',
    resistance: '🌑-40',
    retreat: 2,
  },
  {
    id: 'templar-watchtower',
    no: '038/041',
    name: 'CRUSADER CITADEL',
    stage: 'LEGEND',
    hp: 360,
    typeLabel: 'STEEL',
    typeIcon: '⚔️',
    src: '/assets/aistudio/7489f3f048a5d3af848e8bd3960baa59_1945018c.jpg',
    cardBg: 'linear-gradient(155deg, #0e1726 0%, #060a12 58%, #2e1114 100%)',
    accentHex: '#dc2626',
    specLine: 'NO. 038  Mounted Knight · Templar Cross Shield',
    move1Name: 'Cross Shield Bash',
    move1Dmg: '130',
    move1Desc: 'Slams a battle-scarred iron kite shield against besieging foes.',
    move2Name: 'Night Siege Charge',
    move2Dmg: '290',
    move2Desc: 'Gallops across rainy highlands to reclaim the stone watchtower.',
    lore: 'Mounted in crimson cloak and scarred cross shield before an ancient hilltop keep.',
    weakness: '⚡×2',
    resistance: '🌿-30',
    retreat: 3,
  },
  {
    id: 'witcher-white-wolf',
    no: '039/041',
    name: 'WHITE WOLF GERALT',
    stage: 'VMAX',
    hp: 390,
    typeLabel: 'WOLF',
    typeIcon: '🐺',
    src: '/assets/aistudio/4603b71ef5f687b42944a02b439b1f0a_2ce443d7.jpg',
    cardBg: 'linear-gradient(155deg, #1f1a14 0%, #09090c 58%, #36130d 100%)',
    accentHex: '#f59e0b',
    specLine: 'NO. 039  School of the Wolf · Silver Blade · Contract',
    move1Name: 'Aard Shockwave',
    move1Dmg: '140',
    move1Desc: 'Blasts monsters backward while Wolf Medallion hums near magic.',
    move2Name: 'Silver & Swallow',
    move2Dmg: '320',
    move2Desc: 'Cleaves trophy beasts with rune-etched silver amid drifting embers.',
    lore: 'Amber cat-eyes scan the dark with studded chainmail, twin blades, and trophy.',
    weakness: '🧠×2',
    resistance: '🌑-40',
    retreat: 2,
  },
  {
    id: 'witcher-night-campfire',
    no: '040/041',
    name: 'IGNI MEDITATION',
    stage: 'STAGE 2',
    hp: 350,
    typeLabel: 'FIRE',
    typeIcon: '🜂',
    src: '/assets/aistudio/3b841c98df4d2948c8cf742f5da95ae1_17bcd78d.jpg',
    cardBg: 'linear-gradient(155deg, #0b1b26 0%, #080b12 58%, #471808 100%)',
    accentHex: '#ea580c',
    specLine: 'NO. 040  Twin Swords · Alchemy Camp · Kaer Morhen',
    move1Name: 'Quen Barrier',
    move1Dmg: '110',
    move1Desc: 'Forms an amber runic ward that absorbs 100 damage beside the fire.',
    move2Name: 'Ignite Blade',
    move2Dmg: '270',
    move2Desc: 'Channels sparkling Igni flames over steel and silver blades before dawn.',
    lore: 'Crouched in silent meditation beside camp embers, dual hilts glinting under stars.',
    weakness: '💧×2',
    resistance: '🔥-40',
    retreat: 2,
  },
  {
    id: 'witcher-conjunction',
    no: '041/041',
    name: 'CONJUNCTION TRIO',
    stage: 'LEGEND',
    hp: 400,
    typeLabel: 'CHAOS',
    typeIcon: '✨',
    src: '/assets/aistudio/6e6542f7cb51f99a262f70b16739604a_275146eb.jpg',
    cardBg: 'linear-gradient(155deg, #191326 0%, #090a0f 58%, #3b1315 100%)',
    accentHex: '#a855f7',
    specLine: 'NO. 041  Geralt · Yennefer · Triss · Ciri  Destiny',
    move1Name: 'Yennefer’s Chaos',
    move1Dmg: '160',
    move1Desc: 'Combines violet Chaos ribbons with Triss’s roaring Igni fire.',
    move2Name: 'Elder Blood & Silver',
    move2Dmg: '350',
    move2Desc: 'Unleashes Ciri’s cyan surge alongside Geralt’s drawn Witcher blade.',
    lore: 'Before the spiked monolith under a pale moon, destiny binds sword and Chaos.',
    weakness: '🌑×2',
    resistance: '🔥-30',
    retreat: 3,
  },
];

const WL_INTERVALS = [
  { ms: 7200000, label: 'Every 2 hours' },
  { ms: 10800000, label: 'Every 3 hours' },
  { ms: 14400000, label: 'Every 4 hours' },
  { ms: 18000000, label: 'Every 5 hours' },
  { ms: 86400000, label: 'Every 1 day' },
  { ms: 172800000, label: 'Every 2 days' },
  { ms: 259200000, label: 'Every 3 days' },
];

export const WallpapersPage: React.FC<WallpapersPageProps> = ({
  open,
  activeBackdropOverride,
  onClose,
  onSetWallBlob,
  onSelectBackdropUrl,
  onToast,
}) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [list, setList] = useState<WallpaperThumb[]>([]);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [selMode, setSelMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [playlists, setPlaylists] = useState<WallpaperPlaylist[]>([]);
  const [activePl, setActivePl] = useState('');
  const [intervalMs, setIntervalMs] = useState(7200000);
  const [nextAt, setNextAt] = useState(0);
  const [newPlName, setNewPlName] = useState('');
  const [creatingPl, setCreatingPl] = useState(false);

  const loadAll = async () => {
    const items = await getAllWallpaperThumbs();
    setList(items);
    const urls: Record<string, string> = {};
    items.forEach((it) => {
      if (it.thumb) urls[it.id] = URL.createObjectURL(it.thumb);
    });
    setThumbUrls((prev) => {
      Object.values(prev).forEach((u) => URL.revokeObjectURL(u));
      return urls;
    });

    const auto = await getWallpaperAutoMeta();
    if (auto) {
      setPlaylists(Array.isArray(auto.playlists) ? auto.playlists : []);
      setActivePl(auto.active || '');
      setIntervalMs(auto.interval || 7200000);
      setNextAt(auto.nextAt || 0);
    }
  };

  useEffect(() => {
    if (open) loadAll();
  }, [open]);

  if (!open) return null;

  const makeThumb = async (file: File) => {
    let bm: ImageBitmap | HTMLImageElement | null = null;
    try {
      bm = await createImageBitmap(file);
    } catch {
      bm = await new Promise<HTMLImageElement | null>((res) => {
        const u = URL.createObjectURL(file);
        const im = new Image();
        im.onload = () => {
          URL.revokeObjectURL(u);
          res(im);
        };
        im.onerror = () => {
          URL.revokeObjectURL(u);
          res(null);
        };
        im.src = u;
      });
    }
    if (!bm) return { thumb: null, w: 0, h: 0 };
    const w = bm instanceof ImageBitmap ? bm.width : bm.naturalWidth;
    const h = bm instanceof ImageBitmap ? bm.height : bm.naturalHeight;
    const scale = Math.min(1, 360 / Math.max(w, h));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * scale));
    c.height = Math.max(1, Math.round(h * scale));
    c.getContext('2d')?.drawImage(bm, 0, 0, c.width, c.height);
    if (bm instanceof ImageBitmap) bm.close();
    const thumb = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/jpeg', 0.8));
    return { thumb, w, h };
  };

  const handleImport = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const arr = Array.from(files).filter(
      (f) => /^image\//.test(f.type) || /\.(gif|webp|avif|png|jpe?g|bmp)$/i.test(f.name)
    );
    if (!arr.length) {
      onToast('No valid images selected');
      return;
    }
    let ok = 0;
    const t0 = Date.now();
    for (let i = 0; i < arr.length; i++) {
      const f = arr[i];
      try {
        const { thumb, w, h } = await makeThumb(f);
        const id = `${t0}-${i}-${Math.random().toString(36).slice(2, 7)}`;
        await saveWallpaperRecord(id, new Blob([f], { type: f.type || 'image/jpeg' }), {
          id,
          name: f.name || `wallpaper-${i}`,
          type: f.type || 'image/jpeg',
          size: f.size,
          w,
          h,
          thumb,
          added: t0 + i,
        });
        ok++;
      } catch {
        onToast('Storage limit reached while saving wallpaper');
        break;
      }
    }
    onToast(`Added ${ok} wallpaper card${ok === 1 ? '' : 's'}`);
    loadAll();
  };

  const applyWallpaperId = async (id: string) => {
    const blob = await getWallpaperBlob(id);
    if (!blob) {
      onToast('Wallpaper blob not found');
      return;
    }
    onSetWallBlob(blob);
    await putMeta('wall', blob);
    onToast('Wallpaper card equipped');
  };

  const applyUploadedCard = async (card: PokemonCardMeta) => {
    onSetWallBlob(null);
    await putMeta('wall', null);
    onSelectBackdropUrl(card.src);
    onToast(`${card.name} equipped as live wallpaper`);
  };

  const clearCustomWallpaper = async () => {
    onSetWallBlob(null);
    await putMeta('wall', null);
    onSelectBackdropUrl('');
    onToast('Restored 4K AI theme scene');
  };

  const toggleSel = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleDeleteSelected = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    await deleteWallpapers(ids);
    setSelected(new Set());
    setSelMode(false);
    onToast(`Deleted ${ids.length} wallpaper${ids.length > 1 ? 's' : ''}`);
    loadAll();
  };

  const createPlaylist = async () => {
    const ids = Array.from(selected);
    if (!ids.length) {
      onToast('Select custom wallpapers first');
      return;
    }
    const name = newPlName.trim() || 'My 4K Wallpapers';
    const pl: WallpaperPlaylist = { id: 'wp-' + Date.now(), name, ids };
    const nextPls = [...playlists, pl];
    setPlaylists(nextPls);
    setActivePl(pl.id);
    setCreatingPl(false);
    setNewPlName('');
    setSelMode(false);
    setSelected(new Set());
    await putWallpaperAutoMeta({
      playlists: nextPls,
      active: pl.id,
      interval: intervalMs,
      nextAt,
      lastId: '',
    });
    onToast('Wallpaper playlist created');
  };

  const rotateNow = async () => {
    const pl = playlists.find((x) => x.id === activePl);
    if (!pl || !pl.ids.length) {
      const pick = UPLOADED_POKEMON_CARDS[Math.floor(Math.random() * UPLOADED_POKEMON_CARDS.length)];
      await applyUploadedCard(pick);
      return;
    }
    const nextId = pl.ids[Math.floor(Math.random() * pl.ids.length)];
    await applyWallpaperId(nextId);
    const nAt = Date.now() + intervalMs;
    setNextAt(nAt);
    await putWallpaperAutoMeta({
      playlists,
      active: activePl,
      interval: intervalMs,
      nextAt: nAt,
      lastId: nextId,
    });
  };

  return (
    <div className="fixed inset-0 z-30 flex flex-col overflow-hidden bg-black/65 backdrop-blur-2xl text-[var(--fg)]">
      <div className="shrink-0 z-20 flex items-center gap-3 px-4 py-3 bg-black/75 backdrop-blur-xl border-b border-white/10">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/10"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">Wallpapers &amp; Collectible Pokémon Deck</h1>
          <p className="text-xs text-[var(--mu)] truncate">
            {UPLOADED_POKEMON_CARDS.length} uploaded picture cards · {list.length} custom · tap any card to equip
          </p>
        </div>
        <button
          type="button"
          onClick={clearCustomWallpaper}
          className="min-h-[40px] px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold whitespace-nowrap"
        >
          Use 4K Theme Scene
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="min-h-[44px] min-w-[44px] rounded-xl bg-[var(--or)] text-white flex items-center justify-center shrink-0"
          title="Import custom wallpapers"
        >
          <Plus className="w-5 h-5" />
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,.gif,.webp,.avif"
          className="hidden"
          onChange={(e) => {
            handleImport(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-auto touch-pan-y">
        <div className="max-w-6xl mx-auto p-4 space-y-6 pb-28">
        {/* Auto rotation control box */}
        <div className="mat-surface rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="font-bold text-sm">Wallpaper Deck &amp; Auto Rotation</div>
            <button
              type="button"
              onClick={() => {
                const pick =
                  UPLOADED_POKEMON_CARDS[Math.floor(Math.random() * UPLOADED_POKEMON_CARDS.length)];
                applyUploadedCard(pick);
              }}
              className="min-h-[38px] px-3 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-200 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-500/30"
            >
              <Shuffle className="w-3.5 h-3.5" /> Draw Random Card
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <select
              value={activePl}
              onChange={async (e) => {
                const v = e.target.value;
                setActivePl(v);
                await putWallpaperAutoMeta({
                  playlists,
                  active: v,
                  interval: intervalMs,
                  nextAt: 0,
                  lastId: '',
                });
              }}
              className="min-h-[44px] px-3 rounded-xl bg-black/50 border border-white/15 text-sm"
            >
              <option value="">No playlist selected</option>
              {playlists.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.ids.length})
                </option>
              ))}
            </select>
            <select
              value={intervalMs}
              onChange={async (e) => {
                const ms = Number(e.target.value);
                setIntervalMs(ms);
                const nAt = Date.now() + ms;
                setNextAt(nAt);
                await putWallpaperAutoMeta({
                  playlists,
                  active: activePl,
                  interval: ms,
                  nextAt: nAt,
                  lastId: '',
                });
              }}
              className="min-h-[44px] px-3 rounded-xl bg-black/50 border border-white/15 text-sm"
            >
              {WL_INTERVALS.map((iv) => (
                <option key={iv.ms} value={iv.ms}>
                  {iv.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (!selected.size) {
                  setSelMode(true);
                  onToast('Tap your imported cards below to select them for a playlist');
                } else {
                  setCreatingPl(true);
                }
              }}
              className="min-h-[42px] px-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create Playlist from Selected
            </button>
            <button
              type="button"
              onClick={rotateNow}
              className="min-h-[42px] px-3.5 rounded-xl bg-[var(--or)] text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" /> Rotate Now
            </button>
          </div>

          {creatingPl && (
            <div className="flex gap-2 items-center pt-1">
              <input
                value={newPlName}
                onChange={(e) => setNewPlName(e.target.value)}
                placeholder="Playlist name..."
                className="flex-1 min-h-[42px] px-3 rounded-xl bg-black/50 border border-white/15 text-sm"
              />
              <button
                type="button"
                onClick={createPlaylist}
                className="min-h-[42px] px-4 rounded-xl bg-[var(--or)] text-white text-xs font-bold"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setCreatingPl(false)}
                className="min-h-[42px] min-w-[42px] rounded-xl bg-white/10 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Section 1: Uploaded Pictures as Collectible Holographic Pokémon Cards */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-amber-200">
                Uploaded Pictures — Pokémon Holo Card Collection ({UPLOADED_POKEMON_CARDS.length})
              </h2>
            </div>
            <span className="text-[11px] text-[var(--mu)]">
              Tap any collectible card to apply it as your live deck wallpaper
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {UPLOADED_POKEMON_CARDS.map((card) => {
              const isEquipped = activeBackdropOverride === card.src;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => applyUploadedCard(card)}
                  className={`poke-card group relative text-left rounded-[18px] p-[7px] shadow-2xl transition-all ${
                    isEquipped
                      ? 'ring-2 ring-cyan-300 shadow-[0_0_28px_rgba(56,224,255,0.45)]'
                      : 'hover:shadow-[0_18px_36px_rgba(0,0,0,0.75)]'
                  }`}
                  style={{
                    background: isEquipped
                      ? 'linear-gradient(135deg, #fde047 0%, #38e0ff 50%, #facc15 100%)'
                      : 'linear-gradient(135deg, #f7d559 0%, #ca981f 48%, #f5da71 100%)',
                  }}
                >
                  {/* Inner Card Body */}
                  <div
                    className="relative overflow-hidden rounded-[12px] p-2.5 flex flex-col justify-between h-full border border-black/45"
                    style={{ background: card.cardBg }}
                  >
                    {/* Holographic Foil Overlay + Sweep Bar */}
                    <div className="poke-foil pointer-events-none absolute inset-0 z-10" />
                    <div className="poke-sheen-bar pointer-events-none absolute -inset-y-10 -left-16 w-20 z-20" />

                    {/* Top Pokémon Header: Stage, Name, HP & Type Orb */}
                    <div className="relative z-20 flex items-center justify-between gap-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="px-1.5 py-0.5 rounded bg-gradient-to-b from-zinc-200 to-zinc-400 text-[9px] font-black uppercase tracking-tight text-zinc-900 border border-black/40 shrink-0 shadow-sm">
                          {card.stage}
                        </span>
                        <span className="text-xs font-black tracking-tight text-white truncate drop-shadow">
                          {card.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[9px] font-bold text-amber-200">HP</span>
                        <span className="text-sm font-black text-white leading-none">{card.hp}</span>
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] border border-white/60 shadow-inner"
                          style={{ backgroundColor: `${card.accentHex}55` }}
                          title={card.typeLabel}
                        >
                          {card.typeIcon}
                        </span>
                      </div>
                    </div>

                    {/* Art Box Frame */}
                    <div className="relative z-20 rounded-md p-[3px] bg-gradient-to-br from-[#fae078] via-[#b88918] to-[#f8df74] shadow-md">
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[3px] bg-black">
                        <img
                          src={card.src}
                          alt={card.name}
                          className="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        {isEquipped && (
                          <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded bg-cyan-400 text-slate-950 text-[9px] font-black uppercase tracking-wider shadow">
                            EQUIPPED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Gold Spec Strip */}
                    <div className="relative z-20 mt-1 px-1.5 py-0.5 rounded bg-gradient-to-r from-[#f7d863] via-[#e2b63a] to-[#f5d25c] text-[8.5px] font-bold text-zinc-950 text-center truncate border border-black/30">
                      {card.specLine}
                    </div>

                    {/* Attacks / Features Block */}
                    <div className="relative z-20 mt-2 space-y-1.5 flex-1">
                      <div className="border-b border-white/15 pb-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-extrabold text-white flex items-center gap-1 truncate">
                            <span className="text-[10px]">{card.typeIcon}</span>
                            {card.move1Name}
                          </span>
                          <span className="text-xs font-black text-amber-200 shrink-0">
                            {card.move1Dmg}
                          </span>
                        </div>
                        <p className="text-[9.5px] leading-snug text-white/80 line-clamp-2 mt-0.5">
                          {card.move1Desc}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-extrabold text-white flex items-center gap-1 truncate">
                            <span className="text-[10px]">{card.typeIcon}✦</span>
                            {card.move2Name}
                          </span>
                          <span className="text-xs font-black text-amber-200 shrink-0">
                            {card.move2Dmg}
                          </span>
                        </div>
                        <p className="text-[9.5px] leading-snug text-white/80 line-clamp-2 mt-0.5">
                          {card.move2Desc}
                        </p>
                      </div>
                    </div>

                    {/* Weakness / Resistance / Retreat & Lore Footer */}
                    <div className="relative z-20 mt-2 pt-1.5 border-t border-white/20 space-y-1">
                      <div className="flex items-center justify-between text-[8.5px] font-bold text-white/85">
                        <span>weakness {card.weakness}</span>
                        <span>resist {card.resistance}</span>
                        <span>retreat {'⭐'.repeat(card.retreat)}</span>
                      </div>
                      <div className="px-1.5 py-0.5 rounded bg-black/35 border border-white/15 text-[8.5px] italic text-white/85 line-clamp-1">
                        {card.lore}
                      </div>
                      <div className="flex items-center justify-between text-[8px] font-mono text-amber-200/85 pt-0.5">
                        <span>#XI COLLECTION · {card.no}</span>
                        <span className="font-bold uppercase">
                          {isEquipped ? '★ ACTIVE' : 'TAP TO EQUIP'}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 2: Custom User-Imported Wallpapers (Also Rendered as Pokémon Cards) */}
        <section className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--pe)]">
              {selMode
                ? `Custom Deck — ${selected.size} selected`
                : `Your Custom Wallpaper Cards (${list.length})`}
            </div>
            {list.length > 0 && (
              <div className="flex gap-2">
                {selMode ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelected(new Set(list.map((x) => x.id)))}
                      className="min-h-[40px] px-3 rounded-xl bg-white/10 text-xs font-semibold"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      className="min-h-[40px] px-3 rounded-xl bg-red-500/20 text-red-300 text-xs font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete ({selected.size})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelMode(false);
                        setSelected(new Set());
                      }}
                      className="min-h-[40px] px-3 rounded-xl bg-white/10 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        applyWallpaperId(list[Math.floor(Math.random() * list.length)].id)
                      }
                      className="min-h-[40px] px-3 rounded-xl bg-white/10 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Shuffle className="w-3.5 h-3.5" /> Random Custom
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelMode(true)}
                      className="min-h-[40px] px-3 rounded-xl bg-white/10 text-xs font-semibold"
                    >
                      Select
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {list.length === 0 ? (
            <div className="mat-surface rounded-2xl p-8 text-center space-y-2.5">
              <ImagePlus className="w-9 h-9 mx-auto text-[var(--mu)]" />
              <div className="font-bold text-sm">Import More Custom Wallpaper Cards</div>
              <p className="text-xs text-[var(--mu)] max-w-md mx-auto">
                Tap + above to mint any 4K image or animated GIF into your own holographic Pokémon
                wallpaper card deck.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {list.map((m, idx) => {
                const isSel = selected.has(m.id);
                const is4k = Math.max(m.w, m.h) >= 3840;
                const cleanTitle = m.name.replace(/\.[^.]+$/, '').toUpperCase() || `CARD ${idx + 1}`;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      if (selMode) toggleSel(m.id);
                      else applyWallpaperId(m.id);
                    }}
                    className={`poke-card group relative text-left rounded-[18px] p-[7px] transition-all ${
                      isSel ? 'ring-2 ring-[var(--or)]' : ''
                    }`}
                    style={{
                      background:
                        'linear-gradient(135deg, #f7d559 0%, #ca981f 48%, #f5da71 100%)',
                    }}
                  >
                    <div
                      className="relative overflow-hidden rounded-[12px] p-2.5 flex flex-col justify-between h-full border border-black/45"
                      style={{
                        background:
                          'linear-gradient(155deg, #10203d 0%, #0d1328 55%, #1d1233 100%)',
                      }}
                    >
                      <div className="poke-foil pointer-events-none absolute inset-0 z-10" />
                      <div className="relative z-20 flex items-center justify-between gap-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="px-1.5 py-0.5 rounded bg-zinc-200 text-[9px] font-black text-zinc-900">
                            CUSTOM
                          </span>
                          <span className="text-xs font-black text-white truncate">{cleanTitle}</span>
                        </div>
                        <span className="text-xs font-black text-amber-200 shrink-0">
                          HP {is4k ? 300 : 240}
                        </span>
                      </div>

                      <div className="relative z-20 rounded-md p-[3px] bg-gradient-to-br from-[#fae078] to-[#b88918]">
                        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[3px] bg-black">
                          {thumbUrls[m.id] ? (
                            <img
                              src={thumbUrls[m.id]}
                              alt={m.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-white/5 flex items-center justify-center">
                              🖼
                            </div>
                          )}
                          {isSel && (
                            <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[var(--or)] text-white flex items-center justify-center">
                              <Check className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="relative z-20 mt-1 px-1.5 py-0.5 rounded bg-[#f5d25c] text-[8.5px] font-bold text-zinc-950 text-center truncate">
                        {/gif/i.test(m.type) ? 'ANIMATED GIF' : is4k ? '4K ULTRA HOLO' : 'CUSTOM HOLO'} ·{' '}
                        {formatSize(m.size)}
                      </div>

                      <div className="relative z-20 mt-2 text-[9.5px] text-white/80 flex items-center justify-between">
                        <span>{m.w && m.h ? `${m.w}×${m.h}` : 'Custom Art'}</span>
                        <span className="font-bold text-amber-200">TAP TO EQUIP</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
        </div>
      </div>
    </div>
  );
};
