import React, { useState, useMemo, useEffect } from 'react';
import { 
  Target, 
  Swords, 
  Quote, 
  Eye
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
    const radius = 68;
    return radarMetrics.map((m, i) => {
      const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
      const r = (m.value / 100) * radius;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
        axisEndX: center + radius * Math.cos(angle),
        axisEndY: center + radius * Math.sin(angle),
        labelX: center + (radius + 21) * Math.cos(angle),
        labelY: center + (radius + 16) * Math.sin(angle),
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
      <div className="premium-card specular-top p-3 rounded-2xl border border-white/[0.08] overflow-x-auto no-scrollbar">
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
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#1a2820] to-[#111b15] text-white border border-[#d4af37]/50 shadow-[0_0_20px_rgba(212,175,55,0.15)]'
                    : 'bg-[#080c0a] text-slate-400 hover:text-slate-200 hover:bg-[#0e1511] border border-white/[0.05]'
                }`}
              >
                <div className={`w-5 h-5 rounded-full overflow-hidden shrink-0 border ${isSelected ? 'border-[#d4af37]' : 'border-white/10'}`}>
                  <img src={avatarImg} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <span>{p.name}</span>
                <span className={`font-mono text-[10px] ${isSelected ? 'text-[#f5e6b3] font-bold' : 'text-[#d4af37]/80'}`}>({p.wins}V)</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Player Dossier Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Player Identity & Lore */}
        <div className="lg:col-span-7 space-y-5">
          
          <div className="premium-card specular-top p-6 rounded-2xl border border-white/[0.08] space-y-5 relative overflow-hidden">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-15"
              style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.4) 0%, transparent 70%)' }}
            />
            
            {/* Header */}
            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-[#d4af37] shadow-[0_0_25px_rgba(212,175,55,0.25)] shrink-0">
                  <img src={getPlayerAvatar(profile.name)} alt={profile.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black font-heading text-white tracking-tight">{profile.name}</h2>
                  </div>
                  <p className="text-xs font-bold text-[#f5e6b3] mt-0.5">{profile.nickname}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Ruolo: <strong className="text-slate-200 font-semibold">{profile.badge}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => onStartH2HWith(playerStats.name)}
                className="px-3.5 py-2 rounded-xl bg-[#111915] hover:bg-[#18241e] border border-rose-500/30 text-xs font-bold text-slate-100 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Confronta in 1v1"
              >
                <Swords className="w-3.5 h-3.5 text-rose-400" />
                <span>1v1 Arena</span>
              </button>
            </div>

            {/* Aliases Pills */}
            {profile.aliases && profile.aliases.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
                  Soprannomi & Deformazioni Storiche:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.aliases.map((alias, i) => (
                    <span key={i} className="px-2.5 py-0.5 rounded-md bg-white/[0.035] text-slate-300 border border-white/[0.07] text-[10px] font-mono">
                      {alias}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Signature Quote */}
            <div className="bg-[#070b09] p-3.5 rounded-xl border-l-2 border-[#d4af37] text-xs text-slate-200 italic flex items-start gap-2.5">
              <Quote className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
              <span>"{profile.quote}"</span>
            </div>

            {/* Bio */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {profile.bio}
            </p>

            {/* Lore Details */}
            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div className="bg-[#070b09] p-3.5 rounded-xl border border-white/[0.05]">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Nemesi Storica</span>
                <span className="text-rose-400 font-bold font-heading text-sm">{profile.nemesis || 'Tutti'}</span>
              </div>
              <div className="bg-[#070b09] p-3.5 rounded-xl border border-white/[0.05]">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Podium Rate</span>
                <span className="text-emerald-400 font-bold font-mono text-sm">{profile.podiumRate}%</span>
              </div>
            </div>

            {/* Iconic Memes */}
            {profile.iconicMemes && profile.iconicMemes.length > 0 && (
              <div className="bg-[#070b09] p-3.5 rounded-xl border border-white/[0.05] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37] block">
                  Dinamiche & Momenti Cult Associati:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.iconicMemes.map((m, i) => (
                    <span key={i} className="px-2.5 py-0.5 rounded-md bg-[#d4af37]/10 text-[#f5e6b3] border border-[#d4af37]/25 text-[10px] font-semibold">
                      ⚡ {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="premium-card specular-top p-3.5 rounded-xl text-center">
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Vittorie</div>
              <div className="text-xl font-mono font-black text-[#f5e6b3] mt-1">{playerStats.wins}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{playerStats.winRate}% Win Rate</div>
            </div>

            <div className="premium-card specular-top p-3.5 rounded-xl text-center">
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Hole-in-One</div>
              <div className="text-xl font-mono font-black text-emerald-400 mt-1">{playerStats.totalHIOs}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{(playerStats.totalHIOs / Math.max(1, playerStats.matchesPlayed)).toFixed(1)} / match</div>
            </div>

            <div className="premium-card specular-top p-3.5 rounded-xl text-center">
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Best Score</div>
              <div className="text-xl font-mono font-black text-white mt-1">
                {playerStats.bestDiffPar < 0 ? playerStats.bestDiffPar : `+${playerStats.bestDiffPar}`}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Scarto dal Par</div>
            </div>

            <div className="premium-card specular-top p-3.5 rounded-xl text-center">
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Disastri (10+)</div>
              <div className="text-xl font-mono font-black text-rose-400 mt-1">{playerStats.totalDisasters}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Buche al Cap</div>
            </div>
          </div>

        </div>

        {/* Right Column: Radar Chart & Stats */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Radar Chart */}
          <div className="premium-card specular-top p-6 rounded-2xl border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#d4af37]" />
                Radar Telemetrico Attributi
              </span>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Index Melagoodo</span>
            </div>

            <div className="relative aspect-square max-w-[290px] mx-auto">
              <svg className="w-full h-full" viewBox="0 0 200 200">
                <defs>
                  <radialGradient id="radarFillGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(212, 175, 55, 0.38)" />
                    <stop offset="100%" stopColor="rgba(16, 185, 129, 0.14)" />
                  </radialGradient>
                </defs>

                {/* Axis spokes */}
                {radarPoints.map((p, i) => (
                  <line
                    key={`axis-${i}`}
                    x1={100}
                    y1={100}
                    x2={p.axisEndX}
                    y2={p.axisEndY}
                    stroke="rgba(255, 255, 255, 0.06)"
                    strokeWidth="1"
                  />
                ))}

                {/* Background radar rings */}
                {[0.25, 0.5, 0.75, 1].map((scale, i) => (
                  <polygon
                    key={i}
                    points={radarPoints.map((_, idx) => {
                      const angle = (Math.PI * 2 / 5) * idx - Math.PI / 2;
                      const r = 68 * scale;
                      return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
                    }).join(' ')}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="1"
                    strokeDasharray={i < 3 ? '2 2' : undefined}
                  />
                ))}

                {/* Radar Area */}
                <polygon
                  points={polygonPoints}
                  fill="url(#radarFillGrad)"
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
                    fill="#f5e6b3"
                    stroke="#070b09"
                    strokeWidth="1.5"
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
                    fill="#cbd5e1"
                    fontSize="8.5"
                    fontFamily="var(--font-jakarta)"
                    fontWeight="700"
                  >
                    {p.label} ({p.val})
                  </text>
                ))}
              </svg>
            </div>
          </div>

          {/* Career Highlights */}
          <div className="premium-card specular-top p-4 rounded-xl space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Stile e Rendimento Sul Campo</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {profile.name} vanta una media di <strong className="text-white font-mono">{profile.avgScore.toFixed(1)}</strong> colpi a partita con un differenziale medio di <strong className="text-emerald-400 font-mono">{profile.avgDiffPar > 0 ? `+${profile.avgDiffPar.toFixed(1)}` : profile.avgDiffPar.toFixed(1)}</strong> dal par su <strong className="text-slate-200 font-mono">{profile.totalHoles}</strong> buche giocate.
            </p>
          </div>

        </div>

      </div>

      {/* Match History for this Player */}
      <div className="space-y-4 pt-4 cv-section">
        <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
          <span>📜</span> Storico Partite Disputate da {playerStats.name} ({playerMatches.length})
        </h3>

        <div className="premium-card specular-top rounded-2xl border border-white/[0.08] overflow-hidden bg-[#070b09]">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse tabular-nums">
              <thead>
                <tr className="bg-[#0d1410] text-slate-400 font-semibold border-b border-white/[0.08] text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3">Partita</th>
                  <th className="py-3 px-2 text-center">Posizione</th>
                  <th className="py-3 px-2 text-center">Score</th>
                  <th className="py-3 px-2 text-center">Diff Par</th>
                  <th className="py-3 px-2 text-center">HIO</th>
                  <th className="py-3 px-2 text-center">Disastri</th>
                  <th className="py-3 px-3 text-right">Azione</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {playerMatches.map(({ match, entry }) => (
                  <tr 
                    key={match.id}
                    onClick={() => {
                      sound.playClick();
                      onOpenMatchModal(match);
                    }}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-3 font-medium text-white group-hover:text-[#f5e6b3] transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#d4af37]/80 text-[10px] font-bold">#{match.id}</span>
                        <span className="truncate max-w-[200px] sm:max-w-xs">{match.title}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-2 text-center font-mono font-bold">
                      {entry.position === 1 ? (
                        <span className="px-1.5 py-0.5 rounded bg-[#d4af37]/20 text-[#f5e6b3] border border-[#d4af37]/40 text-[10px]">1°</span>
                      ) : entry.position === 2 ? (
                        <span className="text-slate-200">2°</span>
                      ) : entry.position === 3 ? (
                        <span className="text-amber-500">3°</span>
                      ) : (
                        <span className="text-slate-500">{entry.position}°</span>
                      )}
                    </td>

                    <td className="py-2.5 px-2 text-center font-mono font-bold text-white">
                      {entry.totalScore}
                    </td>

                    <td className="py-2.5 px-2 text-center font-mono font-semibold">
                      <span className={entry.diffPar < 0 ? 'text-emerald-400' : entry.diffPar === 0 ? 'text-slate-400' : 'text-rose-400'}>
                        {entry.diffPar > 0 ? `+${entry.diffPar}` : entry.diffPar === 0 ? 'E' : entry.diffPar}
                      </span>
                    </td>

                    <td className="py-2.5 px-2 text-center font-mono text-[#f5e6b3] font-semibold">
                      {entry.hios > 0 ? entry.hios : '-'}
                    </td>

                    <td className="py-2.5 px-2 text-center font-mono text-rose-400 font-semibold">
                      {entry.disasters > 0 ? entry.disasters : '-'}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <span className="text-[11px] text-slate-400 group-hover:text-white flex items-center justify-end gap-1 transition-colors">
                        <Eye className="w-3 h-3 text-[#d4af37]" />
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



