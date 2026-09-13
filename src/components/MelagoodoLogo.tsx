import React, { useState } from 'react';

interface MelagoodoLogoProps {
  className?: string;
  size?: number;
  variant?: 'badge' | 'full';
  showText?: boolean;
}

/**
 * Original Melagoodo Golf Community Logo
 * 
 * Features:
 * - Iconic Melagoodo Green Apple morphing into a precision dimpled Golf Ball
 * - Royal Golden Crown with emerald insets of the Melagoodo Kings
 * - Circular golden-rimmed gaming medallion aesthetic
 * - Authentic YouTube / Esports crew branding identity
 */
export const MelagoodoLogo: React.FC<MelagoodoLogoProps> = ({ 
  className = "w-8 h-8", 
  size = 34,
  variant = 'badge',
  showText = false 
}) => {
  const [imageError, setImageError] = useState(false);

  const imgSrc = variant === 'full'
    ? '/brand/melagoodo_golfatine_full.webp'
    : '/brand/melagoodo_badge_transparent-64.webp';

  return (
    <div 
      className={`inline-flex items-center gap-2.5 select-none shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {!imageError ? (
        <img
          src={imgSrc}
          alt="Melagoodo Golf Logo Ufficiale"
          width={size}
          height={size}
          className="w-full h-full object-contain rounded-full drop-shadow-[0_2px_10px_rgba(212,175,55,0.4)] group-hover:scale-105 group-hover:drop-shadow-[0_4px_16px_rgba(212,175,55,0.6)] transition-all duration-300"
          onError={() => setImageError(true)}
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      ) : (
        /* Fallback Vector */
        <div 
          className="w-full h-full rounded-full bg-[#121c16] border border-[#d4af37]/60 flex items-center justify-center text-sm shadow-md"
        >
          🍏
        </div>
      )}

      {showText && (
        <div className="flex flex-col">
          <span className="font-heading font-black text-sm tracking-tight text-white leading-none">
            MELAGOODO
          </span>
          <span className="font-mono text-[9px] font-bold text-[#d4af37] tracking-wider uppercase leading-none mt-0.5">
            GOLFATINE
          </span>
        </div>
      )}
    </div>
  );
};
