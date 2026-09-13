import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  RotateCw, 
  Download, 
  Sparkles, 
  Save, 
  Check, 
  CreditCard,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { sound } from '../utils/audio';
import { triggerVictoryConfetti } from '../utils/confetti';
import { 
  getLocalUserProfile, 
  saveUserCustomGaYCard, 
  UserGaYCard, 
  generateUniqueCardNumber 
} from '../utils/userStore';
import { downloadGayCardPng } from '../utils/cardExporter';
import { PLAYERS_LIST } from '../data/golfatineData';

interface GayCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GayCardModal: React.FC<GayCardModalProps> = ({ isOpen, onClose }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; rotX: number; rotY: number }>({ x: 0, y: 0, rotX: 0, rotY: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);

  // Customizer state
  const [userName, setUserName] = useState('Massimiliano');
  const [userSurname, setUserSurname] = useState('Ciconte');
  const [cardNumber, setCardNumber] = useState('');
  const [customTitle, setCustomTitle] = useState('Lifetime Member Melagoodo');
  const [favoritePlayer, setFavoritePlayer] = useState('Just Rohn');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    const profile = getLocalUserProfile();
    if (profile.savedGaYCard) {
      setUserName(profile.savedGaYCard.name || 'Massimiliano');
      setUserSurname(profile.savedGaYCard.surname || 'Ciconte');
      setCardNumber(profile.savedGaYCard.cardNumber || generateUniqueCardNumber());
      setCustomTitle(profile.savedGaYCard.customTitle || 'Lifetime Member Melagoodo');
      setFavoritePlayer(profile.savedGaYCard.favoritePlayer || 'Just Rohn');
    } else {
      setCardNumber(generateUniqueCardNumber());
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        sound.playClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFlip = () => {
    sound.playSwing();
    setIsFlipped(!isFlipped);
  };

  const updateRotation = (clientX: number, clientY: number) => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      const deltaX = clientX - dragStartRef.current.x;
      const deltaY = clientY - dragStartRef.current.y;
      setRotY(dragStartRef.current.rotY + deltaX * 0.45);
      setRotX(Math.max(-35, Math.min(35, dragStartRef.current.rotX - deltaY * 0.45)));
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, rotX, rotY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    updateRotation(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, rotX, rotY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    updateRotation(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleSaveCard = () => {
    sound.playHIOFanfare();
    triggerVictoryConfetti();
    const finalCardNumber = cardNumber || generateUniqueCardNumber();
    const card: UserGaYCard = {
      name: userName.trim(),
      surname: userSurname.trim(),
      cardNumber: finalCardNumber,
      customTitle: customTitle.trim(),
      membershipType: 'Gold Lifetime',
      favoritePlayer,
      createdAt: new Date().toISOString(),
    };
    saveUserCustomGaYCard(card);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handleDownloadCard = async () => {
    try {
      setIsExporting(true);
      setExportError(null);
      sound.playClick();

      await downloadGayCardPng({
        userName,
        userSurname,
        cardNumber,
        customTitle,
        favoritePlayer,
      });

      sound.playHIOFanfare();
      triggerVictoryConfetti();
    } catch (err) {
      console.error('Export failed', err);
      setExportError('Esportazione non riuscita: controlla la connessione e riprova.');
    } finally {
      setIsExporting(false);
    }
  };

  const currentRotation = isFlipped ? rotY + 180 : rotY;

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="gaycard-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sound.playClick();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-xl bg-black/85 animate-in fade-in duration-200 select-none overflow-y-auto cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-[#090d0b] border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col cursor-default"
      >
        
        {/* Modal Header with Required Exact Title */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-[#0d1410] flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#d4af37] to-amber-600 flex items-center justify-center text-slate-950 font-bold text-base shadow shrink-0">
              🎴
            </div>
            <div>
              <h2 id="gaycard-title" className="text-sm sm:text-base font-black font-heading text-white tracking-tight leading-snug">
                “Ritira subito la tua GAY card prima che sia troppo tardi! Non diventare etero”
              </h2>
              <p className="text-[11px] text-[#d4af37] font-semibold mt-0.5">
                Tessera Ufficiale Esclusiva della Community di Melagoodo • ID Univoco Permanente
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleFlip}
              className="px-3 py-1.5 rounded-lg bg-[#141d18] hover:bg-[#1a2620] border border-white/[0.1] text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5 text-[#d4af37]" />
              <span className="hidden sm:inline">Ruota 180°</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              aria-label="Chiudi finestra modale"
              className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left: 3D Interactive Card Stage */}
          <div 
            className="lg:col-span-7 flex flex-col items-center justify-center p-2 sm:p-4 min-h-[320px] relative cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            <div className="text-[10px] text-slate-400 font-mono mb-2 flex items-center gap-1">
              <span>Trascina con il cursore per muovere la card nello spazio 3D</span>
            </div>

            {/* 3D Perspective Wrapper */}
            <div 
              className="relative w-full max-w-[360px] sm:max-w-[420px] aspect-[882/576] transition-transform duration-75"
              style={{ perspective: '1200px' }}
            >
              <div 
                ref={cardRef}
                className="w-full h-full relative rounded-2xl shadow-2xl transition-transform duration-100"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: `rotateX(${rotX}deg) rotateY(${currentRotation}deg)`,
                }}
              >
                
                {/* FRONT OF THE GAY CARD */}
                <div 
                  className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-2xl backface-hidden bg-[#e0c26b]"
                  style={{
                    backfaceVisibility: 'hidden',
                    backgroundImage: 'url(/cards/gay_card_front-600.webp)',
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center',
                  }}
                >
                  {/* Dynamic Metallic Shimmer Glare */}
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-30"
                    style={{
                      background: `linear-gradient(${120 + rotY}deg, transparent 30%, rgba(255,255,255,0.7) 50%, transparent 70%)`,
                    }}
                  />

                  {/* Strictly Positioned Safe Text Block (Y: 32% to 56%, X: 6% to 40%) - ZERO Overlap */}
                  <div className="absolute top-[32%] left-[6%] max-w-[40%] pointer-events-none select-none space-y-0.5">
                    
                    {/* Metallic Smart Chip Hologram */}
                    <div className="w-6 h-4.5 rounded bg-gradient-to-br from-[#d8ba66] via-[#f7e6a5] to-[#9c7d2e] border border-[#785f1e] shadow-sm flex items-center justify-center mb-0.5">
                      <div className="w-4.5 h-3 border border-[#8f7429]/60 rounded-sm grid grid-cols-2 gap-0.5 p-0.5">
                        <div className="bg-[#b3953f]/40 rounded-sm" />
                        <div className="bg-[#b3953f]/40 rounded-sm" />
                      </div>
                    </div>

                    {/* Label */}
                    <div className="text-[6.5px] font-mono font-bold tracking-widest uppercase text-[#5a4315] leading-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]">
                      INTESTATARIO UFFICIALE
                    </div>

                    {/* Name */}
                    <div className="text-[10px] sm:text-[11px] font-black font-heading tracking-tight uppercase text-[#241704] leading-tight truncate drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]">
                      {userName} {userSurname}
                    </div>

                    {/* Unique Serial Number */}
                    <div className="text-[8px] font-mono font-black text-[#38260a] leading-none pt-0.5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)] truncate">
                      {cardNumber}
                    </div>

                    {/* Rank */}
                    <div className="text-[7px] font-bold text-[#5c4618] leading-none truncate drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]">
                      {customTitle}
                    </div>

                  </div>

                </div>

                {/* BACK OF THE GAY CARD */}
                <div 
                  className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-2xl backface-hidden bg-[#121212]"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    backgroundImage: 'url(/cards/gay_card_back-600.webp)',
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="absolute inset-0 p-4 flex flex-col justify-between text-white drop-shadow pointer-events-none select-none">
                    
                    <div className="flex justify-between items-center text-[9px] font-mono font-bold">
                      <span className="bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm border border-white/10">
                        MELAGOODO OFFICIAL CARD
                      </span>
                      <span className="bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm border border-white/10">
                        VERIFIED 82 EPISODES
                      </span>
                    </div>

                    {/* Integrated Signature Panel */}
                    <div className="w-full bg-white/90 text-slate-900 rounded px-3 py-1 flex items-center justify-between my-auto shadow border border-black/20">
                      <span className="font-mono text-[10px] tracking-wider italic font-bold">
                        {userName} {userSurname}
                      </span>
                      <span className="font-mono text-[9px] font-black bg-slate-200 px-1.5 py-0.5 rounded border border-slate-400">
                        {cardNumber}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-bold bg-black/60 px-2.5 py-1 rounded backdrop-blur-sm border border-white/10">
                      <span className="text-[#d4af37]">Favorito: {favoritePlayer}</span>
                      <span className="font-mono text-slate-300">losdrogogolfometro.cloud</span>
                    </div>

                  </div>
                </div>

              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2.5 mt-4">
              <button
                onClick={handleFlip}
                className="px-3.5 py-1.5 rounded-xl bg-white text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow hover:bg-slate-200 transition-colors cursor-pointer min-h-[38px]"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Gira Carta</span>
              </button>

              <button
                onClick={handleDownloadCard}
                disabled={isExporting}
                className="px-3.5 py-1.5 rounded-xl bg-[#141d18] border border-white/[0.1] text-xs font-semibold text-slate-200 flex items-center gap-1.5 hover:bg-[#1a2620] transition-colors cursor-pointer min-h-[38px]"
              >
                <Download className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>{isExporting ? 'Generazione...' : 'Scarica PNG (HD)'}</span>
              </button>
              {exportError && (
                <p role="alert" className="text-[11px] text-red-300">{exportError}</p>
              )}
            </div>
          </div>

          {/* Right: Personalization Form */}
          <div className="lg:col-span-5 premium-card p-5 rounded-2xl border border-white/[0.08] space-y-4">
            <div>
              <h3 className="text-sm font-bold font-heading text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                Personalizza la Tua Tessera Ufficiale
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                La card possiede un serial ID univoco non riutilizzabile che la rende autentica e preziosa.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Nome</label>
                  <input
                    type="text"
                    maxLength={25}
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg premium-input text-white text-base sm:text-xs"
                    placeholder="Nome"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Cognome</label>
                  <input
                    type="text"
                    maxLength={25}
                    value={userSurname}
                    onChange={(e) => setUserSurname(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg premium-input text-white text-base sm:text-xs"
                    placeholder="Cognome"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Titolo / Rango Community</label>
                <input
                  type="text"
                  maxLength={35}
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg premium-input text-white text-base sm:text-xs"
                  placeholder="Es: Lifetime Member Melagoodo"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Serial ID Univoco (Permanente)</label>
                  <input
                    type="text"
                    value={cardNumber}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg premium-input text-[#d4af37] text-xs font-mono font-bold bg-[#070b09]/80 cursor-not-allowed"
                    title="ID univoco non riutilizzabile generato per te"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Giocatore Preferito</label>
                  <select
                    value={favoritePlayer}
                    onChange={(e) => setFavoritePlayer(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg premium-input text-white text-base sm:text-xs cursor-pointer"
                  >
                    {PLAYERS_LIST.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            {/* Save & Feedback */}
            <div className="pt-2 border-t border-white/[0.08] space-y-2">
              <button
                onClick={handleSaveCard}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-amber-500 hover:from-[#e5c158] hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer min-h-[44px]"
              >
                <Save className="w-4 h-4" />
                <span>Salva Card nel Profilo Utente</span>
              </button>

              {savedSuccess && (
                <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs text-center font-bold animate-in zoom-in-95">
                  ✓ GaY Card salvata con successo nel profilo!
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
