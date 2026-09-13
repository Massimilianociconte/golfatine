import React, { useEffect, useState, useRef } from 'react';
import { 
  X, 
  Play, 
  Trophy, 
  Target, 
  Flame, 
  ExternalLink, 
  Calendar, 
  Share2, 
  Award, 
  TrendingUp, 
  Info,
  CheckCircle2,
  Clock,
  Sparkles,
  Coins,
  Tv
} from 'lucide-react';
import { GolfatinaMatch } from '../data/golfatineData';
import { sound } from '../utils/audio';
import { triggerVictoryConfetti } from '../utils/confetti';
import { getPlayerAvatar } from '../utils/playerAvatars';
import { 
  recordWatchProgress, 
  getMatchWatchSession, 
  REQUIRED_WATCH_SECONDS 
} from '../utils/userStore';

interface MatchModalProps {
  match: GolfatinaMatch;
  onClose: () => void;
  initialView?: 'scorecard' | 'video' | 'graph';
  onSelectPlayer?: (playerName: string) => void;
  onSelectChannel?: (channel: string) => void;
  onOpenShare?: (match: GolfatinaMatch) => void;
}

export const MatchModal: React.FC<MatchModalProps> = ({
  match,
  onClose,
  initialView = 'scorecard',
  onSelectPlayer,
  onSelectChannel,
  onOpenShare
}) => {
  const isVideoOnly = match.hasScorecard === false || (match.players ?? []).length === 0;
  const resolvedInitialView = isVideoOnly ? 'video' : initialView;
  const [activeView, setActiveView] = useState<'scorecard' | 'video' | 'graph'>(resolvedInitialView);

  // Watch Time Tracker State
  const initialSession = getMatchWatchSession(match.id);
  const [watchSeconds, setWatchSeconds] = useState<number>(initialSession.watchSeconds);
  const [isCompleted, setIsCompleted] = useState<boolean>(initialSession.isCompleted);
  const [justRewarded, setJustRewarded] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Reset view + watch session when a different match is loaded into the
  // already-mounted modal (e.g. browser back/forward between deep links).
  useEffect(() => {
    setActiveView(match.hasScorecard === false || (match.players ?? []).length === 0 ? 'video' : initialView);
    const session = getMatchWatchSession(match.id);
    setWatchSeconds(session.watchSeconds);
    setIsCompleted(session.isCompleted);
    setJustRewarded(false);
    setIsPlaying(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.id]);

  // Watch Time Active Tracking Effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    if (activeView === 'video' && !isCompleted && isPlaying) {
      timer = setInterval(() => {
        // Only count if window/document is active and visible (Anti-Abuse)
        if (document.visibilityState === 'visible') {
          const result = recordWatchProgress(match.id, 1);
          setWatchSeconds(result.currentSeconds);

          if (result.justCompleted) {
            setIsCompleted(true);
            setJustRewarded(true);
            sound.playHIOFanfare();
            triggerVictoryConfetti();
            setTimeout(() => setJustRewarded(false), 6000);
          }
        }
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeView, isCompleted, isPlaying, match.id]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        sound.playClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const getHoleCellStyle = (score: number | null) => {
    if (score === null || score === undefined) {
      return 'bg-[#0b0f0d] text-slate-600';
    }
    if (score === 1) {
      return 'bg-[#2b2410] text-[#fbbf24] border border-[#785d18] font-bold';
    }
    if (score === 2) {
      return 'bg-[#0f2419] text-[#4ade80] border border-[#1b4e33] font-medium';
    }
    if (score === 3) {
      return 'bg-[#111714] text-slate-300 border border-white/[0.06]';
    }
    if (score === 4) {
      return 'bg-[#23170e] text-[#fb923c] border border-[#522b13]';
    }
    if (score >= 5 && score < 10) {
      return 'bg-[#261314] text-[#f87171] border border-[#5a2123]';
    }
    return 'bg-[#3b1214] text-[#ef4444] border border-[#7f1d1d] font-bold';
  };

  const getPositionBadge = (pos: number) => {
    switch (pos) {
      case 1:
        return <span className="text-xs font-mono font-bold text-[#d4af37]">1°</span>;
      case 2:
        return <span className="text-xs font-mono font-bold text-slate-300">2°</span>;
      case 3:
        return <span className="text-xs font-mono font-bold text-amber-600">3°</span>;
      default:
        return <span className="text-xs font-mono text-slate-500">{pos}°</span>;
    }
  };

  const maxHoles = Math.max(...(match.players ?? []).map(p => p.holes.length), 18);
  const parBase = match.totalPar > 0 ? match.totalPar : 60;
  const holeIndices = Array.from({ length: maxHoles }, (_, i) => i + 1);
  const progressPercent = Math.min(100, Math.round((watchSeconds / REQUIRED_WATCH_SECONDS) * 100));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Dettaglio ${match.title}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto backdrop-blur-md bg-black/80 animate-in fade-in duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      
      {/* Modal Container */}
      <div
        className="relative w-full max-w-5xl bg-[#090d0b] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        
        {/* Sticky Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-[#0c120f]/95 backdrop-blur-md flex items-center justify-between gap-4 sticky top-0 z-20">
          
          <div className="flex items-center gap-3 truncate">
            <div className="px-2.5 py-1 rounded-lg bg-[#141d18] border border-white/[0.08] text-white font-mono font-bold text-xs shrink-0">
              #{match.id}
            </div>

            <div className="truncate">
              <h2 className="text-base sm:text-lg font-bold text-white font-heading truncate">
                {match.title}
              </h2>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1 font-mono">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  {match.date}
                </span>
                <span>•</span>
                {isVideoOnly ? (
                  <span className="font-mono font-bold text-amber-300">
                    Video in archivio — scorecard in arrivo
                  </span>
                ) : (
                  <>
                    <span className="font-mono font-medium text-slate-300">
                      Par {match.totalPar}
                    </span>
                    <span>•</span>
                    <span>{match.players.length} giocatori</span>
                  </>
                )}
                {match.channel && (
                  <>
                    <span>•</span>
                    <button
                      onClick={() => {
                        if (onSelectChannel) onSelectChannel(match.channel);
                      }}
                      title={`Mostra tutti i video pubblicati da ${match.channel}`}
                      className="flex items-center gap-1 font-semibold text-red-300 hover:text-red-200 hover:underline cursor-pointer"
                    >
                      <Tv className="w-3 h-3" />
                      <span>{match.channel}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {match.url && (
              <a
                href={match.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sound.playClick()}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-semibold transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                <span>YouTube</span>
              </a>
            )}

            <button
              onClick={() => {
                if (onOpenShare) onOpenShare(match);
              }}
              aria-label="Condividi Story Wrapped"
              className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-[#d4af37] transition-colors border border-white/[0.06] cursor-pointer"
              title="Condividi Story Wrapped"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              aria-label="Chiudi dettaglio partita"
              className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors border border-white/[0.06] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Modal Navigation Bar & Watch Progress Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-2.5 border-b border-white/[0.06] bg-[#070b09] gap-2 text-xs">
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (isVideoOnly) return;
                sound.playClick();
                setActiveView('scorecard');
              }}
              disabled={isVideoOnly}
              title={isVideoOnly ? 'Scorecard in trascrizione' : undefined}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${isVideoOnly ? 'text-slate-600 cursor-not-allowed' : 'cursor-pointer'} ${
                activeView === 'scorecard'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Scorecard 18 Buche
            </button>

            {match.youtubeId && (
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveView('video');
                }}
                className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'video'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Video YouTube</span>
              </button>
            )}

            <button
              onClick={() => {
                if (isVideoOnly) return;
                sound.playClick();
                setActiveView('graph');
              }}
              disabled={isVideoOnly}
              title={isVideoOnly ? 'Grafico disponibile con la scorecard' : undefined}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${isVideoOnly ? 'text-slate-600 cursor-not-allowed' : 'cursor-pointer'} ${
                activeView === 'graph'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Grafico Colpi
            </button>
          </div>

          {/* Watch Time Progress Tracker Indicator */}
          <div className="flex items-center gap-2.5 bg-[#0e1411] px-3 py-1 rounded-lg border border-white/[0.08] font-mono text-[11px]">
            {isCompleted ? (
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Episodio Visto (+50 PTS)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Watch: {watchSeconds}s / {REQUIRED_WATCH_SECONDS}s</span>
                <div className="w-16 h-1.5 rounded-full bg-black/60 overflow-hidden border border-white/10">
                  <div 
                    className="h-full bg-gradient-to-r from-[#d4af37] to-emerald-400 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#d4af37] font-bold">+50 PTS</span>
              </div>
            )}
          </div>

        </div>

        {/* Reward Notification Banner */}
        {justRewarded && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 p-3 text-center text-xs font-bold text-emerald-300 flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
            <Coins className="w-4 h-4 text-[#d4af37]" />
            <span>Soglia di visione raggiunta! Hai guadagnato +50 SdrogoPoints per il tuo profilo!</span>
          </div>
        )}

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* VIEW: VIDEO EMBED WITH WATCH TRACKER */}
          {activeView === 'video' && match.youtubeId && (
            <div className="space-y-3 animate-in fade-in">
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/[0.1] shadow-2xl">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${match.youtubeId}?autoplay=1&enablejsapi=1`}
                  title={match.title}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 bg-[#0c120f] p-3 rounded-xl border border-white/[0.06] gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#d4af37]" />
                  <span>
                    Il timer misura il tempo effettivo di visione. Guarda almeno {REQUIRED_WATCH_SECONDS} secondi per riscattare i 50 crediti.
                  </span>
                </div>

                <div className="font-mono text-white font-bold">
                  {isCompleted ? '✓ 50 Crediti Assegnati' : `${watchSeconds}/${REQUIRED_WATCH_SECONDS}s maturati`}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: SCORECARD */}
          {activeView === 'scorecard' && (
            isVideoOnly ? (
              <div className="premium-card p-6 rounded-xl text-center space-y-2">
                <p className="text-sm font-bold text-amber-300">Scorecard in trascrizione</p>
                <p className="text-xs text-slate-400">Questo episodio è archiviato come video. La scorecard buca-per-buca verrà pubblicata appena disponibile — intanto guarda il video YouTube.</p>
              </div>
            ) : (
            <div className="space-y-6 animate-in fade-in">
              
              <div className="rounded-xl border border-white/[0.08] overflow-hidden bg-[#0a0e0c]">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse tabular-nums">
                    
                    <thead>
                      <tr className="bg-[#0f1512] text-slate-400 font-semibold border-b border-white/[0.08]">
                        <th className="py-2.5 px-3 sticky left-0 bg-[#0f1512] z-10 w-44">Giocatore</th>
                        <th className="py-2.5 px-2 text-center w-12 text-[#d4af37]">Tot</th>
                        <th className="py-2.5 px-2 text-center w-12">+/-</th>
                        {holeIndices.map((h) => (
                          <th key={h} className="py-2.5 px-1.5 text-center min-w-[28px] text-slate-500 font-mono text-[10px]">
                            B{h}
                          </th>
                        ))}
                        <th className="py-2.5 px-2 text-center text-amber-400">HIO</th>
                        <th className="py-2.5 px-2 text-center text-rose-400">10+</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-white/[0.04]">
                      {match.players.map((p, pIdx) => {
                        const isWinner = p.position === 1;

                        return (
                          <tr 
                            key={pIdx}
                            className={`hover:bg-white/[0.02] transition-colors ${
                              isWinner ? 'bg-white/[0.02]' : ''
                            }`}
                          >
                            <td className={`py-2.5 px-3 sticky left-0 z-10 border-r border-white/[0.06] ${
                              isWinner ? 'bg-[#0f1512] font-bold text-white' : 'bg-[#0a0e0c] text-slate-300'
                            }`}>
                              <div className="flex items-center gap-2">
                                {getPositionBadge(p.position)}
                                <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-white/10">
                                  <img src={getPlayerAvatar(p.name)} alt={p.name} className="w-full h-full object-cover" />
                                </div>
                                <button
                                  onClick={() => {
                                    if (onSelectPlayer) {
                                      onClose();
                                      onSelectPlayer(p.name);
                                    }
                                  }}
                                  className="truncate hover:text-[#d4af37] text-left cursor-pointer"
                                >
                                  {p.name}
                                </button>
                              </div>
                            </td>

                            <td className="py-2.5 px-2 text-center font-mono font-bold text-white bg-white/[0.01]">
                              {p.totalScore}
                            </td>

                            <td className="py-2.5 px-2 text-center font-mono font-medium">
                              <span className={`text-[11px] font-bold ${
                                p.diffPar < 0 ? 'text-emerald-400' : p.diffPar === 0 ? 'text-slate-400' : 'text-rose-400'
                              }`}>
                                {p.diffPar > 0 ? `+${p.diffPar}` : p.diffPar === 0 ? 'E' : p.diffPar}
                              </span>
                            </td>

                            {holeIndices.map((hIdx) => {
                              const holeScore = p.holes[hIdx - 1];
                              return (
                                <td key={hIdx} className="py-1 px-1 text-center">
                                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-[11px] font-mono ${getHoleCellStyle(holeScore)}`}>
                                    {holeScore !== undefined && holeScore !== null ? holeScore : '-'}
                                  </span>
                                </td>
                              );
                            })}

                            <td className="py-2.5 px-2 text-center font-mono font-bold text-[#d4af37]">
                              {p.hios > 0 ? p.hios : '-'}
                            </td>

                            <td className="py-2.5 px-2 text-center font-mono font-bold text-rose-400">
                              {p.disasters > 0 ? p.disasters : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>

                  </table>
                </div>
              </div>

            </div>
            )
          )}

          {/* VIEW: GRAPH */}
          {activeView === 'graph' && (
            isVideoOnly ? (
              <div className="premium-card p-6 rounded-xl text-center space-y-2">
                <p className="text-sm font-bold text-amber-300">Grafico non disponibile</p>
                <p className="text-xs text-slate-400">Il grafico dei colpi verrà generato con la pubblicazione della scorecard.</p>
              </div>
            ) : (
            <div className="space-y-4 animate-in fade-in">
              <div className="premium-card p-5 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-[#d4af37]" />
                    Progressione Cumulativa dei Colpi Buca per Buca
                  </span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    Più la linea è bassa, migliore è la prestazione
                  </span>
                </div>

                <div className="w-full h-64 relative bg-[#070a08] rounded-lg p-2 border border-white/[0.06]">
                  <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${maxHoles * 30} 180`}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <line
                        key={i}
                        x1="0"
                        y1={i * 40}
                        x2={maxHoles * 30}
                        y2={i * 40}
                        stroke="rgba(255,255,255,0.05)"
                        strokeDasharray="2 2"
                      />
                    ))}

                    {match.players.map((p, pIdx) => {
                      const colors = ['#d4af37', '#60a5fa', '#34d399', '#f87171', '#c084fc', '#fb923c', '#e879f9'];
                      const playerColor = colors[pIdx % colors.length];

                      let cumulative = 0;
                      const points = p.holes.map((h, i) => {
                        cumulative += (h || 3);
                        const x = i * 30 + 15;
                        const y = 170 - (cumulative / (parBase * 1.5)) * 140;
                        return `${x},${Math.max(10, Math.min(170, y))}`;
                      }).join(' ');

                      return (
                        <g key={pIdx}>
                          <polyline
                            fill="none"
                            stroke={playerColor}
                            strokeWidth={p.position === 1 ? '2.5' : '1.5'}
                            strokeOpacity={p.position === 1 ? '1' : '0.7'}
                            points={points}
                          />
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                  {match.players.map((p, pIdx) => {
                    const colors = ['#d4af37', '#60a5fa', '#34d399', '#f87171', '#c084fc', '#fb923c', '#e879f9'];
                    return (
                      <div key={pIdx} className="flex items-center gap-1.5 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[pIdx % colors.length] }} />
                        <span className="text-slate-300 font-medium">{p.name}</span>
                        <span className="font-mono text-slate-500 text-[10px]">({p.totalScore})</span>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
            )
          )}

          {/* Melagoodo Commentary & Cult Moments */}
          <div className="premium-card p-4 rounded-xl border-l-2 border-[#d4af37] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#d4af37]">
              <Info className="w-3.5 h-3.5" />
              <span>Cronaca & Momenti Cult</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
              "{match.sdrogoCommentary}"
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
