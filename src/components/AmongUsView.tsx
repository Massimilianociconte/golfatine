import React, { useState } from 'react';
import { 
  Skull, 
  CheckCircle2, 
  AlertTriangle,
  Vote, 
  Users, 
  MessageSquare
} from 'lucide-react';
import { sound } from '../utils/audio';
import { triggerVictoryConfetti } from '../utils/confetti';
import { getPlayerAvatar } from '../utils/playerAvatars';

interface TraitorCandidate {
  id: string;
  name: string;
  playerName: string;
  nickname: string;
  badge: string;
  color: string;
  episodeRef: string;
  quote: string;
  accusation: string;
  initialVotes: number;
  highlight?: boolean;
}

const CANDIDATES: TraitorCandidate[] = [
  {
    id: 'rohn',
    name: 'Just Rohn',
    playerName: 'Just Rohn',
    nickname: 'Teo',
    badge: 'Sospetto #1 • Negare Sempre',
    color: '#d4af37',
    episodeRef: 'Golfatina #4, #7 & #38',
    accusation: '«Dreddone, fratè l\'ha già provata! Tu dimmi come fai a vedere sta roba qua... se ti rendi conto che hai 13 colpi in meno e non l\'hai provata sei diventato il boss finale! Teo, fingere di non averla già provata facendo tutti sti tiri non ti fa scappare. Lui di notte si mette nel workshop!»',
    quote: '«Bro, ti giuro sul mio cane che non l\'ho mai vista prima di questa volta, non l\'ho mai vista! Il prossimo video scegliete voi la mappa e me la fate giocare nel mio video, vi giuro che non l\'ho mai vista sta cazzo di mappa!»',
    initialVotes: 842,
    highlight: true,
  },
  {
    id: 'delux',
    name: 'Delux',
    playerName: 'Delux',
    nickname: 'De Luca',
    badge: 'Sospetto #2 • Cammina nella Mappa',
    color: '#3b82f6',
    episodeRef: 'Golfatina #4, #29 & #34',
    accusation: '«Il tempo che guardo la mappa, De Luca è già arrivato in fondo! Ma come fa? C\'è Dellu che cammina nella mappa al primo colpo! Sì ma l\'ha beccata subito fratè: l\'ha provata zì, l\'ha provata! Assolutamente sì!»',
    quote: '«Io ho seguito chi ha già provato la mappa ragazzi... ecco, l\'ha provata meglio! Geometria, raga. Get on my level!»',
    initialVotes: 789,
    highlight: true,
  },
  {
    id: 'dread',
    name: 'nonsonodread',
    playerName: 'nonsonodread',
    nickname: 'Il Dreddone Brobbey',
    badge: 'L’Host del Workshop',
    color: '#8b5cf6',
    episodeRef: 'Golfatina #4, #38 & #56',
    accusation: '«Le mappe dal Workshop di Steam le scarica e le sceglie tutte lui! Com\'è che sa sempre in anticipo quale teleporter a destra non va e dove rimbalzare? È lui che crea le lobby prima di registrare!»',
    quote: '«Negare sempre, Teo, bravo! Guarda che se le provi lo puoi dire! Ho scelto la mappa apposta per vedere chi perde il fucking mental!»',
    initialVotes: 412,
  },
  {
    id: 'gabbo',
    name: 'GaBBo',
    playerName: 'GaBBo',
    nickname: 'Cannuccia Bianca',
    badge: 'Alibi di Ferro • 181 Colpi',
    color: '#ef4444',
    episodeRef: 'Golfatina #1, #29 & #34',
    accusation: '«Ma a Gabbo la fisica come gliel\'hanno spiegata?! Si lancia a tre tacche nella neve, si bugga sulle ruote e chiude a 14 colpi alla prima buca. Se l\'avesse provata prima, non farebbe 181 colpi a partita!»',
    quote: '«Progetto Gabbiness, ve l\'ho detto io! Ho perso tutto, la mia pallina si è buggata... no dai, ma perché?!»',
    initialVotes: 198,
  },
  {
    id: 'masseo',
    name: 'ilMasseo',
    playerName: 'ilMasseo',
    nickname: 'Il Berserker',
    badge: 'Innocente per Furia Cieca',
    color: '#f59e0b',
    episodeRef: 'Golfatina #6, #8 & #39',
    accusation: '«Se Masseo conoscesse la mappa in anticipo non gli esploderebbe la vena sulla fronte alla buca 3. Tira pugni al tavolo, crasha, ragequitta a metà partita e urla "CHI L\'HA CREATA STA MAPPA?!". Zero sospetti, disperazione pura!»',
    quote: '«BENVENUTI ALL\'INFERNO! MA CHE CAZZO DI MAPPA È QUESTA?! HO PERSO IL FUCKING MENTAL, PUGNO AL TAVOLO E VIA!»',
    initialVotes: 95,
  },
  {
    id: 'mollu',
    name: 'Mollu',
    playerName: 'Mollu',
    nickname: 'Mollura',
    badge: 'Il Silenzioso Infiltrato',
    color: '#10b981',
    episodeRef: 'Golfatina #4, #11 & #40',
    accusation: '«In Golfatina #4 hanno urlato: "Fratè, l\'ha vista anche Mollura!". Non parla mai in vocale, non urla, ma mentre tutti si insultano e litigano sul workshop lui chiude le buche da 1 e finisce a -8 in silenzio tombale.»',
    quote: '«Fratè, io sto zitto e gioco... lasciateli litigare che intanto la buca la faccio io in due colpi.»',
    initialVotes: 134,
  },
];

const LOCAL_STORAGE_VOTE_KEY = 'sdrogo_amongus_user_vote_v1';
const LOCAL_STORAGE_COUNTS_KEY = 'sdrogo_amongus_counts_v1';

const getInitialCounts = (): Record<string, number> => {
  const defaults: Record<string, number> = {};
  CANDIDATES.forEach((c) => {
    defaults[c.id] = c.initialVotes;
  });
  if (typeof window === 'undefined') return defaults;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_COUNTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        CANDIDATES.forEach((c) => {
          if (typeof parsed[c.id] === 'number' && !isNaN(parsed[c.id])) {
            defaults[c.id] = parsed[c.id];
          }
        });
        return defaults;
      }
    }
  } catch {
    // fallback to defaults on error
  }
  return defaults;
};

export const AmongUsView: React.FC = () => {
  const [userVote, setUserVote] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(LOCAL_STORAGE_VOTE_KEY);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [voteCounts, setVoteCounts] = useState<Record<string, number>>(getInitialCounts);

  // Calculate total community votes
  const totalVotes = Object.values(voteCounts).reduce((acc, count) => acc + count, 0);

  const handleCastVote = (candidateId: string) => {
    try {
      sound.playClick();
    } catch {
      // ignore
    }

    setVoteCounts((prev) => {
      const updated = { ...prev };
      // If user had already voted for someone else, decrement previous
      if (userVote && userVote !== candidateId && updated[userVote] > 0) {
        updated[userVote] = Math.max(0, updated[userVote] - 1);
      }
      // If not already voted for this candidate, increment
      if (userVote !== candidateId) {
        updated[candidateId] = (updated[candidateId] || 0) + 1;
      }
      try {
        localStorage.setItem(LOCAL_STORAGE_COUNTS_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    setUserVote(candidateId);
    try {
      localStorage.setItem(LOCAL_STORAGE_VOTE_KEY, candidateId);
    } catch {
      // ignore
    }

    // Fanfare and confetti for community action
    try {
      sound.playHIOFanfare();
      triggerVictoryConfetti();
    } catch {
      // ignore
    }
  };

  const handleCancelVote = () => {
    if (!userVote) return;
    try {
      sound.playClick();
    } catch {
      // ignore
    }

    const previousVote = userVote;
    setVoteCounts((prev) => {
      const updated = { ...prev };
      if (updated[previousVote] > 0) {
        updated[previousVote] = Math.max(0, updated[previousVote] - 1);
      }
      try {
        localStorage.setItem(LOCAL_STORAGE_COUNTS_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    setUserVote(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_VOTE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      
      {/* Top Banner: Emergency Meeting Lore */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#120a1c] via-[#090d10] to-[#040806] border border-red-500/20 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-black tracking-wide uppercase shadow-sm">
            <Skull className="w-4 h-4 animate-pulse" />
            <span>Emergency Meeting • Il Mappa-Gate</span>
          </div>

          <h2 className="text-5xl sm:text-7xl font-black font-heading tracking-tight text-white leading-none">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-[#d4af37]">GOLFATINA GATE</span>
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            L'impostore è tra di noi? Chi Guarda le Mappe Prima?
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Voto 100% Gratuito (Zero Crediti Richiesti)</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-400 flex items-center gap-1.5">
              <Vote className="w-4 h-4 text-[#d4af37]" />
              <span>{totalVotes.toLocaleString()} Voti Registrati dalla Community</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Voted Notice */}
      {userVote && (() => {
        const votedCandidate = CANDIDATES.find((c) => c.id === userVote);
        if (!votedCandidate) return null;
        return (
          <div className="p-4 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-between gap-4 text-xs sm:text-sm text-amber-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#d4af37] shrink-0 shadow">
                <img 
                  src={getPlayerAvatar(votedCandidate.playerName)} 
                  alt={votedCandidate.name} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <span>
                Hai votato per <strong>{votedCandidate.name}</strong> come impostore del Mappa-Gate! Puoi cambiare voto in qualunque momento cliccando su un altro candidato.
              </span>
            </div>
            <button
              onClick={handleCancelVote}
              className="text-[11px] underline text-slate-400 hover:text-white shrink-0 cursor-pointer font-mono"
            >
              Annulla Voto
            </button>
          </div>
        );
      })()}

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CANDIDATES.map((candidate) => {
          const votes = voteCounts[candidate.id] || 0;
          const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          const isSelected = userVote === candidate.id;

          return (
            <div
              key={candidate.id}
              className={`relative flex flex-col justify-between rounded-3xl p-6 transition-all duration-300 border ${
                isSelected 
                  ? 'bg-gradient-to-b from-[#1c1822] to-[#0c0f12] border-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.25)] scale-[1.01]' 
                  : candidate.highlight 
                    ? 'bg-[#0d1210]/90 hover:bg-[#121915] border-red-500/30 hover:border-red-400/50' 
                    : 'bg-[#0a0d0c]/80 hover:bg-[#0f1412] border-white/[0.08] hover:border-white/[0.15]'
              }`}
            >
              {/* Top Accent & Badge */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-16 h-16 rounded-full overflow-hidden border-2 shadow-xl shrink-0 bg-[#070b09] relative"
                      style={{ 
                        borderColor: candidate.color,
                        boxShadow: `0 0 16px ${candidate.color}35`,
                      }}
                    >
                      <img 
                        src={getPlayerAvatar(candidate.playerName)} 
                        alt={candidate.name} 
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-lg text-white leading-tight">
                        {candidate.name}
                      </h3>
                      <p className="text-xs font-bold text-slate-400">
                        {candidate.nickname}
                      </p>
                      <span className="text-[10px] font-mono text-slate-500">
                        {candidate.episodeRef}
                      </span>
                    </div>
                  </div>

                  <span 
                    className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border text-right"
                    style={{ 
                      backgroundColor: `${candidate.color}20`,
                      color: candidate.color,
                      borderColor: `${candidate.color}40`
                    }}
                  >
                    {candidate.badge}
                  </span>
                </div>

                {/* Accusation Box */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] space-y-1.5 mb-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 font-mono tracking-wide">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>L'ACCUSA DEI COMPAGNI IN VIDEO:</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {candidate.accusation}
                  </p>
                </div>

                {/* Iconic Quote / Defense */}
                <div className="p-3 rounded-2xl bg-[#060907] border border-white/[0.04] space-y-1 mb-4">
                  <div className="flex items-center gap-1 text-[10px] font-mono text-amber-300/90 font-bold uppercase">
                    <MessageSquare className="w-3 h-3 text-amber-300" />
                    <span>LA REAZIONE IN VIDEO:</span>
                  </div>
                  <p className="text-xs text-slate-300 italic font-mono leading-relaxed">
                    {candidate.quote}
                  </p>
                </div>
              </div>

              {/* Progress & Voting Button */}
              <div className="space-y-4 pt-4 border-t border-white/[0.06]">
                {/* Live percentage bar */}
                <div>
                  <div className="flex items-center justify-between text-xs font-mono font-bold mb-1.5">
                    <span className="text-slate-400">Indice di Sospetto:</span>
                    <span style={{ color: candidate.color }}>
                      {percentage}% ({votes.toLocaleString()} voti)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-white/[0.06] overflow-hidden p-0.5">
                    <div 
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: candidate.color,
                        boxShadow: `0 0 10px ${candidate.color}80`
                      }}
                    />
                  </div>
                </div>

                {/* Vote CTA */}
                <button
                  onClick={() => handleCastVote(candidate.id)}
                  className={`w-full py-3 px-4 rounded-xl font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98 ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#d4af37] to-amber-500 text-black shadow-[#d4af37]/30'
                      : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.1] hover:border-white/[0.2]'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-black" />
                      <span>Hai Votato Questo Giocatore</span>
                    </>
                  ) : (
                    <>
                      <Vote className="w-4 h-4" />
                      <span>Vota Come Traditore</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Community Disclaimer */}
      <div className="p-6 rounded-3xl bg-[#090d0b] border border-white/[0.06] text-center max-w-2xl mx-auto space-y-2">
        <p className="text-xs text-slate-400 leading-relaxed">
          <strong>Nota per la Community:</strong> Questa sezione ripercorre le accuse reali e le liti goliardiche scoppiate sul Workshop di Steam negli 87 video di Melagoodo. Ogni citazione è tratta direttamente dai video ufficiali della serie.
        </p>
      </div>

    </div>
  );
};
