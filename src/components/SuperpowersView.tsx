import React, { useState } from 'react';
import { 
  Zap, 
  Sparkles, 
  ShieldAlert, 
  Flame, 
  Target, 
  Crosshair, 
  Play, 
  ExternalLink, 
  Award,
  ChevronRight,
  Eye,
  Activity
} from 'lucide-react';
import { PLAYERS_LIST, PlayerProfile, GolfatinaMatch, MATCHES_DATA } from '../data/golfatineData';
import { getPlayerAvatar } from '../utils/playerAvatars';
import { sound } from '../utils/audio';
import { triggerVictoryConfetti } from '../utils/confetti';

interface SuperpowersViewProps {
  onOpenMatchModal: (match: GolfatinaMatch) => void;
}

export interface PlayerSuperpower {
  playerName: string;
  powerName: string;
  archetype: string;
  elementColor: string;
  aliases: string[];
  badge: string;
  description: string;
  peggleEffect: string;
  stats: {
    power: number;
    precision: number;
    cooldown: number;
    chaos: number;
  };
  iconicMatchId: number;
  iconicQuote: string;
}

export const SUPERPOWERS_DATA: PlayerSuperpower[] = [
  {
    playerName: 'Just Rohn',
    powerName: 'Traiettoria del Mongoloniometro & Cono Visivo',
    archetype: 'L’Orefice / Il Gioielliere',
    elementColor: '#d4af37',
    aliases: ['Just Strong', 'Just Wrong', 'Juston', 'Just Fucking Just', 'L’Orefice', 'JustFinalmentecivedoRohn', 'Rohnnino'],
    badge: 'Precisione Millimetrica',
    description: 'Apre il celeberrimo "Mongoloniometro" per eseguire calcoli millimetrici per 45 secondi. Grazie al cono visivo recuperato dall’operazione agli occhi, trova l’allineamento perfetto e annulla l’attrito superficiale.',
    peggleEffect: 'Quando attivato: la pallina traccia una guida laser dorata e mira magneticamente al centro della tazza entro 3 rimbalzi.',
    stats: { power: 85, precision: 99, cooldown: 80, chaos: 15 },
    iconicMatchId: 29,
    iconicQuote: '«Apri il mongoloniometro! Ho perso il cono visivo ma ho preso la traiettoria quantistica!»',
  },
  {
    playerName: 'Delux',
    powerName: 'Faccio Geometria (Spider-Man di Quartiere)',
    archetype: 'Mister Geometria / Il Biliardista',
    elementColor: '#3b82f6',
    aliases: ['Delu', 'Dello', 'De Luca', 'Daniele Paolo De Luca', 'Spider-Man di quartiere', 'Il Geometra', 'Dolbex'],
    badge: '104 Hole-in-One Storici',
    description: 'Esclama «Faccio geometria!» dopo carambole casuali e triple sponde sui tubi verdi. Il resto del gruppo lo accusa di fortuna sfacciata («Tu non fai geometria, fai le cose a caso!»), mentre lui riesuma l’eterna rivalità su Trials.',
    peggleEffect: 'Ogni rimbalzo su sponda aumenta la velocità del 30% e calcola automaticamente l’angolo di riflessione perfetto.',
    stats: { power: 78, precision: 96, cooldown: 90, chaos: 35 },
    iconicMatchId: 29,
    iconicQuote: '«Faccio geometria! Guarda la tripla sponda sul tubo verde... Get on my level!»',
  },
  {
    playerName: 'GaBBo',
    powerName: 'Progetto Gabbiness & Evil Griefer (Capo Bastone)',
    archetype: 'Re del Tilt & Speronamento',
    elementColor: '#ef4444',
    aliases: ['Gabbone', 'Gamba', 'Gambao', 'Gabbo di Squared', 'Gabbo di Smerdaland', 'Cannuccia Bianca', 'Evil Gabbo', 'Capo Bastone', 'Gubbio'],
    badge: 'Record Storico 181 Colpi',
    description: 'Attiva il sacro Progetto Gabbiness («La gente è per strada con le magliette: Carica 3 Gabbo!»). Quando la partita è persa, diventa Evil Gabbo: consiglia «Tira tre tacche!» per far volare gli altri fuori mappa e si posiziona davanti alla buca per speronarli in acqua con 7 grammi di creatina e un pugno al tavolo.',
    peggleEffect: 'Genera un’onda d’urto che fa bocciare tutte le palline avversarie mandandole fuori mappa nei percorsi RPG.',
    stats: { power: 99, precision: 45, cooldown: 95, chaos: 100 },
    iconicMatchId: 2,
    iconicQuote: '«Occhio al progetto! Donate al Progetto Gabbiness! Tira tre tacche e 7 grammi di creatina!»',
  },
  {
    playerName: 'nonsonodread',
    powerName: 'Coordinatore del Workshop & Clutch Overdrive',
    archetype: 'Il Dreddone Brobbey',
    elementColor: '#10b981',
    aliases: ['Il Dreddone Brobbey', 'Dreddone', 'Dreddoide', 'Droid', 'Droddy', 'Dredonicogrobert', 'Re delle Mappe'],
    badge: 'Il Dreddone Brobbey',
    description: 'Seleziona le mappe labirinto/RPG più punitive dal Workshop di Steam per far tiltare il gruppo. Quando rischia di perdere il mental («Sembro l’Arsenal in Premier League!»), attiva il Clutch Overdrive nelle buche finali 15-18.',
    peggleEffect: 'Se è in svantaggio dopo la buca 14, azzera le penalità di caduta e raddoppia la potenza di tiro.',
    stats: { power: 90, precision: 88, cooldown: 85, chaos: 50 },
    iconicMatchId: 1,
    iconicQuote: '«Get on my level! Ho scelto la mappa apposta per vedere chi perde il fucking mental!»',
  },
  {
    playerName: 'ilMasseo',
    powerName: 'Ira dell’Inferno Tellurica (7g Creatina)',
    archetype: 'Berserker dell’Inferno',
    elementColor: '#f59e0b',
    aliases: ['Il Masseo', 'Messio', 'Mascel', 'Masbrecot', 'Il Marbeo'],
    badge: 'Trionfatore Inferno #6',
    description: 'Scatena sfuriate sismiche contro la fisica del gioco gridando «BENVENUTI ALL’INFERNO!». Trasforma la frustrazione del cap (buca da 14 colpi) in colpi a velocità supersonica che distruggono ogni ostacolo.',
    peggleEffect: 'Ignora le superfici scivolose e i burroni, superando tratti impossibili con una bordata tellurica.',
    stats: { power: 100, precision: 68, cooldown: 60, chaos: 90 },
    iconicMatchId: 6,
    iconicQuote: '«BENVENUTI ALL’INFERNO! HO PERSO IL FUCKING MENTAL! PUGNO AL TAVOLO E VIA!»',
  },
  {
    playerName: 'Mollu',
    powerName: 'Algoritmo Balistico Fuori Mappa (Polura)',
    archetype: 'Stratega dei Glitch',
    elementColor: '#ec4899',
    aliases: ['Mollura', 'Polura', 'Il Fisico'],
    badge: 'Win Rate Top 3',
    description: 'Studia la fisica interna di Golf With Your Friends per trovare rimbalzi sui pixel invisibili e scavalcare intere sezioni labirintiche in un colpo solo.',
    peggleEffect: 'Rivela scorciatoie aeree nascoste illuminando il tragitto verso la buca.',
    stats: { power: 80, precision: 94, cooldown: 80, chaos: 30 },
    iconicMatchId: 7,
    iconicQuote: '«Se tocchi l’angolo a 45 gradi scivoli fuori dal labirinto e sei già in buca.»',
  },
  {
    playerName: 'JTaz',
    powerName: 'Speronamento Tattico di Evil Jimmy',
    archetype: 'Evil Jimmy / Jimmy Jones',
    elementColor: '#8b5cf6',
    aliases: ['Jimmy', 'Jimmy Jones', 'Evil Jimmy', 'Lo Speronatore'],
    badge: 'Wildcard Anarchica',
    description: 'Specialista nel posizionarsi a guardia della tazza per bocciare i leader della classifica e spedirli fuori mappa, chiudendo poi la buca con rimbalzi assurdi.',
    peggleEffect: 'Crea una barriera invisibile attorno alla propria pallina che respinge qualsiasi avversario tenti di avvicinarsi.',
    stats: { power: 86, precision: 76, cooldown: 70, chaos: 95 },
    iconicMatchId: 13,
    iconicQuote: '«Attivo la modalità Evil Jimmy: nessuno entra in buca oggi!»',
  },
  {
    playerName: 'Just Marzaa',
    powerName: 'Sdrogo Strike Devastante',
    archetype: 'Cannoniere del Tee',
    elementColor: '#f97316',
    aliases: ['Marzone', 'Il Maestro dello Strike', 'Sdrogo Cannon'],
    badge: 'Ospite d’Onore',
    description: 'Bordata fulminea a potenza 100% che ignora dislivelli e atterra dritta sul green principale.',
    peggleEffect: 'Frantuma le trappole mobili e riduce di 2 colpi il par della buca.',
    stats: { power: 96, precision: 74, cooldown: 65, chaos: 70 },
    iconicMatchId: 57,
    iconicQuote: '«Tiro secco e deciso, senza troppi mongoloniometri!»',
  },
  {
    playerName: 'Yung Chape',
    powerName: 'Salto Dimensionale Ombra',
    archetype: 'Ninja del Fairway',
    elementColor: '#06b6d4',
    aliases: ['Chape', 'L’Ombra Veloce'],
    badge: 'Regolarità Silenziosa',
    description: 'Avanza silenzioso evitando le trappole dei griefer e rimontando con regolarità chirurgica.',
    peggleEffect: 'Immunità totale dalle collisioni e dai blocchi degli avversari.',
    stats: { power: 76, precision: 85, cooldown: 75, chaos: 35 },
    iconicMatchId: 4,
    iconicQuote: '«Piano piano, a fari spenti verso il podio.»',
  },
  {
    playerName: 'Fava',
    powerName: 'Impatto Tellurico Smeraldo',
    archetype: 'Guardiano del Par',
    elementColor: '#84cc16',
    aliases: ['Il Fava', 'Colosso del Bunker'],
    badge: 'Specialista Sabbia & Ghiaccio',
    description: 'Neutralizza le superfici scivolose e i bunker di sabbia, uscendo sempre al primo colpo.',
    peggleEffect: 'Trasforma sabbia e ghiaccio in normale fairway morbido.',
    stats: { power: 84, precision: 80, cooldown: 70, chaos: 45 },
    iconicMatchId: 58,
    iconicQuote: '«Dalla sabbia e dal ghiaccio si esce sempre al primo colpo.»',
  },
];

export const SuperpowersView: React.FC<SuperpowersViewProps> = ({ onOpenMatchModal }) => {
  const [activePower, setActivePower] = useState<PlayerSuperpower>(SUPERPOWERS_DATA[0]);
  const [activatedHero, setActivatedHero] = useState<string | null>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up any pending hero activation timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const handleActivatePower = (p: PlayerSuperpower) => {
    try {
      sound.playHIOFanfare();
      triggerVictoryConfetti();
    } catch {
      // ignore
    }
    setActivatedHero(p.playerName);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setActivatedHero(null);
      timeoutRef.current = null;
    }, 3500);
  };

  const iconicMatch = MATCHES_DATA.find((m) => m.id === activePower.iconicMatchId);

  return (
    <div className="space-y-10">
      
      {/* Editorial Header */}
      <div className="premium-card p-6 sm:p-8 rounded-2xl border border-white/[0.08] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Peggle 2 Inspired Mechanics
              </span>
              <span className="text-xs text-slate-400">Melagoodo Lore & Meme Special Abilities</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight">
              I Superpoteri dei Melagoodo
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Dal <em>Progetto Gabbiness</em> al <em>Mongoloniometro dell’Orefice</em>, passando per la <em>Geometria di Delux</em> e l’<em>Ira dell’Inferno</em>. Seleziona un personaggio e scatena il suo potere!
            </p>
          </div>
        </div>
      </div>

      {/* Character Selector Roster Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {SUPERPOWERS_DATA.map((p) => {
          const isSelected = activePower.playerName === p.playerName;
          const avatarUrl = getPlayerAvatar(p.playerName);

          return (
            <button
              key={p.playerName}
              onClick={() => {
                sound.playClick();
                setActivePower(p);
              }}
              className={`premium-card p-3 rounded-2xl flex flex-col items-center text-center transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#d4af37] bg-[#141d18] shadow-lg ring-1 ring-[#d4af37]/40'
                  : 'border-white/[0.06] hover:border-white/[0.15] bg-[#090d0b]'
              }`}
            >
              <div className="w-14 h-14 rounded-full overflow-hidden mb-2 border-2 border-white/10 shadow-md">
                <img
                  src={avatarUrl}
                  alt={p.playerName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="text-xs font-bold text-white truncate max-w-full">{p.playerName}</div>
              <div className="text-[10px] text-[#d4af37] truncate max-w-full font-mono mt-0.5">{p.archetype}</div>
            </button>
          );
        })}
      </div>

      {/* Showcase Stage for Active Character */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left: Character Portrait & Power Card */}
        <div className="lg:col-span-6 premium-card p-6 sm:p-8 rounded-3xl border-2 border-[#d4af37]/40 bg-gradient-to-b from-[#101914] via-[#0b100d] to-[#070a08] space-y-6 shadow-2xl relative overflow-hidden">
          
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#d4af37] shadow-xl shrink-0">
                <img
                  src={getPlayerAvatar(activePower.playerName)}
                  alt={activePower.playerName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30">
                  {activePower.archetype}
                </span>
                <h3 className="text-2xl font-black font-heading text-white mt-1">{activePower.playerName}</h3>
                <p className="text-xs text-slate-400 font-mono">{activePower.badge}</p>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-[#141d18] border border-white/[0.1] text-[#d4af37]">
              <Zap className="w-6 h-6" />
            </div>
          </div>

          {/* Aliases Pills */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Soprannomi & Deformazioni Storiche:</span>
            <div className="flex flex-wrap gap-1">
              {activePower.aliases.map((alias, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/[0.06] text-[10px] font-mono">
                  {alias}
                </span>
              ))}
            </div>
          </div>

          {/* Superpower Name & Lore */}
          <div className="bg-[#070b08] p-4 rounded-2xl border border-white/[0.08] space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Superpotere Speciale:</span>
            </div>
            <div className="text-lg font-black font-heading text-white">
              {activePower.powerName}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {activePower.description}
            </p>
          </div>

          {/* Peggle 2 Activation Trigger */}
          <div className="bg-[#0e1612] p-3.5 rounded-xl border-l-2 border-emerald-400 text-xs text-slate-300">
            <strong className="text-emerald-400 block text-[10px] uppercase font-mono mb-0.5">Effetto Peggle 2 Style:</strong>
            <span>{activePower.peggleEffect}</span>
          </div>

          {/* Activation Button */}
          <button
            onClick={() => handleActivatePower(activePower)}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#d4af37] via-amber-400 to-yellow-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl hover:scale-103 active:scale-98 transition-all cursor-pointer"
          >
            <Zap className="w-5 h-5 fill-current" />
            <span>ATTIVA SUPERPOTERE IN PARTITA ⚡</span>
          </button>

          {activatedHero === activePower.playerName && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs text-center font-bold animate-in zoom-in-95">
              ⚡ Superpotere "{activePower.powerName}" scatenato sul green!
            </div>
          )}

        </div>

        {/* Right: Stats Gauges & Iconic Reference */}
        <div className="lg:col-span-6 space-y-5">
          
          {/* Stats Breakdown */}
          <div className="premium-card p-6 rounded-2xl border border-white/[0.08] space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Crosshair className="w-4 h-4 text-[#d4af37]" />
              Indicatori di Prestazione Superpotere
            </h4>

            <div className="space-y-3 text-xs">
              
              <div className="space-y-1">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Potenza di Tiro:</span>
                  <strong className="text-white">{activePower.stats.power}/100</strong>
                </div>
                <div className="w-full h-2 rounded-full bg-[#090d0b] overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500" style={{ width: `${activePower.stats.power}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Precisione Sponda:</span>
                  <strong className="text-white">{activePower.stats.precision}/100</strong>
                </div>
                <div className="w-full h-2 rounded-full bg-[#090d0b] overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${activePower.stats.precision}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Velocità Ricarica:</span>
                  <strong className="text-white">{activePower.stats.cooldown}/100</strong>
                </div>
                <div className="w-full h-2 rounded-full bg-[#090d0b] overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${activePower.stats.cooldown}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Indice di Caos / Tilt:</span>
                  <strong className="text-rose-400">{activePower.stats.chaos}/100</strong>
                </div>
                <div className="w-full h-2 rounded-full bg-[#090d0b] overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${activePower.stats.chaos}%` }} />
                </div>
              </div>

            </div>
          </div>

          {/* Associated Iconic Match Episode */}
          {iconicMatch && (
            <div className="premium-card p-5 rounded-2xl border border-white/[0.08] space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Episodio Cult di Riferimento
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="truncate">
                  <div className="text-xs font-mono text-[#d4af37]">Golfatina #{iconicMatch.id}</div>
                  <div className="text-sm font-bold text-white truncate font-heading">{iconicMatch.title}</div>
                </div>

                <button
                  onClick={() => onOpenMatchModal(iconicMatch)}
                  className="px-3 py-1.5 rounded-lg bg-[#141d18] hover:bg-[#1a2620] border border-white/[0.1] text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Vedi Match</span>
                </button>
              </div>

              <p className="text-xs text-slate-300 italic bg-[#070b08] p-2.5 rounded-lg border-l-2 border-[#d4af37]">
                {activePower.iconicQuote}
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
