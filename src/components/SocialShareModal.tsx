import React, { useEffect, useRef, useState } from 'react';
import { 
  X, 
  Download, 
  Share2, 
  Sparkles, 
  Trophy, 
  Target, 
  Flame, 
  Check, 
  MessageCircle, 
  Send, 
  Copy,
  Globe
} from 'lucide-react';
import { GolfatinaMatch } from '../data/golfatineData';
import { sound } from '../utils/audio';
import { triggerVictoryConfetti } from '../utils/confetti';

interface SocialShareModalProps {
  match: GolfatinaMatch | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({ match, isOpen, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !match) return null;

  const hasScorecard = match.hasScorecard !== false && match.players.length > 0;

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      sound.playClick();
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, { quality: 0.95 });
      const link = document.createElement('a');
      link.download = `Melagoodo_Golfatina_${match.id}_Wrapped.png`;
      link.href = dataUrl;
      link.click();
      sound.playHIOFanfare();
      triggerVictoryConfetti();
    } catch (err) {
      console.error('Error exporting story card', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyLink = () => {
    sound.playClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?match=${match.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const shareText = encodeURIComponent(
    `Guarda le statistiche della Golfatina #${match.id}: "${match.title}" sullo Sdrogo Golfometro di Melagoodo!\n`
  );
  const shareUrl = encodeURIComponent(`${window.location.origin}${window.location.pathname}?match=${match.id}`);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Condividi Golfatina ${match.id}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-xl bg-black/85 animate-in fade-in duration-200 select-none overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      
      <div
        className="relative w-full max-w-2xl bg-[#090d0b] border border-white/[0.1] rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-[#0d1410] flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-5 h-5 text-[#d4af37]" />
            <div>
              <h2 className="text-base sm:text-lg font-black font-heading text-white">
                Social Story Wrapped
              </h2>
              <p className="text-[11px] text-slate-400">
                Condividi la card ufficiale sui social (Instagram Stories, WhatsApp, TikTok)
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            aria-label="Chiudi condivisione"
            className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 flex flex-col items-center">
          
          {/* Vertical 9:16 Story Wrapped Card (Exportable Target) */}
          <div
            ref={cardRef}
            className="w-full max-w-[340px] aspect-[9/16] rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-[#0e1612] via-[#090d0b] to-[#040705] border-2 border-[#d4af37]/40 shadow-2xl text-white"
          >
            {/* Background Texture Accents */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#d4af37]/10 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

            {/* Top Brand Header */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#d4af37]/20 flex items-center justify-center text-xs text-[#d4af37]">
                  ⛳
                </div>
                <div>
                  <div className="text-[10px] font-black tracking-wider uppercase text-[#d4af37]">LO SDROGO GOLFOMETRO</div>
                  <div className="text-[8px] text-slate-400 font-mono">Melagoodo Official Archive</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#d4af37] text-slate-950">
                #{match.id}
              </span>
            </div>

            {/* Middle Thumbnail Album */}
            <div className="space-y-3 relative z-10 my-auto">
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/20 shadow-xl">
                <img
                  src={match.youtubeId ? `https://i.ytimg.com/vi/${match.youtubeId}/mqdefault.jpg` : ''}
                  alt={match.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[9px] font-mono">
                  {hasScorecard ? `Par ${match.totalPar} • ${match.date}` : `Video in archivio • ${match.date}`}
                </div>
              </div>

              <h3 className="text-sm font-black font-heading line-clamp-2 text-center text-white">
                {match.title}
              </h3>

              {/* Podium Breakdown */}
              {hasScorecard ? (
              <div className="bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 space-y-1.5 text-xs font-mono">
                <div className="text-[9px] font-bold uppercase text-slate-400 tracking-wider flex justify-between">
                  <span>Podio Ufficiale</span>
                  <span>Score</span>
                </div>
                {match.players.slice(0, 3).map((p, i) => (
                  <div key={p.name} className="flex justify-between items-center text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#d4af37]">{i + 1}°</span>
                      <strong className={i === 0 ? 'text-[#d4af37]' : 'text-slate-200'}>{p.name}</strong>
                    </span>
                    <span className="text-slate-300 font-bold">{p.totalScore} ({p.diffPar > 0 ? `+${p.diffPar}` : p.diffPar})</span>
                  </div>
                ))}
              </div>
              ) : (
              <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-400/30 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Video in archivio</div>
                <div className="text-[10px] text-slate-300 font-mono">Scorecard in trascrizione</div>
              </div>
              )}

              {/* Stats Highlights */}
              {hasScorecard && (
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-center">
                <div className="bg-white/[0.05] p-2 rounded-lg border border-white/10">
                  <div className="text-slate-400">Hole in One</div>
                  <div className="text-sm font-bold text-[#d4af37]">{match.totalHIOs} HIO</div>
                </div>
                <div className="bg-white/[0.05] p-2 rounded-lg border border-white/10">
                  <div className="text-slate-400">Peggior Buca</div>
                  <div className="text-sm font-bold text-rose-400">{match.maxHoleScore} colpi</div>
                </div>
              </div>
              )}
            </div>

            {/* Bottom Signature */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[8px] text-slate-400 font-mono relative z-10">
              <span>www.webnovis.com</span>
              <span>MELAGOODO ARCHIVES</span>
            </div>

          </div>

          {/* Action Triggers */}
          <div className="w-full space-y-3">
            
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={handleDownloadImage}
                disabled={isExporting}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-amber-500 hover:from-[#e5c158] hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-98 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Generazione...' : 'Scarica Immagine Story (PNG)'}</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="px-4 py-2.5 rounded-xl bg-[#141d18] border border-white/[0.1] text-slate-200 hover:bg-[#1a2620] font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Link Copiato!' : 'Copia Link'}</span>
              </button>
            </div>

            {/* Social Share Channels */}
            <div className="flex items-center justify-center gap-3 pt-2 text-xs">
              <a
                href={`https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sound.playClick()}
                className="p-2.5 rounded-full bg-[#128c7e]/20 text-[#25d366] border border-[#25d366]/30 hover:scale-110 transition-transform"
                title="Condividi su WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>

              <a
                href={`https://t.me/share/url?url=${shareUrl}&text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sound.playClick()}
                className="p-2.5 rounded-full bg-[#0088cc]/20 text-[#0088cc] border border-[#0088cc]/30 hover:scale-110 transition-transform"
                title="Condividi su Telegram"
              >
                <Send className="w-4 h-4" />
              </a>

              <button
                onClick={handleCopyLink}
                className="p-2.5 rounded-full bg-white/[0.05] text-slate-300 border border-white/10 hover:scale-110 transition-transform cursor-pointer"
                title="Copia Link per Instagram / TikTok"
              >
                <Globe className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
