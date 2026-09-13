import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Volume2, 
  Sparkles, 
  Target, 
  Flame, 
  Play, 
  Share2, 
  Check, 
  Mic, 
  Activity, 
  Zap, 
  ShieldAlert,
  Crosshair,
  TrendingUp,
  Hammer,
  Send,
  ExternalLink,
  MessageCircle,
  X,
  Layers,
  HelpCircle
} from 'lucide-react';
import { sound } from '../utils/audio';
import { triggerVictoryConfetti } from '../utils/confetti';

// Official Community Telegram Contact
export const TELEGRAM_COMMUNITY_URL = 'https://t.me/sinnerpadel';

export const SoundboardView: React.FC = () => {
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const playTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);
  
  // Work in Progress State Flow: 'modal_open' -> 'preview'
  // Skip modal and loading if user has already seen the WIP notice in this session
  const [wipPhase, setWipPhase] = useState<'modal_open' | 'preview'>(() => {
    if (typeof window !== 'undefined') {
      try {
        if (sessionStorage.getItem('sdrogo_soundboard_wip_seen') === 'true') {
          return 'preview';
        }
      } catch {
        // ignore sessionStorage errors
      }
    }
    return 'modal_open';
  });

  const handleCloseWipModal = () => {
    try {
      sound.playClick();
    } catch {
      // ignore
    }
    try {
      sessionStorage.setItem('sdrogo_soundboard_wip_seen', 'true');
    } catch {
      // ignore
    }
    setWipPhase('preview');
  };

  useEffect(() => {
    if (wipPhase !== 'modal_open') return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleCloseWipModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [wipPhase]);

  const soundTracks = [
    {
      title: '«Donate al Progetto Gabbiness!»',
      character: 'GaBBo, Dread & Delux',
      desc: '«La gente è per strada con le magliette: Carica 3 Gabbo! Occhio al progetto!» Il tormentone supremo.',
      category: 'Progetto Gabbiness',
      action: () => sound.playDisasterBuzzer(),
    },
    {
      title: '«Faccio Geometria!»',
      character: 'Delux',
      desc: '«Faccio geometria!» — «Tu non fai geometria, fai le cose a caso!» La difesa classica dopo carambole assurde.',
      category: 'Fisica & Sponde',
      action: () => sound.playRouletteTick(),
    },
    {
      title: '«Apri il Mongoloniometro!»',
      character: 'Just Rohn & Dread',
      desc: '«Calcoli mongoniometrici per 45 secondi!» La parodia per chi allinea il tiro al millimetro.',
      category: 'Precisione Orefice',
      action: () => sound.playSwing(),
    },
    {
      title: '«Ho perso il fucking mental!»',
      character: 'ilMasseo & Dread',
      desc: '«Ho perso il mental! Sembro l’Arsenal in Premier League!» Dichiarazione di resa dopo una buca da 14.',
      category: 'Rage & Tilt',
      action: () => sound.playDisasterBuzzer(),
    },
    {
      title: '«Get on my level!»',
      character: 'Melagoodo Crew',
      desc: 'Gridato a pieni polmoni da chi infila un Hole-in-One imprevisto per sbeffeggiare chi è rimasto allo spawn.',
      category: 'Celebrazione HIO',
      action: () => {
        sound.playHIOFanfare();
        triggerVictoryConfetti();
      },
    },
    {
      title: '«Tira tre tacche!»',
      character: 'Evil Gabbo',
      desc: 'Il consiglio/troll di Gabbo dato agli avversari per farli volare deliberatamente fuori mappa nei percorsi RPG.',
      category: 'Griefer & Troll',
      action: () => sound.playSwing(),
    },
    {
      title: '«7g Creatina e Pugno al Tavolo»',
      character: 'GaBBo & Masseo',
      desc: 'La giustificazione dopo aver crashato il gioco o staccato i cavi per un pugno dato sul tavolo in preda al rage.',
      category: 'Impatti Tellurici',
      action: () => sound.playDisasterBuzzer(),
    },
    {
      title: '«Non ha più il cono visivo!»',
      character: 'Just Rohn',
      desc: 'Riferito alla vista e agli occhiali di Rohn durante le traiettorie lunghe e i tiri impossibili.',
      category: 'Cono Visivo',
      action: () => sound.playPuttInHole(),
    },
    {
      title: '«Cannuccia Bianca & Pastina»',
      character: 'GaBBo',
      desc: 'Il meme storico sull’alimentazione a base di pastina senza denti e del bere solo con la cannuccia bianca.',
      category: 'Meme Storico',
      action: () => sound.playClick(),
    },
    {
      title: '«BENVENUTI ALL’INFERNO!»',
      character: 'ilMasseo',
      desc: 'L’urlo primordiale della Golfatina #6, la mappa più brutale e punitiva mai giocata.',
      category: 'Inferno #6',
      action: () => sound.playDisasterBuzzer(),
    },
    {
      title: '«Modalità Evil Jimmy: Bocciare!»',
      character: 'JTaz',
      desc: 'Speronamento tattico con collisioni attive per scaraventare i primi in classifica fuori dal green.',
      category: 'Speronamento',
      action: () => sound.playSwing(),
    },
    {
      title: '«La Sfida su Trials Fusion»',
      character: 'Rohn vs Delux',
      desc: 'L’eterno rimando alle storiche sfide di abilità motociclistica riesumato ad ogni singolo colpo di distacco.',
      category: 'Rivalità Epica',
      action: () => sound.playHIOFanfare(),
    },
  ];

  const handlePlaySound = (idx: number, action: () => void) => {
    if (wipPhase !== 'preview') {
      setWipPhase('modal_open');
      return;
    }
    setPlayingIdx(idx);
    try {
      action();
    } catch {
      // ignore
    }
    if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
    playTimeoutRef.current = setTimeout(() => {
      setPlayingIdx(null);
      playTimeoutRef.current = null;
    }, 1200);
  };

  const handleCopyQuote = (idx: number, quote: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(`${quote} - Melagoodo Golfatine`)
        .then(() => {
          setCopiedIdx(idx);
          if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
          copyTimeoutRef.current = setTimeout(() => {
            setCopiedIdx(null);
            copyTimeoutRef.current = null;
          }, 2000);
        })
        .catch(() => {});
    }
  };

  const openTelegramChat = () => {
    try {
      sound.playClick();
      triggerVictoryConfetti();
    } catch {
      // ignore
    }
    window.open(TELEGRAM_COMMUNITY_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="relative min-h-[75vh]">
      
      {/* 1. Interactive Preview Bar (Visible when user dismissed the popup to explore the blurred grid) */}
      {wipPhase === 'preview' && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#d4af37]/10 to-amber-500/15 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3 text-xs">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Hammer className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <strong className="text-white block font-heading">Modalità Anteprima • Sezione in Lavorazione</strong>
              <span className="text-slate-400 text-[11px]">Hai clip o meme audio da inserire? Contribuisci alla Soundboard!</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={openTelegramChat}
              className="px-3.5 py-1.5 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Invia su Telegram (@sinnerpadel)</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setWipPhase('modal_open');
              }}
              className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Dettagli
            </button>
          </div>
        </div>
      )}

      {/* 2. Underlying Soundboard Layout (Blurred when in loading or modal state) */}
      <div 
        className={`space-y-8 max-w-6xl mx-auto transition-all duration-700 ${
          wipPhase !== 'preview' ? 'filter blur-[26px] opacity-20 select-none pointer-events-none scale-[0.99]' : 'filter blur-[0.5px] opacity-90'
        }`}
      >
        {/* Top Banner */}
        <div className="premium-card p-6 sm:p-8 rounded-2xl border border-white/[0.08] text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 mx-auto">
            <Mic className="w-3.5 h-3.5" />
            <span>Melagoodo Audio Console & Tormentoni</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight">
            Sdrogo Soundboard & Frasi Celebri
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Tutti i tormentoni cult, i gridi di battaglia, i buzzer di tilt e le citazioni entrate nella storia delle Golfatine.
          </p>
        </div>

        {/* Grid of Sound Triggers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {soundTracks.map((item, idx) => {
            const isPlaying = playingIdx === idx;
            const isCopied = copiedIdx === idx;

            return (
              <div
                key={idx}
                className={`premium-card p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isPlaying ? 'border-[#d4af37] bg-[#141d18] shadow-lg ring-1 ring-[#d4af37]/40' : 'border-white/[0.08]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-white/[0.05] text-[#d4af37] border border-white/[0.06]">
                      {item.category}
                    </span>
                    
                    {isPlaying ? (
                      <Activity className="w-4 h-4 text-[#d4af37] animate-pulse" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-slate-500" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold font-heading text-white">{item.title}</h3>
                    <div className="text-[11px] text-slate-400 font-medium mt-0.5">{item.character}</div>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed italic">{item.desc}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/[0.06] flex items-center gap-2 mt-4">
                  <button
                    onClick={() => handlePlaySound(idx, item.action)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isPlaying
                        ? 'bg-[#d4af37] text-slate-950 shadow'
                        : 'bg-white text-slate-950 hover:bg-slate-200 active:scale-95'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isPlaying ? 'In Riproduzione' : 'Riproduci Audio'}</span>
                  </button>

                  <button
                    onClick={() => handleCopyQuote(idx, item.title)}
                    title="Copia citazione"
                    className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/[0.06] transition-colors cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. WORK IN PROGRESS COMMUNITY POPUP / MODAL */}
      {wipPhase === 'modal_open' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl bg-black/80 animate-in fade-in duration-300 select-none"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) handleCloseWipModal();
          }}
        >
          
          <div
            className="relative w-full max-w-lg bg-[#090e0b] border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 p-6 sm:p-8 space-y-6 text-center"
            onMouseDown={(event) => event.stopPropagation()}
          >
            
            {/* Top-Right Accessible Close Button */}
            <button
              onClick={handleCloseWipModal}
              aria-label="Chiudi avviso"
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Top Glowing Construction Icon */}
            <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 via-[#d4af37]/20 to-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl">
              <Hammer className="w-8 h-8 animate-bounce" />
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 animate-ping" />
            </div>

            {/* Header / Badges */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Work in Progress • Community Hub</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black font-heading text-white tracking-tight">
                Sezione Audio in Costruzione
              </h2>
            </div>

            {/* Official Requested Message */}
            <div className="p-4 rounded-2xl bg-[#0e1612] border border-white/[0.08] text-left space-y-2 shadow-inner">
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                “Attualmente questa sezione è in fase di costruzione. Se vuoi contribuire al suo completamento, inviaci gli audio specifici e i meme audio che vorresti inserire all’interno di questa sezione.”
              </p>
              <div className="pt-2 border-t border-white/[0.06] text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                <Mic className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                <span>Formati: Clip vocali Telegram, file .mp3, frasi celebri & meme cult</span>
              </div>
            </div>

            {/* Actions / CTA */}
            <div className="space-y-3 pt-1">
              
              {/* Main Telegram CTA */}
              <button
                onClick={openTelegramChat}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#0088cc] via-[#0099e6] to-[#0088cc] hover:from-[#0077b5] hover:to-[#0088cc] text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#0088cc]/20 transition-all active:scale-98 cursor-pointer group"
              >
                <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform" />
                <span>Invia il tuo audio su Telegram (@sinnerpadel)</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70 ml-1" />
              </button>

              {/* Secondary Explore Preview Button */}
              <button
                onClick={handleCloseWipModal}
                className="w-full py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer border border-white/[0.06]"
              >
                Esplora comunque l'anteprima dei titoli
              </button>

            </div>

            <p className="text-[10px] text-slate-500">
              Contatto ufficiale Telegram: <strong className="text-[#0088cc]">@sinnerpadel</strong> • Contributo libero della community Melagoodo
            </p>

          </div>

        </div>
      )}

    </div>
  );
};
