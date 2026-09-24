import { Match, Player, SportType } from '../types';

// ── Colors ──────────────────────────────────────────────────────────────────
// Categorical palette (validated for colorblind separation). A player's color
// follows the player — it's based on their position in the alphabetical list,
// never on which players are currently selected.
export const PLAYER_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];

export const playerColorMap = (players: Player[]): Record<string, string> => {
  const sorted = [...players].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  const map: Record<string, string> = {};
  sorted.forEach((p, i) => { map[p.id] = PLAYER_COLORS[i % PLAYER_COLORS.length]; });
  return map;
};

// Single-hue sequential ramp (light → dark) for the activity calendar.
export const ACTIVITY_RAMP = ['#eef2f7', '#b7d3f6', '#6da7ec', '#2a78d6', '#184f95'];

export const SPORT_EMOJI: Record<string, string> = { padel: '🎾', badminton: '🏸', all: '🏅' };
export const SPORT_LABEL: Record<string, string> = { padel: 'Padel', badminton: 'Badminton', all: 'Tous' };

// ── Default players ────────────────────────────────────────────────────────
export const DEFAULT_SPORT: SportType = 'badminton';

const normalizeName = (name: string) =>
  name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export const findDefaultPlayerId = (players: Player[], prefix: string) =>
  players.find(p => normalizeName(p.name).startsWith(prefix))?.id || '';

export const defaultPlayerIds = (players: Player[]) => {
  const ids = [findDefaultPlayerId(players, 'gilles'), findDefaultPlayerId(players, 'tad')].filter(Boolean);
  return ids.length > 0 ? ids : players.slice(0, 2).map(p => p.id);
};

// ── Periods ────────────────────────────────────────────────────────────────
export type Period = 'all' | '30d' | '3m' | '12m';
export const PERIOD_LABEL: Record<Period, string> = { all: 'Tout', '30d': '30 j', '3m': '3 mois', '12m': '12 mois' };
const PERIOD_DAYS: Record<Period, number> = { all: Infinity, '30d': 30, '3m': 91, '12m': 365 };

export const inPeriod = (date: Date | string, period: Period, now = new Date()) => {
  if (period === 'all') return true;
  return now.getTime() - new Date(date).getTime() <= PERIOD_DAYS[period] * 86400000;
};

// ── Match helpers ──────────────────────────────────────────────────────────
export const isOnTeam1 = (m: Match, pid: string) => m.player1Id === pid || m.player3Id === pid;
export const isOnTeam2 = (m: Match, pid: string) => m.player2Id === pid || m.player4Id === pid;
export const isInMatch = (m: Match, pid: string) => isOnTeam1(m, pid) || isOnTeam2(m, pid);
export const matchPlayerIds = (m: Match) =>
  [m.player1Id, m.player2Id, m.player3Id, m.player4Id].filter(Boolean) as string[];

export const didWin = (m: Match, pid: string): boolean | null => {
  if (!m.winner || !isInMatch(m, pid)) return null;
  return isOnTeam1(m, pid) ? m.winner === 'player1' : m.winner === 'player2';
};

export const team1Label = (m: Match) =>
  m.matchType === 'doubles' ? `${m.player1Name} & ${m.player3Name}` : m.player1Name;
export const team2Label = (m: Match) =>
  m.matchType === 'doubles' ? `${m.player2Name} & ${m.player4Name}` : m.player2Name;

export const setsWon = (m: Match) => ({
  t1: m.sets.filter(s => s.winner === 'player1').length,
  t2: m.sets.filter(s => s.winner === 'player2').length,
});

export const pointsDiff = (m: Match) =>
  m.sets.reduce((acc, s) => acc + s.player1Score - s.player2Score, 0);

export const byDateAsc = (a: Match, b: Match) => new Date(a.date).getTime() - new Date(b.date).getTime();
export const byDateDesc = (a: Match, b: Match) => byDateAsc(b, a);

// A set is "close" when decided by 2 points (badminton) or 1 game (padel).
export const isCloseSet = (sport: SportType, s: { player1Score: number; player2Score: number }) => {
  const margin = Math.abs(s.player1Score - s.player2Score);
  return sport === 'padel' ? margin <= 1 : margin <= 2;
};

// Extra time: badminton set past 21 points, padel tie-break (7–6).
export const isExtraTimeSet = (sport: SportType, s: { player1Score: number; player2Score: number }) => {
  const hi = Math.max(s.player1Score, s.player2Score);
  const lo = Math.min(s.player1Score, s.player2Score);
  return sport === 'padel' ? hi === 7 && lo === 6 : hi > 21;
};

// ── Per-player summary ─────────────────────────────────────────────────────
export interface PlayerSummary {
  player: Player;
  color: string;
  wins: number;
  losses: number;
  total: number;
  winRate: number;
  setsWon: number;
  setsLost: number;
  ptWon: number;
  ptLost: number;
  avgMargin: number;
  form: (boolean | null)[];
  currentStreak: { type: 'W' | 'L' | null; count: number };
  longestWinStreak: number;
  comebacks: number;
  closeSets: { won: number; total: number };
  extraSets: { won: number; total: number };
  afterWinningSet1: { won: number; total: number };
  afterLosingSet1: { won: number; total: number };
}

export const summarizePlayer = (player: Player, color: string, matches: Match[]): PlayerSummary => {
  const mine = matches.filter(m => isInMatch(m, player.id)).sort(byDateAsc);
  let wins = 0, losses = 0, sW = 0, sL = 0, ptWon = 0, ptLost = 0, comebacks = 0;
  let run = 0, longest = 0;
  const closeSets = { won: 0, total: 0 };
  const extraSets = { won: 0, total: 0 };
  const afterWinningSet1 = { won: 0, total: 0 };
  const afterLosingSet1 = { won: 0, total: 0 };

  mine.forEach(m => {
    const w = didWin(m, player.id);
    if (w === true) { wins++; run++; longest = Math.max(longest, run); }
    else if (w === false) { losses++; run = 0; }

    const t1 = isOnTeam1(m, player.id);
    m.sets.forEach(s => {
      const won = t1 ? s.winner === 'player1' : s.winner === 'player2';
      if (won) sW++; else sL++;
      ptWon += t1 ? s.player1Score : s.player2Score;
      ptLost += t1 ? s.player2Score : s.player1Score;
      if (isCloseSet(m.sportType, s)) { closeSets.total++; if (won) closeSets.won++; }
      if (isExtraTimeSet(m.sportType, s)) { extraSets.total++; if (won) extraSets.won++; }
    });

    const first = m.sets[0];
    if (first && w !== null) {
      const wonFirst = t1 ? first.winner === 'player1' : first.winner === 'player2';
      const bucket = wonFirst ? afterWinningSet1 : afterLosingSet1;
      bucket.total++;
      if (w) bucket.won++;
      if (!wonFirst && w) comebacks++;
    }
  });

  // current streak = run of identical results at the end
  const results = mine.map(m => didWin(m, player.id)).filter((r): r is boolean => r !== null);
  let streakCount = 0;
  const last = results[results.length - 1];
  for (let i = results.length - 1; i >= 0 && results[i] === last; i--) streakCount++;

  const total = wins + losses;
  return {
    player, color, wins, losses, total,
    winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
    setsWon: sW, setsLost: sL, ptWon, ptLost,
    avgMargin: total > 0 ? +((ptWon - ptLost) / total).toFixed(1) : 0,
    form: mine.slice(-10).map(m => didWin(m, player.id)),
    currentStreak: { type: last === undefined ? null : last ? 'W' : 'L', count: streakCount },
    longestWinStreak: longest,
    comebacks,
    closeSets, extraSets, afterWinningSet1, afterLosingSet1,
  };
};

// ── Rivalry (exactly 2 players on opposing sides) ──────────────────────────
export interface RivalryPoint {
  n: number;
  date: Date;
  diff: number;
  winnerName: string;
  score: string;
}

export const rivalryMatches = (matches: Match[], p1: string, p2: string) =>
  matches.filter(m =>
    (isOnTeam1(m, p1) && isOnTeam2(m, p2)) || (isOnTeam2(m, p1) && isOnTeam1(m, p2))
  ).sort(byDateAsc);

export const rivalrySeries = (matches: Match[], p1: Player, p2: Player): RivalryPoint[] => {
  let diff = 0;
  const pts: RivalryPoint[] = [{ n: 0, date: new Date(0), diff: 0, winnerName: '', score: '' }];
  rivalryMatches(matches, p1.id, p2.id).forEach((m, i) => {
    const w = didWin(m, p1.id);
    if (w === true) diff++;
    else if (w === false) diff--;
    const { t1, t2 } = setsWon(m);
    const p1Team1 = isOnTeam1(m, p1.id);
    pts.push({
      n: i + 1,
      date: new Date(m.date),
      diff,
      winnerName: w === null ? 'Nul' : w ? p1.name : p2.name,
      score: m.sets.map(s => p1Team1 ? `${s.player1Score}–${s.player2Score}` : `${s.player2Score}–${s.player1Score}`).join(' · ')
        || (p1Team1 ? `${t1}–${t2}` : `${t2}–${t1}`),
    });
  });
  return pts;
};

// Cumulative net result (wins − losses) per player, one row per match.
export const netSeries = (matches: Match[], players: Player[]) => {
  const sorted = matches.filter(m => players.some(p => isInMatch(m, p.id))).sort(byDateAsc);
  const net: Record<string, number> = {};
  players.forEach(p => { net[p.id] = 0; });
  const rows: any[] = [{ n: 0, date: null, ...Object.fromEntries(players.map(p => [p.id, 0])) }];
  sorted.forEach((m, i) => {
    const row: any = { n: i + 1, date: new Date(m.date) };
    players.forEach(p => {
      const w = didWin(m, p.id);
      if (w === true) net[p.id]++;
      else if (w === false) net[p.id]--;
      row[p.id] = net[p.id];
    });
    rows.push(row);
  });
  return rows;
};

// ── Match records ──────────────────────────────────────────────────────────
export interface MatchRecord { match: Match; margin: number }

export const matchMargins = (matches: Match[]): MatchRecord[] =>
  matches.filter(m => m.winner && m.sets.length > 0).map(m => ({
    match: m,
    // margin from the winner's point of view
    margin: m.winner === 'player1' ? pointsDiff(m) : -pointsDiff(m),
  }));

export const biggestWin = (matches: Match[]) =>
  matchMargins(matches).sort((a, b) => b.margin - a.margin)[0] || null;

export const closestMatch = (matches: Match[]) =>
  matchMargins(matches)
    .sort((a, b) => Math.abs(a.margin) - Math.abs(b.margin) || b.match.sets.length - a.match.sets.length)[0] || null;

// ── Activity calendar ──────────────────────────────────────────────────────
const startOfWeek = (d: Date) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  return x;
};

export const dayKey = (d: Date | string) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

export interface ActivityWeek { start: Date; days: { date: Date; count: number; future: boolean }[] }

export const activityWeeks = (matches: Match[], weeks: number, now = new Date()): ActivityWeek[] => {
  const counts: Record<string, number> = {};
  matches.forEach(m => { const k = dayKey(m.date); counts[k] = (counts[k] || 0) + 1; });
  const first = startOfWeek(now);
  first.setDate(first.getDate() - (weeks - 1) * 7);
  const res: ActivityWeek[] = [];
  for (let w = 0; w < weeks; w++) {
    const start = new Date(first);
    start.setDate(first.getDate() + w * 7);
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return { date, count: counts[dayKey(date)] || 0, future: date > now };
    });
    res.push({ start, days });
  }
  return res;
};

export const activityLevel = (count: number) => (count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4);

// ── Sessions (matches played the same day) ─────────────────────────────────
export interface Session {
  key: string;
  date: Date;
  matches: Match[];
  tally: { id: string; name: string; wins: number }[];
}

export const groupSessions = (matches: Match[]): Session[] => {
  const map = new Map<string, Match[]>();
  [...matches].sort(byDateDesc).forEach(m => {
    const k = dayKey(m.date);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(m);
  });
  return Array.from(map.entries()).map(([key, ms]) => {
    const tally: Record<string, { id: string; name: string; wins: number }> = {};
    ms.forEach(m => {
      const ids = matchPlayerIds(m);
      const names = [m.player1Name, m.player2Name, m.player3Name, m.player4Name];
      const idList = [m.player1Id, m.player2Id, m.player3Id, m.player4Id];
      ids.forEach(id => {
        const name = names[idList.indexOf(id)] || '?';
        if (!tally[id]) tally[id] = { id, name, wins: 0 };
        if (didWin(m, id)) tally[id].wins++;
      });
    });
    return {
      key,
      date: new Date(ms[0].date),
      matches: ms,
      tally: Object.values(tally).sort((a, b) => b.wins - a.wins || a.name.localeCompare(b.name)),
    };
  });
};

// ── Formatting ─────────────────────────────────────────────────────────────
export const fmtDay = (d: Date | string) => {
  const s = new Date(d).toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};
export const fmtShort = (d: Date | string) =>
  new Date(d).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short', year: '2-digit' });
export const pct = (won: number, total: number) => (total > 0 ? Math.round((won / total) * 100) : null);
