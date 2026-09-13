import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Trophy, 
  Target, 
  Flame, 
  TrendingUp, 
  Swords, 
  Quote, 
  CheckCircle2, 
  Eye, 
  Calendar,
  Sparkles,
  Zap,
  Award
} from 'lucide-react';
import { PLAYERS_LIST, PLAYERS_DATA, MATCHES_DATA, GolfatinaMatch, PlayerProfile } from '../data/golfatineData';
import { sound } from '../utils/audio';
import { getPlayerAvatar } from '../utils/playerAvatars';

interface PlayerProfilesViewProps {
  selectedPlayerName: string | null;
  onSelectPlayer: (playerName: string | null) => void;
  onOpenMatchModal: (match: GolfatinaMatch) => void;
  onStartH2HWith: (playerName: string) => void;
}

export const PlayerProfilesView: React.FC<PlayerProfilesViewProps> = ({
  selectedPlayerName,
  onSelectPlayer,
  onOpenMatchModal,
  onStartH2HWith,
}) => {

  const [activeTab, setActiveTab] = useState<string>(selectedPlayerName || 'Just Rohn');

  // React to external selectedPlayerName prop changes (e.g. from Leaderboard, Grid, or URL deep link)
  useEffect(() => {
    if (selectedPlayerName) {
      setActiveTab(selectedPlayerName);
    }
  }, [selectedPlayerName]);

  const playerStats: PlayerProfile = useMemo(() => {
    return PLAYERS_LIST.find((p) => p.name === activeTab) || PLAYERS_LIST[0];
  }, [activeTab]);

  const profile: PlayerProfile = useMemo(() => {
    return PLAYERS_DATA[playerStats.name] || PLAYERS_DATA['Just Rohn'];
  }, [playerStats.name]);

  // Match history for selected player
  const playerMatches = useMemo(() => {
    return MATCHES_DATA.filter((m) =>
      m.players.some((p) => p.name === playerStats.name)
    ).map((m) => {
      const pEntry = m.players.find((p) => p.name === playerStats.name)!;
      return {
        match: m,
        entry: pEntry,
      };
    });
  }, [playerStats.name]);

  // SVG 5-axis Radar points
  const radarMetrics = useMemo(() => [
    { label: 'Precisione', value: profile.radar.precisione },
    { label: 'Clutch', value: profile.radar.clutch },
    { label: 'Sdroganza', value: profile.radar.sdroganza },
    { label: 'Tilt Control', value: profile.radar.tiltControl },
    { label: 'Fortuna / IQ', value: profile.radar.fortuna },
  ], [profile]);

  const radarPoints = useMemo(() => {
    const center = 100;
    const radius = 70;
    return radarMetrics.map((m, i) => {
      const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
      const r = (m.value / 100) * radius;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
        labelX: center + (radius + 20) * Math.cos(angle),
        labelY: center + (radius + 15) * Math.sin(angle),
        label: m.label,
        val: m.value,
      };
    });
  }, [radarMetrics]);

  const polygonPoints = useMemo(() => {
    return radarPoints.map((p) => `${p.x},${p.y}`).join(' ');
  }, [radarPoints]);

  return (
    <div className="space-y-8">
      
      {/* Player Selector Bar */}
      <div className="premium-card p-3 rounded-2xl border border-white/[0.08] overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          {PLAYERS_LIST.map((p: PlayerProfile) => {
            const isSelected = activeTab === p.name;
            const avatarImg = getPlayerAvatar(p.name);

            return (
              <button
                key={p.name}
                onClick={() => {
                  sound.playClick();
                  setActiveTab(p.name);
                  if (onSelectPlayer) onSelectPlayer(p.name);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#18231d] text-white border border-[#d4af37]/40 shadow-sm ring-1 ring-[#d4af37]/20'
                    : 'bg-[#090d0b] text-slate-400 hover:text-slate-200 border border-white/[0.04]'
                }`}
              >
                <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-white/10">
                  <img src={avatarImg} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <span>{p.name}</span>
                <span className="font-mono text-[10px] text-[#d4af37]">({p.wins} V)</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Player Dossier Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Player Identity & Lore */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="premium-card p-6 rounded-2xl border border-white/[0.08] space-y-5">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#d4af37] shadow-xl shrink-0">
                  <img src={getPlayerAvatar(profile.name)} alt={profile.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black font-heading text-white">{profile.name}</h2>
                  </div>
                  <p className="text-xs font-semibold text-[#d4af37]">{profile.nickname}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Ruolo: <strong className="text-slate-200">{profile.badge}</strong></p>
                </div>
              </div>

              <button
                onClick={() => onStartH2HWith(playerStats.name)}
                className="px-3 py-1.5 rounded-lg bg-[#141d18] hover:bg-[#1a2620] border border-white/[0.1] text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Confronta in 1v1"
              >
                <Swords className="w-3.5 h-3.5 text-rose-400" />
                <span>1v1 Arena</span>
              </button>
            </div>

            {/* Aliases Pills */}
            {profile.aliases && profile.aliases.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Soprannomi & Deformazioni Storiche:
                </span>
                <div className="flex flex-wrap gap-1">
                  {profile.aliases.map((alias, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/[0.06] text-[10px] font-mono">
                      {alias}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Signature Quote */}
            <div className="bg-[#090d0b] p-3 rounded-xl border-l-2 border-[#d4af37] text-xs text-slate-300 italic flex items-start gap-2">
              <Quote className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
              <span>"{profile.quote}"</span>
            </div>

            {/* Bio */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {profile.bio}
            </p>

            {/* Lore Details */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="bg-[#090d0b] p-3 rounded-xl border border-white/[0.04]">
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Nemesi Storica</span>
                <span className="text-rose-400 font-semibold">{profile.nemesis || 'Tutti'}</span>
              </div>
              <div className="bg-[#090d0b] p-3 rounded-xl border border-white/[0.04]">
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Podium Rate</span>
                <span className="text-emerald-400 font-semibold">{profile.podiumRate}%</span>
              </div>
            </div>

            {/* Iconic Memes */}
            {profile.iconicMemes && profile.iconicMemes.length > 0 && (
              <div className="bg-[#090d0b] p-3 rounded-xl border border-white/[0.04] space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#d4af37] block">
                  Dinamiche & Momenti Cult Associati:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.iconicMemes.map((m, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 text-[10px] font-semibold">
                      ⚡ {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="premium-card p-3.5 rounded-xl text-center">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Vittorie</div>
              <div className="text-xl font-mono font-bold text-[#d4af37] mt-1">{playerStats.wins}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{playerStats.winRate}% Win Rate</div>
            </div>

            <div className="premium-card p-3.5 rounded-xl text-center">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Hole-in-One</div>
              <div className="text-xl font-mono font-bold text-emerald-400 mt-1">{playerStats.totalHIOs}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{(playerStats.totalHIOs / Math.max(1, playerStats.matchesPlayed)).toFixed(1)} / match</div>
            </div>

            <div className="premium-card p-3.5 rounded-xl text-center">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Best Score</div>
              <div className="text-xl font-mono font-bold text-white mt-1">
                {playerStats.bestDiffPar < 0 ? playerStats.bestDiffPar : `+${playerStats.bestDiffPar}`}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Scarto dal Par</div>
            </div>

            <div className="premium-card p-3.5 rounded-xl text-center">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Disastri (10+)</div>
              <div className="text-xl font-mono font-bold text-rose-400 mt-1">{playerStats.totalDisasters}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Buche al Cap</div>
            </div>
          </div>

        </div>

        {/* Right Column: Radar Chart & Stats */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Radar Chart */}
          <div className="premium-card p-6 rounded-2xl border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#d4af37]" />
                Radar Attributi Giocatore
              </span>
              <span className="text-[10px] font-mono text-slate-500">Valutazione Melagoodo</span>
            </div>

            <div className="relative aspect-square max-w-[280px] mx-auto">
              <svg className="w-full h-full" viewBox="0 0 200 200">
                {/* Background radar rings */}
                {[0.25, 0.5, 0.75, 1].map((scale, i) => (
                  <polygon
                    key={i}
                    points={radarPoints.map(p => {
                      const angle = (Math.PI * 2 / 5) * radarPoints.indexOf(p) - Math.PI / 2;
                      const r = 70 * scale;
                      return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
                    }).join(' ')}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="1"
                  />
                ))}

                {/* Radar Area */}
                <polygon
                  points={polygonPoints}
                  fill="rgba(212, 175, 55, 0.2)"
                  stroke="#d4af37"
                  strokeWidth="2"
                />

                {/* Radar Vertex Dots */}
                {radarPoints.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r="3.5"
                    fill="#d4af37"
                    stroke="#000"
                    strokeWidth="1"
                  />
                ))}

                {/* Labels */}
                {radarPoints.map((p, i) => (
                  <text
                    key={i}
                    x={p.labelX}
                    y={p.labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="var(--font-jakarta)"
                    fontWeight="600"
                  >
                    {p.label} ({p.val})
                  </text>
                ))}
              </svg>
            </div>
          </div>

          {/* Career Highlights */}
          <div className="premium-card p-4 rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Stile e Strategia</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {profile.name} vanta una media di <strong className="text-white font-mono">{profile.avgScore.toFixed(1)}</strong> colpi a partita con un differenziale medio di <strong className="text-emerald-400 font-mono">{profile.avgDiffPar > 0 ? `+${profile.avgDiffPar.toFixed(1)}` : profile.avgDiffPar.toFixed(1)}</strong> dal par.
            </p>
          </div>

        </div>

      </div>

      {/* Match History for this Player */}
      <div className="space-y-4 pt-4">
        <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
          <span>📜</span> Storico Partite Disputate da {playerStats.name} ({playerMatches.length})
        </h3>

        <div className="premium-card rounded-xl border border-white/[0.08] overflow-hidden bg-[#090d0b]">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse tabular-nums">
              <thead>
                <tr className="bg-[#0f1512] text-slate-400 font-semibold border-b border-white/[0.08]">
                  <th className="py-2.5 px-3">Partita</th>
                  <th className="py-2.5 px-2 text-center">Posizione</th>
                  <th className="py-2.5 px-2 text-center">Score</th>
                  <th className="py-2.5 px-2 text-center">Diff Par</th>
                  <th className="py-2.5 px-2 text-center">HIO</th>
                  <th className="py-2.5 px-2 text-center">Disastri</th>
                  <th className="py-2.5 px-3 text-right">Azione</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {playerMatches.map(({ match, entry }, idx) => (
                  <tr 
                    key={match.id}
                    onClick={() => {
                      sound.playClick();
                      onOpenMatchModal(match);
                    }}
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 px-3 font-medium text-white">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500 text-[10px]">#{match.id}</span>
                        <span className="truncate max-w-[200px] sm:max-w-xs">{match.title}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-2 text-center font-mono font-bold">
                      {entry.position === 1 ? (
                        <span className="text-[#d4af37]">1°</span>
                      ) : entry.position === 2 ? (
                        <span className="text-slate-300">2°</span>
                      ) : entry.position === 3 ? (
                        <span className="text-amber-600">3°</span>
                      ) : (
                        <span className="text-slate-500">{entry.position}°</span>
                      )}
                    </td>

                    <td className="py-2.5 px-2 text-center font-mono font-bold text-white">
                      {entry.totalScore}
                    </td>

                    <td className="py-2.5 px-2 text-center font-mono font-medium">
                      <span className={entry.diffPar < 0 ? 'text-emerald-400' : entry.diffPar === 0 ? 'text-slate-400' : 'text-rose-400'}>
                        {entry.diffPar > 0 ? `+${entry.diffPar}` : entry.diffPar === 0 ? 'E' : entry.diffPar}
                      </span>
                    </td>

                    <td className="py-2.5 px-2 text-center font-mono text-[#d4af37] font-semibold">
                      {entry.hios > 0 ? entry.hios : '-'}
                    </td>

                    <td className="py-2.5 px-2 text-center font-mono text-rose-400 font-semibold">
                      {entry.disasters > 0 ? entry.disasters : '-'}
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


