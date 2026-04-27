import React, { useState, useMemo } from 'react';
import { Player, Match } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, RadialBarChart, RadialBar,
} from 'recharts';

interface DashboardProps {
  players: Player[];
  matches: Match[];
}

const PLAYER_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#22c55e', '#ef4444', '#06b6d4', '#f97316', '#14b8a6'];
const SPORT_EMOJI: Record<string, string> = { padel: '🎾', badminton: '🏸', all: '🏅' };

// ── helpers ────────────────────────────────────────────────────────────────
const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short' });

const isOnTeam1 = (match: Match, pid: string) =>
  match.player1Id === pid || match.player3Id === pid;
const isOnTeam2 = (match: Match, pid: string) =>
  match.player2Id === pid || match.player4Id === pid;
const isInMatch = (match: Match, pid: string) =>
  isOnTeam1(match, pid) || isOnTeam2(match, pid);

const didWin = (match: Match, pid: string) => {
  if (!match.winner) return null;
  return (isOnTeam1(match, pid) && match.winner === 'player1') ||
         (isOnTeam2(match, pid) && match.winner === 'player2');
};

// ── sub-components ─────────────────────────────────────────────────────────
const StatCard: React.FC<{ label: string; value: string | number; sub?: string; color?: string }> =
  ({ label, value, sub, color = '#3b82f6' }) => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</div>
      <div className="text-3xl font-black" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-gray-500">{sub}</div>}
    </div>
  );

const FormDots: React.FC<{ results: (boolean | null)[] }> = ({ results }) => (
  <div className="flex gap-1">
    {results.map((w, i) => (
      <span
        key={i}
        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
        style={{ backgroundColor: w === null ? '#d1d5db' : w ? '#22c55e' : '#ef4444' }}
      >
        {w === null ? '–' : w ? 'V' : 'D'}
      </span>
    ))}
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 mt-10 flex items-center gap-2">
    <span className="flex-1 h-px bg-gray-100" />
    {children}
    <span className="flex-1 h-px bg-gray-100" />
  </h2>
);

// ── main component ─────────────────────────────────────────────────────────
const Dashboard: React.FC<DashboardProps> = ({ players, matches }) => {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(() =>
    players.slice(0, 2).map(p => p.id)
  );
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [headToHeadOnly, setHeadToHeadOnly] = useState(false);

  const togglePlayer = (id: string) => {
    setSelectedPlayers(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  // ── filtered data ──────────────────────────────────────────────────────
  const filteredPlayers = useMemo(
    () => players.filter(p => selectedPlayers.includes(p.id)),
    [players, selectedPlayers]
  );

  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      if (selectedSport !== 'all' && m.sportType !== selectedSport) return false;
      if (selectedPlayers.length === 0) return true;
      const ids = [m.player1Id, m.player2Id, m.player3Id, m.player4Id].filter(Boolean) as string[];
      if (headToHeadOnly) {
        // FIX: just require ALL selected players to be in the match (works for singles AND doubles)
        return selectedPlayers.every(pid => ids.includes(pid));
      }
      return ids.some(pid => selectedPlayers.includes(pid));
    });
  }, [matches, selectedPlayers, selectedSport, headToHeadOnly]);

  const sortedMatches = useMemo(
    () => [...filteredMatches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [filteredMatches]
  );

  // ── per-player stats ───────────────────────────────────────────────────
  const playerStats = useMemo(() =>
    filteredPlayers.map((player, idx) => {
      let wins = 0, losses = 0, setsWon = 0, setsLost = 0, ptWon = 0, ptLost = 0;
      const form: (boolean | null)[] = [];

      const myMatches = [...filteredMatches]
        .filter(m => isInMatch(m, player.id))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      myMatches.forEach(m => {
        const w = didWin(m, player.id);
        if (w === true) wins++;
        else if (w === false) losses++;

        const team1 = isOnTeam1(m, player.id);
        m.sets.forEach(s => {
          const sw = team1 ? s.winner === 'player1' : s.winner === 'player2';
          if (sw) setsWon++; else setsLost++;
          ptWon += team1 ? s.player1Score : s.player2Score;
          ptLost += team1 ? s.player2Score : s.player1Score;
        });
      });

      // last 8 matches form
      myMatches.slice(-8).forEach(m => form.push(didWin(m, player.id)));

      const total = wins + losses;
      return {
        player,
        color: PLAYER_COLORS[idx % PLAYER_COLORS.length],
        wins, losses, total,
        winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
        setsWon, setsLost,
        ptWon, ptLost,
        avgMargin: total > 0 ? Math.round((ptWon - ptLost) / total) : 0,
        form,
      };
    }), [filteredPlayers, filteredMatches]);

  // ── H2H ───────────────────────────────────────────────────────────────
  const h2h = useMemo(() => {
    if (filteredPlayers.length !== 2) return null;
    const [p1, p2] = filteredPlayers;
    let p1Wins = 0, p2Wins = 0;
    filteredMatches.forEach(m => {
      const p1team1 = isOnTeam1(m, p1.id), p1team2 = isOnTeam2(m, p1.id);
      const p2team1 = isOnTeam1(m, p2.id), p2team2 = isOnTeam2(m, p2.id);
      // only count when they're on opposing teams
      if ((p1team1 && p2team2) || (p1team2 && p2team1)) {
        if ((p1team1 && m.winner === 'player1') || (p1team2 && m.winner === 'player2')) p1Wins++;
        else if ((p2team1 && m.winner === 'player1') || (p2team2 && m.winner === 'player2')) p2Wins++;
      }
    });
    return { p1, p2, p1Wins, p2Wins, total: p1Wins + p2Wins };
  }, [filteredPlayers, filteredMatches]);

  // ── win rate over time ─────────────────────────────────────────────────
  const winRateOverTime = useMemo(() => {
    const allMonths = Array.from(new Set(
      filteredMatches.map(m => new Date(m.date).toISOString().slice(0, 7))
    )).sort();

    return allMonths.map(month => {
      const entry: any = { month: month.slice(5) }; // MM only
      filteredPlayers.forEach(player => {
        const mMonthMatches = filteredMatches.filter(m =>
          isInMatch(m, player.id) && new Date(m.date).toISOString().slice(0, 7) === month
        );
        const w = mMonthMatches.filter(m => didWin(m, player.id) === true).length;
        entry[player.name] = mMonthMatches.length > 0 ? Math.round((w / mMonthMatches.length) * 100) : null;
      });
      return entry;
    });
  }, [filteredPlayers, filteredMatches]);

  // ── win/loss bar data ──────────────────────────────────────────────────
  const winLossData = playerStats.map(s => ({
    name: s.player.name,
    Victoires: s.wins,
    Défaites: s.losses,
  }));

  // ── sets won/lost ──────────────────────────────────────────────────────
  const setsData = playerStats.map(s => ({
    name: s.player.name,
    'Sets gagnés': s.setsWon,
    'Sets perdus': s.setsLost,
  }));

  // ── points per set (avg) ───────────────────────────────────────────────
  const maxSetCount = Math.max(0, ...filteredMatches.map(m => m.sets.length));
  const pointsPerSet = useMemo(() => {
    const rows = [];
    for (let i = 0; i < maxSetCount; i++) {
      const entry: any = { set: `Set ${i + 1}` };
      filteredPlayers.forEach(player => {
        let total = 0, count = 0;
        filteredMatches.forEach(m => {
          const s = m.sets[i];
          if (!s) return;
          if (!isInMatch(m, player.id)) return;
          total += isOnTeam1(m, player.id) ? s.player1Score : s.player2Score;
          count++;
        });
        entry[player.name] = count > 0 ? +(total / count).toFixed(1) : undefined;
      });
      rows.push(entry);
    }
    return rows;
  }, [filteredPlayers, filteredMatches, maxSetCount]);

  // ── radial win rate data ───────────────────────────────────────────────
  const radialData = playerStats.map((s, i) => ({
    name: s.player.name,
    winRate: s.winRate,
    fill: PLAYER_COLORS[i % PLAYER_COLORS.length],
  }));

  const isEmpty = filteredMatches.length === 0;
  const noPlayersSelected = selectedPlayers.length === 0;

  return (
    <div className="max-w-4xl mx-auto pb-12">

      {/* ── FILTERS ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-8 space-y-4">

        {/* Sport pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">Sport</span>
          {['all', 'badminton', 'padel'].map(s => (
            <button
              key={s}
              onClick={() => setSelectedSport(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                selectedSport === s
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {SPORT_EMOJI[s]} {s === 'all' ? 'Tous' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Player chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">Joueurs</span>
          {players.map((player, idx) => {
            const selected = selectedPlayers.includes(player.id);
            const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
            return (
              <button
                key={player.id}
                onClick={() => togglePlayer(player.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                  selected ? 'text-white shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
                style={selected ? { backgroundColor: color, borderColor: color } : {}}
              >
                {player.name}
              </button>
            );
          })}
        </div>

        {/* H2H toggle */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">Filtre</span>
          <button
            onClick={() => setHeadToHeadOnly(!headToHeadOnly)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              headToHeadOnly ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              headToHeadOnly ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
          <span className="text-sm text-gray-600">Seulement les matchs où tous les joueurs sélectionnés participent</span>
        </div>
      </div>

      {noPlayersSelected && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">👆</div>
          <p className="font-medium">Sélectionne des joueurs pour voir les stats</p>
        </div>
      )}

      {!noPlayersSelected && isEmpty && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🏸</div>
          <p className="font-medium">Aucun match trouvé avec ces filtres</p>
        </div>
      )}

      {!noPlayersSelected && !isEmpty && (
        <>
          {/* ── H2H HERO ─────────────────────────────────────────────── */}
          {h2h && h2h.total > 0 && (
            <>
              <SectionTitle>Face à face</SectionTitle>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-2">
                <div className="grid grid-cols-3 items-center p-6 gap-4">
                  {/* Player 1 */}
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-black shadow-sm"
                      style={{ backgroundColor: PLAYER_COLORS[0] }}
                    >
                      {h2h.p1.name.charAt(0)}
                    </div>
                    <span className="font-bold text-gray-800 text-center">{h2h.p1.name}</span>
                    <span className="text-xs text-gray-400">{h2h.p1Wins} victoire{h2h.p1Wins !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Score */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-5xl font-black ${h2h.p1Wins >= h2h.p2Wins ? 'text-gray-900' : 'text-gray-300'}`}
                      >{h2h.p1Wins}</span>
                      <span className="text-2xl text-gray-300 font-light">–</span>
                      <span
                        className={`text-5xl font-black ${h2h.p2Wins >= h2h.p1Wins ? 'text-gray-900' : 'text-gray-300'}`}
                      >{h2h.p2Wins}</span>
                    </div>
                    <span className="text-xs text-gray-400">{h2h.total} match{h2h.total !== 1 ? 's' : ''} face à face</span>
                    {h2h.p1Wins !== h2h.p2Wins && (
                      <span
                        className="mt-1 text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: h2h.p1Wins > h2h.p2Wins ? PLAYER_COLORS[0] : PLAYER_COLORS[1] }}
                      >
                        🏆 {h2h.p1Wins > h2h.p2Wins ? h2h.p1.name : h2h.p2.name} mène
                      </span>
                    )}
                    {h2h.p1Wins === h2h.p2Wins && (
                      <span className="mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        Égalité parfaite
                      </span>
                    )}
                  </div>

                  {/* Player 2 */}
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-black shadow-sm"
                      style={{ backgroundColor: PLAYER_COLORS[1] }}
                    >
                      {h2h.p2.name.charAt(0)}
                    </div>
                    <span className="font-bold text-gray-800 text-center">{h2h.p2.name}</span>
                    <span className="text-xs text-gray-400">{h2h.p2Wins} victoire{h2h.p2Wins !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* H2H progress bar */}
                {h2h.total > 0 && (
                  <div className="flex h-2 mx-6 mb-4 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${(h2h.p1Wins / h2h.total) * 100}%`, backgroundColor: PLAYER_COLORS[0] }}
                    />
                    <div
                      style={{ width: `${(h2h.p2Wins / h2h.total) * 100}%`, backgroundColor: PLAYER_COLORS[1] }}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── KPIs ──────────────────────────────────────────────────── */}
          <SectionTitle>Résumé</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
            <StatCard label="Matchs" value={filteredMatches.length} sub="dans la sélection" />
            {playerStats.map(s => (
              <StatCard
                key={s.player.id}
                label={`Win rate ${s.player.name}`}
                value={`${s.winRate}%`}
                sub={`${s.wins}V – ${s.losses}D`}
                color={s.color}
              />
            ))}
          </div>

          {/* Per-player form + stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {playerStats.map(s => (
              <div
                key={s.player.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
                    style={{ backgroundColor: s.color }}
                  >
                    {s.player.name.charAt(0)}
                  </div>
                  <span className="font-bold text-gray-800">{s.player.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center text-sm mb-3">
                  <div>
                    <div className="font-black text-xl" style={{ color: s.color }}>{s.setsWon}</div>
                    <div className="text-gray-400 text-xs">Sets gagnés</div>
                  </div>
                  <div>
                    <div className="font-black text-xl text-gray-400">{s.setsLost}</div>
                    <div className="text-gray-400 text-xs">Sets perdus</div>
                  </div>
                  <div>
                    <div className={`font-black text-xl ${s.avgMargin >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {s.avgMargin > 0 ? '+' : ''}{s.avgMargin}
                    </div>
                    <div className="text-gray-400 text-xs">Marge moy.</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1.5">Forme récente (8 derniers)</div>
                  <FormDots results={s.form} />
                </div>
              </div>
            ))}
          </div>

          {/* ── WIN/LOSS CHARTS ───────────────────────────────────────── */}
          <SectionTitle>Victoires &amp; Sets</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="text-sm font-semibold text-gray-700 mb-4">Victoires / Défaites</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={winLossData} layout="vertical" barCategoryGap="30%">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Victoires" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Défaites" fill="#f87171" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="text-sm font-semibold text-gray-700 mb-4">Sets gagnés / perdus</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={setsData} layout="vertical" barCategoryGap="30%">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Sets gagnés" fill="#38bdf8" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Sets perdus" fill="#fbbf24" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── WIN RATE RADIAL ───────────────────────────────────────── */}
          {radialData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mt-4">
              <div className="text-sm font-semibold text-gray-700 mb-1">Win rate (%)</div>
              <div className="flex items-center gap-6 flex-wrap">
                <ResponsiveContainer width={220} height={180}>
                  <RadialBarChart
                    innerRadius="30%" outerRadius="90%"
                    data={radialData} startAngle={90} endAngle={-270}
                  >
                    <RadialBar dataKey="winRate" cornerRadius={6} background={{ fill: '#f1f5f9' }} />
                    <Tooltip formatter={(v: any) => `${v}%`} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-3">
                  {playerStats.map(s => (
                    <div key={s.player.id} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-sm font-medium text-gray-700 w-24">{s.player.name}</span>
                      <span className="text-lg font-black" style={{ color: s.color }}>{s.winRate}%</span>
                      <div className="w-24 bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${s.winRate}%`, backgroundColor: s.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── EVOLUTION ─────────────────────────────────────────────── */}
          <SectionTitle>Évolution dans le temps</SectionTitle>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="text-sm font-semibold text-gray-700 mb-4">Taux de victoire mensuel (%)</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={winRateOverTime} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {filteredPlayers.map((player, idx) => (
                  <Line
                    key={player.id}
                    type="monotone"
                    dataKey={player.name}
                    stroke={PLAYER_COLORS[idx % PLAYER_COLORS.length]}
                    strokeWidth={2.5}
                    dot={{ r: 4, strokeWidth: 2 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ── POINTS ────────────────────────────────────────────────── */}
          {maxSetCount > 0 && (
            <>
              <SectionTitle>Points par set</SectionTitle>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="text-sm font-semibold text-gray-700 mb-4">Points moyens gagnés par numéro de set</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={pointsPerSet} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="set" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {filteredPlayers.map((player, idx) => (
                      <Bar
                        key={player.id}
                        dataKey={player.name}
                        fill={PLAYER_COLORS[idx % PLAYER_COLORS.length]}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {/* ── MATCHS RÉCENTS ────────────────────────────────────────── */}
          <SectionTitle>Matchs récents</SectionTitle>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {sortedMatches.slice(0, 8).map(match => {
              const isDoubles = match.matchType === 'doubles';
              const t1 = isDoubles ? `${match.player1Name} & ${match.player3Name}` : match.player1Name;
              const t2 = isDoubles ? `${match.player2Name} & ${match.player4Name}` : match.player2Name;
              const s1 = match.sets.filter(s => s.winner === 'player1').length;
              const s2 = match.sets.filter(s => s.winner === 'player2').length;
              const sportEmoji = SPORT_EMOJI[match.sportType] ?? '🏅';

              return (
                <div key={match.id} className="px-4 py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <span className={`text-sm font-medium truncate ${match.winner === 'player1' ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>
                    {t1}
                  </span>
                  <div className="flex flex-col items-center gap-0.5 min-w-[80px]">
                    <div className="flex items-center gap-1">
                      <span className={`font-black text-lg ${match.winner === 'player1' ? 'text-gray-900' : 'text-gray-300'}`}>{s1}</span>
                      <span className="text-gray-200 font-light">–</span>
                      <span className={`font-black text-lg ${match.winner === 'player2' ? 'text-gray-900' : 'text-gray-300'}`}>{s2}</span>
                    </div>
                    <span className="text-xs text-gray-400">{sportEmoji} {fmtDate(match.date)}</span>
                  </div>
                  <span className={`text-sm font-medium truncate text-right ${match.winner === 'player2' ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>
                    {t2}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
