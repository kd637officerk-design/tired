import React, { useState } from 'react';
import { ArrowLeft, Bookmark, Clock, ExternalLink, Play, Search, Trash2 } from 'lucide-react';
import { hostOf } from '../utils/mediaParsers';

interface BrowserPageProps {
  open: boolean;
  engine: string;
  bookmarks: string[];
  history: string[];
  onClose: () => void;
  onChangeEngine: (eng: string) => void;
  onAddHistory: (url: string) => void;
  onToggleBookmark: (url: string) => void;
  onClearHistory: () => void;
  onPlayUrl: (url: string) => void;
}

const ENGINES: { id: string; label: string; prefix: string }[] = [
  { id: 'brave', label: 'Brave', prefix: 'https://search.brave.com/search?q=' },
  { id: 'ddg', label: 'DuckDuckGo', prefix: 'https://duckduckgo.com/?q=' },
  { id: 'google', label: 'Google', prefix: 'https://www.google.com/search?q=' },
  { id: 'yt', label: 'YouTube', prefix: 'https://www.youtube.com/results?search_query=' },
  { id: 'wiki', label: 'Wikipedia', prefix: 'https://en.wikipedia.org/w/index.php?search=' },
];

export const BrowserPage: React.FC<BrowserPageProps> = ({
  open,
  engine,
  bookmarks,
  history,
  onClose,
  onChangeEngine,
  onAddHistory,
  onToggleBookmark,
  onClearHistory,
  onPlayUrl,
}) => {
  const [query, setQuery] = useState('');
  const [inAppUrl, setInAppUrl] = useState('');
  const [embedMode, setEmbedMode] = useState(false);

  if (!open) return null;

  const buildUrl = (raw: string) => {
    const q = raw.trim();
    if (!q) return '';
    if (/^https?:\/\//i.test(q)) return q;
    if (!/\s/.test(q) && /^[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/.test(q)) return 'https://' + q;
    const eng = ENGINES.find((e) => e.id === engine) || ENGINES[0];
    return eng.prefix + encodeURIComponent(q);
  };

  const handleGo = (override?: string) => {
    const u = override || buildUrl(query);
    if (!u) return;
    onAddHistory(u);
    if (embedMode) {
      setInAppUrl(u);
    } else {
      window.open(u, '_blank', 'noopener');
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex flex-col overflow-hidden bg-black/65 backdrop-blur-2xl text-[var(--fg)]">
      <div className="shrink-0 z-10 flex items-center gap-3 px-4 py-3 bg-black/70 border-b border-white/10">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-lg font-bold">Web & Stream Explorer</h1>
        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="min-h-[40px] px-3 rounded-xl bg-white/10 text-xs font-semibold flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear History
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-auto touch-pan-y">
        <div className="max-w-4xl mx-auto p-4 space-y-4 pb-24">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--mu)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGo();
              }}
              placeholder="Search web or paste video / audio / YouTube URL..."
              className="w-full min-h-[46px] pl-10 pr-4 rounded-xl mat-surface text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => handleGo()}
            className="min-h-[46px] px-5 rounded-xl bg-[var(--or)] text-white text-sm font-bold"
          >
            Go
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {ENGINES.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => onChangeEngine(e.id)}
              className={`min-h-[40px] px-3 rounded-xl text-xs font-bold border ${
                engine === e.id
                  ? 'bg-[var(--or)] text-white border-transparent'
                  : 'bg-white/5 border-white/12 text-[var(--mu)]'
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              const u = buildUrl(query);
              if (u) onPlayUrl(u);
            }}
            className="min-h-[42px] px-3.5 rounded-xl bg-[var(--or)]/20 border border-[var(--or)]/50 text-[var(--pe)] text-xs font-bold flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" /> Play URL in App
          </button>
          <button
            type="button"
            onClick={() => setEmbedMode((v) => !v)}
            className={`min-h-[42px] px-3.5 rounded-xl text-xs font-bold border ${
              embedMode ? 'bg-white/20 border-white/40' : 'bg-white/5 border-white/12'
            }`}
          >
            In-App Embed: {embedMode ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            onClick={() => {
              const u = buildUrl(query);
              if (u) onToggleBookmark(u);
            }}
            className="min-h-[42px] px-3.5 rounded-xl bg-white/5 border border-white/12 text-xs font-bold flex items-center gap-1.5"
          >
            <Bookmark className="w-3.5 h-3.5" /> Bookmark URL
          </button>
        </div>

        {embedMode && inAppUrl && (
          <iframe
            src={inAppUrl}
            title="In-App Browser"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
            className="w-full h-[60vh] rounded-2xl border border-white/15 bg-white"
          />
        )}

        {bookmarks.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--mu)]">
              Bookmarks
            </div>
            {bookmarks.map((u) => (
              <div
                key={u}
                className="mat-surface rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold truncate">{hostOf(u)}</div>
                  <div className="text-xs text-[var(--mu)] truncate">{u}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onPlayUrl(u)}
                  className="min-h-[38px] px-3 rounded-lg bg-[var(--or)]/20 text-xs font-bold"
                >
                  Play
                </button>
                <a
                  href={u}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[38px] min-w-[38px] rounded-lg bg-white/10 flex items-center justify-center"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        )}

        {history.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--mu)] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Recent Links
            </div>
            {history.map((u) => (
              <div
                key={u}
                className="mat-surface rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold truncate">{hostOf(u)}</div>
                  <div className="text-xs text-[var(--mu)] truncate">{u}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleGo(u)}
                  className="min-h-[38px] px-3 rounded-lg bg-white/10 text-xs font-bold"
                >
                  Open
                </button>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
