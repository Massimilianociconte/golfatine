import React, { useState } from 'react';
import { 
  Play, 
  Trophy, 
  Target, 
  Flame, 
  Calendar, 
  ExternalLink, 
  ChevronRight, 
  Eye, 
  Check,
  Share2,
  Tv
} from 'lucide-react';
import { GolfatinaMatch } from '../data/golfatineData';
import { sound } from '../utils/audio';
import { getPlayerAvatar } from '../utils/playerAvatars';
import { isMatchWatched } from '../utils/userStore';

// Helper functions hoisted to module scope to avoid re-creation on renders
const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

function formatDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const year = parts[0];
      return `${day} ${MONTHS[monthIndex] || parts[1]} ${year}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function getPositionBadge(pos: number) {
  switch (pos) {
    case 1:
      return <span className="text-[11px] font-mono font-bold text-[#d4af37]">1°</span>;
    case 2:
      return <span className="text-[11px] font-mono font-bold text-slate-300">2°</span>;
    case 3:
      return <span className="text-[11px] font-mono font-bold text-amber-600">3°</span>;
    default:
      return <span className="text-[11px] font-mono text-slate-400">{pos}°</span>;
  }
}

function getDiffParBadge(diff: number) {
  if (diff < 0) {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0e2417] text-emerald-400 border border-emerald-500/20">
        {diff}
      </span>
    );
  } else if (diff === 0) {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#141b17] text-slate-400 border border-white/[0.08]">
        E
      </span>
    );
  } else {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#261314] text-rose-400 border border-rose-500/20">
        +{diff}
      </span>
    );
  }
}

interface MatchCardProps {
  match: GolfatinaMatch;
  onOpenModal: (match: GolfatinaMatch, initialView?: 'scorecard' | 'video' | 'graph') => void;
  onSelectPlayer?: (playerName: string) => void;
  onSelectChannel?: (channel: string) => void;
  onOpenShare?: (match: GolfatinaMatch) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onOpenModal,
  onSelectPlayer,
  onSelectChannel,
  onOpenShare
}) => {

  const [imgError, setImgError] = useState(false);
  const watched = isMatchWatched(match.id);
  const hasScorecard = match.hasScorecard !== false && (match.players ?? []).length > 0;

  const handleCardClick = () => {
    sound.playPuttInHole();
    onOpenModal(match, hasScorecard ? undefined : 'video');
  };

  const handleWatchAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    onOpenModal(match, 'video');
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playPuttInHole();
    onOpenModal(match, 'video');
  };

  const thumbnailSrc = match.youtubeId && !imgError
    ? `https://i.ytimg.com/vi/${match.youtubeId}/mqdefault.jpg`
    : `https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=640&auto=format&fit=crop&q=80`;

  return (
    <div className="premium-card premium-card-hover rounded-2xl overflow-hidden flex flex-col justify-between group relative transition-all">
      
      {/* Thumbnail Header */}
      <div>
        <div 
          onClick={handleVideoClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleVideoClick(e as unknown as React.MouseEvent);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`Guarda il video della Golfatina ${match.id}`}
          className="relative aspect-video w-full overflow-hidden bg-black cursor-pointer"
        >
          <img
            src={thumbnailSrc}
            alt={match.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300 opacity-90 group-hover:opacity-100"
            loading="lazy"
            decoding="async"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e1411] via-transparent to-black/50" />

          {/* Top Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
            <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-white font-mono font-bold text-[11px] border border-white/10 shadow">
              Golfatina #{match.id}
            </span>
            {hasScorecard ? (
              <span className="px-2 py-0.5 rounded-md bg-[#0e1411]/90 backdrop-blur-md text-slate-300 font-mono text-[10px] border border-white/[0.08]">
                Par {match.totalPar}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/90 backdrop-blur-md text-black font-mono font-bold text-[10px] border border-amber-200/50">
                SCORECARD IN ARRIVO
              </span>
            )}
          </div>

          {/* Hover Play Circle */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-xl transform group-hover:scale-105 transition-transform">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
          </div>

          {/* Bottom Date inside thumbnail */}
          <div className="absolute bottom-2 left-2.5 flex items-center gap-1 text-[10px] font-medium text-slate-300 bg-black/70 px-2 py-0.5 rounded border border-white/5">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{formatDate(match.date)}</span>
          </div>

          {/* Watched Badge */}
          {watched && (
            <div className="absolute bottom-2 right-2.5 flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-300 bg-emerald-950/90 px-2 py-0.5 rounded border border-emerald-500/30">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Visto</span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-3.5">
          
          {/* Title */}
          <h3
            onClick={handleCardClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardClick();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Apri il dettaglio della Golfatina ${match.id}`}
            className="text-sm font-bold text-white font-heading line-clamp-2 hover:text-[#f3e8c8] transition-colors cursor-pointer leading-snug"
            title={match.title}
          >
            {match.title}
          </h3>

          {/* Publisher channel (click filters by uploader, not by title) */}
          {match.channel && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                sound.playClick();
                if (onSelectChannel) onSelectChannel(match.channel);
              }}
              title={`Mostra tutti i video pubblicati da ${match.channel}`}
              className="self-start flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-950/40 hover:bg-red-900/50 text-red-300 hover:text-red-200 border border-red-500/25 text-[10px] font-semibold transition-colors cursor-pointer"
            >
              <Tv className="w-3 h-3 shrink-0" />
              <span className="truncate">{match.channel}</span>
            </button>
          )}

          {/* Podium Rows */}
          <div className="space-y-1 bg-[#090d0b] p-2.5 rounded-xl border border-white/[0.05]">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
              <span>Podio Finale</span>
              <span className="text-slate-400 font-normal">{hasScorecard ? `${match.players.length} giocatori` : 'Video in archivio'}</span>
            </div>

            {hasScorecard ? (
            match.players.slice(0, 3).map((p, idx) => (
              <div 
                key={idx} 
                className={`flex items-center justify-between text-xs py-1 px-1.5 rounded transition-colors ${
                  p.position === 1 ? 'bg-white/[0.03] font-semibold text-white' : 'text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {getPositionBadge(p.position)}
                  <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 border border-white/10">
                    <img src={getPlayerAvatar(p.name)} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectPlayer) onSelectPlayer(p.name);
                    }}
                    className="truncate hover:text-white hover:underline cursor-pointer text-left text-xs"
                  >
                    {p.name}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-mono text-xs text-slate-400 tabular-nums">{p.totalScore}</span>
                  {getDiffParBadge(p.diffPar)}
                </div>
              </div>
            ))
            ) : (
              <p className="text-[11px] text-amber-200/90 leading-snug px-1 py-1">
                Scorecard in trascrizione — apri il video YouTube per guardare l'episodio completo.
              </p>
            )}
          </div>

          {/* Match Insight Badges */}
          {hasScorecard && (
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex items-center gap-1.5 bg-[#0a0e0c] px-2 py-1 rounded border border-white/[0.04]">
              <Target className="w-3 h-3 text-[#d4af37]" />
              <span className="text-slate-400 font-mono">
                <strong className="text-slate-200">{match.totalHIOs}</strong> HIO
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#0a0e0c] px-2 py-1 rounded border border-white/[0.04]">
              <Flame className="w-3 h-3 text-rose-400" />
              <span className="text-slate-400 truncate font-mono">
                Max: <strong className="text-slate-200">{match.maxHoleScore}</strong> colpi
              </span>
            </div>
          </div>
          )}

          {/* Commentary snippet */}
          <p className="text-[11px] text-slate-400 italic bg-[#0a0e0c] p-2 rounded border-l-2 border-[#d4af37]/60 line-clamp-2">
            "{match.sdrogoCommentary}"
          </p>

        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 pt-0">
        <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between gap-2">
          
          <button
            onClick={hasScorecard ? handleCardClick : handleWatchAction}
            className="flex-1 py-1.5 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 border border-white/[0.08] cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>{hasScorecard ? 'Scorecard' : 'Guarda Video'}</span>
          </button>

          {/* Watch Status Badge */}
          <button
            onClick={handleWatchAction}
            aria-label={watched ? "Episodio visto" : "Guarda il video"}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              watched 
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40' 
                : 'bg-[#0a0e0c] text-slate-500 border-white/[0.08] hover:text-[#d4af37]'
            }`}
            title={watched ? "Episodio Visto (+50 PTS)" : "Guarda Video (+50 PTS)"}
          >
            <Check className="w-3.5 h-3.5" />
          </button>

          {/* Social Story Wrapped */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              sound.playClick();
              if (onOpenShare) onOpenShare(match);
            }}
            aria-label="Genera Story Spotify Wrapped"
            className="p-1.5 rounded-lg bg-[#0a0e0c] hover:bg-[#15201a] text-slate-400 hover:text-[#d4af37] border border-white/[0.08] transition-colors cursor-pointer"
            title="Genera Story Spotify Wrapped"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {/* YouTube Link */}
          {match.url && (
            <a
              href={match.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                sound.playClick();
              }}
              className="p-1.5 rounded-lg bg-[#0a0e0c] hover:bg-red-600 text-slate-400 hover:text-white transition-colors border border-white/[0.08]"
              aria-label="Guarda su YouTube"
              title="Guarda su YouTube"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

    </div>
  );
};


