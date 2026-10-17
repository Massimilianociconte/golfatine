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
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-gradient-to-br from-[#f5e6b3] to-[#d4af37] text-slate-950 text-[10px] font-mono font-black shadow-sm shrink-0">
          1°
        </span>
      );
    case 2:
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-slate-300/15 border border-slate-300/30 text-slate-200 text-[10px] font-mono font-bold shrink-0">
          2°
        </span>
      );
    case 3:
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-amber-600/20 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold shrink-0">
          3°
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-white/[0.04] text-slate-400 text-[10px] font-mono shrink-0">
          {pos}°
        </span>
      );
  }
}

function getDiffParBadge(diff: number) {
  if (diff < 0) {
    return (
      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/25 min-w-[30px] text-center">
        {diff}
      </span>
    );
  } else if (diff === 0) {
    return (
      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#141b17] text-slate-400 border border-white/[0.08] min-w-[30px] text-center">
        E
      </span>
    );
  } else {
    return (
      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-950/70 text-rose-400 border border-rose-500/25 min-w-[30px] text-center">
        +{diff}
      </span>
    );
  }
}

interface MatchCardProps {
  match: GolfatinaMatch;
  isAboveFold?: boolean;
  onOpenModal: (match: GolfatinaMatch, initialView?: 'scorecard' | 'video' | 'graph') => void;
  onSelectPlayer?: (playerName: string) => void;
  onSelectChannel?: (channel: string) => void;
  onOpenShare?: (match: GolfatinaMatch) => void;
}

const MatchCardComponent: React.FC<MatchCardProps> = ({
  match,
  isAboveFold = false,
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
    <article
      className={`premium-card premium-card-hover rounded-2xl overflow-hidden flex flex-col justify-between group relative ${
        !isAboveFold ? 'cv-card' : ''
      }`}
    >
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
          className="relative aspect-video w-full overflow-hidden bg-[#050806] cursor-pointer"
        >
          <img
            src={thumbnailSrc}
            alt={match.title}
            width={320}
            height={180}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out opacity-90 group-hover:opacity-100"
            loading={isAboveFold ? 'eager' : 'lazy'}
            decoding="async"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b110d] via-black/15 to-black/55" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <span className="px-2.5 py-1 rounded-lg bg-[#050806]/85 backdrop-blur-md text-white font-mono font-bold text-[11px] border border-white/15 shadow-lg flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
              <span>Golfatina #{match.id}</span>
            </span>
            {hasScorecard ? (
              <span className="px-2.5 py-1 rounded-lg bg-[#0b120e]/90 backdrop-blur-md text-[#f5e6b3] font-mono font-bold text-[10px] border border-[#d4af37]/30 shadow">
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
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#f5e6b3] to-[#d4af37] text-slate-950 flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.6)] transform group-hover:scale-105 transition-transform">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
          </div>

          {/* Bottom Date inside thumbnail */}
          <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 text-[10px] font-mono font-medium text-slate-200 bg-[#050806]/80 backdrop-blur-sm px-2.5 py-0.5 rounded-md border border-white/10">
            <Calendar className="w-3 h-3 text-[#d4af37]" />
            <span>{formatDate(match.date)}</span>
          </div>

          {/* Watched Badge */}
          {watched && (
            <div className="absolute bottom-2.5 right-3 flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-300 bg-emerald-950/90 px-2 py-0.5 rounded-md border border-emerald-500/40 shadow">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Visto</span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5 space-y-3.5">
          
          {/* Channel + Title Header */}
          <div className="space-y-2">
            {match.channel && (
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sound.playClick();
                    if (onSelectChannel) onSelectChannel(match.channel);
                  }}
                  title={`Mostra tutti i video pubblicati da ${match.channel}`}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-950/45 hover:bg-rose-900/55 text-rose-300 hover:text-rose-200 border border-rose-500/25 text-[10px] font-semibold transition-colors cursor-pointer"
                >
                  <Tv className="w-3 h-3 shrink-0" />
                  <span className="truncate">{match.channel}</span>
                </button>
                {hasScorecard && (
                  <span className="text-[10px] font-mono text-slate-400">
                    {match.players.length} giocatori
                  </span>
                )}
              </div>
            )}

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
              className="text-sm sm:text-[15px] font-bold text-white font-heading line-clamp-2 hover:text-[#f5e6b3] transition-colors cursor-pointer leading-snug"
              title={match.title}
            >
              {match.title}
            </h3>
          </div>

          {/* Podium Standings Box */}
          <div className="space-y-1.5 bg-[#070b09]/95 p-3 rounded-xl border border-white/[0.06] shadow-inner">
            <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1 text-[#f5e6b3]">
                <Trophy className="w-3 h-3 text-[#d4af37]" />
                <span>Podio Ufficiale</span>
              </span>
              <span className="text-slate-500 font-normal">{hasScorecard ? 'Colpi / Par' : 'Video in archivio'}</span>
            </div>

            {hasScorecard ? (
              match.players.slice(0, 3).map((p, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between text-xs py-1.5 px-2 rounded-lg transition-colors ${
                    p.position === 1
                      ? 'bg-gradient-to-r from-[#d4af37]/12 via-[#d4af37]/5 to-transparent border border-[#d4af37]/25 font-bold text-white'
                      : 'text-slate-300 hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {getPositionBadge(p.position)}
                    <div className={`w-4.5 h-4.5 rounded-full overflow-hidden shrink-0 border ${p.position === 1 ? 'border-[#d4af37]' : 'border-white/15'}`}>
                      <img src={getPlayerAvatar(p.name)} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectPlayer) onSelectPlayer(p.name);
                      }}
                      className="truncate hover:text-[#f5e6b3] hover:underline cursor-pointer text-left text-xs"
                    >
                      {p.name}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs font-semibold text-slate-300 tabular-nums">{p.totalScore}</span>
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

          {/* Match Telemetry Insights */}
          {hasScorecard && (
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="flex items-center justify-between bg-[#080d0a] px-2.5 py-1.5 rounded-lg border border-white/[0.05]">
                <span className="flex items-center gap-1 text-slate-400">
                  <Target className="w-3 h-3 text-[#d4af37]" />
                  <span>HIO</span>
                </span>
                <strong className="text-white font-mono text-xs">{match.totalHIOs}</strong>
              </div>
              <div className="flex items-center justify-between bg-[#080d0a] px-2.5 py-1.5 rounded-lg border border-white/[0.05]">
                <span className="flex items-center gap-1 text-slate-400">
                  <Flame className="w-3 h-3 text-rose-400" />
                  <span>Max Buca</span>
                </span>
                <strong className="text-rose-300 font-mono text-xs">{match.maxHoleScore} colpi</strong>
              </div>
            </div>
          )}

          {/* Commentary snippet */}
          <p className="text-[11px] text-slate-300/90 italic bg-[#080d0a] p-2.5 rounded-xl border-l-2 border-[#d4af37]/70 line-clamp-2 leading-relaxed">
            "{match.sdrogoCommentary}"
          </p>

        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 sm:p-5 pt-0">
        <div className="pt-3 border-t border-white/[0.07] flex items-center justify-between gap-2">
          
          <button
            onClick={hasScorecard ? handleCardClick : handleWatchAction}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-b from-white/[0.07] to-white/[0.03] hover:from-[#d4af37]/20 hover:to-[#d4af37]/10 hover:border-[#d4af37]/40 text-slate-100 hover:text-[#f5e6b3] font-heading font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 border border-white/[0.09] cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>{hasScorecard ? 'Scorecard 18 Buche' : 'Guarda Video'}</span>
          </button>

          {/* Watch Status Badge */}
          <button
            onClick={handleWatchAction}
            aria-label={watched ? "Episodio visto" : "Guarda il video"}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              watched 
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40' 
                : 'bg-[#080d0a] text-slate-400 border-white/[0.08] hover:text-[#d4af37] hover:border-[#d4af37]/30'
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
            className="p-2 rounded-xl bg-[#080d0a] hover:bg-[#142019] text-slate-400 hover:text-[#d4af37] border border-white/[0.08] hover:border-[#d4af37]/30 transition-colors cursor-pointer"
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
              className="p-2 rounded-xl bg-[#080d0a] hover:bg-red-600 text-slate-400 hover:text-white transition-colors border border-white/[0.08]"
              aria-label="Guarda su YouTube"
              title="Guarda su YouTube"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

    </article>
  );
};

export const MatchCard = React.memo(MatchCardComponent);



