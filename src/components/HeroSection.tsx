import React from 'react';
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
  ChevronRight
} from 'lucide-react';
import { GLOBAL_SUMMARY } from '../data/golfatineData';
import { UPCOMING_MATCH_FORECAST } from '../data/forecastingData';
import { sound } from '../utils/audio';
import { TabType } from './Navbar';
import { HeroGayCardWidget } from './HeroGayCardWidget';
import { smoothScrollTo } from '../utils/scrollHelper';

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

  const forecastTop = [...UPCOMING_MATCH_FORECAST.playersForecast].sort(
    (a, b) => b.winProbabilityPercent - a.winProbabilityPercent
  );
  const forecastFav = forecastTop[0];
  const forecastSecond = forecastTop[1];

  return (
    <div className="relative border-b border-white/[0.06] bg-gradient-to-b from-[#090f0c] via-[#070b09] to-[#050806] pt-6 sm:pt-10 pb-8 sm:pb-12 overflow-hidden w-full max-w-full">
      
      {/* Subtle Background Ambient Glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-[#d4af37]/5 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 relative z-10 w-full">
        
        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#101814] border border-white/[0.08] text-slate-300 text-xs font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />
            <span>ARCHIVIO INTEGRALE MELAGOODO • {GLOBAL_SUMMARY.totalVideos} EPISODI</span>
          </div>

          <button
            onClick={() => handleNavigateWithScroll('forecast', '#forecast')}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141c17] border border-[#d4af37]/30 text-[#d4af37] hover:bg-[#1a251f] text-xs font-mono font-semibold transition-colors cursor-pointer"
          >
            <Brain className="w-3 h-3 text-[#d4af37]" />
            <span>PREVISIONI AI</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenGayCard();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#171c14] border border-amber-500/30 text-amber-300 hover:bg-[#20271c] text-xs font-mono font-semibold transition-colors cursor-pointer"
          >
            <span>🎴 MEME GAY CARD 3D</span>
          </button>
        </div>

        {/* Main Hero Row: Left Headline & CTAs + Right 3D GaY Card on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero Column: Headline, Paragraph, CTAs (Untouched sizing) */}
          <div className="lg:col-span-7 space-y-3 sm:space-y-4">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-heading tracking-tight text-white leading-[1.08]">
              L'archivio analitico delle <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] via-[#f7e6a5] to-amber-500">Golfatine storiche di Melagoodo</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl font-normal">
              Tutte le partite, buche e colpi della serie cult di <strong className="text-white font-semibold">Melagoodo</strong> su <em>Golf With Your Friends</em>. Classifiche ufficiali, tabellini buca per buca, statistiche di carriera, modelli predittivi e superpoteri dei giocatori.
            </p>

            {/* Quick CTA Action Group with Smooth Scroll */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-2">
              <button
                onClick={handleExploreMatches}
                className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer group"
              >
                <Play className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition-transform" />
                <span>Esplora Partite</span>
              </button>

              <button
                onClick={() => handleNavigateWithScroll('superpowers', '#superpowers')}
                className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-[#141d18] border border-[#d4af37]/40 text-[#d4af37] font-semibold text-xs sm:text-sm flex items-center gap-2 hover:bg-[#1a2620] hover:border-[#d4af37]/80 active:scale-98 transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Superpoteri</span>
              </button>

              <button
                onClick={() => handleNavigateWithScroll('forecast', '#forecast')}
                className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-[#0e1411] border border-white/[0.1] text-slate-200 font-semibold text-xs sm:text-sm flex items-center gap-2 hover:bg-[#141b18] hover:text-white transition-all cursor-pointer"
              >
                <Brain className="w-3.5 h-3.5 text-slate-400" />
                <span>Previsioni & Bet</span>
              </button>

              <button
                onClick={() => handleNavigateWithScroll('roulette', '#roulette')}
                className="px-3.5 py-2.5 sm:py-3 rounded-xl bg-[#0a0e0c] border border-white/[0.08] text-slate-400 font-medium text-xs sm:text-sm flex items-center gap-1.5 hover:bg-[#101713] hover:text-white transition-all cursor-pointer"
                title="Vai alla Sdrogo Roulette"
              >
                <Dices className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Roulette</span>
              </button>
            </div>

          </div>

          {/* Right Desktop Column: Integrated 3D GaY Card (Occupies empty space) */}
          <div className="hidden lg:flex lg:col-span-5 justify-center items-center">
            <HeroGayCardWidget onOpenModal={onOpenGayCard} />
          </div>

        </div>

        {/* 4 Dashboard Metric Cards - Responsive Grid with Smooth Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
          
          {/* Metric 1 */}
          <div 
            onClick={() => handleNavigateWithScroll('leaderboard', '#leaderboard')}
            className="premium-card premium-card-hover p-4 rounded-xl cursor-pointer group flex flex-col justify-between border-t-2 border-t-[#d4af37]/80"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">
                Record Vittorie
              </span>
              <Trophy className="w-3.5 h-3.5 text-[#d4af37]" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black font-heading text-white group-hover:text-[#f3e8c8] transition-colors truncate">
                Delux
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center justify-between tabular-nums">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#d4af37]">25 Vittorie</span>
                  <span className="text-slate-500">•</span>
                  <span>33.3% Win Rate</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </div>

          {/* Metric 2 */}
          <div 
            onClick={() => handleNavigateWithScroll('leaderboard', '#leaderboard')}
            className="premium-card premium-card-hover p-4 rounded-xl cursor-pointer group flex flex-col justify-between border-t-2 border-t-emerald-400/80"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">
                Hole-in-One King
              </span>
              <Target className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black font-heading text-white group-hover:text-emerald-300 transition-colors truncate">
                Delux (195)
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center justify-between tabular-nums">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-200">747 HIO totali</span>
                  <span className="text-slate-500">•</span>
                  <span>1 su 6.7 buche</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </div>

          {/* Metric 3 */}
          <div 
            onClick={handleExploreMatches}
            className="premium-card premium-card-hover p-4 rounded-xl cursor-pointer group flex flex-col justify-between border-t-2 border-t-teal-400/80"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">
                Record dal Par
              </span>
              <TrendingDown className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black font-heading text-white group-hover:text-teal-300 transition-colors truncate">
                -30 dal Par
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span>Delux in</span>
                  <strong className="text-slate-200 font-medium">Golfatina #29</strong>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </div>

          {/* Metric 4 */}
          <div 
            onClick={() => handleNavigateWithScroll('forecast', '#forecast')}
            className="premium-card premium-card-hover p-4 rounded-xl cursor-pointer group flex flex-col justify-between border-t-2 border-t-[#d4af37]/80 bg-gradient-to-b from-[#121914] to-[#0e1411]"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-[#d4af37]">
                AI Proiezione Match #{UPCOMING_MATCH_FORECAST.matchNumber}
              </span>
              <Brain className="w-3.5 h-3.5 text-[#d4af37]" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black font-heading text-white group-hover:text-[#f3e8c8] transition-colors truncate">
                {forecastFav.playerName} Favorito ({forecastFav.winProbabilityPercent}%)
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span>Quota:</span>
                  <strong className="text-[#d4af37] font-mono font-bold">{forecastFav.bettingOdds.toFixed(2)}x</strong>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300">{forecastSecond.playerName} {forecastSecond.bettingOdds.toFixed(2)}x</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#d4af37]/60 group-hover:text-[#d4af37] group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
