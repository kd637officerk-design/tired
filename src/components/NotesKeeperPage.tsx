import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Lock,
  Plus,
  Search,
  Trash2,
  Unlock,
} from 'lucide-react';
import {
  createPasswordRecord,
  linkList,
  verifyPasswordRecord,
} from '../utils/mediaParsers';
import { KeeperEntry, PasswordRecord, Track } from '../types/player';

interface NotesKeeperPageProps {
  open: boolean;
  entries: KeeperEntry[];
  tracksWithNotes: Track[];
  pwRecord?: PasswordRecord;
  unlocked: boolean;
  onUnlock: () => void;
  onLockNow: () => void;
  onSetPwRecord: (rec: PasswordRecord | undefined) => void;
  onEraseAllOnForgot: () => void;
  onSaveEntries: (next: KeeperEntry[]) => void;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const NotesKeeperPage: React.FC<NotesKeeperPageProps> = ({
  open,
  entries,
  tracksWithNotes,
  pwRecord,
  unlocked,
  onUnlock,
  onLockNow,
  onSetPwRecord,
  onEraseAllOnForgot,
  onSaveEntries,
  onClose,
  onToast,
}) => {
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<KeeperEntry | null | 'new'>(null);
  const [name, setName] = useState('');
  const [links, setLinks] = useState('');
  const [notes, setNotes] = useState('');

  // Password modal state
  const [pwInput, setPwInput] = useState('');
  const [pwModalMode, setPwModalMode] = useState<'none' | 'set' | 'remove' | 'forgot'>('none');
  const [pwNew1, setPwNew1] = useState('');
  const [pwNew2, setPwNew2] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');

  useEffect(() => {
    if (!open) {
      setEditing(null);
      setPwModalMode('none');
      setPwInput('');
    }
  }, [open]);

  if (!open) return null;

  // Password gate
  if (pwRecord && !unlocked) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-2xl p-4 text-[var(--fg)]">
        <div className="mat-panel w-full max-w-sm rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[var(--or)]/20 border border-[var(--or)]/40 flex items-center justify-center text-[var(--or)]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Notes Locked</h2>
              <p className="text-xs text-[var(--mu)]">Enter your password to view saved notes</p>
            </div>
          </div>

          {pwModalMode === 'forgot' ? (
            <div className="space-y-3">
              <p className="text-xs text-red-300 leading-relaxed">
                There is no recovery. Type <strong>RESET</strong> to erase all Notes & Names entries
                and per-song notes, and clear the password.
              </p>
              <input
                value={resetConfirm}
                onChange={(e) => setResetConfirm(e.target.value)}
                placeholder="Type RESET"
                className="w-full min-h-[44px] px-3 rounded-xl bg-black/50 border border-red-400/30 text-sm"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPwModalMode('none')}
                  className="min-h-[42px] px-4 rounded-xl bg-white/10 text-xs font-bold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (resetConfirm.trim() !== 'RESET') {
                      onToast('Type RESET to confirm');
                      return;
                    }
                    onEraseAllOnForgot();
                    setPwModalMode('none');
                  }}
                  className="min-h-[42px] px-4 rounded-xl bg-red-600 text-white text-xs font-bold"
                >
                  Erase & Reset
                </button>
              </div>
            </div>
          ) : (
            <>
              <input
                type="password"
                autoFocus
                value={pwInput}
                onChange={(e) => setPwInput(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    if (await verifyPasswordRecord(pwInput, pwRecord)) {
                      setPwInput('');
                      onUnlock();
                    } else {
                      onToast('Wrong password');
                    }
                  }
                }}
                placeholder="Password"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-black/50 border border-white/15 text-sm"
              />
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setPwModalMode('forgot')}
                  className="text-xs text-red-300 hover:underline min-h-[40px]"
                >
                  Forgot password?
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="min-h-[42px] px-3.5 rounded-xl bg-white/10 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (await verifyPasswordRecord(pwInput, pwRecord)) {
                        setPwInput('');
                        onUnlock();
                      } else {
                        onToast('Wrong password');
                      }
                    }}
                    className="min-h-[42px] px-4 rounded-xl bg-[var(--or)] text-white text-xs font-bold"
                  >
                    Unlock
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const startEdit = (e: KeeperEntry | 'new') => {
    setEditing(e);
    if (e === 'new') {
      setName('');
      setLinks('');
      setNotes('');
    } else {
      setName(e.name || '');
      setLinks(e.links || '');
      setNotes(e.notes || '');
    }
  };

  const saveEntry = () => {
    if (!name.trim() && !links.trim() && !notes.trim()) {
      onToast('Nothing to save');
      return;
    }
    const ts = Date.now();
    if (editing === 'new') {
      const created: KeeperEntry = {
        id: ts + Math.floor(Math.random() * 1000),
        name: name.trim(),
        links: links.trim(),
        notes: notes.trim(),
        ts,
      };
      onSaveEntries([created, ...entries]);
    } else if (editing) {
      onSaveEntries(
        entries.map((x) =>
          x.id === editing.id
            ? { ...x, name: name.trim(), links: links.trim(), notes: notes.trim(), ts }
            : x
        )
      );
    }
    setEditing(null);
    onToast('Saved');
  };

  const exportNotesTxt = () => {
    const out: string[] = [];
    entries.forEach((e) =>
      out.push([e.name || '(no name)', e.links || '', e.notes || ''].filter(Boolean).join('\n'))
    );
    tracksWithNotes.forEach((t) =>
      out.push(
        [(t.nick || t.name) + (t.nick ? ` [${t.name}]` : ''), t.links || '', t.notes || '']
          .filter(Boolean)
          .join('\n')
      )
    );
    const text = out.join('\n\n----------\n\n');
    if (!text) {
      onToast('No notes to export yet');
      return;
    }
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    onToast('Notes exported');
  };

  const q = query.trim().toLowerCase();
  const filtered = entries
    .filter(
      (e) =>
        !q ||
        `${e.name} ${e.links} ${e.notes}`.toLowerCase().includes(q)
    )
    .sort((a, b) => (b.ts || 0) - (a.ts || 0));

  return (
    <div className="fixed inset-0 z-30 flex flex-col overflow-hidden bg-black/60 backdrop-blur-2xl text-[var(--fg)]">
      <div className="shrink-0 z-10 flex items-center gap-2 px-4 py-3 bg-black/65 backdrop-blur-xl border-b border-white/10">
        <button
          type="button"
          onClick={() => (editing ? setEditing(null) : onClose())}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-lg font-bold truncate">
          {editing ? (editing === 'new' ? 'New Entry' : 'Edit Entry') : 'Notes & Names'}
        </h1>

        {editing ? (
          <button
            type="button"
            onClick={saveEntry}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--or)] hover:bg-white/10"
          >
            <Check className="w-6 h-6" />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPwModalMode(pwRecord ? 'remove' : 'set')}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/10"
              title="Password lock"
            >
              {pwRecord ? <Lock className="w-4 h-4 text-[var(--or)]" /> : <Unlock className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={exportNotesTxt}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/10"
              title="Export notes .txt"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => startEdit('new')}
              className="min-h-[44px] min-w-[44px] rounded-xl bg-[var(--or)] text-white flex items-center justify-center"
              title="Add entry"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-auto touch-pan-y">
        <div className="max-w-3xl mx-auto p-4 space-y-4 pb-24">
        {pwModalMode !== 'none' && (
          <div className="mat-panel rounded-2xl p-4 space-y-3 border border-[var(--or)]/40">
            {pwModalMode === 'set' ? (
              <>
                <div className="font-bold text-sm">Set Notes Password</div>
                <input
                  type="password"
                  value={pwNew1}
                  onChange={(e) => setPwNew1(e.target.value)}
                  placeholder="New password (min 4 chars)"
                  className="w-full min-h-[42px] px-3 rounded-xl bg-black/50 border border-white/15 text-sm"
                />
                <input
                  type="password"
                  value={pwNew2}
                  onChange={(e) => setPwNew2(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full min-h-[42px] px-3 rounded-xl bg-black/50 border border-white/15 text-sm"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPwModalMode('none')}
                    className="min-h-[40px] px-3 rounded-xl bg-white/10 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (pwNew1.length < 4) return onToast('Use at least 4 characters');
                      if (pwNew1 !== pwNew2) return onToast('Passwords do not match');
                      try {
                        const rec = await createPasswordRecord(pwNew1);
                        onSetPwRecord(rec);
                        setPwModalMode('none');
                        setPwNew1('');
                        setPwNew2('');
                        onToast('Password set');
                      } catch (e: unknown) {
                        onToast(e instanceof Error ? e.message : 'Crypto unavailable');
                      }
                    }}
                    className="min-h-[40px] px-4 rounded-xl bg-[var(--or)] text-white text-xs font-bold"
                  >
                    Enable Lock
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold">Notes password is active</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onLockNow();
                      setPwModalMode('none');
                    }}
                    className="min-h-[40px] px-3 rounded-xl bg-white/10 text-xs font-bold"
                  >
                    Lock Now
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSetPwRecord(undefined);
                      setPwModalMode('none');
                      onToast('Password removed');
                    }}
                    className="min-h-[40px] px-3 rounded-xl bg-red-500/20 text-red-300 text-xs font-bold"
                  >
                    Remove Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setPwModalMode('none')}
                    className="min-h-[40px] px-3 rounded-xl bg-white/10 text-xs font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {editing ? (
          <div className="mat-surface rounded-2xl p-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--mu)] mb-1">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name or title"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-black/50 border border-white/15 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--mu)] mb-1">Links (one per line)</label>
              <textarea
                value={links}
                onChange={(e) => setLinks(e.target.value)}
                rows={3}
                placeholder="https://..."
                className="w-full p-3.5 rounded-xl bg-black/50 border border-white/15 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--mu)] mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={7}
                placeholder="Notes..."
                className="w-full p-3.5 rounded-xl bg-black/50 border border-white/15 text-sm"
              />
            </div>
            {editing !== 'new' && (
              <button
                type="button"
                onClick={() => {
                  onSaveEntries(entries.filter((x) => x.id !== editing.id));
                  setEditing(null);
                  onToast('Deleted');
                }}
                className="min-h-[44px] px-4 rounded-xl bg-red-500/20 text-red-300 text-xs font-bold flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Delete Entry
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--mu)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search names, links, notes..."
                className="w-full min-h-[46px] pl-10 pr-4 rounded-xl mat-surface text-sm"
              />
            </div>

            {filtered.length === 0 ? (
              <div className="mat-surface rounded-2xl p-10 text-center text-sm text-[var(--mu)]">
                Nothing saved yet. Tap + to keep a name, links and notes.
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((e) => (
                  <div key={e.id} className="mat-surface rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-base break-words">
                        {e.name || '(no name)'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => startEdit(e)}
                        className="min-h-[40px] px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                    </div>
                    {linkList(e.links).map((u, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-black/35 rounded-xl px-3 py-2 border border-white/10"
                      >
                        <span className="flex-1 text-xs text-[var(--pe)] truncate">{u}</span>
                        <a
                          href={u}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[34px] px-2.5 rounded-lg bg-white/10 text-xs font-bold flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> Open
                        </a>
                        <button
                          type="button"
                          onClick={async () => {
                            await navigator.clipboard.writeText(u);
                            onToast('Link copied');
                          }}
                          className="min-h-[34px] px-2.5 rounded-lg bg-white/10 text-xs font-bold flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>
                    ))}
                    {e.notes && (
                      <p className="text-sm text-white/85 whitespace-pre-wrap break-words">
                        {e.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
};

interface TrackNotesModalProps {
  open: boolean;
  track: Track | null;
  onClose: () => void;
  onSave: (trackId: number, patch: Partial<Track>) => void;
  onToast: (msg: string) => void;
}

export const TrackNotesModal: React.FC<TrackNotesModalProps> = ({
  open,
  track,
  onClose,
  onSave,
  onToast,
}) => {
  const [nick, setNick] = useState('');
  const [links, setLinks] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open && track) {
      setNick(track.nick || '');
      setLinks(track.links || '');
      setNotes(track.notes || '');
    }
  }, [open, track]);

  if (!open || !track) return null;

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
          <div className="text-sm font-bold truncate">Links, Name & Notes</div>
          <div className="text-xs text-[var(--mu)] truncate">{track.name}</div>
        </div>
        <button
          type="button"
          onClick={() => {
            onSave(track.id, {
              nick: nick.trim(),
              links: links.trim(),
              notes: notes.trim(),
            });
            onToast('Track notes saved');
            onClose();
          }}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--or)] hover:bg-white/10"
        >
          <Check className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-auto touch-pan-y">
        <div className="max-w-xl mx-auto p-4 space-y-4 pb-16">
        <div>
          <label className="block text-xs font-bold text-[var(--mu)] mb-1">Custom Label / Name</label>
          <input
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            placeholder="Your custom label..."
            className="w-full min-h-[44px] px-3.5 rounded-xl bg-black/50 border border-white/15 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[var(--mu)] mb-1">Links (one per line)</label>
          <textarea
            value={links}
            onChange={(e) => setLinks(e.target.value)}
            rows={3}
            placeholder="https://..."
            className="w-full p-3.5 rounded-xl bg-black/50 border border-white/15 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[var(--mu)] mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={7}
            placeholder="Anything you want to remember..."
            className="w-full p-3.5 rounded-xl bg-black/50 border border-white/15 text-sm"
          />
        </div>
        </div>
      </div>
    </div>
  );
};
