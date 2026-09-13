import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Coins, 
  Trophy, 
  Award, 
  CheckCircle2, 
  CreditCard, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  Eye, 
  Heart, 
  ExternalLink, 
  Flame,
  Cloud,
  Lock,
  Mail,
  AlertCircle,
  LogIn,
  LogOut,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { 
  getLocalUserProfile, 
  subscribeToUserProfile, 
  subscribeToSyncStatus, 
  getSyncStatus, 
  SyncStatusInfo, 
  UserProfile, 
  REQUIRED_WATCH_SECONDS,
  handleUserLogin,
  handleUserLogout,
  flushOfflineQueue,
  syncProfileFromSupabase,
  getAuthUser
} from '../utils/userStore';
import { 
  signIn, 
  signUp, 
  signOut, 
  getCurrentUser, 
  onAuthStateChange 
} from '../utils/authService';
import { getUserBet, SdrogoBetTicket } from '../utils/betStorage';
import { sound } from '../utils/audio';
import { MATCHES_DATA } from '../data/golfatineData';
import { UPCOMING_MATCH_FORECAST } from '../data/forecastingData';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenGayCard: () => void;
  onOpenDonation?: () => void;
  onNavigateToForecast?: () => void;
}

type TabKey = 'overview' | 'account' | 'watched' | 'donations' | 'bets' | 'card';

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  onOpenGayCard,
  onOpenDonation,
  onNavigateToForecast
}) => {
  const [profile, setProfile] = useState<UserProfile>(getLocalUserProfile());
  // Show only the ticket for the current market; stale tickets from previous
  // markets stay in history but must not look "active".
  const isCurrentTicket = (t: SdrogoBetTicket | null): t is SdrogoBetTicket =>
    Boolean(t && t.matchId === UPCOMING_MATCH_FORECAST.matchNumber);
  const [activeBet, setActiveBet] = useState<SdrogoBetTicket | null>(() => {
    const saved = getUserBet();
    return isCurrentTicket(saved) ? saved : null;
  });
  const [syncInfo, setSyncInfo] = useState<SyncStatusInfo>(() => getSyncStatus());
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Supabase Auth State
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(() => getAuthUser());
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [realName, setRealName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMessage, setAuthSuccessMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProfile(getLocalUserProfile());
      const saved = getUserBet();
      setActiveBet(isCurrentTicket(saved) ? saved : null);
      setSyncInfo(getSyncStatus());
      getCurrentUser().then((user) => {
        setAuthUser(user);
      });
      setAuthError(null);
      setAuthSuccessMessage(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const unsubProfile = subscribeToUserProfile((updatedProfile) => {
      setProfile(updatedProfile);
      const saved = getUserBet();
      setActiveBet(isCurrentTicket(saved) ? saved : null);
    });
    const unsubSync = subscribeToSyncStatus((updatedSync) => {
      setSyncInfo(updatedSync);
    });
    const authSubscription = onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });
    return () => {
      unsubProfile();
      unsubSync();
      authSubscription.unsubscribe();
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        sound.playClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const watchedMatchesList = MATCHES_DATA.filter(m => profile.watchedMatches.includes(m.id));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMessage(null);

    if (!email.trim() || !password) {
      setAuthError('Inserisci sia l\'email che la password.');
      return;
    }

    setAuthLoading(true);
    sound.playClick();

    const res = await signIn(email.trim(), password);
    setAuthLoading(false);

    if (res.error) {
      const msg = res.error.message.toLowerCase();
      if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
        setAuthError('Credenziali errate: verifica indirizzo email e password.');
      } else if (msg.includes('email not confirmed')) {
        setAuthError('Email non ancora confermata! Controlla la tua casella di posta per confermare l\'indirizzo prima di accedere.');
      } else {
        setAuthError(res.error.message || 'Errore durante l\'accesso.');
      }
    } else if (res.user) {
      setAuthUser(res.user);
      await handleUserLogin(res.user);
      setProfile(getLocalUserProfile());
      setAuthSuccessMessage('Accesso eseguito con successo! Profilo sincronizzato su Cloud Melagoodo.');
      sound.playHIOFanfare();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMessage(null);

    if (!username.trim()) {
      setAuthError('Inserisci un Username.');
      return;
    }
    if (!email.trim()) {
      setAuthError('Inserisci un indirizzo email valido.');
      return;
    }
    if (password.length < 6) {
      setAuthError('La password deve contenere almeno 6 caratteri.');
      return;
    }

    setAuthLoading(true);
    sound.playClick();

    const res = await signUp(
      email.trim(),
      password,
      username.trim(),
      realName.trim() || username.trim()
    );
    setAuthLoading(false);

    if (res.error) {
      const msg = res.error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('user already registered')) {
        setAuthError('Questa email è già registrata. Passa alla scheda "Accedi" per eseguire il login.');
      } else {
        setAuthError(res.error.message || 'Errore durante la registrazione.');
      }
    } else if (res.requiresEmailConfirmation) {
      setAuthSuccessMessage(
        `Registrazione completata! Abbiamo inviato un'email di conferma a ${email}. Clicca sul link nella mail per attivare l'account e accedere.`
      );
    } else if (res.user) {
      setAuthUser(res.user);
      await handleUserLogin(res.user);
      setProfile(getLocalUserProfile());
      setAuthSuccessMessage('Account Community creato con successo! +1.000 SdrogoPoints accreditati.');
      sound.playHIOFanfare();
    }
  };

  const handleSignOut = async () => {
    sound.playClick();
    setAuthLoading(true);
    await signOut();
    await handleUserLogout();
    setAuthUser(null);
    setProfile(getLocalUserProfile());
    setAuthLoading(false);
    setAuthSuccessMessage('Disconnessione completata. Sei tornato alla Modalità Ospite locale.');
  };

  const handleCopyUserId = () => {
    if (!authUser) return;
    navigator.clipboard.writeText(authUser.id);
    setCopiedId(true);
    sound.playClick();
    setTimeout(() => setCopiedId(false), 2000);
  };

  const tabs: { id: TabKey; label: string; badge?: string }[] = [
    { id: 'overview', label: 'Panoramica & Crediti' },
    { 
      id: 'account', 
      label: authUser ? 'Account & Cloud ✓' : 'Account & Cloud',
      badge: authUser ? 'CLOUD' : undefined
    },
    { id: 'watched', label: `Visione (${profile.watchedMatches.length})` },
    { id: 'donations', label: `Donazioni (${profile.totalCannucceDonated} 🥤)` },
    { id: 'bets', label: 'Schedina Bet' },
    { id: 'card', label: 'GaY Card 3D' },
  ];

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-profile-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sound.playClick();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-xl bg-black/80 animate-in fade-in duration-200 select-none overflow-y-auto cursor-pointer"
    >
      {/* Determinist Box preventing layout jump/shift across tabs with full mobile responsiveness */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl h-full max-h-[92vh] sm:h-[620px] bg-[#090d0b] border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto cursor-default"
      >
        
        {/* Fixed Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-[#0d1410] flex items-center justify-between gap-3 sm:gap-4 shrink-0 z-20 min-w-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 truncate">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#18231d] border border-white/[0.1] flex items-center justify-center text-lg sm:text-xl shadow-inner shrink-0">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4af37]" />
            </div>
            <div className="min-w-0 truncate">
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <h2 id="user-profile-title" className="text-sm sm:text-lg font-black font-heading text-white truncate">
                  Profilo Utente Community
                </h2>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border flex items-center gap-1 shrink-0 ${
                  syncInfo.status === 'synced'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : syncInfo.status === 'local'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                    : syncInfo.status === 'syncing'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : syncInfo.status === 'offline'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : syncInfo.status === 'error'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    syncInfo.status === 'synced' 
                      ? 'bg-emerald-400' 
                      : syncInfo.status === 'local'
                      ? 'bg-sky-400' 
                      : syncInfo.status === 'syncing' 
                      ? 'bg-amber-400 animate-pulse' 
                      : syncInfo.status === 'offline' 
                      ? 'bg-amber-400' 
                      : syncInfo.status === 'error'
                      ? 'bg-rose-400 animate-ping'
                      : 'bg-amber-400'
                  }`} />
                  <span>
                    {syncInfo.status === 'synced' 
                      ? 'Cloud Melagoodo' 
                      : syncInfo.status === 'local'
                      ? 'Modalità Ospite'
                      : syncInfo.status === 'syncing' 
                      ? 'Sincronizzazione...' 
                      : syncInfo.status === 'offline' 
                      ? 'Offline Resilience' 
                      : syncInfo.status === 'error'
                      ? 'Errore Cloud'
                      : `In Coda (${syncInfo.pendingActionsCount})`}
                  </span>
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                {authUser ? (
                  <>
                    Cloud Verificato: <strong className="text-emerald-300">{profile.username}</strong> • Email: <span className="text-slate-300">{authUser.email}</span>
                  </>
                ) : (
                  <>
                    Utente Ospite: <strong className="text-slate-200">{profile.realName || profile.username}</strong> • Salvataggio Locale (localStorage)
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            aria-label="Chiudi profilo utente"
            className="p-2 sm:p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher - Fixed in position */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-white/[0.06] bg-[#070a08] text-xs overflow-x-auto no-scrollbar shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                sound.playClick();
                setActiveTab(tab.id);
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Scrollable Content Container with fixed flex boundary */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in min-h-[380px]">
              
              {/* Guest / Auth Banner */}
              {!authUser ? (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-[#0c141a] to-[#0e1411] border border-sky-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-400" />
                      <span className="font-bold text-white text-xs">Sei in Modalità Ospite (Salvataggio Locale)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      I tuoi punti e donazioni sono salvati solo su questo dispositivo. Crea o collega un account Cloud (<strong>gratuito per sempre</strong>) per sincronizzarli ovunque e competere nelle classifiche!
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setActiveTab('account');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shrink-0 transition-colors cursor-pointer"
                  >
                    Accedi al Cloud ☁
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#0d1813] to-[#0e1411] border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-emerald-300 text-xs">Account Cloud Melagoodo Verificato</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Connesso come <strong className="text-white">{authUser.email}</strong> • I tuoi crediti e le tue scommesse sono salvati nel cloud.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setActiveTab('account');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-slate-200 font-semibold text-xs shrink-0 transition-colors cursor-pointer"
                  >
                    Gestisci Account →
                  </button>
                </div>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="premium-card p-4 rounded-xl space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Saldo Crediti Virtuali</span>
                  </div>
                  <div className="text-2xl font-mono font-black text-[#d4af37]">{profile.sdrogoPoints.toLocaleString()} PTS</div>
                  <div className="text-[10px] text-slate-400">1.000 iniziali + 50 per match visto</div>
                </div>

                <div className="premium-card p-4 rounded-xl space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-[#ef4444]" />
                    <span>Cannucce Donate</span>
                  </div>
                  <div className="text-2xl font-mono font-black text-[#ef4444]">🥤 {profile.totalCannucceDonated}</div>
                  <div className="text-[10px] text-slate-400">Al Progetto Gabbiness</div>
                </div>

                <div className="premium-card p-4 rounded-xl space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Match Verificati</span>
                  </div>
                  <div className="text-2xl font-mono font-black text-white">{profile.watchedMatches.length} / {MATCHES_DATA.length}</div>
                  <div className="text-[10px] text-slate-400">Soglia: {REQUIRED_WATCH_SECONDS}s di visione reale</div>
                </div>
              </div>

              {/* Badges */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#d4af37]" />
                  Badge Sbloccati della Community Melagoodo
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {profile.unlockedBadges.map((badge, i) => (
                    <div key={i} className="bg-[#0e1411] p-3 rounded-xl border border-white/[0.06] flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-200">{badge}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB: ACCOUNT & CLOUD */}
          {activeTab === 'account' && (
            <div className="space-y-5 animate-in fade-in min-h-[380px]">
              
              {/* Case 1: Utente Autenticato Supabase */}
              {authUser ? (
                <div className="space-y-4">
                  
                  {/* Account Card */}
                  <div className="p-5 rounded-2xl bg-[#0c120f] border border-emerald-500/30 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white font-heading">Account Cloud Verificato</span>
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Attivo
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Sincronizzazione in tempo reale con salvataggio cloud protetto e crittografato
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          sound.playClick();
                          setAuthLoading(true);
                          await syncProfileFromSupabase();
                          await flushOfflineQueue();
                          setProfile(getLocalUserProfile());
                          setAuthLoading(false);
                        }}
                        disabled={authLoading}
                        className="px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        title="Forza sincronizzazione con Supabase Cloud"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${authLoading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Sincronizza Ora</span>
                      </button>
                    </div>

                    {/* Sync Status Feedback Alert Banner */}
                    {syncInfo.errorMessage && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-start gap-2 animate-in fade-in">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                        <div className="space-y-0.5">
                          <p className="font-semibold text-[11px] text-amber-200">{syncInfo.errorMessage}</p>
                          <p className="text-[10px] text-slate-400">I tuoi progressi sono protetti in locale e verranno riallineati automaticamente.</p>
                        </div>
                      </div>
                    )}

                    {/* Account Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-[#080c0a] p-3 rounded-xl border border-white/[0.04] space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Email Ufficiale</span>
                        <strong className="text-white text-xs block truncate">{authUser.email}</strong>
                      </div>

                      <div className="bg-[#080c0a] p-3 rounded-xl border border-white/[0.04] space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Username Community</span>
                        <strong className="text-emerald-300 text-xs block">{profile.username}</strong>
                      </div>

                      <div className="bg-[#080c0a] p-3 rounded-xl border border-white/[0.04] space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Nome Reale</span>
                        <strong className="text-slate-200 text-xs block">{profile.realName || 'Non impostato'}</strong>
                      </div>

                      <div className="bg-[#080c0a] p-3 rounded-xl border border-white/[0.04] space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center justify-between">
                          <span>User ID Univoco Cloud</span>
                          <button 
                            onClick={handleCopyUserId} 
                            className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                            title="Copia User ID"
                          >
                            {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span className="text-[9px]">{copiedId ? 'Copiato' : 'Copia'}</span>
                          </button>
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 block truncate">{authUser.id}</span>
                      </div>
                    </div>

                    {/* Balance Status in Cloud */}
                    <div className="p-3 bg-[#080c0a] rounded-xl border border-white/[0.06] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Saldo Verificato Cloud</span>
                        <span className="text-lg font-mono font-black text-[#d4af37]">{profile.sdrogoPoints.toLocaleString()} PTS</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Cannucce Donate</span>
                        <span className="text-sm font-mono font-bold text-red-400">🥤 {profile.totalCannucceDonated}</span>
                      </div>
                    </div>

                    {/* Disconnect Action */}
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Vuoi usare l'app in locale senza salvare su cloud?
                      </span>
                      <button
                        onClick={handleSignOut}
                        disabled={authLoading}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Disconnetti (Modalità Ospite)</span>
                      </button>
                    </div>

                  </div>

                </div>
              ) : (
                /* Case 2: Utente Non Autenticato (Modalità Ospite) */
                <div className="space-y-4">
                  
                  {/* Advantages Header Card */}
                  <div className="p-4 rounded-2xl bg-[#0d1612] border border-[#d4af37]/25 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-white font-bold font-heading">
                        <Cloud className="w-4 h-4 text-[#d4af37]" />
                        <span>Perché creare un Account Cloud Melagoodo?</span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider w-fit">
                        ✓ Gratuito al 100% per sempre
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-300">
                      <div className="flex items-start gap-1.5 bg-[#080e0a] p-2.5 rounded-xl border border-white/[0.04]">
                        <span className="text-[#d4af37] shrink-0">☁️</span>
                        <span><strong>Cloud Sync:</strong> Crediti, schedine e donazioni sincronizzati su qualsiasi browser e dispositivo.</span>
                      </div>
                      <div className="flex items-start gap-1.5 bg-[#080e0a] p-2.5 rounded-xl border border-white/[0.04]">
                        <span className="text-emerald-400 shrink-0">🏆</span>
                        <span><strong>Classifiche Live:</strong> Partecipa alle leaderboard reali della community Melagoodo.</span>
                      </div>
                      <div className="flex items-start gap-1.5 bg-[#080e0a] p-2.5 rounded-xl border border-white/[0.04]">
                        <span className="text-amber-400 shrink-0">🎁</span>
                        <span><strong>Bonus Iscrizione:</strong> +1.000 SdrogoPoints gratuiti accreditati all'istante.</span>
                      </div>
                    </div>
                  </div>

                  {/* Mode Switcher */}
                  <div className="flex p-1 bg-[#0c120f] rounded-xl border border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setAuthMode('login');
                        setAuthError(null);
                        setAuthSuccessMessage(null);
                      }}
                      className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        authMode === 'login'
                          ? 'bg-[#18241e] text-white shadow-sm border border-white/[0.12]'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <LogIn className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>Accedi (Account Esistente)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setAuthMode('signup');
                        setAuthError(null);
                        setAuthSuccessMessage(null);
                      }}
                      className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        authMode === 'signup'
                          ? 'bg-[#18241e] text-white shadow-sm border border-white/[0.12]'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Crea Account (+1.000 PTS)</span>
                    </button>
                  </div>

                  {/* Feedback Messages */}
                  {authError && (
                    <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-start gap-2 text-xs animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{authError}</span>
                    </div>
                  )}

                  {authSuccessMessage && (
                    <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-start gap-2 text-xs animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{authSuccessMessage}</span>
                    </div>
                  )}

                  {/* LOGIN FORM */}
                  {authMode === 'login' && (
                    <form onSubmit={handleLogin} className="space-y-3 p-4 bg-[#0c120f] rounded-2xl border border-white/[0.06]">
                      <div>
                        <label className="text-[11px] text-slate-300 font-semibold mb-1 block">Email</label>
                        <div className="relative">
                          <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="es. nome@dominio.it"
                            className="w-full bg-[#080c0a] border border-white/[0.1] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-300 font-semibold mb-1 block">Password</label>
                        <div className="relative">
                          <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                          <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-[#080c0a] border border-white/[0.1] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full py-2.5 rounded-xl bg-[#d4af37] hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2 shadow-lg"
                      >
                        {authLoading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Accesso in corso...</span>
                          </>
                        ) : (
                          <>
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Accedi al Profilo Cloud</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* SIGNUP FORM */}
                  {authMode === 'signup' && (
                    <form onSubmit={handleSignUp} className="space-y-3 p-4 bg-[#0c120f] rounded-2xl border border-white/[0.06]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                            Username Community <span className="text-[#d4af37]">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="es. Er Sdrogo"
                            className="w-full bg-[#080c0a] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-300 font-semibold mb-1 block">Nome Reale (opzionale)</label>
                          <input
                            type="text"
                            value={realName}
                            onChange={(e) => setRealName(e.target.value)}
                            placeholder="es. Massimiliano Ciconte"
                            className="w-full bg-[#080c0a] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                          Email <span className="text-[#d4af37]">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="es. melagoodo@community.it"
                            className="w-full bg-[#080c0a] border border-white/[0.1] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                          Password (minimo 6 caratteri) <span className="text-[#d4af37]">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                          <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-[#080c0a] border border-white/[0.1] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2 shadow-lg"
                      >
                        {authLoading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Creazione account in corso...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Crea Account Community (+1.000 PTS)</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}

                </div>
              )}

            </div>
          )}

          {/* TAB: WATCHED */}
          {activeTab === 'watched' && (
            <div className="space-y-3 animate-in fade-in min-h-[380px]">
              <div className="text-xs text-slate-400 flex justify-between items-center">
                <span>Episodi con visione verificata: <strong>{watchedMatchesList.length}</strong></span>
                <span className="font-mono text-emerald-400">+50 PTS ciascuno</span>
              </div>

              {watchedMatchesList.length > 0 ? (
                <div className="divide-y divide-white/[0.04] bg-[#0c120f] rounded-xl border border-white/[0.06] max-h-80 overflow-y-auto">
                  {watchedMatchesList.map((m) => (
                    <div key={m.id} className="p-3 flex items-center justify-between text-xs hover:bg-white/[0.02]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500 font-bold">#{m.id}</span>
                        <span className="font-semibold text-white truncate max-w-[280px] sm:max-w-md">{m.title}</span>
                      </div>
                      <span className="text-emerald-400 text-[11px] font-mono font-bold shrink-0">Completato (+50 PTS) ✓</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 bg-[#0c120f] rounded-xl flex flex-col items-center justify-center min-h-[220px]">
                  <p>Nessun episodio ancora completato.</p>
                  <p className="text-[11px] mt-1 text-slate-400">Guarda almeno {REQUIRED_WATCH_SECONDS} secondi di un video per sbloccare la ricompensa!</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: DONATIONS */}
          {activeTab === 'donations' && (
            <div className="space-y-4 animate-in fade-in min-h-[380px]">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Totale donato: <strong className="text-white">🥤 {profile.totalCannucceDonated} Cannucce Bianche</strong></span>
                {onOpenDonation && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenDonation();
                    }}
                    className="px-3 py-1 rounded-lg bg-[#ef4444] text-white font-bold text-xs hover:bg-red-600 transition-colors cursor-pointer"
                  >
                    Effettua Nuova Donazione
                  </button>
                )}
              </div>

              {profile.donationsHistory.length > 0 ? (
                <div className="divide-y divide-white/[0.04] bg-[#0c120f] rounded-xl border border-white/[0.06] max-h-80 overflow-y-auto">
                  {profile.donationsHistory.map((don) => (
                    <div key={don.id} className="p-3 flex items-center justify-between text-xs hover:bg-white/[0.02]">
                      <div>
                        <strong className="text-white block">{don.donorName}</strong>
                        <span className="text-[10px] text-[#d4af37] font-medium">{don.tierTitle}</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-xs font-bold text-[#ef4444]">🥤 {don.cannucceAmount}</span>
                        <span className="text-[9px] text-slate-500 block">
                          {new Date(don.donatedAt).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 bg-[#0c120f] rounded-xl space-y-2 flex flex-col items-center justify-center min-h-[220px]">
                  <p>Non hai ancora effettuato donazioni virtuali al Progetto Gabbiness.</p>
                  {onOpenDonation && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenDonation();
                      }}
                      className="px-4 py-2 rounded-xl bg-[#ef4444] text-white font-bold text-xs hover:bg-red-600 transition-colors cursor-pointer"
                    >
                      Dona subito Cannucce Bianche a GaBBo
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: CARD */}
          {activeTab === 'card' && (
            <div className="space-y-4 animate-in fade-in text-center min-h-[380px] flex flex-col justify-center">
              {profile.savedGaYCard ? (
                <div className="premium-card p-6 rounded-2xl border border-[#d4af37]/30 space-y-3 max-w-md mx-auto w-full">
                  <div className="text-base font-bold font-heading text-white">
                    GaY Card di {profile.savedGaYCard.name} {profile.savedGaYCard.surname}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    ID: {profile.savedGaYCard.cardNumber} • Ruolo: {profile.savedGaYCard.customTitle}
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenGayCard();
                      }}
                      className="px-4 py-2 rounded-xl bg-white text-slate-950 font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      Apri Card Interattiva 3D
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center space-y-3 bg-[#0c120f] rounded-2xl max-w-md mx-auto w-full">
                  <div className="text-3xl">🎴</div>
                  <div className="text-sm font-bold text-white">Nessuna GaY Card ancora salvata</div>
                  <p className="text-xs text-slate-400">Personalizza la tua tessera con nome e titolo ufficiale Melagoodo.</p>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenGayCard();
                    }}
                    className="px-4 py-2 rounded-xl bg-[#d4af37] text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors cursor-pointer"
                  >
                    Crea Ora la Tua GaY Card
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: BETS */}
          {activeTab === 'bets' && (
            <div className="space-y-3 animate-in fade-in min-h-[380px]">
              <div className="text-xs text-slate-400">
                Storico schedine giocate per le Golfatine.
              </div>

              {activeBet ? (
                <div className="p-4 bg-[#0c120f] rounded-xl border border-white/[0.08] text-xs text-slate-300 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-white/[0.06]">
                    <div>
                      <span className="font-bold text-white block">Golfatina #{UPCOMING_MATCH_FORECAST.matchNumber} (Previsioni State-of-the-Art)</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Giocata il {new Date(activeBet.placedAt).toLocaleDateString('it-IT')} ore {new Date(activeBet.placedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30">
                      SCHEDINA ATTIVA
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="bg-[#080c0a] p-2 rounded border border-white/[0.04]">
                      <span className="text-[9px] text-slate-500 uppercase block">1. Vincitore</span>
                      <strong className="text-white">{activeBet.winnerPick}</strong>
                    </div>
                    <div className="bg-[#080c0a] p-2 rounded border border-white/[0.04]">
                      <span className="text-[9px] text-slate-500 uppercase block">2. Re Hole-in-One</span>
                      <strong className="text-emerald-300">{activeBet.hioKingPick}</strong>
                    </div>
                    <div className="bg-[#080c0a] p-2 rounded border border-white/[0.04]">
                      <span className="text-[9px] text-slate-500 uppercase block">3. Asino / Tilt</span>
                      <strong className="text-rose-300">{activeBet.asinoPick}</strong>
                    </div>
                    <div className="bg-[#080c0a] p-2 rounded border border-white/[0.04]">
                      <span className="text-[9px] text-slate-500 uppercase block">4. Score Previsto</span>
                      <strong className="text-purple-300">{activeBet.scoreRangePick}</strong>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-white/[0.06] text-xs">
                    <span className="text-slate-400">Puntata Scommessa:</span>
                    <strong className="text-[#d4af37] font-mono font-bold text-sm">
                      {activeBet.stakedPoints.toLocaleString()} SdrogoPoints
                    </strong>
                  </div>

                  {onNavigateToForecast && (
                    <div className="pt-2 text-right">
                      <button
                        onClick={() => {
                          onClose();
                          onNavigateToForecast();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                      >
                        Modifica Schedina
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 bg-[#0c120f] rounded-xl space-y-2 flex flex-col items-center justify-center min-h-[220px]">
                  <p>Non hai ancora piazzato nessuna schedina per la Golfatina #{UPCOMING_MATCH_FORECAST.matchNumber}.</p>
                  {onNavigateToForecast && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToForecast();
                      }}
                      className="px-4 py-2 rounded-xl bg-[#d4af37] text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors cursor-pointer"
                    >
                      Gioca subito la Schedina Sdrogo
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
