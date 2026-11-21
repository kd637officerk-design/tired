import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  FileText,
  Heart,
  Image as ImageIcon,
  MessageSquare,
  MoreVertical,
  Music2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Sliders,
  Volume2,
} from 'lucide-react';
import { fetchOnlineLyrics, formatTime, parseLRC } from '../utils/mediaParsers';
import { Track } from '../types/player';

interface NowPlayingViewProps {
  open: boolean;
  track: Track | null;
  coverUrl?: string;
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isFav: boolean;
  playMode: 'seq' | 'all' | 'one' | 'shuf';
  onClose: () => void;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (sec: number) => void;
  onVolumeChange: (v: number) => void;
  onToggleFav: () => void;
  onCycleMode: () => void;
  onOpenOptions: () => void;
  onOpenMore: () => void;
  onOpenNotes: () => void;
  onOpenArtViewer: () => void;
  onEditLyrics: () => void;
  onSaveAutoLyrics: (trackId: number, lyr: string) => void;
  onToast: (msg: string) => void;
}

export const NowPlayingView: React.FC<NowPlayingViewProps> = ({
  open,
  track,
  coverUrl,
  playing,
  currentTime,
  duration,
  volume,
  isFav,
  playMode,
  onClose,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleFav,
  onCycleMode,
  onOpenOptions,
  onOpenMore,
  onOpenNotes,
  onOpenArtViewer,
  onEditLyrics,
  onSaveAutoLyrics,
  onToast,
}) => {
  const [showLyrics, setShowLyrics] = useState(false);
  const [uiHidden, setUiHidden] = useState(false);
  const [searchingLyrics, setSearchingLyrics] = useState(false);
  const lyrBoxRef = useRef<HTMLDivElement | null>(null);
  const swipeStart = useRef<{ y: number; t: number } | null>(null);

  const lrcLines = useMemo(() => parseLRC(track?.lyr), [track?.lyr]);

  const activeLrcIndex = useMemo(() => {
    if (!lrcLines) return -1;
    const ct = currentTime + 0.15;
    let idx = -1;
    for (let i = 0; i < lrcLines.length; i++) {
      if (lrcLines[i].t <= ct) idx = i;
      else break;
    }
    return idx;
  }, [lrcLines, currentTime]);

  useEffect(() => {
    if (!showLyrics || activeLrcIndex < 0 || !lyrBoxRef.current) return;
    const el = lyrBoxRef.current.querySelector(`[data-lrc-idx="${activeLrcIndex}"]`) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [activeLrcIndex, showLyrics]);

  useEffect(() => {
    if (!open) {
      setUiHidden(false);
    }
  }, [open]);

  if (!open) return null;

  const pct = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const handleFindOnline = async () => {
    if (!track) return;
    if (!track.artist?.trim()) {
      onToast('Add the artist name in Edit tags first');
      return;
    }
    setSearchingLyrics(true);
    const found = await fetchOnlineLyrics(track.artist, track.name);
    setSearchingLyrics(false);
    if (found) {
      onSaveAutoLyrics(track.id, found);
      onToast('Lyrics loaded');
    } else {
      onToast('No online match found — tap Edit lyrics to paste');
    }
  };

  const renderModeIcon = () => {
    if (playMode === 'one') return <Repeat1 className="w-5 h-5" />;
    if (playMode === 'shuf') return <Shuffle className="w-5 h-5" />;
    return <Repeat className={`w-5 h-5 ${playMode === 'all' ? 'text-[var(--or)]' : 'opacity-65'}`} />;
  };

  return (
    <div
      className="fixed inset-0 z-40 overflow-hidden bg-black/80 backdrop-blur-3xl text-white flex flex-col"
      onTouchStart={(e) => {
        if ((e.target as HTMLElement).closest('button,input')) return;
        if (showLyrics && (lyrBoxRef.current?.scrollTop ?? 0) > 2) return;
        swipeStart.current = { y: e.touches[0].clientY, t: Date.now() };
      }}
      onTouchEnd={(e) => {
        if (!swipeStart.current) return;
        const dy = e.changedTouches[0].clientY - swipeStart.current.y;
        const dt = Date.now() - swipeStart.current.t;
        swipeStart.current = null;
        if (dy > 110 && dt < 500) onClose();
      }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button,input,a')) return;
        if (!showLyrics) setUiHidden((prev) => !prev);
      }}
    >
      {/* Blurred full-bleed ambient album background */}
      {coverUrl && (
        <div
          className="pointer-events-none absolute -inset-12 bg-cover bg-center blur-3xl opacity-45 scale-110 transition-all duration-700"
          style={{ backgroundImage: `url("${coverUrl}")` }}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/90" />

      {/* Top Navigation */}
      <div
        className={`relative z-10 shrink-0 flex items-center justify-between px-4 pt-4 pb-2 transition-opacity duration-200 ${
          uiHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/10"
          aria-label="Minimize Now Playing"
        >
          <ChevronDown className="w-7 h-7" />
        </button>
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
          {track?.kind === 'book' ? 'Audiobook Deck' : 'Now Playing'}
        </div>
        <button
          type="button"
          onClick={onOpenMore}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/10"
          aria-label="Track options"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content (2-column on Desktop) */}
      <div className="relative z-10 flex-1 min-h-0 overflow-y-auto touch-pan-y max-w-6xl w-full mx-auto px-5 pb-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
        {/* Artwork or Lyrics Panel */}
        <div className="lg:col-span-6 w-full flex flex-col items-center justify-center min-h-0 h-full max-h-[52vh] lg:max-h-[72vh]">
          {showLyrics ? (
            <div
              ref={lyrBoxRef}
              onClick={(e) => e.stopPropagation()}
              className="w-full h-full overflow-y-auto touch-pan-y mat-panel rounded-2xl p-5 space-y-3"
            >
              <div className="flex flex-wrap gap-2 pb-2 border-b border-white/10">
                <button
                  type="button"
                  onClick={onEditLyrics}
                  className="min-h-[40px] px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold"
                >
                  ✎ {track?.lyr ? 'Edit Lyrics' : 'Add Lyrics'}
                </button>
                {track?.kind === 'audio' && (
                  <button
                    type="button"
                    onClick={handleFindOnline}
                    disabled={searchingLyrics}
                    className="min-h-[40px] px-3 rounded-xl bg-[var(--or)]/20 border border-[var(--or)]/40 text-xs font-bold text-[var(--pe)]"
                  >
                    {searchingLyrics ? 'Searching...' : '🔎 Find Online'}
                  </button>
                )}
              </div>

              {lrcLines ? (
                <div className="space-y-2.5 py-2">
                  {lrcLines.map((line, i) => (
                    <button
                      key={i}
                      type="button"
                      data-lrc-idx={i}
                      onClick={() => onSeek(Math.max(0, line.t))}
                      className={`block w-full text-left text-lg leading-relaxed transition-all ${
                        i === activeLrcIndex
                          ? 'text-[var(--pe)] font-bold scale-[1.01]'
                          : 'text-white/55 hover:text-white/85'
                      }`}
                    >
                      {line.s || '♪'}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-base leading-relaxed text-white/85">
                  {track?.lyr?.trim() || 'No lyrics added for this track yet.'}
                </div>
              )}
            </div>
          ) : (
            <div className="relative aspect-square w-full max-w-[380px] lg:max-w-[460px] rounded-2xl overflow-hidden mat-panel flex items-center justify-center shadow-2xl">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={track?.name || 'Cover art'}
                  className="h-full w-full object-contain bg-black/40"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-white/40">
                  <Music2 className="w-20 h-20 stroke-[1.2]" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transport & Metadata Column */}
        <div
          className={`lg:col-span-6 w-full flex flex-col justify-center space-y-5 transition-opacity duration-200 ${
            uiHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--pe)] break-words">
                {track ? track.name : 'Nothing playing'}
              </h2>
              <p className="text-base md:text-lg text-white/70 truncate mt-1">
                {track ? track.artist || (track.kind === 'book' ? 'Audiobook' : 'Local Track') : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleFav}
              className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl hover:bg-white/10 shrink-0"
              aria-label="Favorite"
            >
              <Heart
                className={`w-6 h-6 transition-colors ${
                  isFav ? 'fill-[var(--or)] text-[var(--or)]' : 'text-white/65'
                }`}
              />
            </button>
          </div>

          {/* Seekbar */}
          <div className="space-y-1.5">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={Math.min(currentTime, duration || 100)}
              onChange={(e) => onSeek(Number(e.target.value))}
              className="studio-range w-full h-5"
              style={{ '--p': `${pct}%` } as React.CSSProperties}
            />
            <div className="flex justify-between text-xs font-mono text-white/65">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Playback Controls */}
          <div className="flex items-center justify-around py-1">
            <button
              type="button"
              onClick={onPrev}
              className="min-h-[56px] min-w-[56px] flex items-center justify-center rounded-2xl text-[var(--pe)] hover:bg-white/10 active:scale-95 transition"
              aria-label="Previous"
            >
              <SkipBack className="w-8 h-8 fill-current" />
            </button>
            <button
              type="button"
              onClick={onTogglePlay}
              className="w-20 h-20 rounded-full bg-[var(--or)] text-white flex items-center justify-center shadow-xl shadow-[var(--or)]/40 hover:brightness-110 active:scale-95 transition"
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? (
                <Pause className="w-9 h-9 fill-current" />
              ) : (
                <Play className="w-9 h-9 fill-current ml-1" />
              )}
            </button>
            <button
              type="button"
              onClick={onNext}
              className="min-h-[56px] min-w-[56px] flex items-center justify-center rounded-2xl text-[var(--pe)] hover:bg-white/10 active:scale-95 transition"
              aria-label="Next"
            >
              <SkipForward className="w-8 h-8 fill-current" />
            </button>
          </div>

          {/* Desktop Volume Slider */}
          <div className="hidden md:flex items-center gap-3 px-1">
            <Volume2 className="w-4 h-4 text-white/65 shrink-0" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="studio-range flex-1"
              style={{ '--p': `${volume * 100}%` } as React.CSSProperties}
            />
          </div>

          {/* Bottom Utility Bar */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={onOpenOptions}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/10 text-white/75"
              title="Speed & sleep timer"
            >
              <Sliders className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setShowLyrics((v) => !v)}
              className={`min-h-[44px] px-4 rounded-xl text-sm font-bold flex items-center gap-2 border transition ${
                showLyrics
                  ? 'bg-[var(--pe)] text-black border-transparent'
                  : 'bg-white/10 text-white border-white/15 hover:bg-white/15'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Lyrics
            </button>

            <button
              type="button"
              onClick={onOpenArtViewer}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/10 text-white/75"
              title="View original art"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={onOpenNotes}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/10 text-white/75"
              title="Links, name & notes"
            >
              <FileText className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={onCycleMode}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/10 text-white/75"
              title="Play mode"
            >
              {renderModeIcon()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
