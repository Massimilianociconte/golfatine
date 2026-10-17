import React, { useState, useMemo, useDeferredValue, useEffect } from 'react';
import { MatchCard } from './MatchCard';
import { GolfatinaMatch, MATCHES_DATA } from '../data/golfatineData';
import { ALL_CHANNELS, CHANNEL_OWNERS } from '../data/channels';
import { Search, Filter, ArrowDownUp, Sparkles, X, Target, Flame } from 'lucide-react';
import { sound } from '../utils/audio';
import { getPlayerAvatar } from '../utils/playerAvatars';

interface GolfatineGridProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  channelFilter: string;
  setChannelFilter: (channel: string) => void;
  onOpenModal: (match: GolfatinaMatch, initialView?: 'scorecard' | 'video' | 'graph') => void;
  onSelectPlayer: (playerName: string) => void;
  onSelectChannel?: (channel: string) => void;
  onOpenShare?: (match: GolfatinaMatch) => void;
}

const GolfatineGridComponent: React.FC<GolfatineGridProps> = ({
  searchQuery,
  setSearchQuery,
  channelFilter,
  setChannelFilter,
  onOpenModal,
  onSelectPlayer,
  onSelectChannel,
  onOpenShare,
}) => {
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'id-asc' | 'id-desc' | 'hios' | 'disasters' | 'date-desc'>('id-desc');
  // Paginate the grid: full cards are heavy DOM nodes. Render 12 at a time.
  const [visibleCount, setVisibleCount] = useState(12);

  // Non-blocking deferred query for high-performance 60fps typing
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Reset pagination whenever the result set criteria change
  useEffect(() => {
    setVisibleCount(12);
  }, [deferredSearchQuery, channelFilter, selectedMonthFilter, sortBy]);

  // Published-video counts per channel (publisher = video uploader, not title)
  const channelCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of MATCHES_DATA) {
      const ch = m.channel || 'Sconosciuto';
      counts.set(ch, (counts.get(ch) || 0) + 1);
    }
    return counts;
  }, []);

  // Available months (YYYY-MM) with counts, newest first
  const monthOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of MATCHES_DATA) {
      const month = m.date ? m.date.slice(0, 7) : '';
      if (/^\d{4}-\d{2}$/.test(month)) counts.set(month, (counts.get(month) || 0) + 1);
    }
    return [...counts.entries()]
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => b.month.localeCompare(a.month));
  }, []);

  const maxMatchId = useMemo(
    () => MATCHES_DATA.reduce((max, m) => Math.max(max, m.id), 0),
    []
  );

  // Filter and sort matches
  const filteredMatches = useMemo(() => {
    let result = [...MATCHES_DATA];

    // Filter by search query
    if (deferredSearchQuery && typeof deferredSearchQuery === 'string' && deferredSearchQuery.trim()) {
      const q = deferredSearchQuery.toLowerCase().trim();
      const numQuery = q.replace(/#/g, '').replace(/golfatina/g, '').trim();

      result = result.filter((m) => {
        if (!m) return false;
        const titleMatch = m.title ? m.title.toLowerCase().includes(q) : false;
        const playerMatch = Array.isArray(m.players) 
          ? m.players.some((p) => p && p.name && p.name.toLowerCase().includes(q)) 
          : false;
        const idMatch = Boolean(numQuery && !isNaN(Number(numQuery)) && String(m.id) === numQuery);
        const dateMatch = m.date ? m.date.toLowerCase().includes(q) : false;
        const channelMatch = m.channel ? m.channel.toLowerCase().includes(q) : false;
        const commMatch = m.sdrogoCommentary ? m.sdrogoCommentary.toLowerCase().includes(q) : false;
        return titleMatch || playerMatch || idMatch || dateMatch || channelMatch || commMatch;
      });
    }

    // Filter by publisher channel (exact match on uploader, never on title)
    if (channelFilter !== 'all') {
      result = result.filter((m) => (m.channel || 'Sconosciuto') === channelFilter);
    }

    // Filter by publication month (YYYY-MM)
    if (selectedMonthFilter !== 'all') {
      result = result.filter((m) => m.date && m.date.slice(0, 7) === selectedMonthFilter);
    }

    // Sort matches
    switch (sortBy) {
      case 'id-asc':
        result.sort((a, b) => a.id - b.id);
        break;
      case 'id-desc':
        result.sort((a, b) => b.id - a.id);
        break;
      case 'date-desc':
        result.sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0));
        break;
      case 'hios':
        result.sort((a, b) => b.totalHIOs - a.totalHIOs);
        break;
      case 'disasters':
        result.sort((a, b) => b.maxHoleScore - a.maxHoleScore);
        break;
    }

    return result;
  }, [deferredSearchQuery, channelFilter, selectedMonthFilter, sortBy]);

  const resetAllFilters = () => {
    sound.playClick();
    setSearchQuery('');
    setChannelFilter('all');
    setSelectedMonthFilter('all');
    setSortBy('id-desc');
    setVisibleCount(12);
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    channelFilter !== 'all' || selectedMonthFilter !== 'all';

  return (
    <div className="space-y-6">
      
      {/* Controls & Telemetry Filter Console */}
      <div className="premium-card specular-top p-4 sm:p-5 rounded-2xl space-y-4">
        
        {/* Top Controls Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4af37]/70 pointer-events-none" />
            <input
              type="text"
              placeholder="Cerca per titolo, numero episodio (#29), giocatore, canale, data..."
              aria-label="Cerca le Golfatine"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl premium-input text-slate-100 placeholder-slate-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Cancella ricerca"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowDownUp className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
            <select
              value={sortBy}
              aria-label="Ordina le Golfatine"
              onChange={(e) => {
                sound.playClick();
                setSortBy(e.target.value as any);
              }}
              className="premium-input px-3.5 py-2.5 text-xs font-medium rounded-xl text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="id-desc">Dal più recente (#{maxMatchId} → #1)</option>
              <option value="id-asc">Dal primo episodio (#1 → #{maxMatchId})</option>
              <option value="date-desc">Data pubblicazione (recente prima)</option>
              <option value="hios">Più Hole-in-One</option>
              <option value="disasters">Peggior Disastro / Caos</option>
            </select>
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
              Data:
            </span>
            <select
              value={selectedMonthFilter}
              aria-label="Filtra per mese di pubblicazione"
              onChange={(e) => {
                sound.playClick();
                setSelectedMonthFilter(e.target.value);
              }}
              className="premium-input px-3.5 py-2.5 text-xs font-mono rounded-xl text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">Tutte le date ({MATCHES_DATA.length})</option>
              {monthOptions.map((opt) => (
                <option key={opt.month} value={opt.month}>
                  {opt.month} ({opt.count})
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Youtuber Filter Chips: each player maps to their exact YouTube
            publisher channel (verified). Clicking filters ONLY the videos
            published on that channel — never by title text. */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 no-scrollbar text-xs border-t border-white/[0.06]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 shrink-0 mr-1 flex items-center gap-1.5">
            <Filter className="w-3 h-3 text-[#d4af37]" />
            Canale:
          </span>

          <button
            onClick={() => {
              sound.playClick();
              setChannelFilter('all');
            }}
            className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-all shrink-0 cursor-pointer ${
              channelFilter === 'all'
                ? 'bg-gradient-to-r from-[#f5e6b3] to-[#d4af37] text-slate-950 font-bold shadow-[0_2px_12px_rgba(212,175,55,0.3)]'
                : 'bg-[#080d0a] text-slate-400 hover:text-slate-200 border border-white/[0.07] hover:border-white/[0.15]'
            }`}
          >
            Tutti ({MATCHES_DATA.length})
          </button>

          {ALL_CHANNELS.map((channel) => {
            const isSelected = channelFilter === channel;
            const owner = CHANNEL_OWNERS[channel];
            const avatarImg = owner ? getPlayerAvatar(owner) : undefined;
            const count = channelCounts.get(channel) || 0;

            return (
              <button
                key={channel}
                onClick={() => {
                  sound.playClick();
                  setChannelFilter(channel);
                }}
                title={`Mostra solo i video pubblicati sul canale ${channel}`}
                className={`px-3 py-1.5 rounded-xl font-medium text-xs transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#1a2820] to-[#111b15] text-[#f5e6b3] border border-[#d4af37]/50 shadow-[0_2px_12px_rgba(212,175,55,0.18)] font-bold'
                    : 'bg-[#080d0a] text-slate-400 hover:text-slate-200 border border-white/[0.07] hover:border-white/[0.15]'
                }`}
              >
                {avatarImg && (
                  <div className={`w-4.5 h-4.5 rounded-full overflow-hidden shrink-0 border ${isSelected ? 'border-[#d4af37]' : 'border-white/15'}`}>
                    <img src={avatarImg} alt={owner} className="w-full h-full object-cover" />
                  </div>
                )}
                <span>{channel}</span>
                <span className={`text-[10px] font-mono ${isSelected ? 'text-[#d4af37]' : 'text-slate-500'}`}>({count})</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Results Count Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 px-1">
        <div>
          Mostrando <strong className="text-white font-mono">{filteredMatches.length}</strong> su <strong className="text-white font-mono">{MATCHES_DATA.length}</strong> Schede in archivio <span className="text-slate-500">(98 episodi ufficiali #1–#98)</span>
          {channelFilter !== 'all' && (
            <span className="ml-1 text-slate-400">
              pubblicate da <strong className="text-[#d4af37]">{channelFilter}</strong>
            </span>
          )}
          {selectedMonthFilter !== 'all' && (
            <span className="ml-1 text-slate-400">
              del <strong className="font-mono text-slate-200">{selectedMonthFilter}</strong>
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={resetAllFilters}
            className="text-xs font-semibold text-[#d4af37] hover:text-[#f5e6b3] flex items-center gap-1 cursor-pointer px-2.5 py-1 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/25 transition-colors"
          >
            <X className="w-3 h-3" />
            Azzera filtri
          </button>
        )}
      </div>

      {/* Numbering note: official episodes are #1–#98, archive cards are fewer */}
      <p className="text-[10px] font-mono text-slate-500 px-1 -mt-4">
        Numerazione ufficiale episodi #1–#98 • assenti in archivio: #14–#17 (senza scorecard) e #79 (duplicato del #30) • 93 scorecard complete
      </p>

      {/* Matches Grid (paginated to keep DOM small) */}
      {filteredMatches.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredMatches.slice(0, visibleCount).map((match, idx) => (
              <MatchCard
                key={match.id}
                match={match}
                isAboveFold={idx < 3}
                onOpenModal={onOpenModal}
                onSelectPlayer={onSelectPlayer}
                onSelectChannel={onSelectChannel}
                onOpenShare={onOpenShare}
              />
            ))}
          </div>
          {visibleCount < filteredMatches.length && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => {
                  sound.playClick();
                  setVisibleCount((c) => c + 12);
                }}
                className="px-6 py-3 rounded-xl premium-card premium-card-hover text-xs font-heading font-bold text-[#f5e6b3] hover:text-white transition-all cursor-pointer border border-[#d4af37]/30 flex items-center gap-2"
              >
                <span>Mostra altre {Math.min(12, filteredMatches.length - visibleCount)} di {filteredMatches.length} Golfatine</span>
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="premium-card p-12 text-center rounded-2xl space-y-3">
          <Search className="w-8 h-8 text-[#d4af37]/60 mx-auto" />
          <h3 className="text-base font-bold text-white font-heading">Nessuna Golfatina trovata</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Nessun episodio corrisponde ai criteri di ricerca attuali. Prova a cercare un altro numero di episodio o nome giocatore.
          </p>
          <button
            onClick={resetAllFilters}
            className="px-4 py-2 rounded-xl gold-badge text-xs font-semibold transition-all cursor-pointer"
          >
            Ripristina tutti gli episodi
          </button>
        </div>
      )}

    </div>
  );
};

export const GolfatineGrid = React.memo(GolfatineGridComponent);

