import React, { useMemo } from 'react';
import { 
  Trophy, 
  Flame, 
  Sparkles, 
  Play, 
  Award, 
  Coins, 
  Target, 
  TrendingDown, 
  Zap, 
  Brain,
  Dices,
  ChevronRight,
  CreditCard
} from 'lucide-react';
import { GLOBAL_SUMMARY, PLAYERS_LIST } from '../data/golfatineData';
import { UPCOMING_MATCH_FORECAST } from '../data/forecastingData';
import { sound } from '../utils/audio';
import { TabType } from './Navbar';
import { HeroGayCardWidget } from './HeroGayCardWidget';
import { getPlayerAvatar } from '../utils/playerAvatars';

interface HeroSectionProps {
  onNavigate: (tab: TabType, targetSelector?: string) => void;
  onOpenGayCard: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onNavigate,
  onOpenGayCard
}) => {
  const handleExploreMatches = () => {
    sound.playClick();
    onNavigate('golfatine', '#matches-archive-section');
  };

  const handleNavigateWithScroll = (tab: TabType, targetId: string) => {
    sound.playClick();
    onNavigate(tab, targetId);
  };

  const forecastTop = useMemo(
    () => [...UPCOMING_MATCH_FORECAST.playersForecast].sort(
      (a, b) => b.winProbabilityPercent - a.winProbabilityPercent
    ),
    []
  );
  const forecastFav = forecastTop[0];
  const forecastSecond = forecastTop[1];

  const topWinner = useMemo(
    () => [...PLAYERS_LIST].sort((a, b) => b.wins - a.wins)[0] || PLAYERS_LIST[0],
    []
  );
  const topHioKing = useMemo(
    () => [...PLAYERS_LIST].sort((a, b) => b.totalHIOs - a.totalHIOs)[0] || PLAYERS_LIST[0],
    []
  );
  const hioFrequency = useMemo(
    () => (GLOBAL_SUMMARY.totalHolesPlayed / Math.max(1, GLOBAL_SUMMARY.totalHIOs)).toFixed(1),
    []
  );

  return (
    <section
      aria-label="Panoramica e Record Storici"
      className="relative border-b border-white/[0.07] bg-gradient-to-b from-[#09120d]/90 via-[#060a08]/95 to-[#050806] pt-7 sm:pt-11 pb-9 sm:pb-14 overflow-hidden w-full max-w-full"
    >
      {/* Subtle Architectural Radial Spotlights (Zero-Repaint Static Layer) */}
      <div className="absolute -top-36 left-1/4 w-[520px] h-[320px] rounded-full bg-[#d4af37]/[0.06] blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-28 w-[420px] h-[420px] rounded-full bg-emerald-500/[0.05] blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-7 sm:space-y-9 relative z-10 w-full">
        
        {/* Top Telemetry Pill Strip */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full premium-pill text-slate-200 text-[11px] font-mono font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
            <span>ARCHIVIO UFFICIALE MELAGOODO • {GLOBAL_SUMMARY.totalVideos} EPISODI</span>
          </div>

          <button
            onClick={() => handleNavigateWithScroll('forecast', '#forecast')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full gold-badge hover:brightness-110 text-[11px] font-mono font-bold transition-all cursor-pointer"
          >
            <Brain className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>FORECAST AI #{UPCOMING_MATCH_FORECAST.matchNumber}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenGayCard();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#121a15] border border-white/[0.1] text-slate-200 hover:border-[#d4af37]/40 hover:text-[#f5e6b3] text-[11px] font-mono font-semibold transition-all cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>MEME GAY CARD 3D</span>
          </button>
        </div>

        {/* Main Hero Row: Left Editorial Column + Right 3D GaY Card on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5">
            <h1 className="text-3xl sm:text-5xl lg:text-[3.55rem] font-black font-heading tracking-tight text-white leading-[1.05]">
              L'archivio analitico delle{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f5e6b3] via-[#d4af37] to-amber-500 drop-shadow-[0_2px_20px_rgba(212,175,55,0.18)]">
                Golfatine storiche di Melagoodo
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300/95 leading-relaxed max-w-2xl font-normal">
              Tutte le partite, le <strong className="text-white font-semibold">{GLOBAL_SUMMARY.totalHolesPlayed.toLocaleString('it-IT')} buche</strong> e i <strong className="text-[#f5e6b3] font-semibold">{GLOBAL_SUMMARY.totalHIOs} Hole-in-One</strong> della serie cult di <strong className="text-white font-semibold">Melagoodo</strong> su <em>Golf With Your Friends</em>. Classifiche certificate, tabellini buca per buca, telemetria di carriera, previsioni neurali e superpoteri.
            </p>

            {/* Primary & Secondary Action Group */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                onClick={handleExploreMatches}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#f5e6b3] via-[#d4af37] to-amber-500 hover:brightness-105 text-slate-950 font-heading font-black text-xs sm:text-sm flex items-center gap-2 shadow-[0_10px_28px_-6px_rgba(212,175,55,0.45)] transition-all active:scale-98 cursor-pointer group"
              >
                <Play className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition-transform" />
                <span>Esplora {GLOBAL_SUMMARY.totalMatches} Partite</span>
              </button>

              <button
                onClick={() => handleNavigateWithScroll('superpowers', '#superpowers')}
                className="px-4 py-3 rounded-xl bg-[#111b15] border border-[#d4af37]/35 text-[#f5e6b3] font-semibold text-xs sm:text-sm flex items-center gap-2 hover:bg-[#17251d] hover:border-[#d4af37]/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] active:scale-98 transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Superpoteri</span>
              </button>

              <button
                onClick={() => handleNavigateWithScroll('forecast', '#forecast')}
                className="px-4 py-3 rounded-xl bg-[#0c130f] border border-white/[0.1] text-slate-200 font-semibold text-xs sm:text-sm flex items-center gap-2 hover:bg-[#131d17] hover:border-white/[0.2] hover:text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all cursor-pointer"
              >
                <Brain className="w-3.5 h-3.5 text-emerald-400" />
                <span>Previsioni & Bet</span>
              </button>

              <button
                onClick={() => handleNavigateWithScroll('roulette', '#roulette')}
                className="px-3.5 py-3 rounded-xl bg-[#090e0b] border border-white/[0.08] text-slate-300 font-medium text-xs sm:text-sm flex items-center gap-1.5 hover:bg-[#111914] hover:text-white transition-all cursor-pointer"
                title="Vai alla Sdrogo Roulette"
              >
                <Dices className="w-3.5 h-3.5 text-[#d4af37]" />
                <span className="hidden sm:inline">Roulette</span>
              </button>
            </div>
          </div>

          {/* Right Desktop Column: Integrated 3D GaY Card */}
          <div className="hidden lg:flex lg:col-span-5 justify-center items-center">
            <HeroGayCardWidget onOpenModal={onOpenGayCard} />
          </div>

        </div>

        {/* 4 Telemetry Bento Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 pt-2">
          
          {/* Metric 1: Record Vittorie */}
          <div 
            onClick={() => handleNavigateWithScroll('leaderboard', '#leaderboard')}
            className="premium-card premium-card-hover specular-top p-4.5 rounded-2xl cursor-pointer group flex flex-col justify-between overflow-hidden"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <span className="font-mono font-bold uppercase tracking-widest text-[10px] text-[#f5e6b3]">
                Record Vittorie
              </span>
              <div className="w-7 h-7 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center">
                <Trophy className="w-3.5 h-3.5 text-[#d4af37]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full overflow-hidden border border-[#d4af37]/50 shrink-0">
                  <img src={getPlayerAvatar(topWinner.name)} alt={topWinner.name} className="w-full h-full object-cover" />
                </div>
                <div className="text-xl sm:text-2xl font-black font-heading text-white group-hover:text-[#f5e6b3] transition-colors truncate">
                  {topWinner.name}
                </div>
              </div>
              <div className="text-xs text-slate-400 mt-2.5 pt-2.5 border-t border-white/[0.06] flex items-center justify-between tabular-nums">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-[#d4af37]">{topWinner.wins} Vittorie</span>
                  <span className="text-slate-600">•</span>
                  <span className="font-mono text-slate-300">{topWinner.winRate}% WR</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#d4af37] group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </div>

          {/* Metric 2: Hole-in-One King */}
          <div 
            onClick={() => handleNavigateWithScroll('leaderboard', '#leaderboard')}
            className="premium-card premium-card-hover p-4.5 rounded-2xl cursor-pointer group flex flex-col justify-between overflow-hidden"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <span className="font-mono font-bold uppercase tracking-widest text-[10px] text-emerald-300">
                Hole-in-One King
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full overflow-hidden border border-emerald-400/50 shrink-0">
                  <img src={getPlayerAvatar(topHioKing.name)} alt={topHioKing.name} className="w-full h-full object-cover" />
                </div>
                <div className="text-xl sm:text-2xl font-black font-heading text-white group-hover:text-emerald-300 transition-colors truncate">
                  {topHioKing.name} ({topHioKing.totalHIOs})
                </div>
              </div>
              <div className="text-xs text-slate-400 mt-2.5 pt-2.5 border-t border-white/[0.06] flex items-center justify-between tabular-nums">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-200">{GLOBAL_SUMMARY.totalHIOs} HIO totali</span>
                  <span className="text-slate-600">•</span>
                  <span className="font-mono text-emerald-400/90">1/{hioFrequency}b</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </div>

          {/* Metric 3: Record dal Par */}
          <div 
            onClick={handleExploreMatches}
            className="premium-card premium-card-hover p-4.5 rounded-2xl cursor-pointer group flex flex-col justify-between overflow-hidden"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <span className="font-mono font-bold uppercase tracking-widest text-[10px] text-teal-300">
                Record dal Par
              </span>
              <div className="w-7 h-7 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center">
                <TrendingDown className="w-3.5 h-3.5 text-teal-400" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black font-heading text-white group-hover:text-teal-300 transition-colors truncate font-mono">
                {GLOBAL_SUMMARY.bestDiffParRecord} dal Par
              </div>
              <div className="text-xs text-slate-400 mt-2.5 pt-2.5 border-t border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-slate-300 font-semibold">Record Assoluto</span>
                  <span className="text-slate-600">•</span>
                  <strong className="text-teal-300 font-mono">{GLOBAL_SUMMARY.totalMatches} Match</strong>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            </div>
          </div>

          {/* Metric 4: AI Proiezione Match */}
          <div 
            onClick={() => handleNavigateWithScroll('forecast', '#forecast')}
            className="premium-card premium-card-hover specular-top p-4.5 rounded-2xl cursor-pointer group flex flex-col justify-between overflow-hidden"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <span className="font-mono font-bold uppercase tracking-widest text-[10px] text-[#d4af37]">
                AI Proiezione #{UPCOMING_MATCH_FORECAST.matchNumber}
              </span>
              <div className="w-7 h-7 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-[#d4af37]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="text-xl sm:text-2xl font-black font-heading text-white group-hover:text-[#f5e6b3] transition-colors truncate">
                  {forecastFav.playerName}
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#d4af37]/20 text-[#f5e6b3] border border-[#d4af37]/35 shrink-0">
                  {forecastFav.winProbabilityPercent}%
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-2.5 pt-2.5 border-t border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono">
                  <span>Quota:</span>
                  <strong className="text-[#d4af37] font-bold">{forecastFav.bettingOdds.toFixed(2)}x</strong>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-300 truncate">{forecastSecond.playerName} {forecastSecond.bettingOdds.toFixed(2)}x</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#d4af37]/70 group-hover:text-[#d4af37] group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

