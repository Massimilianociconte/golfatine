import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Target, 
  ArrowUpDown, 
  Award,
  Crown,
  ChevronRight
} from 'lucide-react';
import { PLAYERS_LIST, MATCHES_DATA, GLOBAL_SUMMARY, PlayerProfile } from '../data/golfatineData';
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

  const maxWins = useMemo(() => Math.max(1, ...PLAYERS_LIST.map((p) => p.wins)), []);

  return (
    <div className="space-y-10">
      
      {/* Top Banner */}
      <div className="premium-card specular-top p-6 sm:p-8 rounded-2xl border border-white/[0.08] relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.4) 0%, transparent 70%)' }}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
              <span className="gold-badge px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                Hall of Fame Ufficiale
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Classifica Generale Storica • {GLOBAL_SUMMARY.totalHolesPlayed.toLocaleString('it-IT')} Buche Registrate
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight">
              Albo d'Oro & Classifiche di Rendimento
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1.5 leading-relaxed">
              Riepilogo statistico completo su tutte le <strong className="text-slate-200 font-mono">{MATCHES_DATA.length}</strong> Golfatine disputate da <strong className="text-white">Melagoodo</strong>. Ordinabile per vittorie, scarto dal par, Hole-in-One e colpi medi.
            </p>
          </div>
        </div>
      </div>

      {/* Podium Cards (1st, 2nd, 3rd) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
        
        {/* 2nd Place */}
        {podium[1] && (
          <div 
            onClick={() => {
              sound.playClick();
              onSelectPlayer(podium[1].name);
            }}
            className="premium-card premium-card-hover specular-top p-5 rounded-2xl border border-slate-300/20 cursor-pointer order-2 md:order-1 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-200 bg-slate-300/10 border border-slate-300/25 px-2.5 py-0.5 rounded-md">
                2° Classificato
              </span>
              <span className="text-[10px] font-bold text-slate-300 font-mono tracking-widest uppercase">ARGENTO</span>
            </div>
            
            <div className="flex items-center gap-3.5 mb-3">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-300/60 shadow-lg shrink-0 group-hover:scale-105 transition-transform">
                <img src={getPlayerAvatar(podium[1].name)} alt={podium[1].name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-lg font-black font-heading text-white group-hover:text-slate-200 transition-colors">
                  {podium[1].name}
                </h3>
                <div className="text-xs text-slate-400 mt-0.5 font-mono">
                  <strong className="text-white text-sm">{podium[1].wins} Vittorie</strong> ({podium[1].winRate}% WR)
                </div>
              </div>
            </div>

            <div className="w-full h-1.5 rounded-full bg-white/[0.05] overflow-hidden mb-3">
              <div
                className="h-full rounded-full bg-gradient-to-r from-slate-400 to-slate-200"
                style={{ width: `${Math.min(100, (podium[1].wins / maxWins) * 100)}%` }}
              />
            </div>

            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-slate-400">
              <span>🎯 <strong className="text-emerald-400">{podium[1].totalHIOs}</strong> HIO</span>
              <span>📉 Best <strong className="text-slate-200">{podium[1].bestDiffPar}</strong></span>
            </div>
          </div>
        )}

        {/* 1st Place: Champion */}
        {podium[0] && (
          <div 
            onClick={() => {
              sound.playClick();
              onSelectPlayer(podium[0].name);
            }}
            className="premium-card premium-card-hover specular-top p-6 rounded-2xl border-2 border-[#d4af37]/50 bg-[#0d1510] cursor-pointer order-1 md:order-2 shadow-[0_20px_50px_-15px_rgba(212,175,55,0.22)] group relative overflow-hidden"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-25"
              style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.45) 0%, transparent 70%)' }}
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="gold-badge text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" />
                  CAMPIONE ASSOLUTO
                </span>
                <Trophy className="w-5 h-5 text-[#d4af37]" />
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#d4af37] shadow-[0_0_24px_rgba(212,175,55,0.3)] shrink-0 group-hover:scale-105 transition-transform">
                  <img src={getPlayerAvatar(podium[0].name)} alt={podium[0].name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black font-heading text-white group-hover:text-[#f5e6b3] transition-colors">
                    {podium[0].name}
                  </h3>
                  <div className="text-xs text-slate-300 mt-1 font-mono">
                    <strong className="text-[#f5e6b3] text-base">{podium[0].wins} Vittorie</strong> ({podium[0].winRate}% WR)
                  </div>
                </div>
              </div>

              <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden mb-3.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#d4af37]"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono text-slate-300">
                <span>🎯 <strong className="text-[#f5e6b3]">{podium[0].totalHIOs}</strong> Hole-in-One</span>
                <span>📉 Media: <strong className="text-white">{podium[0].avgScore.toFixed(1)}</strong> colpi</span>
              </div>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {podium[2] && (
          <div 
            onClick={() => {
              sound.playClick();
              onSelectPlayer(podium[2].name);
            }}
            className="premium-card premium-card-hover specular-top p-5 rounded-2xl border border-amber-700/30 cursor-pointer order-3 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 rounded-md">
                3° Classificato
              </span>
              <span className="text-[10px] font-bold text-amber-500 font-mono tracking-widest uppercase">BRONZO</span>
            </div>

            <div className="flex items-center gap-3.5 mb-3">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-600/70 shadow-lg shrink-0 group-hover:scale-105 transition-transform">
                <img src={getPlayerAvatar(podium[2].name)} alt={podium[2].name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-lg font-black font-heading text-white group-hover:text-amber-300 transition-colors">
                  {podium[2].name}
                </h3>
                <div className="text-xs text-slate-400 mt-0.5 font-mono">
                  <strong className="text-white text-sm">{podium[2].wins} Vittorie</strong> ({podium[2].winRate}% WR)
                </div>
              </div>
            </div>

            <div className="w-full h-1.5 rounded-full bg-white/[0.05] overflow-hidden mb-3">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-700 to-amber-500"
                style={{ width: `${Math.min(100, (podium[2].wins / maxWins) * 100)}%` }}
              />
            </div>

            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-slate-400">
              <span>🎯 <strong className="text-emerald-400">{podium[2].totalHIOs}</strong> HIO</span>
              <span>🎮 <strong className="text-slate-200">{podium[2].matchesPlayed}</strong> Partite</span>
            </div>
          </div>
        )}

      </div>

      {/* Master Standings Table */}
      <div className="space-y-3 cv-section">
        
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-[#d4af37]" />
            <span>Tabella Statistica Generale</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-400">Clicca sulle intestazioni per ordinare</span>
        </div>

        <div className="premium-card specular-top rounded-2xl border border-white/[0.08] overflow-hidden bg-[#070b09]">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse tabular-nums">
              
              <thead>
                <tr className="bg-[#0d1410] text-slate-400 font-semibold border-b border-white/[0.08] select-none text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-3 w-12 text-center">#</th>
                  <th className="py-3.5 px-3 min-w-[170px]">Giocatore</th>
                  
                  <th 
                    onClick={() => handleSort('matchesPlayed')}
                    className={`py-3.5 px-2.5 text-center cursor-pointer hover:text-white transition-colors ${sortField === 'matchesPlayed' ? 'text-white bg-white/[0.03]' : ''}`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Partite</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('wins')}
                    className={`py-3.5 px-2.5 text-center cursor-pointer hover:text-[#f5e6b3] transition-colors text-[#d4af37] ${sortField === 'wins' ? 'bg-[#d4af37]/[0.06]' : ''}`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Vittorie</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('winRate')}
                    className={`py-3.5 px-2.5 text-center cursor-pointer hover:text-white transition-colors ${sortField === 'winRate' ? 'text-white bg-white/[0.03]' : ''}`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Win Rate</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('totalHIOs')}
                    className={`py-3.5 px-2.5 text-center cursor-pointer hover:text-emerald-300 transition-colors text-emerald-400 ${sortField === 'totalHIOs' ? 'bg-emerald-500/[0.06]' : ''}`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Hole in One</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('totalDisasters')}
                    className={`py-3.5 px-2.5 text-center cursor-pointer hover:text-rose-300 transition-colors text-rose-400 ${sortField === 'totalDisasters' ? 'bg-rose-500/[0.06]' : ''}`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Disastri (10+)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('bestDiffPar')}
                    className={`py-3.5 px-2.5 text-center cursor-pointer hover:text-white transition-colors ${sortField === 'bestDiffPar' ? 'text-white bg-white/[0.03]' : ''}`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Best Score</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('avgScore')}
                    className={`py-3.5 px-2.5 text-center cursor-pointer hover:text-white transition-colors ${sortField === 'avgScore' ? 'text-white bg-white/[0.03]' : ''}`}
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
                    className="hover:bg-white/[0.035] transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-3 text-center font-mono font-bold">
                      {idx === 0 ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#d4af37]/20 text-[#f5e6b3] border border-[#d4af37]/40 text-[10px]">1</span>
                      ) : idx === 1 ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-slate-300/15 text-slate-200 border border-slate-300/30 text-[10px]">2</span>
                      ) : idx === 2 ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-amber-600/20 text-amber-400 border border-amber-500/30 text-[10px]">3</span>
                      ) : (
                        <span className="text-slate-500">{idx + 1}</span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-semibold text-white group-hover:text-[#f5e6b3] transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full overflow-hidden border border-white/15 shrink-0">
                            <img src={getPlayerAvatar(p.name)} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <span className="block leading-tight">{p.name}</span>
                            <span className="text-[10px] text-slate-500 font-normal">{p.badge}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#d4af37] group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                    </td>

                    <td className="py-3 px-2.5 text-center font-mono text-slate-300">
                      {p.matchesPlayed}
                    </td>

                    <td className="py-3 px-2.5 text-center font-mono font-bold text-[#f5e6b3] bg-[#d4af37]/[0.03]">
                      {p.wins}
                    </td>

                    <td className="py-3 px-2.5 text-center font-mono font-medium text-slate-300">
                      {p.winRate}%
                    </td>

                    <td className="py-3 px-2.5 text-center font-mono text-emerald-400 font-semibold">
                      {p.totalHIOs}
                    </td>

                    <td className="py-3 px-2.5 text-center font-mono text-rose-400 font-semibold">
                      {p.totalDisasters}
                    </td>

                    <td className="py-3 px-2.5 text-center font-mono text-slate-200 font-semibold">
                      {p.bestDiffPar < 0 ? p.bestDiffPar : `+${p.bestDiffPar}`}
                    </td>

                    <td className="py-3 px-2.5 text-center font-mono text-slate-400">
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



