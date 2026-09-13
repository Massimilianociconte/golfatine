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

  return (
    <div className="w-full max-w-full my-4 sm:my-6 overflow-hidden">
      <div 
        onClick={() => {
          sound.playClick();
          onOpenDonation();
        }}
        className="group relative w-full max-w-full overflow-hidden rounded-2xl border border-[#ef4444]/40 bg-gradient-to-r from-[#180d0f] via-[#10090b] to-[#180d0f] p-3 sm:p-4 shadow-xl cursor-pointer hover:border-[#ef4444] transition-all hover:shadow-2xl active:scale-[0.99]"
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-amber-500/10 to-red-500/10 opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-3 relative z-10 w-full min-w-0">
          
          {/* Left Badge */}
          <div className="flex items-center gap-2.5 shrink-0 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#261315] border border-red-500/30 text-white flex items-center justify-center p-1.5 shadow group-hover:scale-110 transition-transform shrink-0">
              <img src="/cannuccia-bianca.png" alt="Cannuccia Bianca" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0 truncate">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-black font-heading text-white tracking-wide truncate">
                  SOSTIENI IL PROGETTO GABBINESS
                </span>
                <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40 uppercase shrink-0">
                  Live
                </span>
              </div>
              <p className="text-[10px] leading-snug text-slate-300 max-w-[280px]">
                Dona anche tu una cannuccia per sostenere il progetto GABBINESS
              </p>
            </div>
          </div>

          {/* Center: Dynamic Animated Continuous Marquee Ticker */}
          <div className="flex-1 overflow-hidden w-full max-w-2xl py-1 relative min-w-0">
            <div className="flex items-center gap-8 whitespace-nowrap animate-marquee">
              {[...marqueeItems, ...marqueeItems].map((item, i) => {
                return (
                  <div key={i} className="inline-flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider shrink-0">
                    <img src="/cannuccia-bianca.png" alt="Cannuccia" className="w-3.5 h-3.5 object-contain" />
                    <span>{item.text}</span>
                    <span className="text-white/20 ml-2">•</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right CTA Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#ef4444] to-amber-500 text-white font-bold text-xs flex items-center gap-1 shadow group-hover:from-red-600 group-hover:to-amber-400 transition-all pointer-events-none">
              <span>Dona Ora</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
