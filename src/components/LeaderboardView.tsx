import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Medal, 
  Target, 
  Flame, 
  ArrowUpDown, 
  TrendingDown, 
  Sparkles, 
  Award,
  Zap,
  Users
} from 'lucide-react';
import { PLAYERS_LIST, MATCHES_DATA, PlayerProfile } from '../data/golfatineData';
import { sound } from '../utils/audio';
import { getPlayerAvatar } from '../utils/playerAvatars';

interface LeaderboardViewProps {
  onSelectPlayer: (playerName: string) => void;
}

type SortField = 'wins' | 'winRate' | 'totalHIOs' | 'totalDisasters' | 'matchesPlayed' | 'avgScore' | 'bestDiffPar';

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ onSelectPlayer }) => {

  const [sortField, setSortField] = useState<SortField>('wins');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const handleSort = (field: SortField) => {
    sound.playClick();
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'avgScore' || field === 'bestDiffPar'); // lower is better
    }
  };

  const sortedPlayers = useMemo(() => {
    return [...PLAYERS_LIST].sort((a: PlayerProfile, b: PlayerProfile) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (valA === valB) return 0;
      if (sortAsc) {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
  }, [sortField, sortAsc]);

  const podium = useMemo(() => {
    return [...PLAYERS_LIST].sort((a, b) => b.wins - a.wins).slice(0, 3);
  }, []);

  return (
    <div className="space-y-10">
      
      {/* Top Banner */}
      <div className="premium-card p-6 sm:p-8 rounded-2xl border border-white/[0.08]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                Hall of Fame Ufficiale
              </span>
              <span className="text-xs text-slate-400">Classifica Generale Storica</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight">
              Albo d'Oro & Classifiche di Rendimento
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
              Riepilogo statistico completo su tutte le {MATCHES_DATA.length} Golfatine disputate da <strong>Melagoodo</strong>. Ordinabile per vittorie, scarto dal par, Hole-in-One e colpi medi.
            </p>
          </div>
        </div>
      </div>

      {/* Podium Cards (1st, 2nd, 3rd) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        
        {/* 2nd Place: Delux */}
        {podium[1] && (
          <div 
            onClick={() => {
              sound.playClick();
              onSelectPlayer(podium[1].name);
            }}
            className="premium-card premium-card-hover p-5 rounded-2xl border border-white/[0.1] cursor-pointer order-2 md:order-1"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-slate-400 bg-white/[0.05] px-2 py-0.5 rounded">
                2° Classificato
              </span>
              <span className="text-xs font-bold text-slate-300 font-mono">ARGENTO</span>
            </div>
            
            <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border-2 border-slate-400 shadow-md">
              <img src={getPlayerAvatar(podium[1].name)} alt={podium[1].name} className="w-full h-full object-cover" />
            </div>

            <h3 className="text-lg font-bold font-heading text-white">{podium[1].name}</h3>
            <div className="text-xs text-slate-400 mt-1 font-mono">
              <strong className="text-slate-200">{podium[1].wins} Vittorie</strong> ({podium[1].winRate}% WR)
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-slate-400">
              <span>🎯 {podium[1].totalHIOs} HIO</span>
              <span>📉 {podium[1].bestDiffPar} Best</span>
            </div>
          </div>
        )}

        {/* 1st Place: Just Rohn (Champion) */}
        {podium[0] && (
          <div 
            onClick={() => {
              sound.playClick();
              onSelectPlayer(podium[0].name);
            }}
            className="premium-card premium-card-hover p-6 rounded-2xl border-2 border-[#d4af37]/50 bg-[#121a15] cursor-pointer order-1 md:order-2 shadow-xl"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-[#d4af37] bg-[#d4af37]/10 px-2.5 py-0.5 rounded border border-[#d4af37]/30">
                CAMPIONE ASSOLUTO
              </span>
              <Trophy className="w-5 h-5 text-[#d4af37]" />
            </div>

            <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-[#d4af37] shadow-xl">
              <img src={getPlayerAvatar(podium[0].name)} alt={podium[0].name} className="w-full h-full object-cover" />
            </div>

            <h3 className="text-xl font-black font-heading text-white">{podium[0].name}</h3>
            <div className="text-sm text-slate-300 mt-1 font-mono">
              <strong className="text-[#d4af37] text-base">{podium[0].wins} Vittorie</strong> ({podium[0].winRate}% Win Rate)
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono text-slate-300">
              <span>🎯 {podium[0].totalHIOs} Hole-in-One</span>
              <span>📉 Media: {podium[0].avgScore.toFixed(1)} colpi</span>
            </div>
          </div>
        )}

        {/* 3rd Place: Dread */}
        {podium[2] && (
          <div 
            onClick={() => {
              sound.playClick();
              onSelectPlayer(podium[2].name);
            }}
            className="premium-card premium-card-hover p-5 rounded-2xl border border-white/[0.1] cursor-pointer order-3"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-amber-600 bg-white/[0.05] px-2 py-0.5 rounded">
                3° Classificato
              </span>
              <span className="text-xs font-bold text-amber-600 font-mono">BRONZO</span>
            </div>

            <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border-2 border-amber-700 shadow-md">
              <img src={getPlayerAvatar(podium[2].name)} alt={podium[2].name} className="w-full h-full object-cover" />
            </div>

            <h3 className="text-lg font-bold font-heading text-white">{podium[2].name}</h3>
            <div className="text-xs text-slate-400 mt-1 font-mono">
              <strong className="text-slate-200">{podium[2].wins} Vittorie</strong> ({podium[2].winRate}% WR)
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-slate-400">
              <span>🎯 {podium[2].totalHIOs} HIO</span>
              <span>🎮 {podium[2].matchesPlayed} Partite</span>
            </div>
          </div>
        )}

      </div>

      {/* Master Standings Table */}
      <div className="space-y-3">
        
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#d4af37]" />
            <span>Tabella Statistica Generale</span>
          </h3>
          <span className="text-xs text-slate-500">Clicca sulle intestazioni per ordinare</span>
        </div>

        <div className="premium-card rounded-xl border border-white/[0.08] overflow-hidden bg-[#090d0b]">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse tabular-nums">
              
              <thead>
                <tr className="bg-[#0f1512] text-slate-400 font-semibold border-b border-white/[0.08] select-none">
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-3 min-w-[160px]">Giocatore</th>
                  
                  <th 
                    onClick={() => handleSort('matchesPlayed')}
                    className="py-3 px-2 text-center cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Partite</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('wins')}
                    className="py-3 px-2 text-center cursor-pointer hover:text-white transition-colors text-[#d4af37]"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Vittorie</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('winRate')}
                    className="py-3 px-2 text-center cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Win Rate</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('totalHIOs')}
                    className="py-3 px-2 text-center cursor-pointer hover:text-white transition-colors text-emerald-400"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Hole in One</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('totalDisasters')}
                    className="py-3 px-2 text-center cursor-pointer hover:text-white transition-colors text-rose-400"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Disastri (10+)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('bestDiffPar')}
                    className="py-3 px-2 text-center cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Best Score</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('avgScore')}
                    className="py-3 px-2 text-center cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Media Colpi</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.04]">
                {sortedPlayers.map((p: PlayerProfile, idx: number) => (
                  <tr 
                    key={p.name}
                    onClick={() => {
                      sound.playClick();
                      onSelectPlayer(p.name);
                    }}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-3 font-semibold text-white group-hover:text-[#d4af37] transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10 shrink-0">
                          <img src={getPlayerAvatar(p.name)} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <span>{p.name}</span>
                      </div>
                    </td>

                    <td className="py-3 px-2 text-center font-mono text-slate-300">
                      {p.matchesPlayed}
                    </td>

                    <td className="py-3 px-2 text-center font-mono font-bold text-[#d4af37]">
                      {p.wins}
                    </td>

                    <td className="py-3 px-2 text-center font-mono font-medium text-slate-300">
                      {p.winRate}%
                    </td>

                    <td className="py-3 px-2 text-center font-mono text-emerald-400 font-semibold">
                      {p.totalHIOs}
                    </td>

                    <td className="py-3 px-2 text-center font-mono text-rose-400 font-semibold">
                      {p.totalDisasters}
                    </td>

                    <td className="py-3 px-2 text-center font-mono text-slate-300">
                      {p.bestDiffPar < 0 ? p.bestDiffPar : `+${p.bestDiffPar}`}
                    </td>

                    <td className="py-3 px-2 text-center font-mono text-slate-400">
                      {p.avgScore.toFixed(1)}
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


