import React, { useEffect, useState } from 'react';
import { 
  X, 
  Sparkles, 
  Heart, 
  ShieldCheck, 
  Trophy, 
  Coins, 
  Check, 
  Flame, 
  AlertCircle,
  HelpCircle,
  Users,
  Award
} from 'lucide-react';
import { sound } from '../utils/audio';
import { triggerVictoryConfetti } from '../utils/confetti';
import { 
  getLocalUserProfile, 
  subscribeToUserProfile,
  UserProfile,
  donateCannucce, 
  getAllCommunityDonations, 
  UserDonation 
} from '../utils/userStore';

interface GabbinessDonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile?: () => void;
}

export const GabbinessDonationModal: React.FC<GabbinessDonationModalProps> = ({
  isOpen,
  onClose,
  onOpenProfile,
}) => {
  const [profile, setProfile] = useState<UserProfile>(() => getLocalUserProfile());
  const [donorName, setDonorName] = useState<string>(() => profile.realName || 'Massimiliano Ciconte');
  const [cannucceAmount, setCannucceAmount] = useState<number>(50);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [allDonations, setAllDonations] = useState<UserDonation[]>(() => getAllCommunityDonations());

  useEffect(() => {
    if (!isOpen) return;
    setProfile(getLocalUserProfile());
    setAllDonations(getAllCommunityDonations());
    const unsub = subscribeToUserProfile((updatedProfile) => {
      setProfile(updatedProfile);
      setAllDonations(getAllCommunityDonations());
    });
    return unsub;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickPicks = [10, 50, 100, 250, 500, 1000];

  const getEquivalentMemeText = (amount: number) => {
    if (amount >= 1000) return 'Maglietta Ufficiale «Carica 3 Gabbo!» & Titolo di Donatore Supremo';
    if (amount >= 500) return 'Scudo Tellurico Anti-Cap 14 per salvare GaBBo dai 181 colpi';
    if (amount >= 250) return 'Speronamento Tattico di Evil Gabbo contro Delux e Rohn';
    if (amount >= 100) return '1 Porzione di 7g di Creatina & Pugno alla Scrivania Assorbito';
    if (amount >= 50) return '1 Cannuccia Bianca d\'Oro e Pastina Senza Denti Garantita';
    return '1 Cannuccia Bianca di Sostegno Morale per la prossima Golfatina';
  };

  const handleDonate = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    const result = donateCannucce(donorName, cannucceAmount);

    if (result.success) {
      sound.playHIOFanfare();
      triggerVictoryConfetti();
      setFeedback({ type: 'success', text: `✓ Donazione registrata con successo! Hai sostenuto il Progetto Gabbiness con ${cannucceAmount} Cannucce Bianche!` });
      setAllDonations(getAllCommunityDonations());
      setTimeout(() => setFeedback(null), 5000);
    } else {
      sound.playDisasterBuzzer();
      setFeedback({ type: 'error', text: result.message });
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-xl bg-black/85 animate-in fade-in duration-200 select-none overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      
      <div
        className="relative w-full max-w-3xl bg-[#090d0b] border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-[#0d1410] flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ef4444] to-amber-600 flex items-center justify-center shadow shrink-0 p-1.5 border border-red-400/30">
              <img src="/cannuccia-bianca.png" alt="Cannuccia Bianca" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black font-heading text-white tracking-tight">
                  Golfatina di Donazione al Progetto Gabbiness
                </h2>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30 uppercase">
                  Community Fund
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Sostieni virtualmente GaBBo donando le iconiche <strong>Cannucce Bianche</strong>!
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            aria-label="Chiudi donazione Gabbiness"
            className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Virtual Currency Notice Alert */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-2.5 text-xs text-slate-300">
            <HelpCircle className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Simbolo Virtuale della Community:</strong> Le <em>Cannucce Bianche</em> sono crediti virtuali gratuiti maturati guardando le Golfatine (+50 PTS/match). Non costituiscono valuta reale né transazioni a pagamento.
            </div>
          </div>

          {/* Donation Form & Equivalent Calculator */}
          <form onSubmit={handleDonate} className="grid grid-cols-1 md:grid-cols-12 gap-5">
            
            {/* Left: Input Parameters */}
            <div className="md:col-span-7 space-y-4">
              
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Nome Reale del Donatore / Nickname
                </label>
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg premium-input text-white text-xs font-semibold"
                  placeholder="Es: Massimiliano Ciconte"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <img src="/cannuccia-bianca.png" alt="Cannuccia" className="w-3.5 h-3.5 object-contain" />
                    <span>Quante Cannucce Bianche vuoi donare?</span>
                  </label>
                  <span className="text-[10px] font-mono text-[#d4af37]">
                    Disponibili: <strong>{profile.sdrogoPoints} PTS</strong>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-2">
                  {quickPicks.map((amt) => {
                    const isSelected = cannucceAmount === amt;
                    return (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => {
                          sound.playClick();
                          setCannucceAmount(amt);
                        }}
                        className={`py-2 px-2 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#1e1315] border-[#ef4444] text-[#ef4444] ring-1 ring-[#ef4444]/40'
                            : 'bg-[#090d0b] border-white/[0.08] text-slate-300 hover:border-white/[0.2]'
                        }`}
                      >
                        <img src="/cannuccia-bianca.png" alt="Cannuccia" className="w-3.5 h-3.5 object-contain" />
                        <span>{amt}</span>
                      </button>
                    );
                  })}
                </div>

                <input
                  type="number"
                  min="1"
                  max={Math.max(1000, profile.sdrogoPoints)}
                  value={cannucceAmount}
                  onChange={(e) => setCannucceAmount(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-lg premium-input text-white text-xs font-mono"
                  placeholder="Quantità personalizzata"
                />
              </div>

              {/* Action Button */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ef4444] to-amber-500 hover:from-red-600 hover:to-amber-400 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all cursor-pointer"
              >
                <img src="/cannuccia-bianca.png" alt="Cannuccia" className="w-4 h-4 object-contain brightness-200" />
                <span>DONA {cannucceAmount} CANNUCCE BIANCHE</span>
              </button>

              {feedback && (
                <div className={`p-3 rounded-xl text-xs text-center font-bold animate-in zoom-in-95 ${
                  feedback.type === 'success' 
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                }`}>
                  {feedback.text}
                </div>
              )}

            </div>

            {/* Right: Equivalent Impact Live Box */}
            <div className="md:col-span-5 premium-card p-4 rounded-2xl border border-white/[0.08] flex flex-col justify-between space-y-3 bg-[#0a0e0c]">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Equivalente Simbolico della Donazione:
                </span>

                <div className="p-3 rounded-xl bg-[#141210] border border-[#d4af37]/30 text-xs text-slate-200 space-y-1">
                  <div className="text-[10px] text-[#d4af37] font-bold uppercase">Impatto sul Progetto Gabbiness:</div>
                  <p className="font-semibold text-white leading-snug">
                    "{getEquivalentMemeText(cannucceAmount)}"
                  </p>
                </div>

                <div className="text-[11px] text-slate-400 space-y-1 font-mono">
                  <div className="flex justify-between items-center">
                    <span>Cannucce da Donare:</span>
                    <strong className="text-white flex items-center gap-1">
                      <img src="/cannuccia-bianca.png" alt="Cannuccia" className="w-3.5 h-3.5 object-contain" />
                      <span>{cannucceAmount}</span>
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Totale Tuo Donato:</span>
                    <strong className="text-emerald-400 font-bold flex items-center gap-1">
                      <img src="/cannuccia-bianca.png" alt="Cannuccia" className="w-3.5 h-3.5 object-contain" />
                      <span>{profile.totalCannucceDonated}</span>
                    </strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.06] text-center">
                <span className="text-[10px] text-slate-500 block italic">
                  «Donate al Progetto Gabbiness! Carica 3 Gabbo!»
                </span>
              </div>
            </div>

          </form>

          {/* Real Community Leaderboard: Albo d'Oro dei Donatori (Real Data Only) */}
          <div className="space-y-3 pt-4 border-t border-white/[0.08]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-[#d4af37]" />
                Albo d'Oro dei Donatori Reali • Progetto Gabbiness
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">Dati Live Community</span>
            </div>

            {allDonations.length > 0 ? (
              <div className="premium-card rounded-xl border border-white/[0.08] overflow-hidden bg-[#0a0e0c]">
                <div className="divide-y divide-white/[0.04] text-xs">
                  {allDonations.map((don, idx) => (
                    <div key={don.id} className="p-2.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-5 text-center font-mono font-bold text-xs ${
                          idx === 0 ? 'text-[#d4af37]' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500'
                        }`}>
                          {idx + 1}°
                        </span>
                        <div>
                          <strong className="text-white block leading-tight">{don.donorName}</strong>
                          <span className="text-[10px] text-[#d4af37] font-medium">{don.tierTitle}</span>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span className="text-xs font-bold text-white flex items-center justify-end gap-1">
                          <img src="/cannuccia-bianca.png" alt="Cannuccia" className="w-3.5 h-3.5 object-contain" />
                          <span>{don.cannucceAmount.toLocaleString()}</span>
                        </span>
                        <span className="text-[9px] text-slate-500 block">
                          {new Date(don.donatedAt).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 bg-[#0a0e0c] rounded-xl border border-white/[0.04] space-y-1">
                <p className="text-xs text-slate-400">Nessuna donazione ancora registrata.</p>
                <p className="text-[11px]">Sii il primo sostenitore a donare Cannucce Bianche al Progetto Gabbiness!</p>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
