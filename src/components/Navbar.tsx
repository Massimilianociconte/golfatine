import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  Flame, 
  Sparkles, 
  Search, 
  Volume2, 
  VolumeX, 
  Menu, 
  X,
  CreditCard,
  User,
  Radio,
  Swords,
  TrendingUp,
  Brain,
  Award,
  Users,
  Dices,
  ChevronDown,
  Heart,
  Skull
} from 'lucide-react';
import { MelagoodoLogo } from './MelagoodoLogo';
import { sound } from '../utils/audio';
import { GLOBAL_SUMMARY } from '../data/golfatineData';
import { 
  getLocalUserProfile, 
  subscribeToBalanceUpdates,
  subscribeToSyncStatus,
  getSyncStatus,
  SyncStatusInfo,
  DEFAULT_PROFILE 
} from '../utils/userStore';
import { smoothScrollTo } from '../utils/scrollHelper';

export type TabType = 
  | 'golfatine' 
  | 'superpowers' 
  | 'forecast' 
  | 'amongus'
  | 'leaderboard' 
  | 'players' 
  | 'h2h' 
  | 'roulette' 
  | 'soundboard';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType, targetSelector?: string) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  onOpenGayCard: () => void;
  onOpenProfile: () => void;
  onOpenDonation?: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onOpenGayCard,
  onOpenProfile,
  onOpenDonation,
  soundEnabled,
  setSoundEnabled,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [userPoints, setUserPoints] = useState<number>(() => getLocalUserProfile().sdrogoPoints);
  const [syncInfo, setSyncInfo] = useState<SyncStatusInfo>(() => getSyncStatus());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time balance and sync status updates across components & tabs
  useEffect(() => {
    const unsubBalance = subscribeToBalanceUpdates((newPoints: number) => {
      setUserPoints(newPoints);
    });
    const unsubSync = subscribeToSyncStatus((newSync: SyncStatusInfo) => {
      setSyncInfo(newSync);
    });
    return () => {
      unsubBalance();
      unsubSync();
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMoreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    sound.setEnabled(newState);
    if (newState) sound.playClick();
  };

  const handleTabClick = (tab: TabType) => {
    sound.playClick();
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setMoreDropdownOpen(false);

    if (tab === 'golfatine') {
      smoothScrollTo('#matches-archive-section', { duration: 680, offset: 25 });
    } else {
      smoothScrollTo('#main-tab-content', { duration: 680, offset: 20 });
    }
  };

  const primaryNavItems = [
    { id: 'golfatine' as TabType, label: 'Video', icon: Flame },
    { id: 'superpowers' as TabType, label: 'Superpoteri', icon: Sparkles },
    { id: 'forecast' as TabType, label: 'Previsioni & Bet', icon: Brain, badge: 'PRO' },
    { id: 'amongus' as TabType, label: 'Among Us', icon: Skull, badge: 'VOTA' },
    { id: 'leaderboard' as TabType, label: 'Albo d\'Oro', icon: Trophy },
    { id: 'players' as TabType, label: 'Roster', icon: Users },
  ];

  const secondaryNavItems = [
    { id: 'h2h' as TabType, label: '1v1 Arena', icon: Swords },
    { id: 'roulette' as TabType, label: 'Roulette', icon: Dices },
    { id: 'soundboard' as TabType, label: 'Audio Meme', icon: Radio, badge: 'WIP' },
  ];

  const allNavItems = [...primaryNavItems, ...secondaryNavItems];
  const isSecondaryActive = secondaryNavItems.some(i => i.id === activeTab);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#050806]/90 backdrop-blur-xl max-w-full overflow-x-clip pt-[env(safe-area-inset-top,0px)] shadow-[0_8px_30px_rgba(0,0,0,0.55)]">
      
      {/* Top Broadcast Telemetry Ticker Bar */}
      <div className="border-b border-white/[0.05] bg-gradient-to-r from-[#040705] via-[#070d0a] to-[#040705] w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1.5 text-[11px] text-slate-400 flex items-center justify-between min-w-0">
          <div className="flex items-center gap-2.5 sm:gap-3.5 font-medium min-w-0 truncate">
            <div className="flex items-center gap-1.5 text-slate-200 shrink-0 px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse shrink-0" />
              <span className="tracking-widest uppercase font-mono font-bold text-[9px] sm:text-[10px] text-slate-200 truncate">
                MELAGOODO • TELEMETRIA UFFICIALE
              </span>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 text-slate-400 font-mono shrink-0">
              <strong className="text-white font-bold">{GLOBAL_SUMMARY.totalVideos}</strong>
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Episodi</span>
            </span>
            <span className="text-white/10 hidden md:inline">•</span>
            <span className="hidden md:inline-flex items-center gap-1 text-slate-400 font-mono shrink-0">
              <strong className="text-white font-bold">{GLOBAL_SUMMARY.totalMatches}</strong>
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Scorecard</span>
            </span>
            <span className="text-white/10 hidden md:inline">•</span>
            <span className="hidden md:inline-flex items-center gap-1 text-slate-400 font-mono shrink-0">
              <strong className="text-[#d4af37] font-bold">{GLOBAL_SUMMARY.totalHIOs}</strong>
              <span className="text-[10px] uppercase tracking-wider text-[#d4af37]/80">Hole-in-One</span>
            </span>
            <span className="text-white/10 hidden lg:inline">•</span>
            <span className="hidden lg:inline-flex items-center gap-1 text-slate-400 font-mono shrink-0">
              <strong className="text-emerald-400 font-bold">{GLOBAL_SUMMARY.totalHolesPlayed.toLocaleString('it-IT')}</strong>
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Buche Analizzate</span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2 font-mono text-[9px] sm:text-[10px]">
            <button
              onClick={() => handleTabClick('forecast')}
              className="text-[#f5e6b3] hover:text-white flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/25 transition-colors cursor-pointer"
            >
              <Brain className="w-3 h-3 text-[#d4af37] shrink-0" />
              <span className="hidden xs:inline">TimesFM-3.0</span>
              <span className="text-[#d4af37] font-bold">LIVE</span>
            </button>
            <span className="text-white/15 hidden sm:inline">|</span>
            <a
              href="https://www.webnovis.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-[#d4af37] transition-colors hidden sm:inline font-semibold"
            >
              by WebNovis
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-15 sm:h-17 gap-2 sm:gap-3 min-w-0">
          
          {/* Brand Logo - Responsive */}
          <div 
            onClick={() => {
              sound.playClick();
              setActiveTab('golfatine');
              smoothScrollTo(0, { duration: 650 });
            }}
            className="flex items-center gap-3 cursor-pointer group select-none min-w-0 shrink"
          >
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-[#d4af37]/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <MelagoodoLogo className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 relative z-10" size={38} />
            </div>

            <div className="min-w-0 truncate">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs sm:text-sm md:text-base font-black tracking-tight font-heading text-white group-hover:text-[#f5e6b3] transition-colors truncate">
                  LO SDROGO GOLFOMETRO
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-md text-[8px] font-mono font-bold uppercase tracking-widest gold-badge shrink-0">
                  Melagoodo
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-none hidden sm:block truncate mt-0.5">
                Archivio Analitico & Esports Telemetry Hub
              </p>
            </div>
          </div>

          {/* Desktop Nav Links (Responsive Layout: 6 primary + Dropdown on XL, Full 9 on 2XL) */}
          <nav
            aria-label="Navigazione principale"
            className="hidden xl:flex items-center gap-1 bg-[#080d0a]/95 p-1.5 rounded-2xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] shrink-0"
          >
            {/* Primary Nav Items */}
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-b from-[#1a2820] to-[#111a15] text-white shadow-[0_2px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(212,175,55,0.3)] border border-[#d4af37]/35'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.035] border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-[#d4af37]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`hidden 2xl:inline-block px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase ${
                      item.id === 'amongus'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/35'
                        : 'bg-[#d4af37]/15 text-[#f5e6b3] border border-[#d4af37]/30'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Extra items visible on 2XL screens */}
            <div className="hidden 2xl:flex items-center gap-1 border-l border-white/[0.07] pl-1 ml-0.5">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-gradient-to-b from-[#1a2820] to-[#111a15] text-white shadow-[0_2px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(212,175,55,0.3)] border border-[#d4af37]/35'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.035] border border-transparent'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#d4af37]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* "Altro ▾" Dropdown for XL screens (1280px-1535px) */}
            <div className="relative 2xl:hidden" ref={dropdownRef}>
              <button
                onClick={() => {
                  sound.playClick();
                  setMoreDropdownOpen(!moreDropdownOpen);
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isSecondaryActive
                    ? 'bg-gradient-to-b from-[#1a2820] to-[#111a15] text-[#f5e6b3] border border-[#d4af37]/35 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.035] border border-transparent'
                }`}
              >
                <span>{isSecondaryActive ? secondaryNavItems.find(i => i.id === activeTab)?.label : 'Altro'}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${moreDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {moreDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-44 glass-panel rounded-2xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                  {secondaryNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabClick(item.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer text-left ${
                          isActive
                            ? 'bg-[#16221b] text-white font-bold'
                            : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#d4af37]' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right Action Tools - Guaranteed Mobile-First & Contained */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* GaY Card 3D Trigger */}
            <button
              onClick={() => {
                sound.playClick();
                onOpenGayCard();
              }}
              className="hidden sm:flex px-3.5 py-2 rounded-xl gold-badge hover:brightness-110 text-xs font-bold items-center gap-1.5 transition-all cursor-pointer shrink-0 min-h-[42px] shadow-sm active:scale-98"
              title="Apri GaY Card 3D Meme"
            >
              <CreditCard className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>GaY Card 3D</span>
            </button>

            {/* User Profile Button - Compact on Mobile */}
            <button
              onClick={() => {
                sound.playClick();
                onOpenProfile();
              }}
              className="px-2.5 sm:px-3.5 py-2 rounded-xl bg-[#0d1511] hover:bg-[#14201a] border border-white/[0.09] hover:border-white/[0.16] text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 min-h-[42px] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
              title={`Profilo Utente Community • Stato: ${
                syncInfo.status === 'synced' 
                  ? 'Cloud Verificato (Melagoodo Cloud)' 
                  : syncInfo.status === 'local' 
                  ? 'Ospite (Locale)' 
                  : syncInfo.status === 'syncing' 
                  ? 'Sincronizzazione in corso...' 
                  : syncInfo.status === 'offline' 
                  ? 'Offline (Dati protetti in locale)' 
                  : syncInfo.status === 'error'
                  ? `Attenzione: ${syncInfo.errorMessage || 'Errore Cloud'} (Dati protetti in locale)`
                  : `In attesa di sync (${syncInfo.pendingActionsCount} pendenti)`
              }`}
            >
              <User className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
              <span className="font-mono text-[11px] font-bold text-white whitespace-nowrap">{userPoints.toLocaleString()} PTS</span>
              <span 
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  syncInfo.status === 'synced' 
                    ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' 
                    : syncInfo.status === 'local' 
                    ? 'bg-sky-400' 
                    : syncInfo.status === 'syncing' 
                    ? 'bg-amber-400 animate-pulse' 
                    : syncInfo.status === 'offline' 
                    ? 'bg-amber-400' 
                    : syncInfo.status === 'error'
                    ? 'bg-rose-500 animate-ping'
                    : 'bg-amber-400'
                }`}
                title={
                  syncInfo.status === 'synced' 
                    ? 'Cloud Verificato' 
                    : syncInfo.status === 'local' 
                    ? 'Ospite (Locale)' 
                    : syncInfo.status === 'offline' 
                    ? 'Offline: Salvataggio locale attivo' 
                    : syncInfo.status === 'error'
                    ? 'Errore Cloud: Dati protetti in locale'
                    : 'Sincronizzazione in corso'
                }
              />
            </button>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? "Effetti sonori attivi" : "Effetti sonori mutati"}
              className={`hidden sm:flex p-2.5 rounded-xl text-xs font-medium items-center gap-1 transition-all border cursor-pointer shrink-0 min-h-[42px] min-w-[42px] justify-center ${
                soundEnabled 
                  ? 'bg-[#0d1511] text-slate-200 border-white/[0.09] hover:border-white/[0.2] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                  : 'bg-transparent text-slate-500 border-white/[0.04] hover:text-slate-300'
              }`}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-[#d4af37]" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {/* Mobile / Tablet Menu Trigger */}
            <button
              onClick={() => {
                sound.playClick();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              className="p-2.5 xl:hidden rounded-xl bg-[#0d1511] hover:bg-[#14201a] border border-white/[0.12] text-slate-200 hover:text-white transition-colors cursor-pointer shrink-0 min-h-[42px] min-w-[42px] flex items-center justify-center shadow-sm active:scale-95"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[#d4af37]" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-white/[0.08] bg-[#060a08]/98 backdrop-blur-2xl px-4 py-4 space-y-3 animate-in fade-in duration-150 shadow-2xl max-w-full pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
          
          {/* User Account / Cloud Status on Mobile */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b120e] border border-white/[0.07] text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                syncInfo.status === 'synced'
                  ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                  : syncInfo.status === 'local'
                  ? 'bg-sky-400'
                  : syncInfo.status === 'syncing'
                  ? 'bg-amber-400 animate-ping'
                  : syncInfo.status === 'offline'
                  ? 'bg-rose-400'
                  : 'bg-amber-400'
              }`} />
              <span className="text-slate-300 font-medium">
                {syncInfo.status === 'synced'
                  ? 'Cloud Verificato'
                  : syncInfo.status === 'local'
                  ? 'Ospite (Locale)'
                  : syncInfo.status === 'syncing'
                  ? 'Sincronizzazione...'
                  : 'Offline'}
              </span>
              <span className="font-mono text-[#d4af37] font-bold">
                {userPoints.toLocaleString()} PTS
              </span>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                setMobileMenuOpen(false);
                onOpenProfile();
              }}
              className="text-[#d4af37] hover:text-amber-300 font-bold text-xs cursor-pointer flex items-center gap-1"
            >
              <span>Profilo</span>
              <span>→</span>
            </button>
          </div>

          {/* Quick Action Tiles on Mobile */}
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-white/[0.06]">
            <button
              onClick={() => {
                sound.playClick();
                setMobileMenuOpen(false);
                onOpenGayCard();
              }}
              className="flex items-center justify-center gap-2 p-3 rounded-xl gold-badge font-bold text-xs cursor-pointer active:scale-98 transition-all min-h-[44px]"
            >
              <CreditCard className="w-4 h-4 text-[#d4af37] shrink-0" />
              <span>GaY Card 3D</span>
            </button>

            <button
              onClick={() => {
                toggleSound();
              }}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#0d1511] border border-white/[0.08] text-slate-200 font-semibold text-xs cursor-pointer active:scale-98 transition-all min-h-[44px]"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-[#d4af37] shrink-0" />
                  <span>Audio: ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Audio: OFF</span>
                </>
              )}
            </button>
          </div>

          {/* Navigation Links Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center justify-between gap-2 p-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer min-h-[44px] ${
                    isActive
                      ? 'bg-gradient-to-b from-[#1a2820] to-[#111a15] text-white border-[#d4af37]/40 shadow-sm'
                      : 'bg-[#090e0b] text-slate-300 border-white/[0.06] hover:bg-[#111a15]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#d4af37]' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

    </header>
  );
};
