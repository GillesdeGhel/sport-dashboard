import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area, AreaChart, CartesianGrid, Line, LineChart, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Match, Player } from '../types';
import {
  activityLevel, activityWeeks, ACTIVITY_RAMP, biggestWin, byDateDesc, closestMatch,
  defaultPlayerIds, fmtShort, matchPlayerIds, MatchRecord, netSeries,
  Period, PERIOD_LABEL, inPeriod, pct, playerColorMap, rivalryMatches, rivalrySeries,
  SPORT_EMOJI, SPORT_LABEL, summarizePlayer, PlayerSummary, team1Label, team2Label,
} from '../utils/analytics';
import { Avatar, Card, CardHeader, Chip, ChipRow, FormDots, MatchCard, Meter, SectionTitle } from './ui';

interface DashboardProps {
  players: Player[];
  matches: Match[];
}

const AXIS_TICK = { fontSize: 11, fill: '#94a3b8' };
const GRID = '#eef2f6';
const INK = '#0f172a';

const TooltipBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-lg px-3 py-2 text-xs text-slate-600 max-w-[220px]">
    {children}
  </div>
);

// ── Rivalry curve ──────────────────────────────────────────────────────────
const RivalryChart: React.FC<{ p1: Player; p2: Player; c1: string; c2: string; matches: Match[] }> =
  ({ p1, p2, c1, c2, matches }) => {
    const data = useMemo(() => rivalrySeries(matches, p1, p2), [matches, p1, p2]);
    const diffs = data.map(d => d.diff);
    const max = Math.max(...diffs), min = Math.min(...diffs);
    const off = max <= 0 ? 0 : min >= 0 ? 1 : max / (max - min);
    const lead = data[data.length - 1].diff;

    return (
      <Card className="p-4 sm:p-5">
        <CardHeader
          title="Courbe de la rivalité"
          sub="Écart cumulé de victoires, match après match"
          right={
            <span className="text-sm font-semibold tabular-nums text-slate-800 whitespace-nowrap">
              {lead === 0 ? 'Égalité' : `${lead > 0 ? p1.name : p2.name} +${Math.abs(lead)}`}
            </span>
          }
        />
        <div className="flex justify-between text-[11px] font-medium text-slate-500 mb-1">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c1 }} />↑ {p1.name} devant</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c2 }} />↓ {p2.name} devant</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="rivalryFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset={0} stopColor={c1} stopOpacity={0.28} />
                <stop offset={off} stopColor={c1} stopOpacity={0.06} />
                <stop offset={off} stopColor={c2} stopOpacity={0.06} />
                <stop offset={1} stopColor={c2} stopOpacity={0.28} />
              </linearGradient>
              <linearGradient id="rivalryStroke" x1="0" y1="0" x2="0" y2="1">
                <stop offset={off} stopColor={c1} />
                <stop offset={off} stopColor={c2} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="n" tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis
              tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false}
              domain={[Math.min(0, min) - 1, Math.max(0, max) + 1]} tickFormatter={v => `${Math.abs(v)}`}
            />
            <ReferenceLine y={0} stroke="#cbd5e1" />
            <Tooltip
              cursor={{ stroke: '#94a3b8', strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d: any = payload[0].payload;
                if (d.n === 0) return <TooltipBox>Départ</TooltipBox>;
                return (
                  <TooltipBox>
                    <div className="font-semibold text-slate-800">Match {d.n} · {fmtShort(d.date)}</div>
                    <div>Gagné par <b className="text-slate-800">{d.winnerName}</b></div>
                    <div className="tabular-nums">{p1.name} {d.score}</div>
                    <div className="mt-1 tabular-nums">
                      Écart : {d.diff === 0 ? 'égalité' : `${d.diff > 0 ? p1.name : p2.name} +${Math.abs(d.diff)}`}
                    </div>
                  </TooltipBox>
                );
              }}
            />
            <Area
              type="linear" dataKey="diff" stroke="url(#rivalryStroke)" strokeWidth={2}
              fill="url(#rivalryFill)" isAnimationActive={false}
              dot={false} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: INK }}
            />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-[11px] text-slate-400 text-center mt-1">Numéro du match</p>
      </Card>
    );
  };

// ── Net result curve (when not exactly two rivals) ─────────────────────────
const NetChart: React.FC<{ players: Player[]; colors: Record<string, string>; matches: Match[] }> =
  ({ players, colors, matches }) => {
    const data = useMemo(() => netSeries(matches, players), [matches, players]);
    return (
      <Card className="p-4 sm:p-5">
        <CardHeader title="Bilan cumulé" sub="Victoires moins défaites, match après match" />
        {players.length > 1 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-medium text-slate-500 mb-1">
            {players.map(p => (
              <span key={p.id} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[p.id] }} />{p.name}
              </span>
            ))}
          </div>
        )}
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="n" tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
            <ReferenceLine y={0} stroke="#cbd5e1" />
            <Tooltip
              cursor={{ stroke: '#94a3b8', strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d: any = payload[0].payload;
                return (
                  <TooltipBox>
                    <div className="font-semibold text-slate-800 mb-1">{d.date ? `Match ${d.n} · ${fmtShort(d.date)}` : 'Départ'}</div>
                    {players.map(p => (
                      <div key={p.id} className="flex items-center gap-1.5 tabular-nums">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[p.id] }} />
                        {p.name} : <b className="text-slate-800">{d[p.id] > 0 ? '+' : ''}{d[p.id]}</b>
                      </div>
                    ))}
                  </TooltipBox>
                );
              }}
            />
            {players.map(p => (
              <Line
                key={p.id} type="linear" dataKey={p.id} name={p.name} stroke={colors[p.id]}
                strokeWidth={2} dot={false} isAnimationActive={false}
                activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <p className="text-[11px] text-slate-400 text-center mt-1">Numéro du match</p>
      </Card>
    );
  };

// ── Activity calendar ──────────────────────────────────────────────────────
const WEEKS = 26;
const ActivityCalendar: React.FC<{ matches: Match[] }> = ({ matches }) => {
  const weeks = useMemo(() => activityWeeks(matches, WEEKS), [matches]);
  const [hover, setHover] = useState<{ date: Date; count: number } | null>(null);
  const days = weeks.flatMap(w => w.days).filter(d => !d.future);
  const played = days.filter(d => d.count > 0).length;
  const total = days.reduce((a, d) => a + d.count, 0);
  // one label per month change, skipped when too close to the previous one
  let lastLabel = -3;
  const monthLabels = weeks.map((w, i) => {
    const m = w.start.getMonth();
    const prev = i > 0 ? weeks[i - 1].start.getMonth() : -1;
    if (m === prev || i - lastLabel < 3) return '';
    lastLabel = i;
    return w.start.toLocaleDateString('fr-BE', { month: 'short' });
  });

  return (
    <Card className="p-4 sm:p-5">
      <CardHeader
        title="Activité"
        sub={`${total} match${total !== 1 ? 's' : ''} sur ${played} jour${played !== 1 ? 's' : ''} · 6 derniers mois`}
      />
      <div className="grid gap-[3px] max-w-xl" style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}>
        {monthLabels.map((l, i) => (
          <span key={`m${i}`} className="text-[9px] text-slate-400 leading-none h-3 whitespace-nowrap overflow-visible">{l}</span>
        ))}
        {Array.from({ length: 7 }).map((_, dow) =>
          weeks.map((w, wi) => {
            const d = w.days[dow];
            return (
              <div
                key={`${wi}-${dow}`}
                className="aspect-square rounded-[3px]"
                title={d.future ? '' : `${d.date.toLocaleDateString('fr-BE', { weekday: 'short', day: 'numeric', month: 'short' })} : ${d.count} match${d.count !== 1 ? 's' : ''}`}
                onMouseEnter={() => !d.future && setHover(d)}
                onClick={() => !d.future && setHover(d)}
                style={{
                  backgroundColor: d.future ? 'transparent' : ACTIVITY_RAMP[activityLevel(d.count)],
                  gridRow: dow + 2,
                  gridColumn: wi + 1,
                }}
              />
            );
          })
        )}
      </div>
      <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400">
        <span className="tabular-nums min-h-[1em]">
          {hover ? `${hover.date.toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' })} : ${hover.count} match${hover.count !== 1 ? 's' : ''}` : 'Touchez une case pour le détail'}
        </span>
        <span className="flex items-center gap-1">
          Moins
          {ACTIVITY_RAMP.map(c => <span key={c} className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: c }} />)}
          Plus
        </span>
      </div>
    </Card>
  );
};

// ── Records ────────────────────────────────────────────────────────────────
const RecordTile: React.FC<{ icon: string; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
  <Card className="p-4">
    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
      <span className="text-sm">{icon}</span>{label}
    </div>
    {children}
  </Card>
);

const MatchRecordBody: React.FC<{ rec: MatchRecord | null; closest?: boolean }> = ({ rec, closest }) => {
  if (!rec) return <div className="text-slate-400 text-sm">—</div>;
  const m = rec.match;
  const winner = m.winner === 'player1' ? team1Label(m) : team2Label(m);
  const loser = m.winner === 'player1' ? team2Label(m) : team1Label(m);
  const scores = m.sets.map(s => m.winner === 'player1' ? `${s.player1Score}–${s.player2Score}` : `${s.player2Score}–${s.player1Score}`);
  return (
    <>
      <div className="text-lg font-extrabold text-slate-900 leading-tight">
        {closest ? Math.abs(rec.margin) : `+${rec.margin}`}{' '}
        <span className="text-sm font-semibold text-slate-500">{closest ? "pt(s) d'écart au total" : 'points au total'}</span>
      </div>
      <div className="text-sm text-slate-700 truncate"><b>{winner}</b> bat {loser}</div>
      <div className="text-xs text-slate-400 tabular-nums">{scores.join(' · ')} · {fmtShort(m.date)}</div>
    </>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────
const Dashboard: React.FC<DashboardProps> = ({ players, matches }) => {
  const colors = useMemo(() => playerColorMap(players), [players]);
  const sortedPlayers = useMemo(() => [...players].sort((a, b) => a.name.localeCompare(b.name, 'fr')), [players]);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => defaultPlayerIds(players));
  const [sport, setSport] = useState<string>('badminton');
  const [period, setPeriod] = useState<Period>('all');
  const [togetherOnly, setTogetherOnly] = useState(false);

  const toggle = (id: string) =>
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]));

  // selection order follows the fixed alphabetical order, so colors and sides never swap
  const selected = useMemo(() => sortedPlayers.filter(p => selectedIds.includes(p.id)), [sortedPlayers, selectedIds]);

  // Sport + players (no period): used by the activity calendar
  const baseMatches = useMemo(() => matches.filter(m => {
    if (sport !== 'all' && m.sportType !== sport) return false;
    if (selectedIds.length === 0) return true;
    const ids = matchPlayerIds(m);
    return togetherOnly ? selectedIds.every(id => ids.includes(id)) : ids.some(id => selectedIds.includes(id));
  }), [matches, sport, selectedIds, togetherOnly]);

  const filtered = useMemo(() => baseMatches.filter(m => inPeriod(m.date, period)), [baseMatches, period]);

  const summaries: PlayerSummary[] = useMemo(
    () => selected.map(p => summarizePlayer(p, colors[p.id], filtered)),
    [selected, colors, filtered]
  );

  const rivals = selected.length === 2 ? selected : null;
  const h2h = useMemo(() => {
    if (!rivals) return null;
    const ms = rivalryMatches(filtered, rivals[0].id, rivals[1].id);
    if (ms.length === 0) return null;
    const w1 = ms.filter(m => (m.player1Id === rivals[0].id || m.player3Id === rivals[0].id) ? m.winner === 'player1' : m.winner === 'player2').length;
    return { ms, w1, w2: ms.filter(m => m.winner).length - w1 };
  }, [rivals, filtered]);

  const recent = useMemo(() => [...filtered].sort(byDateDesc).slice(0, 5), [filtered]);
  const big = useMemo(() => biggestWin(filtered), [filtered]);
  const close = useMemo(() => closestMatch(filtered), [filtered]);

  const hasData = selected.length > 0 && filtered.length > 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">{filtered.length} match{filtered.length !== 1 ? 's' : ''} dans la sélection</p>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────── */}
      <Card className="p-4 space-y-3 overflow-hidden">
        <ChipRow label="Sport">
          {['badminton', 'padel', 'all'].map(s => (
            <Chip key={s} active={sport === s} onClick={() => setSport(s)}>{SPORT_EMOJI[s]} {SPORT_LABEL[s]}</Chip>
          ))}
        </ChipRow>
        <ChipRow label="Période">
          {(Object.keys(PERIOD_LABEL) as Period[]).map(p => (
            <Chip key={p} active={period === p} onClick={() => setPeriod(p)}>{PERIOD_LABEL[p]}</Chip>
          ))}
        </ChipRow>
        <ChipRow label="Joueurs">
          {sortedPlayers.map(p => (
            <Chip key={p.id} active={selectedIds.includes(p.id)} onClick={() => toggle(p.id)} color={colors[p.id]}>{p.name}</Chip>
          ))}
        </ChipRow>
        {selected.length > 1 && (
          <label className="flex items-center gap-2 text-sm text-slate-600 pt-1 cursor-pointer select-none">
            <input
              type="checkbox" checked={togetherOnly} onChange={e => setTogetherOnly(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 accent-slate-900"
            />
            Seulement les matchs avec tous les joueurs sélectionnés
          </label>
        )}
      </Card>

      {selected.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <div className="text-5xl mb-3">👆</div>
          <p className="font-medium">Sélectionne des joueurs pour voir les stats</p>
        </div>
      )}
      {selected.length > 0 && filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <div className="text-5xl mb-3">🏸</div>
          <p className="font-medium">Aucun match trouvé avec ces filtres</p>
        </div>
      )}

      {hasData && (
        <>
          {/* ── Head to head ───────────────────────────────────────── */}
          {rivals && h2h && (
            <>
              <SectionTitle>Face à face</SectionTitle>
              <Card className="p-5 mb-3">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  {[0, 1].map(i => {
                    const s = summaries[i];
                    const p = rivals[i];
                    const streak = s.currentStreak.type === 'W' && s.currentStreak.count > 1;
                    return (
                      <div key={p.id} className={`flex flex-col items-center gap-1.5 text-center ${i === 1 ? 'order-3' : ''}`}>
                        <Avatar name={p.name} color={colors[p.id]} size={48} />
                        <span className="font-bold text-slate-800 leading-tight">{p.name}</span>
                        {streak && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                            🔥 {s.currentStreak.count} d'affilée
                          </span>
                        )}
                      </div>
                    );
                  })}
                  <div className="order-2 flex flex-col items-center">
                    <div className="flex items-baseline gap-2 tabular-nums">
                      <span className={`text-5xl font-black ${h2h.w1 >= h2h.w2 ? 'text-slate-900' : 'text-slate-300'}`}>{h2h.w1}</span>
                      <span className="text-2xl text-slate-300">–</span>
                      <span className={`text-5xl font-black ${h2h.w2 >= h2h.w1 ? 'text-slate-900' : 'text-slate-300'}`}>{h2h.w2}</span>
                    </div>
                    <span className="text-xs text-slate-400 mt-1">{h2h.ms.length} match{h2h.ms.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="flex h-2.5 gap-[2px] mt-4">
                  <div className="rounded-l-full" style={{ width: `${(h2h.w1 / Math.max(1, h2h.w1 + h2h.w2)) * 100}%`, backgroundColor: colors[rivals[0].id] }} />
                  <div className="rounded-r-full" style={{ width: `${(h2h.w2 / Math.max(1, h2h.w1 + h2h.w2)) * 100}%`, backgroundColor: colors[rivals[1].id] }} />
                </div>
                <div className="flex justify-between text-xs font-semibold tabular-nums text-slate-600 mt-1.5">
                  <span>{pct(h2h.w1, h2h.w1 + h2h.w2) ?? 0}%</span>
                  <span>{pct(h2h.w2, h2h.w1 + h2h.w2) ?? 0}%</span>
                </div>
              </Card>
              <RivalryChart p1={rivals[0]} p2={rivals[1]} c1={colors[rivals[0].id]} c2={colors[rivals[1].id]} matches={filtered} />
            </>
          )}
          {!(rivals && h2h) && (
            <>
              <SectionTitle>Évolution</SectionTitle>
              <NetChart players={selected} colors={colors} matches={filtered} />
            </>
          )}

          {/* ── Players ───────────────────────────────────────────── */}
          <SectionTitle>Joueurs</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {summaries.map(s => (
              <Card key={s.player.id} className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar name={s.player.name} color={s.color} />
                  <div className="flex-1 min-w-0">
                    <Link to={`/players/${s.player.id}`} className="font-bold text-slate-800 hover:underline">{s.player.name}</Link>
                    <div className="text-xs text-slate-500 tabular-nums">{s.wins} V · {s.losses} D</div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-slate-900 tabular-nums leading-none">{s.winRate}<span className="text-lg text-slate-400">%</span></div>
                    <div className="text-[11px] text-slate-400">victoires</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div className="rounded-xl bg-slate-50 py-2">
                    <div className="font-bold text-slate-800 tabular-nums">{s.setsWon}–{s.setsLost}</div>
                    <div className="text-[11px] text-slate-400">sets</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 py-2">
                    <div className={`font-bold tabular-nums ${s.avgMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {s.avgMargin > 0 ? '+' : ''}{s.avgMargin}
                    </div>
                    <div className="text-[11px] text-slate-400">pts / match</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 py-2">
                    <div className="font-bold text-slate-800 tabular-nums">{s.longestWinStreak}</div>
                    <div className="text-[11px] text-slate-400">meilleure série</div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 mb-1.5">Forme · 10 derniers (ancien → récent)</div>
                <FormDots results={s.form} />
              </Card>
            ))}
          </div>

          {/* ── Records ───────────────────────────────────────────── */}
          <SectionTitle>Records</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <RecordTile icon="🔥" label="Série en cours">
              <div className="space-y-1.5">
                {summaries.map(s => (
                  <div key={s.player.id} className="flex items-center gap-2 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="font-medium text-slate-700 flex-1 truncate">{s.player.name}</span>
                    <span className="tabular-nums font-semibold text-slate-900">
                      {s.currentStreak.type === null ? '—' : `${s.currentStreak.count} ${s.currentStreak.type === 'W' ? 'victoire' : 'défaite'}${s.currentStreak.count > 1 ? 's' : ''}`}
                    </span>
                  </div>
                ))}
              </div>
            </RecordTile>
            <RecordTile icon="🏅" label="Plus longue série de victoires">
              {(() => {
                const best = [...summaries].sort((a, b) => b.longestWinStreak - a.longestWinStreak)[0];
                return best && best.longestWinStreak > 0 ? (
                  <>
                    <div className="text-lg font-extrabold text-slate-900">{best.longestWinStreak} victoires</div>
                    <div className="text-sm text-slate-700 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: best.color }} />{best.player.name}
                    </div>
                  </>
                ) : <div className="text-slate-400 text-sm">—</div>;
              })()}
            </RecordTile>
            <RecordTile icon="💥" label="Plus grosse victoire">
              <MatchRecordBody rec={big} />
            </RecordTile>
            <RecordTile icon="🤏" label="Match le plus serré">
              <MatchRecordBody rec={close} closest />
            </RecordTile>
            <RecordTile icon="🔄" label="Remontadas (set 1 perdu, match gagné)">
              <div className="space-y-1.5">
                {summaries.map(s => (
                  <div key={s.player.id} className="flex items-center gap-2 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="font-medium text-slate-700 flex-1 truncate">{s.player.name}</span>
                    <span className="tabular-nums font-semibold text-slate-900">{s.comebacks}</span>
                  </div>
                ))}
              </div>
            </RecordTile>
          </div>

          {/* ── Pressure ──────────────────────────────────────────── */}
          <SectionTitle>Sous pression</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card className="p-4 sm:p-5">
              <CardHeader title="Sets serrés gagnés" sub="Sets gagnés avec 2 points d'écart ou moins (padel : 1 jeu)" />
              <div className="space-y-3">
                {summaries.map(s => (
                  <div key={s.player.id}>
                    <div className="text-xs font-medium text-slate-600 mb-1">{s.player.name}</div>
                    <Meter value={pct(s.closeSets.won, s.closeSets.total)} color={s.color} label={`${s.closeSets.won}/${s.closeSets.total}`} />
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-4 sm:p-5">
              <CardHeader title="Prolongations gagnées" sub="Sets au-delà de 21 points (padel : tie-break 7–6)" />
              <div className="space-y-3">
                {summaries.map(s => (
                  <div key={s.player.id}>
                    <div className="text-xs font-medium text-slate-600 mb-1">{s.player.name}</div>
                    <Meter value={pct(s.extraSets.won, s.extraSets.total)} color={s.color} label={`${s.extraSets.won}/${s.extraSets.total}`} />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ── First set ─────────────────────────────────────────── */}
          <SectionTitle>Poids du premier set</SectionTitle>
          <Card className="p-4 sm:p-5">
            <CardHeader title="% de matchs gagnés selon le 1er set" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              {summaries.map(s => (
                <div key={s.player.id}>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />{s.player.name}
                  </div>
                  <div className="text-[11px] text-slate-500 mb-0.5">Après avoir gagné le 1er set</div>
                  <Meter value={pct(s.afterWinningSet1.won, s.afterWinningSet1.total)} color={s.color} label={`${s.afterWinningSet1.won}/${s.afterWinningSet1.total}`} />
                  <div className="text-[11px] text-slate-500 mb-0.5 mt-2">Après avoir perdu le 1er set</div>
                  <Meter value={pct(s.afterLosingSet1.won, s.afterLosingSet1.total)} color={s.color} label={`${s.afterLosingSet1.won}/${s.afterLosingSet1.total}`} />
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* ── Activity ────────────────────────────────────────────── */}
      {selected.length > 0 && baseMatches.length > 0 && (
        <>
          <SectionTitle>Régularité</SectionTitle>
          <ActivityCalendar matches={baseMatches} />
        </>
      )}

      {/* ── Recent ──────────────────────────────────────────────── */}
      {hasData && (
        <>
          <div className="flex items-center justify-between mt-8 mb-3 px-1">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Derniers matchs</h2>
            <Link to="/matches" className="text-xs font-semibold text-slate-600 hover:text-slate-900">Tout voir →</Link>
          </div>
          <Card className="divide-y divide-slate-100">
            {recent.map(m => <MatchCard key={m.id} match={m} colors={colors} showDate />)}
          </Card>
        </>
      )}
    </div>
  );
};

export default Dashboard;
