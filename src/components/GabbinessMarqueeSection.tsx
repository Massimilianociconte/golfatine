import React from 'react';
import { Heart, Sparkles, Flame, ChevronRight, Gift } from 'lucide-react';
import { sound } from '../utils/audio';

interface GabbinessMarqueeSectionProps {
  onOpenDonation: () => void;
}

export const GabbinessMarqueeSection: React.FC<GabbinessMarqueeSectionProps> = ({ onOpenDonation }) => {
  const marqueeItems = [
    { text: 'DONA UNA CANNUCCIA BIANCA ANCHE TU E SOSTIENI IL PROGETTO GABBINESS', icon: Heart },
    { text: 'SALVIAMO GABBO DAI 181 COLPI & DAL CAP DELLA BUCA 14', icon: Flame },
    { text: '«LA GENTE È PER STRADA CON LE MAGLIETTE: CARICA 3 GABBO!»', icon: Sparkles },
    { text: 'CLICCA QUI PER APRIRE LA GOLFATINA DI DONAZIONE VIRTUALE', icon: Gift },
    { text: 'SOSTIENI CON LE CANNUCCE BIANCHE • ALBO D\'ORO DELLA COMMUNITY', icon: Heart },
  ];

  const handleOpen = () => {
    sound.playClick();
    onOpenDonation();
  };

  return (
    <div className="w-full max-w-full my-5 sm:my-6 overflow-hidden">
      <div 
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpen();
          }
        }}
        aria-label="Sostieni il Progetto Gabbiness - Apri modale donazione virtuale"
        className="group relative w-full max-w-full overflow-hidden rounded-2xl border border-rose-500/35 bg-gradient-to-r from-[#190c0e] via-[#0e0809] to-[#190c0e] p-3 sm:p-4 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)] cursor-pointer hover:border-rose-400/70 transition-all active:scale-[0.995]"
      >
        {/* Specular Top Rim & Ambient Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/[0.08] via-amber-500/[0.07] to-rose-500/[0.08] opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-3 relative z-10 w-full min-w-0">
          
          {/* Left Badge */}
          <div className="flex items-center gap-3 shrink-0 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#271114] border border-rose-500/35 text-white flex items-center justify-center p-1.5 shadow-md group-hover:scale-105 transition-transform shrink-0">
              <img src="/cannuccia-bianca.png" alt="Cannuccia Bianca" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0 truncate">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs sm:text-[13px] font-black font-heading text-white tracking-wide truncate">
                  SOSTIENI IL PROGETTO GABBINESS
                </span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase shrink-0 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-rose-400 animate-ping" />
                  Live
                </span>
              </div>
              <p className="text-[10px] leading-snug text-slate-300/90 max-w-[290px] truncate">
                Dona anche tu una cannuccia per sostenere il mental di GaBBo
              </p>
            </div>
          </div>

          {/* Center: Dynamic Animated Continuous Marquee Ticker */}
          <div className="flex-1 overflow-hidden w-full max-w-2xl py-1 relative min-w-0">
            <div className="flex items-center gap-8 whitespace-nowrap animate-marquee">
              {[...marqueeItems, ...marqueeItems].map((item, i) => {
                return (
                  <div key={i} className="inline-flex items-center gap-2 text-[11px] font-mono font-bold text-slate-200 uppercase tracking-wider shrink-0">
                    <img src="/cannuccia-bianca.png" alt="" aria-hidden="true" className="w-3.5 h-3.5 object-contain" />
                    <span>{item.text}</span>
                    <span className="text-rose-400/40 ml-2">◆</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right CTA Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-heading font-black text-xs flex items-center gap-1 shadow-[0_4px_16px_rgba(244,63,94,0.35)] group-hover:brightness-110 transition-all pointer-events-none">
              <span>Dona Ora</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

