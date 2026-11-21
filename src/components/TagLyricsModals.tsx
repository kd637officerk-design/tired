import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Download, Edit3, Music2, Search, Trash2, Upload, X } from 'lucide-react';
import { fetchOnlineLyrics, parseLRC, readTextFile } from '../utils/mediaParsers';
import { Track } from '../types/player';

interface TagEditorModalProps {
  open: boolean;
  track: Track | null;
  coverUrl?: string;
  onClose: () => void;
  onSave: (trackId: number, patch: Partial<Track>) => void;
  onOpenLyrics: () => void;
  onOpenNotes: () => void;
  onViewArt: () => void;
  onToast: (msg: string) => void;
}

export const TagEditorModal: React.FC<TagEditorModalProps> = ({
  open,
  track,
  coverUrl,
  onClose,
  onSave,
  onOpenLyrics,
  onOpenNotes,
  onViewArt,
  onToast,
}) => {
  const artRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [aa, setAa] = useState('');
  const [comp, setComp] = useState('');
  const [genre, setGenre] = useState('');
  const [newCover, setNewCover] = useState<Blob | null | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!open || !track) return;
    setName(track.name || '');
    setArtist(track.artist || '');
    setAlbum(track.album || '');
    setAa(track.aa || '');
    setComp(track.comp || '');
    setGenre(track.genre || '');
    setNewCover(undefined);
    setPreviewUrl(coverUrl || '');
  }, [open, track, coverUrl]);

  if (!open || !track) return null;

  const handleSave = () => {
    const patch: Partial<Track> = {
      name: name.trim() || track.name,
      nameSet: 1,
      artist: artist.trim(),
      album: album.trim(),
      aa: aa.trim(),
      comp: comp.trim(),
      genre: genre.trim(),
    };
    if (newCover !== undefined) {
      patch.cover = newCover;
      if (newCover === null) patch.emb = null;
    }
    onSave(track.id, patch);
    onToast('Tags saved');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-black/75 backdrop-blur-2xl text-[var(--fg)]">
      <div className="shrink-0 z-10 flex items-center justify-between px-4 py-3 bg-black/70 backdrop-blur-md border-b border-white/10">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold">Tag Editor</h1>
        <button
          type="button"
          onClick={handleSave}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--or)] hover:bg-white/10"
        >
          <Check className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-auto touch-pan-y">
        <div className="max-w-xl mx-auto p-4 space-y-4 pb-20">
        <div className="relative w-52 h-52 mx-auto rounded-2xl overflow-hidden mat-surface flex items-center justify-center">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={track.name}
              onClick={onViewArt}
              className="h-full w-full object-contain cursor-pointer"
            />
          ) : (
            <Music2 className="w-16 h-16 text-[var(--mu)]" />
          )}
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => artRef.current?.click()}
              className="min-h-[40px] min-w-[40px] rounded-xl bg-black/75 border border-white/20 flex items-center justify-center"
              title="Change cover art"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setNewCover(null);
                setPreviewUrl('');
              }}
              className="min-h-[40px] min-w-[40px] rounded-xl bg-black/75 border border-white/20 flex items-center justify-center text-red-300"
              title="Remove cover art"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <input
            ref={artRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              setNewCover(f);
              setPreviewUrl(URL.createObjectURL(f));
            }}
          />
        </div>

        {[
          ['Title', name, setName],
          ['Artist', artist, setArtist],
          ['Album', album, setAlbum],
          ['Album Artist', aa, setAa],
          ['Composer', comp, setComp],
          ['Genre', genre, setGenre],
        ].map(([lbl, val, setter]) => (
          <div key={String(lbl)}>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--mu)] mb-1">
              {lbl as string}
            </label>
            <input
              value={val as string}
              onChange={(e) => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-black/45 border border-white/15 text-sm"
            />
          </div>
        ))}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          <button
            type="button"
            onClick={onOpenNotes}
            className="min-h-[48px] px-4 rounded-xl mat-surface text-sm font-semibold text-left"
          >
            📝 {track.nick || track.links || track.notes ? 'Edit links, name & notes' : 'Add links, name & notes'}
          </button>
          {track.kind === 'audio' && (
            <button
              type="button"
              onClick={onOpenLyrics}
              className="min-h-[48px] px-4 rounded-xl mat-surface text-sm font-semibold text-left"
            >
              💬 {track.lyr ? 'Edit lyrics' : 'Add lyrics'}
            </button>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

interface LyricsEditorModalProps {
  open: boolean;
  track: Track | null;
  onClose: () => void;
  onSave: (trackId: number, lyr: string) => void;
  onToast: (msg: string) => void;
}

export const LyricsEditorModal: React.FC<LyricsEditorModalProps> = ({
  open,
  track,
  onClose,
  onSave,
  onToast,
}) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && track) setText(track.lyr || '');
  }, [open, track]);

  if (!open || !track) return null;

  const isSynced = !!parseLRC(text);
  const lineCount = text.trim() ? text.trim().split(/\n/).length : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-black/80 backdrop-blur-2xl text-[var(--fg)]">
      <div className="shrink-0 z-10 flex items-center justify-between px-4 py-3 bg-black/75 border-b border-white/10">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0 px-2">
          <div className="text-sm font-bold truncate">Lyrics — {track.name}</div>
          <div className="text-[11px] text-[var(--mu)]">
            {isSynced ? `Synced .lrc (${lineCount} lines)` : `${lineCount} lines`}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onSave(track.id, text.replace(/\r\n?/g, '\n').trim());
            onToast(text.trim() ? 'Lyrics saved' : 'Lyrics cleared');
            onClose();
          }}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--or)] hover:bg-white/10"
        >
          <Check className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-auto touch-pan-y">
        <div className="max-w-2xl mx-auto p-4 space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          spellCheck={false}
          placeholder={`Paste or type lyrics here...\n\nSynced .lrc format also supported:\n[00:12.50] First line\n[00:17.00] Second line`}
          className="w-full p-4 rounded-2xl bg-black/50 border border-white/15 text-sm leading-relaxed font-mono"
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="min-h-[44px] px-3.5 rounded-xl mat-surface text-xs font-bold flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" /> Import .lrc / .txt
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (!track.artist?.trim()) {
                onToast('Add the artist in Tag Editor first');
                return;
              }
              setBusy(true);
              const found = await fetchOnlineLyrics(track.artist, track.name);
              setBusy(false);
              if (found) {
                setText(found);
                onToast('Found lyrics — tap ✓ to save');
              } else {
                onToast('Not found online');
              }
            }}
            className="min-h-[44px] px-3.5 rounded-xl mat-surface text-xs font-bold flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" /> {busy ? 'Searching...' : 'Find Online'}
          </button>
          <button
            type="button"
            onClick={() => setText('')}
            className="min-h-[44px] px-3.5 rounded-xl bg-red-500/15 text-red-300 text-xs font-bold flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" /> Clear
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".lrc,.txt,text/plain"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              try {
                setText(await readTextFile(f));
                onToast('Imported — tap ✓ to save');
              } catch {
                onToast('Could not read file');
              }
            }}
          />
        </div>
        </div>
      </div>
    </div>
  );
};

interface ArtViewerModalProps {
  open: boolean;
  blob: Blob | null;
  title: string;
  onClose: () => void;
}

export const ArtViewerModal: React.FC<ArtViewerModalProps> = ({ open, blob, title, onClose }) => {
  const [url, setUrl] = useState('');
  const [dims, setDims] = useState('');

  useEffect(() => {
    if (!open || !blob) {
      setUrl('');
      return;
    }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [open, blob]);

  if (!open || !blob || !url) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      onClick={onClose}
    >
      <div className="flex-1 min-h-0 flex items-center justify-center p-4">
        <img
          src={url}
          alt={title}
          onLoad={(e) => {
            const im = e.currentTarget;
            setDims(`${im.naturalWidth} × ${im.naturalHeight} px`);
          }}
          className="max-h-full max-w-full object-contain"
        />
      </div>
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 bg-black/85 border-t border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xs text-white/70 truncate">
          {title} {dims ? `· ${dims}` : ''}
        </span>
        <div className="flex gap-2">
          <a
            href={url}
            download={`${title || 'cover'}.jpg`}
            className="min-h-[42px] px-4 rounded-xl bg-white/15 text-xs font-bold flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Save
          </a>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-4 rounded-xl bg-white/15 text-xs font-bold flex items-center gap-1"
          >
            <X className="w-4 h-4" /> Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface PromptDialogProps {
  open: boolean;
  title: string;
  subtitle?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}

export const PromptDialog: React.FC<PromptDialogProps> = ({
  open,
  title,
  subtitle,
  placeholder,
  defaultValue = '',
  confirmLabel = 'Save',
  onCancel,
  onConfirm,
}) => {
  const [val, setVal] = useState(defaultValue);

  useEffect(() => {
    if (open) setVal(defaultValue);
  }, [open, defaultValue]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="mat-panel w-full max-w-md rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="text-base font-bold">{title}</h3>
          {subtitle && <p className="text-xs text-[var(--mu)] mt-1">{subtitle}</p>}
        </div>
        <input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onConfirm(val);
          }}
          placeholder={placeholder}
          className="w-full min-h-[44px] px-3.5 rounded-xl bg-black/50 border border-white/15 text-sm"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[42px] px-4 rounded-xl bg-white/10 text-xs font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(val)}
            className="min-h-[42px] px-4 rounded-xl bg-[var(--or)] text-white text-xs font-bold"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
