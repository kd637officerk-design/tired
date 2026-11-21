import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  Headphones,
  ListVideo,
  Lock,
  Maximize2,
  MoreVertical,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  RotateCw,
  Settings,
  Shuffle,
  SkipBack,
  SkipForward,
  Unlock,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { formatTime, ytId } from '../utils/mediaParsers';
import { Track, VideoPlayerSettings } from '../types/player';

interface VideoPlayerModalProps {
  open: boolean;
  track: Track | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  settings: VideoPlayerSettings;
  queue: Track[];
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSelectTrack: (id: number) => void;
  onUpdateSettings: (patch: Partial<VideoPlayerSettings>) => void;
  onOpenMore: () => void;
  onToast: (msg: string) => void;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  open,
  track,
  videoRef,
  settings,
  queue,
  onClose,
  onPrev,
  onNext,
  onSelectTrack,
  onUpdateSettings,
  onOpenMore,
  onToast,
}) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [curTime, setCurTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [vol, setVol] = useState(1);
  const [muted, setMuted] = useState(false);
  const [audioOnly, setAudioOnly] = useState(false);
  const [locked, setLocked] = useState(false);
  const [hideControls, setHideControls] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [qualityBadge, setQualityBadge] = useState('');

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurTime(v.currentTime || 0);
    const onMeta = () => {
      setDur(v.duration || 0);
      const w = v.videoWidth;
      const h = v.videoHeight;
      if (h) {
        const m = Math.min(w, h);
        setQualityBadge(Math.max(w, h) >= 3840 || m >= 2160 ? '4K' : `${m}P`);
      }
      v.playbackRate = settings.rate || 1;
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
    };
  }, [videoRef, settings.rate]);

  if (!open) return null;

  const yid = track ? track.yt || (track.url && ytId(track.url)) : null;
  const isEmbed = !!(track?.web || yid);
  const scaleModes = ['contain', 'cover', 'fill', 'none'] as const;
  const scaleIdx = settings.scale ?? 0;

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v || !v.getAttribute('src')) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const toggleFs = async () => {
    const el = stageRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await el.requestFullscreen();
    } catch {
      onToast('Fullscreen unavailable here');
    }
  };

  const pct = dur > 0 ? Math.min(100, (curTime / dur) * 100) : 0;

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-black/92 backdrop-blur-2xl text-white">
      {locked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <button
            type="button"
            onClick={() => setLocked(false)}
            className="min-h-[48px] px-5 rounded-2xl bg-black/80 border border-white/25 text-sm font-bold flex items-center gap-2"
          >
            <Unlock className="w-4 h-4" /> Unlock Screen
          </button>
        </div>
      )}

      {/* Header */}
      <div className="shrink-0 z-10 flex items-center gap-2 px-3 py-2.5 bg-black/75 backdrop-blur-lg border-b border-white/10">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0 font-bold truncate">
          {track ? track.name : 'Symphony Video Deck'}
        </div>
        <button
          type="button"
          onClick={() => {
            const cur = settings.rate || 1;
            const next = SPEEDS[(SPEEDS.indexOf(cur) + 1) % SPEEDS.length];
            onUpdateSettings({ rate: next });
            if (videoRef.current) videoRef.current.playbackRate = next;
            onToast(`Speed: ${next}x`);
          }}
          className="min-h-[40px] px-3 rounded-xl bg-white/10 text-xs font-bold"
        >
          {settings.rate || 1}x
        </button>
        <button
          type="button"
          onClick={() => setShowSettingsPanel((v) => !v)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/10"
        >
          <Settings className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onOpenMore}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/10"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-auto touch-pan-y">
        <div className="max-w-5xl mx-auto p-4 space-y-4 pb-20">
        {/* Video Stage */}
        <div
          ref={stageRef}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('button')) return;
            setHideControls((v) => !v);
          }}
          className="relative rounded-2xl overflow-hidden bg-black border border-white/12 shadow-2xl"
        >
          {settings.badge !== 0 && qualityBadge && !isEmbed && (
            <span className="absolute top-3 left-3 z-20 px-2 py-0.5 rounded bg-black/75 border border-white/20 text-[11px] font-bold">
              {qualityBadge}
            </span>
          )}

          {track?.web ? (
            <iframe
              src={track.web}
              title={track.name}
              className="w-full aspect-video border-0 bg-black"
              sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
            />
          ) : yid ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${yid}?autoplay=1&playsinline=1&rel=0`}
              title={track?.name || 'YouTube'}
              className="w-full aspect-video border-0 bg-black"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                className={`w-full max-h-[64vh] bg-black mx-auto ${audioOnly ? 'opacity-0' : 'opacity-100'}`}
                style={{ objectFit: scaleModes[scaleIdx] }}
              />
              {audioOnly && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/85">
                  <Headphones className="w-12 h-12 text-[var(--or)]" />
                  <span className="text-sm font-semibold text-white/75">Audio-Only Mode</span>
                </div>
              )}

              {!hideControls && (
                <div className="absolute inset-0 flex items-center justify-center gap-6 bg-black/25">
                  <button
                    type="button"
                    onClick={() => {
                      if (videoRef.current)
                        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
                    }}
                    className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-16 h-16 rounded-full bg-[var(--or)] text-white flex items-center justify-center shadow-lg"
                  >
                    {playing ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-0.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (videoRef.current)
                        videoRef.current.currentTime = videoRef.current.currentTime + 10;
                    }}
                    className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80"
                  >
                    <RotateCw className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Transport & Seekbar (for non-embed) */}
        {!isEmbed && (
          <div className="mat-surface rounded-2xl p-4 space-y-4">
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={dur || 100}
                step={0.5}
                value={Math.min(curTime, dur || 100)}
                onChange={(e) => {
                  if (videoRef.current) videoRef.current.currentTime = Number(e.target.value);
                }}
                className="studio-range w-full h-5"
                style={{ '--p': `${pct}%` } as React.CSSProperties}
              />
              <div className="flex justify-between text-xs font-mono text-white/60">
                <span>{formatTime(curTime)}</span>
                <span>{formatTime(dur)}</span>
              </div>
            </div>

            <div className="flex items-center justify-around">
              <button
                type="button"
                onClick={() => onUpdateSettings({ mode: settings.mode === 2 ? 0 : 2 })}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl ${
                  settings.mode === 2 ? 'text-[var(--or)]' : 'text-white/55'
                }`}
              >
                <Shuffle className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={onPrev}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/10"
              >
                <SkipBack className="w-6 h-6 fill-current" />
              </button>
              <button
                type="button"
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-[var(--or)] text-white flex items-center justify-center"
              >
                {playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={onNext}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/10"
              >
                <SkipForward className="w-6 h-6 fill-current" />
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ mode: settings.mode === 1 ? 0 : 1 })}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl ${
                  settings.mode === 1 ? 'text-[var(--or)]' : 'text-white/55'
                }`}
              >
                <Repeat className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAudioOnly((v) => !v)}
                  className={`min-h-[42px] px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 border ${
                    audioOnly
                      ? 'bg-[var(--or)]/20 border-[var(--or)] text-white'
                      : 'bg-white/8 border-white/12'
                  }`}
                >
                  <Headphones className="w-4 h-4" /> Audio Only
                </button>
                <button
                  type="button"
                  onClick={toggleFs}
                  className="min-h-[42px] px-3 rounded-xl bg-white/8 border border-white/12 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Maximize2 className="w-4 h-4" /> Fullscreen
                </button>
                <button
                  type="button"
                  onClick={() => setLocked(true)}
                  className="min-h-[42px] px-3 rounded-xl bg-white/8 border border-white/12 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Lock className="w-4 h-4" /> Lock
                </button>
                <button
                  type="button"
                  onClick={() => setShowQueue((v) => !v)}
                  className="min-h-[42px] px-3 rounded-xl bg-white/8 border border-white/12 text-xs font-semibold flex items-center gap-1.5"
                >
                  <ListVideo className="w-4 h-4" /> Queue ({queue.length})
                </button>
              </div>

              <div className="flex items-center gap-2 min-w-[140px]">
                <button
                  type="button"
                  onClick={() => {
                    const m = !muted;
                    setMuted(m);
                    if (videoRef.current) videoRef.current.muted = m;
                  }}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center"
                >
                  {muted || vol === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={muted ? 0 : vol}
                  onChange={(e) => {
                    const nv = Number(e.target.value);
                    setVol(nv);
                    setMuted(false);
                    if (videoRef.current) {
                      videoRef.current.volume = nv;
                      videoRef.current.muted = false;
                    }
                  }}
                  className="studio-range flex-1"
                  style={{ '--p': `${(muted ? 0 : vol) * 100}%` } as React.CSSProperties}
                />
              </div>
            </div>
          </div>
        )}

        {(yid || track?.orig) && (
          <a
            href={yid ? `https://www.youtube.com/watch?v=${yid}` : track?.orig}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/75 hover:text-white"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open Original Link
          </a>
        )}

        {showSettingsPanel && (
          <div className="mat-surface rounded-2xl p-4 space-y-3">
            <div className="text-sm font-bold">Symphony Video Settings</div>
            <div className="flex flex-wrap gap-2">
              {['Best fit', 'Fill', 'Stretch', 'Original'].map((lbl, idx) => (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => onUpdateSettings({ scale: idx })}
                  className={`min-h-[40px] px-3 rounded-xl text-xs font-bold border ${
                    scaleIdx === idx
                      ? 'bg-[var(--or)] text-white border-transparent'
                      : 'bg-white/8 border-white/15'
                  }`}
                >
                  Scale: {lbl}
                </button>
              ))}
            </div>
          </div>
        )}

        {showQueue && (
          <div className="mat-surface rounded-2xl p-4 space-y-2 max-h-60 overflow-y-auto">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--mu)]">
              Video Queue
            </div>
            {queue.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => onSelectTrack(q.id)}
                className={`w-full min-h-[44px] px-3 rounded-xl text-left text-sm flex items-center justify-between ${
                  q.id === track?.id ? 'bg-[var(--or)]/25 font-bold text-[var(--pe)]' : 'hover:bg-white/10'
                }`}
              >
                <span className="truncate">{q.name}</span>
                {q.id === track?.id && <span className="text-xs">Playing</span>}
              </button>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
