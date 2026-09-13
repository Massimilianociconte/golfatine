import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Navbar, TabType } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { GolfatineGrid } from './components/GolfatineGrid';
import { GabbinessMarqueeSection } from './components/GabbinessMarqueeSection';
import { Footer } from './components/Footer';
import { GolfatinaMatch, MATCHES_DATA } from './data/golfatineData';
import { sound } from './utils/audio';
import { HeroGayCardWidget } from './components/HeroGayCardWidget';
import { smoothScrollTo } from './utils/scrollHelper';

// Lazy loaded heavy tab views and modals for optimal Core Web Vitals
const SuperpowersView = lazy(() => import('./components/SuperpowersView').then(m => ({ default: m.SuperpowersView })));
const PredictionsAndBetView = lazy(() => import('./components/PredictionsAndBetView').then(m => ({ default: m.PredictionsAndBetView })));
const AmongUsView = lazy(() => import('./components/AmongUsView').then(m => ({ default: m.AmongUsView })));
const LeaderboardView = lazy(() => import('./components/LeaderboardView').then(m => ({ default: m.LeaderboardView })));
const PlayerProfilesView = lazy(() => import('./components/PlayerProfilesView').then(m => ({ default: m.PlayerProfilesView })));
const HeadToHeadView = lazy(() => import('./components/HeadToHeadView').then(m => ({ default: m.HeadToHeadView })));
const RouletteView = lazy(() => import('./components/RouletteView').then(m => ({ default: m.RouletteView })));
const SoundboardView = lazy(() => import('./components/SoundboardView').then(m => ({ default: m.SoundboardView })));
const MatchModal = lazy(() => import('./components/MatchModal').then(m => ({ default: m.MatchModal })));
const SocialShareModal = lazy(() => import('./components/SocialShareModal').then(m => ({ default: m.SocialShareModal })));
const GayCardModal = lazy(() => import('./components/GayCardModal').then(m => ({ default: m.GayCardModal })));
const UserProfileModal = lazy(() => import('./components/UserProfileModal').then(m => ({ default: m.UserProfileModal })));
const GabbinessDonationModal = lazy(() => import('./components/GabbinessDonationModal').then(m => ({ default: m.GabbinessDonationModal })));

const VALID_TABS: TabType[] = [
  'golfatine',
  'superpowers',
  'forecast',
  'amongus',
  'leaderboard',
  'players',
  'h2h',
  'roulette',
  'soundboard'
];

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window === 'undefined') return 'golfatine';
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash && VALID_TABS.includes(hash as TabType)) return hash as TabType;
    const params = new URLSearchParams(window.location.search);
    const playerParam = params.get('player');
    if (playerParam) return 'players';
    const tabParam = params.get('tab');
    if (tabParam && VALID_TABS.includes(tabParam as TabType)) return tabParam as TabType;
    return 'golfatine';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  // Publisher channel filter (exact match on video uploader, never on title)
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  
  // Modals state
  const [selectedMatch, setSelectedMatch] = useState<GolfatinaMatch | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const matchParam = params.get('match');
    if (matchParam) {
      return MATCHES_DATA.find((m) => m.id === Number(matchParam) || String(m.id) === matchParam) || null;
    }
    return null;
  });
  const [selectedMatchView, setSelectedMatchView] = useState<'scorecard' | 'video' | 'graph'>('scorecard');
  const [shareMatch, setShareMatch] = useState<GolfatinaMatch | null>(null);
  const [isGayCardOpen, setIsGayCardOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isDonationOpen, setIsDonationOpen] = useState<boolean>(false);

  // Player / H2H navigation
  const [selectedPlayerName, setSelectedPlayerName] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('player');
  });
  const [h2hP1, setH2hP1] = useState<string>('Just Rohn');
  const [h2hP2, setH2hP2] = useState<string>('Delux');

  useEffect(() => {
    const hasOpenOverlay = Boolean(selectedMatch || shareMatch || isGayCardOpen || isProfileOpen || isDonationOpen);
    if (!hasOpenOverlay) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedMatch, shareMatch, isGayCardOpen, isProfileOpen, isDonationOpen]);

  // Deep linking: read query parameters and hash on mount, popstate & hashchange
  useEffect(() => {
    const syncFromUrl = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const matchParam = params.get('match');
      const tabParam = params.get('tab');
      const playerParam = params.get('player');

      if (matchParam) {
        const foundMatch = MATCHES_DATA.find(
          (m) => m.id === Number(matchParam) || String(m.id) === matchParam
        );
        if (foundMatch) {
          setSelectedMatch(foundMatch);
        }
      }

      if (playerParam) {
        setSelectedPlayerName(playerParam);
        setActiveTab('players');
      } else if (hash && VALID_TABS.includes(hash as TabType)) {
        setActiveTab(hash as TabType);
      } else if (tabParam && VALID_TABS.includes(tabParam as TabType)) {
        setActiveTab(tabParam as TabType);
      }
    };

    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    window.addEventListener('hashchange', syncFromUrl);
    return () => {
      window.removeEventListener('popstate', syncFromUrl);
      window.removeEventListener('hashchange', syncFromUrl);
    };
  }, []);

  // Synchronize URL query parameters with state cleanly
  useEffect(() => {
    const url = new URL(window.location.href);
    const params = new URLSearchParams();

    if (selectedMatch) {
      params.set('match', selectedMatch.id.toString());
    }

    if (activeTab !== 'golfatine') {
      params.set('tab', activeTab);
    }

    if (activeTab === 'players' && selectedPlayerName) {
      params.set('player', selectedPlayerName);
    }

    const queryString = params.toString();
    const newSearch = queryString ? `?${queryString}` : '';
    const newUrl = `${url.pathname}${newSearch}${url.hash}`;

    if (window.location.pathname + window.location.search + window.location.hash !== newUrl) {
      window.history.replaceState(null, '', newUrl);
    }

    // Per-tab document title (neutral labels, community copy untouched)
    const TAB_TITLES: Record<string, string> = {
      golfatine: "L'Archivio Ufficiale delle Golfatine di Melagoodo",
      superpowers: 'Superpoteri',
      forecast: 'Previsioni & Bet',
      amongus: 'Golfatina Gate',
      leaderboard: "Albo d'Oro",
      players: 'Giocatori',
      h2h: 'Head to Head',
      roulette: 'Sdrogo Roulette',
      soundboard: 'Soundboard',
    };
    const section = TAB_TITLES[activeTab] ?? TAB_TITLES.golfatine;
    document.title = activeTab === 'golfatine'
      ? `Lo Sdrogo Golfometro | ${section}`
      : `${section} | Lo Sdrogo Golfometro`;
  }, [activeTab, selectedMatch, selectedPlayerName]);

  // NOTE: no idle preload of lazy tab modules — they load on demand via
  // Suspense. Preloading all chunks on idle defeated code-splitting and
  // inflated the critical network chain (PageSpeed: 756ms max path).

  // Deferred auth sync: keeps @supabase/supabase-js out of the critical
  // path; session restore + listener attach on browser idle.
  useEffect(() => {
    const start = () => {
      import('./utils/userStore').then(({ initAuthSync }) => initAuthSync());
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const ric = (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
      const id = ric(start, { timeout: 2500 });
      return () => (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback?.(id);
    }
    const t = setTimeout(start, 2500);
    return () => clearTimeout(t);
  }, []);

  const handleNavigate = useCallback((tab: TabType, targetSelector?: string) => {
    sound.playClick();
    setSelectedMatch(null);
    setSelectedMatchView('scorecard');
    setShareMatch(null);
    setIsGayCardOpen(false);
    setIsProfileOpen(false);
    setIsDonationOpen(false);
    setActiveTab(tab);
    const target = targetSelector || (tab === 'golfatine' ? '#matches-archive-section' : '#main-tab-content');
    smoothScrollTo(target, { duration: 680, offset: 25 });
  }, []);

  const handleSelectPlayer = useCallback((playerName: string | null) => {
    sound.playClick();
    setSelectedPlayerName(playerName);
    setActiveTab('players');
    if (playerName) {
      smoothScrollTo('#players', { duration: 680, offset: 25 });
    }
  }, []);

  const handleSelectChannel = useCallback((channel: string) => {
    sound.playClick();
    setSelectedMatch(null);
    setSelectedMatchView('scorecard');
    setChannelFilter(channel);
    setActiveTab('golfatine');
    smoothScrollTo('#matches-archive-section', { duration: 680, offset: 25 });
  }, []);

  const handleStartH2HWith = useCallback((playerName: string) => {
    sound.playClick();
    setH2hP1(playerName);
    setH2hP2(playerName === 'Just Rohn' ? 'Delux' : 'Just Rohn');
    setSelectedPlayerName(null);
    setActiveTab('h2h');
    smoothScrollTo('#h2h', { duration: 680, offset: 25 });
  }, []);

  const TabLoadingFallback = () => (
    <div className="py-24 flex flex-col items-center justify-center space-y-3 min-h-[300px]">
      <div className="w-8 h-8 rounded-full border-2 border-[#d4af37] border-t-transparent animate-spin" />
      <span className="text-xs font-mono text-slate-400">Caricamento modulo in corso...</span>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#070b09] text-slate-100 font-sans selection:bg-[#d4af37] selection:text-black">
      
      {/* Sticky Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        searchQuery={searchQuery}
        setSearchQuery={(q: string) => {
          setSearchQuery(q);
          if (activeTab !== 'golfatine' && q.trim()) {
            handleNavigate('golfatine');
          }
        }}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onOpenGayCard={() => setIsGayCardOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Hero Banner Section (with integrated Desktop 3D GaY Card) */}
      <HeroSection
        onNavigate={handleNavigate}
        onOpenGayCard={() => setIsGayCardOpen(true)}
      />

      {/* Floating GaY Card Section on Mobile (Directly below Hero, highly polished, no popup) */}
      <div className="lg:hidden max-w-7xl mx-auto px-4 sm:px-6 w-full -mt-2 mb-4">
        <HeroGayCardWidget 
          onOpenModal={() => setIsGayCardOpen(true)}
          isMobileSection={true}
        />
      </div>

      {/* Main Tab Content */}
      <main id="main-tab-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        
        {/* Dynamic Continuous Marquee Section: Sostieni il Progetto Gabbiness */}
        <GabbinessMarqueeSection
          onOpenDonation={() => setIsDonationOpen(true)}
        />

        {activeTab === 'golfatine' && (
          <section id="matches-archive-section" aria-label="Archivio Golfatine">
            <GolfatineGrid
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              channelFilter={channelFilter}
              setChannelFilter={setChannelFilter}
              onOpenModal={(m, initialView) => {
                setSelectedMatch(m);
                setSelectedMatchView(initialView || 'scorecard');
              }}
              onSelectPlayer={handleSelectPlayer}
              onSelectChannel={handleSelectChannel}
              onOpenShare={(m) => setShareMatch(m)}
            />
          </section>
        )}

        <Suspense fallback={<TabLoadingFallback />}>
          {activeTab === 'superpowers' && (
            <section id="superpowers" aria-label="Superpoteri">
              <SuperpowersView
                onOpenMatchModal={(m: GolfatinaMatch) => {
                  setSelectedMatch(m);
                  setSelectedMatchView('scorecard');
                }}
              />
            </section>
          )}

          {activeTab === 'forecast' && (
            <section id="forecast" aria-label="Previsioni AI e Pronostici">
              <PredictionsAndBetView />
            </section>
          )}

          {activeTab === 'amongus' && (
            <section id="amongus" aria-label="Among Us Community">
              <AmongUsView />
            </section>
          )}

          {activeTab === 'leaderboard' && (
            <section id="leaderboard" aria-label="Albo d'Oro">
              <LeaderboardView
                onSelectPlayer={handleSelectPlayer}
              />
            </section>
          )}

          {activeTab === 'players' && (
            <section id="players" aria-label="Roster Giocatori">
              <PlayerProfilesView
                selectedPlayerName={selectedPlayerName}
                onSelectPlayer={setSelectedPlayerName}
                onOpenMatchModal={(m: GolfatinaMatch) => {
                  setSelectedMatch(m);
                  setSelectedMatchView('scorecard');
                }}
                onStartH2HWith={handleStartH2HWith}
              />
            </section>
          )}

          {activeTab === 'h2h' && (
            <section id="h2h" aria-label="Arena 1v1 Head to Head">
              <HeadToHeadView
                initialP1={h2hP1}
                initialP2={h2hP2}
                onOpenMatchModal={(m: GolfatinaMatch) => {
                  setSelectedMatch(m);
                  setSelectedMatchView('scorecard');
                }}
              />
            </section>
          )}

          {activeTab === 'roulette' && (
            <section id="roulette" aria-label="Roulette delle Golfatine">
              <RouletteView
                onOpenMatchModal={(m: GolfatinaMatch) => {
                  setSelectedMatch(m);
                  setSelectedMatchView('scorecard');
                }}
                onSelectPlayer={handleSelectPlayer}
                onSelectChannel={handleSelectChannel}
                onOpenShare={(m) => setShareMatch(m)}
              />
            </section>
          )}

          {activeTab === 'soundboard' && (
            <section id="soundboard" aria-label="Soundboard Meme">
              <SoundboardView />
            </section>
          )}
        </Suspense>
      </main>

      {/* Lazy Loaded Modals */}
      <Suspense fallback={null}>
        {/* Match Detail Interactive Modal */}
        {selectedMatch && (
          <MatchModal
            match={selectedMatch}
            initialView={selectedMatchView}
            onClose={() => setSelectedMatch(null)}
            onSelectPlayer={handleSelectPlayer}
            onSelectChannel={handleSelectChannel}
            onOpenShare={(m) => setShareMatch(m)}
          />
        )}

        {/* Social Story Wrapped Share Modal */}
        {shareMatch && (
          <SocialShareModal
            match={shareMatch}
            isOpen={Boolean(shareMatch)}
            onClose={() => setShareMatch(null)}
          />
        )}

        {/* 3D Interactive Meme GaY Card Modal */}
        {isGayCardOpen && (
          <GayCardModal
            isOpen={isGayCardOpen}
            onClose={() => setIsGayCardOpen(false)}
          />
        )}

        {/* Golfatina di Donazione al Progetto Gabbiness Modal */}
        {isDonationOpen && (
          <GabbinessDonationModal
            isOpen={isDonationOpen}
            onClose={() => setIsDonationOpen(false)}
            onOpenProfile={() => {
              setIsDonationOpen(false);
              setIsProfileOpen(true);
            }}
          />
        )}

        {/* User Community Profile Modal */}
        {isProfileOpen && (
          <UserProfileModal
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            onOpenGayCard={() => {
              setIsProfileOpen(false);
              setIsGayCardOpen(true);
            }}
            onOpenDonation={() => {
              setIsProfileOpen(false);
              setIsDonationOpen(true);
            }}
          />
        )}
      </Suspense>

      {/* Global Footer */}
      <Footer 
        onNavigate={handleNavigate}
        onOpenGayCard={() => setIsGayCardOpen(true)}
      />

    </div>
  );
};

export default App;
