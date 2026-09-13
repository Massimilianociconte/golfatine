import React from 'react';
import { 
  ArrowUp, 
  Sparkles, 
  Trophy, 
  Tv, 
  Users, 
  Swords, 
  Dices, 
  Brain, 
  Zap, 
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Send,
  Skull
} from 'lucide-react';
import { MelagoodoLogo } from './MelagoodoLogo';
import { TabType } from './Navbar';
import { GLOBAL_SUMMARY } from '../data/golfatineData';
import { sound } from '../utils/audio';
import { triggerVictoryConfetti } from '../utils/confetti';

interface FooterProps {
  onNavigate: (tab: TabType) => void;
  onOpenGayCard: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenGayCard }) => {
  const scrollToTop = () => {
    sound.playClick();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEasterEgg = () => {
    sound.playHIOFanfare();
    triggerVictoryConfetti();
  };

  return (
    <footer className="mt-20 border-t border-white/[0.08] bg-[#050806] text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Col 1: Brand & Lore */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <MelagoodoLogo className="w-8 h-8 shrink-0" size={32} />
              <span className="text-base font-black font-heading text-white tracking-tight">
                LO SDROGO GOLFOMETRO
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20">
                Melagoodo
              </span>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              L'archivio analitico e la community digitale dedicata alle {GLOBAL_SUMMARY.totalVideos} leggendarie Golfatine della crew <strong>Melagoodo</strong> su <em>Golf With Your Friends</em> (Dread, Just Rohn, Delux, GaBBo, ilMasseo, Mollu, JTaz, Just Marzaa, Yung Chape, Fava).
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-[#d4af37]">
                <Brain className="w-3.5 h-3.5" />
                <span>Algoritmo Predittivo Melagoodo</span>
              </span>
              <span>•</span>
              <a
                href="https://t.me/sinnerpadel"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sound.playClick()}
                className="text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Send className="w-3 h-3 text-[#0088cc]" />
                <span>Telegram: @sinnerpadel</span>
              </a>
              <span>•</span>
              <button
                onClick={onOpenGayCard}
                className="text-slate-300 hover:text-white flex items-center gap-1 underline cursor-pointer"
              >
                <CreditCard className="w-3 h-3 text-[#d4af37]" />
                <span>Meme GaY Card 3D</span>
              </button>
            </div>
          </div>

          {/* Col 2: Navigazione Rapida */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-white">
              Navigazione Piattaforma
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <button 
                  onClick={() => onNavigate('golfatine')}
                  className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-slate-300"
                >
                  <Tv className="w-3.5 h-3.5 text-slate-400" />
                  <span>Archivio {GLOBAL_SUMMARY.totalVideos} Episodi</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('superpowers')}
                  className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-[#d4af37] font-semibold"
                >
                  <Zap className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Superpoteri (Peggle 2)</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('forecast')}
                  className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-slate-300"
                >
                  <Brain className="w-3.5 h-3.5 text-slate-400" />
                  <span>Previsioni & Bet</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('amongus')}
                  className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-red-400 font-semibold"
                >
                  <Skull className="w-3.5 h-3.5 text-red-400" />
                  <span>Among Us (Chi è il Traditore?)</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('leaderboard')}
                  className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-slate-300"
                >
                  <Trophy className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Albo d'Oro & Classifiche</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('players')}
                  className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-slate-300"
                >
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Roster Giocatori</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('h2h')}
                  className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-slate-300"
                >
                  <Swords className="w-3.5 h-3.5 text-slate-400" />
                  <span>1v1 Arena</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('roulette')}
                  className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-slate-300"
                >
                  <Dices className="w-3.5 h-3.5 text-slate-400" />
                  <span>Roulette Casuale</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Riconoscimenti e WebNovis */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-white">
              Sviluppo & Design
            </div>
            
            {/* Clickable WebNovis Badge */}
            <div className="premium-card p-3.5 rounded-xl border border-white/[0.1] space-y-2">
              <div className="text-[10px] text-slate-400">Progettato e sviluppato da:</div>
              <a
                href="https://www.webnovis.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sound.playClick()}
                className="text-sm font-bold font-heading text-white hover:text-[#d4af37] flex items-center justify-between group transition-colors"
              >
                <span>WebNovis</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#d4af37] transition-colors" />
              </a>
              <div className="text-[10px] text-slate-400 font-mono">
                www.webnovis.com
              </div>
            </div>

            <button
              onClick={handleEasterEgg}
              className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer border border-white/[0.06]"
            >
              <Sparkles className="w-3 h-3 text-[#d4af37]" />
              <span>Attiva Coriandoli Celebrativi</span>
            </button>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <span>Tributo indipendente per la community</span>
            <strong className="text-slate-300">Melagoodo</strong>
            <span>• Realizzato da</span>
            <a
              href="https://www.webnovis.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#d4af37] hover:underline font-semibold inline-flex items-center gap-0.5"
            >
              WebNovis
            </a>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e1411] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-[#141b18] transition-colors cursor-pointer"
          >
            <span>Torna su</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
