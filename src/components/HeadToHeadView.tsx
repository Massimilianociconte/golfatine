import React, { useState, useMemo, useEffect } from 'react';
import { Swords, ArrowLeftRight, Trophy, Target, Flame, Eye } from 'lucide-react';
import { PLAYERS_LIST, PLAYERS_DATA, MATCHES_DATA, GolfatinaMatch, PlayerProfile } from '../data/golfatineData';
import { sound } from '../utils/audio';
import { getPlayerAvatar } from '../utils/playerAvatars';

interface HeadToHeadViewProps {
  initialP1?: string;
  initialP2?: string;
  onOpenMatchModal: (match: GolfatinaMatch) => void;
}

const HeadToHeadViewComponent: React.FC<HeadToHeadViewProps> = ({
  initialP1 = 'Just Rohn',
  initialP2 = 'Delux',
  onOpenMatchModal,
}) => {
  const [p1Name, setP1Name] = useState<string>(initialP1);
  const [p2Name, setP2Name] = useState<string>(initialP2);

  // Synchronize state when initialP1 or initialP2 props change
  useEffect(() => {
    if (initialP1) {
      setP1Name(initialP1);
    }
  }, [initialP1]);

  useEffect(() => {
    if (initialP2) {
      setP2Name(initialP2);
    }
  }, [initialP2]);

  // Ensure p1 and p2 are never the same player
  useEffect(() => {
    if (p1Name === p2Name) {
      const alternate = PLAYERS_LIST.find((p) => p.name !== p1Name)?.name || 'Delux';
      setP2Name(alternate);
    }
  }, [p1Name, p2Name]);

  const p1: PlayerProfile = useMemo(() => {
    return PLAYERS_LIST.find((p: PlayerProfile) => p.name === p1Name) || PLAYERS_LIST[0];
  }, [p1Name]);

  const p2: PlayerProfile = useMemo(() => {
    return PLAYERS_LIST.find((p: PlayerProfile) => p.name === p2Name) || PLAYERS_LIST[1];
  }, [p2Name]);

  const handleSwap = () => {
    try {
      sound.playClick();
    } catch {
      // ignore
    }
    const temp = p1Name;
    setP1Name(p2Name);
    setP2Name(temp);
  };

  // Shared matches memoized
  const sharedMatches = useMemo(() => {
    if (p1.name === p2.name) return [];
    return MATCHES_DATA.filter(
      (m) =>
        m.players &&
        m.players.some((p) => p.name === p1.name) &&
        m.players.some((p) => p.name === p2.name)
    ).map((m) => {
      const entry1 = m.players.find((p) => p.name === p1.name);
      const entry2 = m.players.find((p) => p.name === p2.name);
      if (!entry1 || !entry2) return null;
      return {
        match: m,
        entry1,
        entry2,
        winner: entry1.totalScore < entry2.totalScore ? p1.name : entry1.totalScore > entry2.totalScore ? p2.name : 'Tie',
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);
  }, [p1.name, p2.name]);

  const p1WinsDirect = useMemo(() => sharedMatches.filter((s) => s.winner === p1.name).length, [sharedMatches, p1.name]);
  const p2WinsDirect = useMemo(() => sharedMatches.filter((s) => s.winner === p2.name).length, [sharedMatches, p2.name]);
  const ties = useMemo(() => sharedMatches.filter((s) => s.winner === 'Tie').length, [sharedMatches]);

  const totalShared = sharedMatches.length;
  const totalDecided = p1WinsDirect + p2WinsDirect;
  const p1Ratio = totalDecided > 0 ? (p1WinsDirect / totalDecided) * 100 : 50;

  return (
    <div className="space-y-8">
      
      {/* Top Banner */}
      <div className="premium-card p-6 sm:p-8 rounded-2xl border border-white/[0.08]">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center gap-1.5">
            <Swords className="w-3.5 h-3.5" />
            1v1 Battle Arena
          </span>
          <span className="text-xs text-slate-400">Confronto Diretto Storico</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight">
          Testa a Testa (Head-to-Head)
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
          Analisi comparativa di tutte le partite in cui i due giocatori di <strong>Melagoodo</strong> si sono affrontati sullo stesso green.
        </p>
      </div>

      {/* Selectors & Fighter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
        
        {/* Player 1 Card */}
        <div className="md:col-span-5 premium-card p-5 rounded-2xl border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase">Giocatore 1</span>
            <select
              value={p1Name}
              onChange={(e) => {
                sound.playClick();
                setP1Name(e.target.value);
              }}
              className="premium-input px-2.5 py-1 text-xs rounded-lg text-slate-200 focus:outline-none cursor-pointer"
            >
              {PLAYERS_LIST.map((p: PlayerProfile) => (
                <option key={p.name} value={p.name} disabled={p.name === p2Name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/10 shadow-md shrink-0">
              <img src={getPlayerAvatar(p1.name)} alt={p1.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-lg font-black font-heading text-white">{p1.name}</h3>
              <p className="text-xs text-slate-400 font-mono">{p1.wins} Vittorie totali ({p1.winRate}%)</p>
            </div>
          </div>
        </div>

        {/* Swap / VS Button */}
        <div className="md:col-span-1 flex justify-center">
          <button
            onClick={handleSwap}
            className="p-3 rounded-full bg-[#141d18] hover:bg-[#1a2620] border border-white/[0.1] text-slate-300 hover:text-white transition-all shadow-md cursor-pointer hover:rotate-180 duration-300"
            title="Inverti Giocatori"
          >
            <ArrowLeftRight className="w-4 h-4 text-[#d4af37]" />
          </button>
        </div>

        {/* Player 2 Card */}
        <div className="md:col-span-5 premium-card p-5 rounded-2xl border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase">Giocatore 2</span>
            <select
              value={p2Name}
              onChange={(e) => {
                sound.playClick();
                setP2Name(e.target.value);
              }}
              className="premium-input px-2.5 py-1 text-xs rounded-lg text-slate-200 focus:outline-none cursor-pointer"
            >
              {PLAYERS_LIST.map((p: PlayerProfile) => (
                <option key={p.name} value={p.name} disabled={p.name === p1Name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/10 shadow-md shrink-0">
              <img src={getPlayerAvatar(p2.name)} alt={p2.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-lg font-black font-heading text-white">{p2.name}</h3>
              <p className="text-xs text-slate-400 font-mono">{p2.wins} Vittorie totali ({p2.winRate}%)</p>
            </div>
          </div>
        </div>

      </div>

      {/* Shared Matches Battle Bar */}
      <div className="premium-card p-6 rounded-2xl border border-white/[0.08] space-y-4 text-center">
        
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="font-bold text-[#d4af37] text-sm">{p1WinsDirect} Vittorie ({p1.name})</span>
          <span className="text-slate-500">{totalShared} Scontri Diretti</span>
          <span className="font-bold text-slate-300 text-sm">{p2WinsDirect} Vittorie ({p2.name})</span>
        </div>

        {/* Ratio Split Bar */}
        <div className="w-full h-3 rounded-full bg-[#090d0b] overflow-hidden flex border border-white/[0.06]">
          <div
            className="h-full bg-gradient-to-r from-[#d4af37] to-amber-500 transition-all duration-500"
            style={{ width: `${p1Ratio}%` }}
          />
          <div
            className="h-full bg-slate-600 transition-all duration-500"
            style={{ width: `${100 - p1Ratio}%` }}
          />
        </div>

        {/* Comparator Metrics */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/[0.06] text-xs font-mono">
          
          <div className="text-left font-bold text-white">{p1.totalHIOs}</div>
          <div className="text-slate-500 uppercase font-sans text-[10px] font-bold">Hole-in-One Totali</div>
          <div className="text-right font-bold text-white">{p2.totalHIOs}</div>

          <div className="text-left font-bold text-white">{p1.avgScore.toFixed(1)}</div>
          <div className="text-slate-500 uppercase font-sans text-[10px] font-bold">Media Colpi / Partita</div>
          <div className="text-right font-bold text-white">{p2.avgScore.toFixed(1)}</div>

          <div className="text-left font-bold text-emerald-400">{p1.bestDiffPar < 0 ? p1.bestDiffPar : `+${p1.bestDiffPar}`}</div>
          <div className="text-slate-500 uppercase font-sans text-[10px] font-bold">Miglior Diff Par</div>
          <div className="text-right font-bold text-emerald-400">{p2.bestDiffPar < 0 ? p2.bestDiffPar : `+${p2.bestDiffPar}`}</div>

          <div className="text-left font-bold text-rose-400">{p1.totalDisasters}</div>
          <div className="text-slate-500 uppercase font-sans text-[10px] font-bold">Disastri (10+)</div>
          <div className="text-right font-bold text-rose-400">{p2.totalDisasters}</div>

        </div>

      </div>

      {/* Shared Matches History Table */}
      <div className="space-y-3">
        <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
          <Swords className="w-4 h-4 text-[#d4af37]" />
          <span>Elenco Scontri Diretti ({sharedMatches.length})</span>
        </h3>

        <div className="premium-card rounded-xl border border-white/[0.08] overflow-hidden bg-[#090d0b]">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse tabular-nums">
              <thead>
                <tr className="bg-[#0f1512] text-slate-400 font-semibold border-b border-white/[0.08]">
                  <th className="py-2.5 px-3">Partita</th>
                  <th className="py-2.5 px-2 text-center">{p1.name}</th>
                  <th className="py-2.5 px-2 text-center">{p2.name}</th>
                  <th className="py-2.5 px-2 text-center">Esito Scontro</th>
                  <th className="py-2.5 px-3 text-right">Azione</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {sharedMatches.map(({ match, entry1, entry2, winner }) => (
                  <tr 
                    key={match.id}
                    onClick={() => {
                      sound.playClick();
                      onOpenMatchModal(match);
                    }}
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 px-3 font-medium text-white">
                      <span className="font-mono text-slate-500 text-[10px] mr-1.5">#{match.id}</span>
                      <span className="truncate">{match.title}</span>
                    </td>

                    <td className={`py-2.5 px-2 text-center font-mono font-bold ${
                      entry1.totalScore < entry2.totalScore ? 'text-[#d4af37]' : 'text-slate-400'
                    }`}>
                      {entry1.totalScore} ({entry1.position}°)
                    </td>

                    <td className={`py-2.5 px-2 text-center font-mono font-bold ${
                      entry2.totalScore < entry1.totalScore ? 'text-[#d4af37]' : 'text-slate-400'
                    }`}>
                      {entry2.totalScore} ({entry2.position}°)
                    </td>

                    <td className="py-2.5 px-2 text-center font-medium">
                      {winner === p1.name ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20">
                          {p1.name} Win
                        </span>
                      ) : winner === p2.name ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-white/[0.05] text-slate-300 border border-white/[0.1]">
                          {p2.name} Win
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Pareggio</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <span className="text-[11px] text-slate-400 hover:text-white flex items-center justify-end gap-1">
                        <Eye className="w-3 h-3" />
                        <span>Scorecard</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};

export const HeadToHeadView = React.memo(HeadToHeadViewComponent);

