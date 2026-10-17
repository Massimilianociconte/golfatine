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
    <footer className="mt-24 border-t border-white/[0.08] bg-[#040705]/95 text-slate-400 text-xs relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          
          {/* Col 1: Brand & Lore */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-xl bg-[#0c140f] border border-[#d4af37]/30 shadow-inner">
                <MelagoodoLogo className="w-7 h-7 shrink-0" size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black font-heading text-white tracking-tight">
                    LO SDROGO GOLFOMETRO
                  </span>
                  <span className="gold-badge text-[10px] font-bold px-2 py-0.5 rounded-md">
                    Melagoodo
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mt-0.5">
                  Broadcast Telemetry & Official Archive
                </span>
              </div>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              L'archivio analitico e la community digitale dedicata alle <strong className="text-slate-200 font-mono">{GLOBAL_SUMMARY.totalVideos}</strong> leggendarie Golfatine della crew <strong className="text-white">Melagoodo</strong> su <em>Golf With Your Friends</em> (Dread, Just Rohn, Delux, GaBBo, ilMasseo, Mollu, JTaz, Just Marzaa, Yung Chape, Fava).
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0a100d] border border-white/[0.06] text-[#f5e6b3] font-mono">
                <Brain className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>TimesFM-3.0 Predictive Core</span>
              </span>
              <a
                href="https://t.me/sinnerpadel"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sound.playClick()}
                className="px-2.5 py-1 rounded-lg bg-[#0a100d] border border-white/[0.06] text-slate-300 hover:text-white hover:border-[#0088cc]/40 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Send className="w-3 h-3 text-[#0088cc]" />
                <span>@sinnerpadel</span>
              </a>
              <button
                onClick={onOpenGayCard}
                className="px-2.5 py-1 rounded-lg bg-[#0a100d] border border-[#d4af37]/25 text-[#f5e6b3] hover:border-[#d4af37]/50 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <CreditCard className="w-3 h-3 text-[#d4af37]" />
                <span>Meme GaY Card 3D</span>
              </button>
            </div>
          </div>

          {/* Col 2: Navigazione Rapida */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-widest text-white font-mono">
              Navigazione Piattaforma
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <button 
                  onClick={() => onNavigate('golfatine')}
                  className="hover:text-white transition-colors flex items-center gap-2 cursor-pointer text-slate-300"
                >
                  <Tv className="w-3.5 h-3.5 text-slate-400" />
                  <span>Archivio {GLOBAL_SUMMARY.totalVideos} Episodi</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('superpowers')}
                  className="hover:text-[#f5e6b3] transition-colors flex items-center gap-2 cursor-pointer text-[#d4af37] font-semibold"
                >
                  <Zap className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Superpoteri (Peggle 2)</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('forecast')}
                  className="hover:text-white transition-colors flex items-center gap-2 cursor-pointer text-slate-300"
                >
                  <Brain className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Previsioni & Bet</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('amongus')}
                  className="hover:text-rose-300 transition-colors flex items-center gap-2 cursor-pointer text-rose-400 font-semibold"
                >
                  <Skull className="w-3.5 h-3.5 text-rose-400" />
                  <span>Among Us (Chi è il Traditore?)</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('leaderboard')}
                  className="hover:text-white transition-colors flex items-center gap-2 cursor-pointer text-slate-300"
                >
                  <Trophy className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Albo d'Oro & Classifiche</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('players')}
                  className="hover:text-white transition-colors flex items-center gap-2 cursor-pointer text-slate-300"
                >
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Roster Giocatori</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('h2h')}
                  className="hover:text-white transition-colors flex items-center gap-2 cursor-pointer text-slate-300"
                >
                  <Swords className="w-3.5 h-3.5 text-slate-400" />
                  <span>1v1 Arena</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('roulette')}
                  className="hover:text-white transition-colors flex items-center gap-2 cursor-pointer text-slate-300"
                >
                  <Dices className="w-3.5 h-3.5 text-slate-400" />
                  <span>Roulette Casuale</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Riconoscimenti e WebNovis */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-widest text-white font-mono">
              Sviluppo & Design
            </div>
            
            {/* Clickable WebNovis Badge */}
            <div className="premium-card specular-top p-4 rounded-xl border border-white/[0.1] space-y-2">
              <div className="text-[10px] text-slate-400">Progettato e sviluppato da:</div>
              <a
                href="https://www.webnovis.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sound.playClick()}
                className="text-sm font-black font-heading text-white hover:text-[#f5e6b3] flex items-center justify-between group transition-colors"
              >
                <span>WebNovis</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#d4af37] transition-colors" />
              </a>
              <div className="text-[10px] text-slate-500 font-mono">
                www.webnovis.com
              </div>
            </div>

            <button
              onClick={handleEasterEgg}
              className="w-full justify-center px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] text-slate-200 text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-white/[0.07]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Attiva Coriandoli Celebrativi</span>
            </button>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div className="flex flex-wrap items-center gap-1.5">
            <span>Tributo indipendente per la community</span>
            <strong className="text-slate-200">Melagoodo</strong>
            <span>• Realizzato da</span>
            <a
              href="https://www.webnovis.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#f5e6b3] hover:underline font-semibold inline-flex items-center gap-0.5"
            >
              WebNovis
            </a>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0c140f] border border-white/[0.1] text-slate-200 hover:text-white hover:border-[#d4af37]/40 transition-all cursor-pointer font-semibold"
          >
            <span>Torna su</span>
            <ArrowUp className="w-3.5 h-3.5 text-[#d4af37]" />
          </button>
        </div>
      </div>
    </footer>
  );
};
