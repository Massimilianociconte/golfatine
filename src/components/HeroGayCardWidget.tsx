import React, { useState, useEffect } from 'react';
import { 
  RotateCw, 
  Download, 
  Sparkles, 
  Edit3,
  Play,
  Pause
} from 'lucide-react';
import { sound } from '../utils/audio';
import { triggerVictoryConfetti } from '../utils/confetti';
import { getLocalUserProfile, subscribeToUserProfile, UserGaYCard } from '../utils/userStore';
import { downloadGayCardPng } from '../utils/cardExporter';

interface HeroGayCardWidgetProps {
  onOpenModal: () => void;
  isMobileSection?: boolean;
}

export const HeroGayCardWidget: React.FC<HeroGayCardWidgetProps> = ({ 
  onOpenModal,
  isMobileSection = false 
}) => {
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Load user custom card data or fallback to defaults
  const [cardData, setCardData] = useState<UserGaYCard>(() => {
    const profile = getLocalUserProfile();
    if (profile.savedGaYCard) return profile.savedGaYCard;

    const firstName = profile.realName ? profile.realName.split(' ')[0] : 'Sdrogo';
    const lastName = profile.realName && profile.realName.split(' ')[1] ? profile.realName.split(' ')[1] : 'Player';

    return {
      name: firstName,
      surname: lastName,
      cardNumber: 'GAY-61-0001',
      customTitle: 'Golfatore di Prima Classe',
      membershipType: 'GOLD VIP',
      favoritePlayer: 'Just Rohn',
      createdAt: new Date().toISOString(),
    };
  });

  // Re-sync card data if profile updates (across tabs and within same tab)
  useEffect(() => {
    const unsub = subscribeToUserProfile((p) => {
      if (p.savedGaYCard) {
        setCardData(p.savedGaYCard);
      } else {
        const firstName = p.realName ? p.realName.split(' ')[0] : 'Sdrogo';
        const lastName = p.realName && p.realName.split(' ')[1] ? p.realName.split(' ')[1] : 'Player';
        setCardData({
          name: firstName,
          surname: lastName,
          cardNumber: 'GAY-61-0001',
          customTitle: 'Golfatore di Prima Classe',
          membershipType: 'GOLD VIP',
          favoritePlayer: 'Just Rohn',
          createdAt: new Date().toISOString(),
        });
      }
    });
    return unsub;
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20; // -10 to 10 deg
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -20; // -10 to 10 deg
    setMousePos({ x, y });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: 0, y: 0 });
  };

  const handleFlip = () => {
    try {
      sound.playCardFlip();
    } catch {
      // ignore
    }
    // When manually flipping, pause automatic rotation so the user stays on their desired face
    setIsAutoRotating(false);
    setIsFlipped(!isFlipped);
  };

  const toggleAutoRotate = () => {
    try {
      sound.playClick();
    } catch {
      // ignore
    }
    setIsAutoRotating(!isAutoRotating);
  };

  const handleQuickDownload = async () => {
    try {
      setIsDownloading(true);
      setExportError(null);
      try {
        sound.playClick();
      } catch {
        // ignore
      }
      await downloadGayCardPng({
        userName: cardData.name,
        userSurname: cardData.surname,
        cardNumber: cardData.cardNumber,
        customTitle: cardData.customTitle,
        favoritePlayer: cardData.favoritePlayer,
      });
      try {
        sound.playHIOFanfare();
        triggerVictoryConfetti();
      } catch {
        // ignore
      }
    } catch (err) {
      console.error('Quick download failed', err);
      setExportError('Download non riuscito: controlla la connessione e riprova.');
    } finally {
      setIsDownloading(false);
    }
  };

  // 3D Transform values when not in auto-rotate or when hovered
  const rotY = isFlipped ? 180 + mousePos.x * 0.5 : mousePos.x;
  const rotX = mousePos.y;

  return (
    <div className={`relative flex flex-col items-center ${isMobileSection ? 'w-full max-w-md mx-auto p-6 rounded-3xl bg-gradient-to-b from-[#101914] via-[#090e0b] to-[#050806] border border-[#d4af37]/30 shadow-2xl my-6' : 'w-full max-w-[390px]'}`}>
      
      {/* Mobile-Only Header Badge */}
      {isMobileSection && (
        <div className="w-full text-center mb-5 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Meme GaY Card Ufficiale 3D</span>
          </div>
          <h2 className="text-xl font-heading font-black text-white">
            La Tua Carta Esclusiva Melagoodo
          </h2>
          <p className="text-xs text-slate-400">
            Gira in 3D in tempo reale, personalizza il tuo nome e scarica il PNG ufficiale ad alta risoluzione.
          </p>
        </div>
      )}

      {/* 3D Card Container with Perspective */}
      <div 
        role="button"
        tabIndex={0}
        aria-label={isFlipped ? "GaY Card 3D: visualizza fronte della carta" : "GaY Card 3D: visualizza retro della carta"}
        className="w-full relative cursor-pointer select-none group py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] rounded-2xl"
        style={{ perspective: 1200 }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleFlip}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleFlip();
          }
        }}
        title={isAutoRotating ? "Clicca per fermare e girare la carta" : "Clicca per ruotare la carta"}
      >
        {/* Ambient Gold Glow Under Card with subtle pulsing */}
        <div 
          className="absolute inset-4 rounded-3xl bg-[#d4af37]/20 blur-2xl transition-opacity duration-500 pointer-events-none"
          style={{ opacity: isHovered ? 0.75 : 0.38 }}
        />

        {/* 3D Flipping Card Body with Ambient Auto-Rotation */}
        <div 
          className={`relative w-full rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] ${
            isAutoRotating ? 'animate-hero-card-auto' : 'transition-transform duration-500 ease-out'
          }`}
          style={{
            aspectRatio: '882 / 576',
            transformStyle: 'preserve-3d',
            animationPlayState: isHovered ? 'paused' : 'running',
            transform: !isAutoRotating
              ? `rotateY(${rotY}deg) rotateX(${rotX}deg) ${isHovered ? 'scale3d(1.02, 1.02, 1.02)' : ''}`
              : isHovered
              ? `scale3d(1.03, 1.03, 1.03)`
              : undefined,
          }}
        >
          {/* === FRONT FACE === */}
          <div 
            className="absolute inset-0 rounded-2xl overflow-hidden border border-white/25 bg-[#070b09] shadow-inner"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            {/* Front Background Artwork (600px WebP preview; full-res used for PNG export) */}
            <img
              src="/cards/gay_card_front-600.webp"
              alt="GaY Card Front"
              width={600}
              height={392}
              className="w-full h-full object-fill pointer-events-none select-none"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />

            {/* Smart Metallic Chip */}
            <div 
              className="absolute pointer-events-none select-none rounded-[4px] border border-[#785f1e] shadow-sm overflow-hidden"
              style={{
                top: '31%',
                left: '6%',
                width: '12%',
                aspectRatio: '46 / 35',
                background: 'linear-gradient(135deg, #d8ba66, #f7e6a5, #9c7d2e)',
              }}
            >
              <div className="absolute inset-[1px] border border-[rgba(120,95,30,0.6)] rounded-[2px] grid grid-cols-2 gap-[1px] p-[1px]">
                <div className="bg-[#b3953f]/40 rounded-[1px]" />
                <div className="bg-[#b3953f]/40 rounded-[1px]" />
              </div>
            </div>

            {/* User Text Overlay - Front */}
            <div 
              className="absolute pointer-events-none select-none flex flex-col justify-start"
              style={{
                top: '44%',
                left: '6%',
                maxWidth: '48%',
              }}
            >
              <span className="text-[7px] sm:text-[9px] font-mono font-extrabold tracking-widest text-[#5a4315] uppercase leading-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]">
                INTESTATARIO UFFICIALE
              </span>
              <span className="text-[10px] sm:text-[14px] font-heading font-black tracking-tight text-[#1e1303] uppercase leading-tight truncate drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]">
                {cardData.name} {cardData.surname}
              </span>
              <span className="text-[8px] sm:text-[10px] font-mono font-bold text-[#38260a] leading-tight pt-0.5 truncate drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]">
                {cardData.cardNumber}
              </span>
              <span className="text-[7px] sm:text-[8px] font-sans font-bold text-[#5c4618] leading-tight truncate drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]">
                {cardData.customTitle}
              </span>
            </div>

            {/* Interactive 3D Glare Sheen */}
            <div 
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{
                background: `linear-gradient(${135 + mousePos.x * 2}deg, rgba(255,255,255,0.22) 0%, transparent 60%)`,
                opacity: isHovered ? 0.75 : 0.25,
              }}
            />
          </div>

          {/* === BACK FACE === */}
          <div 
            className="absolute inset-0 rounded-2xl overflow-hidden border border-white/25 bg-[#070b09] shadow-inner"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            {/* Back Background Artwork (600px WebP preview; full-res used for PNG export) */}
            <img
              src="/cards/gay_card_back-600.webp"
              alt="GaY Card Back"
              width={600}
              height={390}
              className="w-full h-full object-fill pointer-events-none select-none"
              loading="lazy"
              decoding="async"
            />
            {/* Back Face Overlay */}
            <div className="absolute inset-0 p-3 sm:p-4 flex flex-col justify-between text-white pointer-events-none select-none">
              
              {/* Top Row Badges */}
              <div className="flex justify-between items-center text-[7px] sm:text-[9px] font-mono font-bold">
                <span className="bg-black/70 px-2 py-0.5 rounded border border-white/15">
                  MELAGOODO OFFICIAL
                </span>
                <span className="bg-black/70 px-2 py-0.5 rounded border border-white/15">
                  82 EPISODI
                </span>
              </div>

              {/* Middle Signature Strip */}
              <div className="w-full bg-white/95 rounded-md px-2 sm:px-3 py-1 sm:py-1.5 flex items-center justify-between text-[#0f172a] shadow-md border border-black/20">
                <span className="font-mono text-[9px] sm:text-[12px] font-bold italic truncate">
                  {cardData.name} {cardData.surname}
                </span>
                <span className="font-mono text-[8px] sm:text-[10px] font-black bg-slate-200 px-1.5 py-0.5 rounded text-slate-800">
                  {cardData.cardNumber}
                </span>
              </div>

              {/* Bottom Row Information */}
              <div className="flex justify-between items-center text-[7px] sm:text-[9px] bg-black/70 px-2 py-1 rounded border border-white/15 font-sans">
                <span className="font-bold text-[#d4af37] truncate">
                  Favorito: {cardData.favoritePlayer}
                </span>
                <span className="font-mono text-slate-300 font-semibold">
                  losdrogogolfometro.cloud
                </span>
              </div>

            </div>

            {/* Back Interactive Glare */}
            <div 
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{
                background: `linear-gradient(${215 - mousePos.x * 2}deg, rgba(255,255,255,0.18) 0%, transparent 60%)`,
                opacity: isHovered ? 0.65 : 0.2,
              }}
            />
          </div>

        </div>
      </div>

      {/* Control Actions Strip */}
      <div className="w-full flex items-center justify-between gap-1.5 sm:gap-2 mt-3 sm:mt-4">
        
        {/* Auto-Rotation Toggle */}
        <button
          onClick={toggleAutoRotate}
          aria-label={isAutoRotating ? "Metti in pausa la rotazione automatica 3D" : "Attiva la rotazione automatica 3D"}
          className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border min-h-[40px] ${
            isAutoRotating 
              ? 'bg-[#d4af37]/15 text-[#d4af37] border-[#d4af37]/35 hover:bg-[#d4af37]/25' 
              : 'bg-white/[0.06] text-slate-400 border-white/[0.08] hover:text-white'
          }`}
          title={isAutoRotating ? "Metti in pausa rotazione automatica" : "Attiva rotazione automatica 3D"}
        >
          {isAutoRotating ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />
              <span className="text-[11px] sm:text-xs">Auto 3D</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 text-slate-400" />
              <span className="text-[11px] sm:text-xs">Gira</span>
            </>
          )}
        </button>

        {/* Manual Flip Button */}
        <button
          onClick={handleFlip}
          aria-label="Gira la card manualmente"
          className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-white/[0.08] min-h-[40px]"
          title="Gira la card manualmente"
        >
          <RotateCw className="w-3.5 h-3.5 text-[#d4af37]" />
          <span className="hidden xs:inline">{isFlipped ? 'Fronte' : 'Retro'}</span>
        </button>

        {/* Quick Download PNG Button */}
        <button
          onClick={handleQuickDownload}
          disabled={isDownloading}
          aria-label="Scarica PNG della GaY Card ad alta risoluzione"
          className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-amber-500 hover:from-[#f3e8c8] hover:to-[#d4af37] text-slate-950 font-heading font-black text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50 min-h-[40px]"
          title="Scarica PNG ad alta risoluzione"
        >
          <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
          <span>{isDownloading ? '...' : 'PNG'}</span>
        </button>
        {exportError && (
          <p role="alert" className="w-full text-center text-[11px] text-red-300 pt-1">{exportError}</p>
        )}

        {/* Customize / Edit Button */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenModal();
          }}
          aria-label="Personalizza Nome & Titolo della GaY Card"
          className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/[0.06] min-h-[40px] min-w-[40px] flex items-center justify-center"
          title="Personalizza Nome & Titolo"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>

      </div>

    </div>
  );
};
