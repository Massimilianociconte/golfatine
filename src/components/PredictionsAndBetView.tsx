import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Award, 
  Coins, 
  CheckCircle2, 
  Trophy, 
  Target, 
  Flame, 
  Calculator,
  RefreshCw,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { UPCOMING_MATCH_FORECAST, PlayerForecast } from '../data/forecastingData';
import { PLAYERS_DATA } from '../data/golfatineData';
import { sound } from '../utils/audio';
import { triggerVictoryConfetti } from '../utils/confetti';
import { getPlayerAvatar } from '../utils/playerAvatars';
import { getOrCreateBettorId, getUserBet, saveUserBet, SdrogoBetTicket } from '../utils/betStorage';
import { 
  getLocalUserProfile, 
  subscribeToUserProfile,
  subscribeToBalanceUpdates,
  placeBetTransaction, 
  UserProfile 
} from '../utils/userStore';

export const PredictionsAndBetView: React.FC = () => {
  const forecast = UPCOMING_MATCH_FORECAST;
  const currentMatchId = forecast.matchNumber;
  const isCurrentTicket = (t: SdrogoBetTicket | null): t is SdrogoBetTicket =>
    Boolean(t && t.matchId === currentMatchId);
  const [profile, setProfile] = useState<UserProfile>(() => getLocalUserProfile());
  const [bettorId, setBettorId] = useState<string>('');
  const [existingBet, setExistingBet] = useState<SdrogoBetTicket | null>(null);

  // Form selections state
  const [winnerPick, setWinnerPick] = useState<string>('Just Rohn');
  const [hioKingPick, setHioKingPick] = useState<string>('Delux');
  const [asinoPick, setAsinoPick] = useState<string>('GaBBo');
  const [scoreRangePick, setScoreRangePick] = useState<string>('50-59 colpi');
  const [stakedPoints, setStakedPoints] = useState<number>(100);

  // Feedback state
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Listen to profile & balance updates across components and tabs
  useEffect(() => {
    const unsubProfile = subscribeToUserProfile((updatedProfile) => {
      setProfile(updatedProfile);
      const saved = getUserBet();
      setExistingBet(isCurrentTicket(saved) ? saved : null);
    });
    const unsubBalance = subscribeToBalanceUpdates(() => {
      setProfile(getLocalUserProfile());
    });
    return () => {
      unsubProfile();
      unsubBalance();
    };
  }, []);

  // Initialize bettor ID & existing bet
  useEffect(() => {
    const id = getOrCreateBettorId();
    setBettorId(id);

    const saved = getUserBet();
    if (isCurrentTicket(saved)) {
      setExistingBet(saved);
      setWinnerPick(saved.winnerPick);
      setHioKingPick(saved.hioKingPick);
      setAsinoPick(saved.asinoPick);
      setScoreRangePick(saved.scoreRangePick);
      setStakedPoints(saved.stakedPoints);
    }
  }, []);

  const scoreOdds: Record<string, number> = {
    '< 50 colpi': 5.50,
    '50-59 colpi': 1.85,
    '60-69 colpi': 3.20,
    '70+ colpi': 6.00,
  };

  const getWinnerOdds = (name: string): number => {
    const p = forecast.playersForecast.find((item: PlayerForecast) => item.playerName === name);
    return p ? p.bettingOdds : 3.00;
  };

  const getHioOdds = (name: string): number => {
    const hioOddsMap: Record<string, number> = {
      'Delux': 1.85,
      'Just Rohn': 2.20,
      'nonsonodread': 2.75,
      'ilMasseo': 4.50,
      'GaBBo': 4.80,
      'Mollu': 5.20,
      'JTaz': 9.50,
    };
    return hioOddsMap[name] || 3.00;
  };

  const getAsinoOdds = (name: string): number => {
    const asinoOddsMap: Record<string, number> = {
      'GaBBo': 1.50,
      'ilMasseo': 2.20,
      'JTaz': 3.20,
      'nonsonodread': 4.20,
      'Delux': 5.50,
      'Just Rohn': 6.50,
      'Mollu': 7.00,
    };
    return asinoOddsMap[name] || 3.50;
  };

  const calculateTotalMultiplier = () => {
    const wOdds = getWinnerOdds(winnerPick);
    const sOdds = scoreOdds[scoreRangePick] || 2.0;
    const hioOdds = getHioOdds(hioKingPick);
    const asinoOdds = getAsinoOdds(asinoPick);
    return Math.max(1.50, parseFloat((wOdds * sOdds * hioOdds * asinoOdds * 0.15).toFixed(2)));
  };

  const totalMultiplier = calculateTotalMultiplier();
  const potentialWin = Math.round(stakedPoints * totalMultiplier);

  const isBetSettled = Boolean(existingBet?.status && existingBet.status !== 'pending');
  const existingStake = existingBet ? existingBet.stakedPoints : 0;
  const availableBudget = profile.sdrogoPoints + existingStake;
  const stakeDelta = stakedPoints - existingStake;
  const canAfford = !isBetSettled && stakedPoints >= 10 && stakeDelta <= profile.sdrogoPoints;

  const handleSubmitBet = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    if (isBetSettled) {
      sound.playDisasterBuzzer();
      setFeedback({ type: 'error', text: 'Questa giocata è già stata conclusa e liquidata. Non può più essere modificata.' });
      return;
    }

    if (!Number.isFinite(stakedPoints) || !Number.isInteger(stakedPoints) || stakedPoints < 10) {
      sound.playDisasterBuzzer();
      setFeedback({ type: 'error', text: 'La puntata minima è di 10 SdrogoPoints (valore intero).' });
      return;
    }

    if (!canAfford) {
      sound.playDisasterBuzzer();
      setFeedback({ 
        type: 'error', 
        text: `Saldo insufficiente! Hai ${profile.sdrogoPoints.toLocaleString()} PTS disponibili. Per puntare ${stakedPoints.toLocaleString()} PTS ti servono ${stakeDelta.toLocaleString()} PTS aggiuntivi.` 
      });
      return;
    }

    const result = placeBetTransaction({
      matchId: currentMatchId,
      winnerPick,
      hioKingPick,
      asinoPick,
      scoreRangePick,
      stakedPoints,
      multiplier: totalMultiplier,
      potentialPayout: potentialWin,
      placedAt: existingBet ? existingBet.placedAt : new Date().toISOString(),
    });

    if (result.success) {
      sound.playHIOFanfare();
      triggerVictoryConfetti();
      if (result.savedTicket) {
        try {
          saveUserBet(result.savedTicket);
        } catch (e) {
          console.warn('Legacy bet mirror persist failed', e);
        }
      }
      setExistingBet(result.savedTicket || null);
      setProfile(getLocalUserProfile());
      setFeedback({ type: 'success', text: result.message });
      setTimeout(() => setFeedback(null), 5000);
    } else {
      sound.playDisasterBuzzer();
      setFeedback({ type: 'error', text: result.message });
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const setQuickStake = (amt: number) => {
    sound.playClick();
    setStakedPoints(Math.min(availableBudget, amt));
  };

  const setMaxStake = () => {
    sound.playClick();
    setStakedPoints(Math.max(10, availableBudget));
  };

  return (
    <div className="space-y-10">
      
      {/* Top Editorial Header */}
      <div className="premium-card p-6 sm:p-8 rounded-2xl border border-white/[0.08] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" />
                Modello Predittivo Avanzato
              </span>
              <span className="text-xs text-slate-400">Analisi Statistica State-of-the-Art</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight">
              Previsioni Analitiche & Sdrogo Bet
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl font-normal leading-relaxed">
              Algoritmo predittivo ad altissima precisione calibrato sui dati storici di 82 partite con scorecard e 6.686 buche giocate da <strong>Melagoodo</strong>, integrato con il sistema di pronostici gratuiti della community.
            </p>
          </div>

          <div className="flex items-center gap-2.5 bg-[#090d0b] px-3.5 py-2.5 rounded-xl border border-white/[0.08] text-xs text-slate-300 shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Saldo Votante</div>
              <div className="font-mono text-[#d4af37] font-bold">
                {profile.sdrogoPoints.toLocaleString()} PTS
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 1: AI PREDICTIONS FOR UPCOMING GOLFATINA */}
      <div className="space-y-4">
        
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold font-heading text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-[#d4af37]" />
              <span>Proiezione Ufficiale: Golfatina #{forecast.matchNumber}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Percorso stimato: <strong>Par {forecast.totalPar}</strong> (18 buche) • Simulazione Monte Carlo su distribuzioni temporali storiche
            </p>
          </div>

          <span className="text-xs text-slate-400 font-mono px-2.5 py-1 rounded bg-[#090d0b] border border-white/[0.06]">
            Engine: {forecast.modelEngine}
          </span>
        </div>

        {/* AI Narrative Commentary Card */}
        <div className="premium-card p-4 rounded-xl border-l-2 border-[#d4af37] space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#d4af37]">
            <Sparkles className="w-3.5 h-3.5" />
            Sintesi dell'Analisi Predittiva
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
            "{forecast.aiAnalysis}"
          </p>
        </div>

        {/* Forecast Leaderboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {forecast.playersForecast.map((p: PlayerForecast, idx: number) => {
            const playerProfile = PLAYERS_DATA[p.playerName];
            const isWinnerFav = idx === 0;
            const avatarImg = getPlayerAvatar(p.playerName);

            return (
              <div
                key={p.playerName}
                className={`premium-card p-4 rounded-xl flex flex-col justify-between transition-all ${
                  isWinnerFav ? 'border-[#d4af37]/40 bg-[#141b17]' : 'border-white/[0.07]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
                        <img src={avatarImg} alt={p.playerName} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white font-heading">{p.playerName}</span>
                          {isWinnerFav && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#d4af37] text-slate-950 font-bold">
                              FAV
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {playerProfile ? playerProfile.badge : 'Player'}
                        </span>
                      </div>
                    </div>


                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-[#d4af37]">
                        {p.bettingOdds.toFixed(2)}x
                      </span>
                      <span className="text-[9px] text-slate-500 block">Quota</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-3 text-center border-b border-white/[0.04]">
                    <div>
                      <span className="text-[9px] text-slate-500 block">Score Stima</span>
                      <strong className="text-xs font-mono text-white">{p.predictedScore}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">vs Par</span>
                      <strong className={`text-xs font-mono ${p.predictedDiffPar < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {p.predictedDiffPar > 0 ? `+${p.predictedDiffPar}` : p.predictedDiffPar}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">Prob. Vittoria</span>
                      <strong className="text-xs font-mono text-emerald-400">{p.winProbabilityPercent}%</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>HIO Stimati: <strong className="text-white">{p.expectedHIOs}</strong></span>
                    <span>Rischio Disastro: <strong className="text-white">{p.disasterRiskPercent}%</strong></span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-mono">
                    <span>Trend: {p.formTrend}</span>
                    <span>Range: [{p.q10Score} - {p.q90Score}]</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* SECTION 2: COMMUNITY BET SLIP (SCHEDINA SDROGO) */}
      <div className="space-y-4 pt-4 border-t border-white/[0.08]">
        
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold font-heading text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#d4af37]" />
              <span>Sdrogo Schedina Community • Golfatina #{forecast.matchNumber}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Punta i tuoi <strong>SdrogoPoints</strong> gratuiti. L'importo viene scalato immediatamente dal tuo saldo reale.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#d4af37] bg-[#0d1410] px-3 py-1.5 rounded-lg border border-[#d4af37]/30">
            <Coins className="w-4 h-4" />
            <span>Saldo: <strong>{profile.sdrogoPoints.toLocaleString()} PTS</strong></span>
          </div>
        </div>

        <form onSubmit={handleSubmitBet} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Interactive Bet Selectors */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* 1. Winner Selection */}
            <div className="premium-card p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Trophy className="w-3.5 h-3.5 text-[#d4af37]" />
                  1. Chi vincerà la Golfatina #{forecast.matchNumber}?
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Quota secca</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {forecast.playersForecast.map((p: PlayerForecast) => {
                  const isSelected = winnerPick === p.playerName;

                  return (
                    <button
                      type="button"
                      key={p.playerName}
                      onClick={() => {
                        sound.playClick();
                        setWinnerPick(p.playerName);
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-[#1e261e] border-[#d4af37] text-white ring-1 ring-[#d4af37]/40' 
                          : 'bg-[#090d0b] border-white/[0.06] text-slate-300 hover:border-white/[0.15]'
                      }`}
                    >
                      <div className="text-xs font-bold font-heading truncate">{p.playerName}</div>
                      <div className="text-[10px] text-[#d4af37] font-mono font-semibold mt-0.5">
                        {p.bettingOdds.toFixed(2)}x
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Hole in One King */}
            <div className="premium-card p-4 rounded-xl space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                2. Chi farà più Hole-in-One (Re delle Buche)?
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Delux', 'Just Rohn', 'nonsonodread', 'ilMasseo', 'Mollu', 'GaBBo', 'JTaz'].map((pName) => {
                  const isSelected = hioKingPick === pName;
                  const odds = getHioOdds(pName);
                  return (
                    <button
                      type="button"
                      key={pName}
                      onClick={() => {
                        sound.playClick();
                        setHioKingPick(pName);
                      }}
                      className={`p-2 rounded-lg text-xs font-medium border transition-all text-center cursor-pointer ${
                        isSelected
                          ? 'bg-[#18231d] border-emerald-400 text-emerald-300 ring-1 ring-emerald-400/30'
                          : 'bg-[#090d0b] border-white/[0.06] text-slate-300 hover:border-white/[0.15]'
                      }`}
                    >
                      <div className="font-bold truncate">{pName}</div>
                      <div className="text-[10px] text-emerald-400 font-mono font-semibold mt-0.5">{odds.toFixed(2)}x</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Asino / Tilt Master */}
            <div className="premium-card p-4 rounded-xl space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                3. Chi farà il peggior disastro (Asino del Match)?
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['GaBBo', 'ilMasseo', 'JTaz', 'nonsonodread', 'Delux', 'Just Rohn', 'Mollu'].map((pName) => {
                  const isSelected = asinoPick === pName;
                  const odds = getAsinoOdds(pName);
                  return (
                    <button
                      type="button"
                      key={pName}
                      onClick={() => {
                        sound.playClick();
                        setAsinoPick(pName);
                      }}
                      className={`p-2 rounded-lg text-xs font-medium border transition-all text-center cursor-pointer ${
                        isSelected
                          ? 'bg-[#241315] border-rose-500 text-rose-300 ring-1 ring-rose-500/30'
                          : 'bg-[#090d0b] border-white/[0.06] text-slate-300 hover:border-white/[0.15]'
                      }`}
                    >
                      <div className="font-bold truncate">{pName}</div>
                      <div className="text-[10px] text-rose-400 font-mono font-semibold mt-0.5">{odds.toFixed(2)}x</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Score Range */}
            <div className="premium-card p-4 rounded-xl space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Calculator className="w-3.5 h-3.5 text-purple-400" />
                4. Con quale punteggio totale vincerà il 1° classificato?
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.keys(scoreOdds).map((range) => {
                  const isSelected = scoreRangePick === range;
                  return (
                    <button
                      type="button"
                      key={range}
                      onClick={() => {
                        sound.playClick();
                        setScoreRangePick(range);
                      }}
                      className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#1e1428] border-purple-400 text-purple-200 ring-1 ring-purple-400/30'
                          : 'bg-[#090d0b] border-white/[0.06] text-slate-300 hover:border-white/[0.15]'
                      }`}
                    >
                      <div className="text-xs font-bold">{range}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">Quota {scoreOdds[range]}x</div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right: Schedina Sdrogo (Slip) */}
          <div className="lg:col-span-4 space-y-4">
            
            <div className="premium-card p-5 rounded-2xl border border-[#d4af37]/30 bg-[#0d1410] space-y-5 sticky top-24 shadow-xl">
              
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div>
                  <h4 className="text-sm font-bold font-heading text-white">Riepilogo Schedina</h4>
                  <p className="text-[10px] text-slate-400">Golfatina #{forecast.matchNumber} Community Bet</p>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  isBetSettled
                    ? existingBet?.status === 'won'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-rose-500 text-white'
                    : 'bg-[#d4af37] text-slate-950'
                }`}>
                  {isBetSettled 
                    ? existingBet?.status === 'won' ? 'VINCENTE' : 'CHIUSA'
                    : 'ATTIVA'}
                </span>
              </div>

              {/* Selections List */}
              <div className="space-y-2 text-xs">
                <div className="bg-[#090d0b] p-2 rounded-lg border border-white/[0.04] flex justify-between items-center">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">1. Vincitore</span>
                    <strong className="text-white">{winnerPick}</strong>
                  </div>
                  <span className="text-[#d4af37] font-mono font-bold">{getWinnerOdds(winnerPick).toFixed(2)}x</span>
                </div>

                <div className="bg-[#090d0b] p-2 rounded-lg border border-white/[0.04] flex justify-between items-center">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">2. Re Hole-in-One</span>
                    <strong className="text-emerald-300">{hioKingPick}</strong>
                  </div>
                  <span className="text-emerald-400 font-mono font-bold">{getHioOdds(hioKingPick).toFixed(2)}x</span>
                </div>

                <div className="bg-[#090d0b] p-2 rounded-lg border border-white/[0.04] flex justify-between items-center">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">3. Asino / Tilt</span>
                    <strong className="text-rose-300">{asinoPick}</strong>
                  </div>
                  <span className="text-rose-400 font-mono font-bold">{getAsinoOdds(asinoPick).toFixed(2)}x</span>
                </div>

                <div className="bg-[#090d0b] p-2 rounded-lg border border-white/[0.04] flex justify-between items-center">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">4. Score Vincitore</span>
                    <strong className="text-purple-300">{scoreRangePick}</strong>
                  </div>
                  <span className="text-purple-400 font-mono font-bold">{Number(scoreOdds[scoreRangePick] ?? 2.0).toFixed(2)}x</span>
                </div>
              </div>

              {/* Staked Points Input with Balance Guard */}
              <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-[#d4af37]" />
                    Punti da Puntare:
                  </span>
                  <div className="text-right">
                    <span className="font-mono text-[11px] text-slate-400 block">
                      Disponibili: <strong className="text-white">{profile.sdrogoPoints.toLocaleString()} PTS</strong>
                    </span>
                    {existingStake > 0 && (
                      <span className="text-[10px] text-[#d4af37] font-mono">
                        (Budget totale: {availableBudget.toLocaleString()} PTS)
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Pick Pills */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[50, 100, 250, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setQuickStake(amt)}
                      disabled={availableBudget < amt}
                      className={`py-1 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                        stakedPoints === amt 
                          ? 'bg-[#d4af37] text-slate-950 border-[#d4af37]' 
                          : 'bg-[#090d0b] border-white/[0.08] text-slate-300 hover:border-white/[0.2] disabled:opacity-30 disabled:cursor-not-allowed'
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="10"
                    max={availableBudget}
                    value={stakedPoints}
                    onChange={(e) => setStakedPoints(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-3 py-1.5 rounded-lg premium-input text-white text-xs font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={setMaxStake}
                    className="px-2.5 py-1.5 rounded-lg bg-[#1a251f] hover:bg-[#23332a] text-[#d4af37] border border-[#d4af37]/30 text-[10px] font-mono font-bold shrink-0 cursor-pointer"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Potential Multiplier Box */}
              <div className="bg-[#090d0b] p-3 rounded-xl border border-white/[0.06] text-center space-y-1">
                <div className="text-[10px] text-slate-400">Moltiplicatore Totale:</div>
                <div className="text-xl font-mono font-bold text-[#d4af37]">
                  {totalMultiplier}x
                </div>
                <div className="text-xs text-slate-400 pt-1 border-t border-white/[0.04] flex justify-between tabular-nums">
                  <span>Vincita Potenziale:</span>
                  <strong className="text-emerald-400 font-mono font-bold">{potentialWin.toLocaleString()} PTS</strong>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={!canAfford || isBetSettled}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-amber-400 to-[#d4af37] hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#d4af37]/20 transition-all active:scale-98 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isBetSettled
                    ? existingBet?.status === 'won'
                      ? 'SCHEDINA VINCENTE (LIQUIDATA)'
                      : 'SCHEDINA CHIUSA (RISOLTA)'
                    : existingBet
                    ? stakeDelta > 0
                      ? `AGGIORNA PUNTATA (+${stakeDelta.toLocaleString()} PTS)`
                      : stakeDelta < 0
                      ? `AGGIORNA PUNTATA (Rimborsa ${Math.abs(stakeDelta).toLocaleString()} PTS)`
                      : 'AGGIORNA PRONOSTICI (0 PTS)'
                    : `CONFERMA SCHEDINA (${stakedPoints.toLocaleString()} PTS)`}
                </span>
              </button>

              {feedback && (
                <div className={`p-2.5 rounded-xl text-xs text-center font-bold animate-in zoom-in-95 ${
                  feedback.type === 'success' 
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                }`}>
                  {feedback.text}
                </div>
              )}

              {existingBet && (
                <p className="text-[10px] text-slate-500 text-center">
                  Ultimo aggiornamento: {new Date(existingBet.lastUpdatedAt || existingBet.placedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} • Schedina attiva nel profilo.
                </p>
              )}

            </div>

          </div>

        </form>

      </div>

    </div>
  );
};
