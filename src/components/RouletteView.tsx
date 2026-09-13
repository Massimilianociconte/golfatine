import React, { useState } from 'react';
import {
  Dices,
  Trophy,
  Target,
  Flame,
  Brain
} from 'lucide-react';
import { MATCHES_DATA, GolfatinaMatch } from '../data/golfatineData';
import { MatchCard } from './MatchCard';
import { sound } from '../utils/audio';
import { triggerVictoryConfetti } from '../utils/confetti';
import { UPCOMING_MATCH_FORECAST } from '../data/forecastingData';

interface RouletteViewProps {
  onOpenMatchModal: (match: GolfatinaMatch) => void;
  onSelectPlayer?: (playerName: string) => void;
  onSelectChannel?: (channel: string) => void;
  onOpenShare?: (match: GolfatinaMatch) => void;
}

export const RouletteView: React.FC<RouletteViewProps> = ({ onOpenMatchModal, onSelectPlayer, onSelectChannel, onOpenShare }) => {
  const [selectedMatch, setSelectedMatch] = useState<GolfatinaMatch | null>(null);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [filterMood, setFilterMood] = useState<'all' | 'ai_pick' | 'high_hio' | 'chaos' | 'classic'>('ai_pick');
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear running spin interval on unmount to prevent memory leaks and setState after unmount
  React.useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    try {
      sound.playRouletteTick();
    } catch {
      // ignore
    }

    let pool = [...MATCHES_DATA];
    if (filterMood === 'ai_pick') {
      // Matches where top predicted players (Rohn / Delux) had iconic close encounters
      pool = pool.filter((m) => m.totalHIOs >= 6 && m.players.length >= 4);
    } else if (filterMood === 'high_hio') {
      pool = pool.filter((m) => m.totalHIOs >= 8);
    } else if (filterMood === 'chaos') {
      pool = pool.filter((m) => m.maxHoleScore >= 12);
    } else if (filterMood === 'classic') {
      pool = pool.filter((m) => m.id <= 20);
    }

    if (pool.length === 0) pool = [...MATCHES_DATA];

    let iterations = 0;
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      const randomCandidate = pool[Math.floor(Math.random() * pool.length)];
      setSelectedMatch(randomCandidate);
      try {
        sound.playRouletteTick();
      } catch {
        // ignore
      }
      iterations++;

      if (iterations > 12) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        const finalPick = pool[Math.floor(Math.random() * pool.length)];
        setSelectedMatch(finalPick);
        setIsSpinning(false);
        try {
          sound.playHIOFanfare();
          triggerVictoryConfetti();
        } catch {
          // ignore
        }
      }
    }, 100);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* Top Banner */}
      <div className="premium-card p-6 sm:p-8 rounded-2xl border border-white/[0.08] text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-300 border border-teal-500/20 mx-auto">
          <Dices className="w-3.5 h-3.5" />
          <span>Generatore Integrato con Algoritmo Predittivo</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight">
          Sdrogo Roulette Intelligente
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Lascia che l'algoritmo predittivo estragga la partita ideale da guardare in base al mood o alle statistiche storiche.
        </p>
      </div>

      {/* Mood Filter & Spin Button */}
      <div className="premium-card p-6 rounded-2xl border border-white/[0.08] space-y-6 text-center">
        
        {/* Mood Filter Controls */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Scegli il Criterio di Estrazione:</span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'ai_pick', label: 'Consigliato dall\'Algoritmo AI', icon: Brain },
              { id: 'high_hio', label: 'Pioggia di Hole-in-One', icon: Target },
              { id: 'chaos', label: 'Disastri & Tilt Puro', icon: Flame },
              { id: 'classic', label: 'I Grandi Classici (#1-#20)', icon: Trophy },
              { id: 'all', label: `Tutti gli ${MATCHES_DATA.length} Episodi in archivio`, icon: Dices },
            ].map((mood) => {
              const Icon = mood.icon;
              const isSelected = filterMood === mood.id;

              return (
                <button
                  key={mood.id}
                  disabled={isSpinning}
                  onClick={() => {
                    if (isSpinning) return;
                    try {
                      sound.playClick();
                    } catch {
                      // ignore
                    }
                    setFilterMood(mood.id as any);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isSpinning ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                  } ${
                    isSelected
                      ? 'bg-white text-slate-950 shadow-sm font-bold'
                      : 'bg-[#090d0b] text-slate-400 hover:text-slate-200 border border-white/[0.06]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{mood.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Big Spin CTA */}
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className={`px-8 py-4 rounded-xl font-black text-sm font-heading flex items-center justify-center gap-2.5 mx-auto transition-all shadow-xl cursor-pointer ${
            isSpinning
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-white hover:bg-slate-200 text-slate-950 active:scale-95'
          }`}
        >
          <Dices className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
          <span>{isSpinning ? 'ESTRAZIONE IN CORSO...' : 'GIRA LA ROULETTE'}</span>
        </button>

      </div>

      {/* Result Card: full video card instead of description-only panel */}
      {selectedMatch && (
        <div className="space-y-4 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-center">
            <span className="text-xs text-[#d4af37] font-bold font-mono tracking-widest">
              {isSpinning ? 'ESTRAZIONE IN CORSO...' : 'ESTRATTA PER TE'}
            </span>
          </div>
          <MatchCard
            match={selectedMatch}
            onOpenModal={(m) => onOpenMatchModal(m)}
            onSelectPlayer={onSelectPlayer}
            onSelectChannel={onSelectChannel}
            onOpenShare={onOpenShare}
          />
        </div>
      )}

    </div>
  );
};
