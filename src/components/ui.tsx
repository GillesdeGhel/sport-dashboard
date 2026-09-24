import React from 'react';
import { Match } from '../types';
import { isCloseSet, isExtraTimeSet, setsWon, SPORT_EMOJI } from '../utils/analytics';

// ── Layout primitives ──────────────────────────────────────────────────────
export const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>
    {children}
  </div>
);

export const CardHeader: React.FC<{ title: string; sub?: React.ReactNode; right?: React.ReactNode }> = ({ title, sub, right }) => (
  <div className="flex items-start justify-between gap-3 mb-4">
    <div>
      <h3 className="text-[15px] font-semibold text-slate-800">{title}</h3>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
    {right}
  </div>
);

export const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 mt-8 mb-3 px-1">{children}</h2>
);

export const PageTitle: React.FC<{ title: string; right?: React.ReactNode }> = ({ title, right }) => (
  <div className="flex items-center justify-between gap-3 mb-5">
    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
    {right}
  </div>
);

// ── Filter chips ───────────────────────────────────────────────────────────
export const ChipRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center gap-2 min-w-0">
    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 w-14 shrink-0">{label}</span>
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mr-4 pr-4 sm:mr-0 sm:pr-0 sm:flex-wrap">
      {children}
    </div>
  </div>
);

export const Chip: React.FC<{
  active: boolean;
  onClick: () => void;
  color?: string;
  children: React.ReactNode;
}> = ({ active, onClick, color, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`shrink-0 inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-[13px] font-medium border transition-colors ${
      active
        ? 'bg-slate-900 text-white border-slate-900'
        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
    }`}
  >
    {color && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />}
    {children}
  </button>
);

export const Avatar: React.FC<{ name: string; color: string; size?: number }> = ({ name, color, size = 36 }) => (
  <div
    className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
    style={{ backgroundColor: color, width: size, height: size, fontSize: size * 0.42 }}
  >
    {name.charAt(0).toUpperCase()}
  </div>
);

export const FormDots: React.FC<{ results: (boolean | null)[] }> = ({ results }) => (
  <div className="flex gap-1" aria-label="Forme récente">
    {results.map((w, i) => (
      <span
        key={i}
        title={w === null ? 'Sans résultat' : w ? 'Victoire' : 'Défaite'}
        className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold ${
          w === null ? 'bg-slate-100 text-slate-400' : w ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
        }`}
      >
        {w === null ? '–' : w ? 'V' : 'D'}
      </span>
    ))}
  </div>
);

// Horizontal proportion meter with its value always written next to it.
export const Meter: React.FC<{ value: number | null; color: string; label?: string }> = ({ value, color, label }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
      {value !== null && <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />}
    </div>
    <span className="text-sm font-semibold tabular-nums text-slate-800 w-11 text-right">
      {value === null ? '—' : `${value}%`}
    </span>
    {label && <span className="text-[11px] text-slate-400 w-12 tabular-nums">{label}</span>}
  </div>
);

// ── Match display ──────────────────────────────────────────────────────────
// One bar per set: left segment = team 1 points, right = team 2 points.
export const SetBars: React.FC<{ match: Match; c1: string; c2: string }> = ({ match, c1, c2 }) => (
  <div className="space-y-1.5">
    {match.sets.map((s, i) => {
      const total = s.player1Score + s.player2Score || 1;
      const close = isCloseSet(match.sportType, s);
      const extra = isExtraTimeSet(match.sportType, s);
      return (
        <div key={s.id || i} className="grid grid-cols-[1.5rem_1fr_1.5rem_auto] items-center gap-2">
          <span className={`text-sm tabular-nums text-right ${s.winner === 'player1' ? 'font-bold text-slate-900' : 'text-slate-400'}`}>
            {s.player1Score}
          </span>
          <div className="flex h-2 gap-[2px]" title={`Set ${i + 1} : ${s.player1Score}–${s.player2Score}`}>
            <div className="rounded-l-full" style={{ width: `${(s.player1Score / total) * 100}%`, backgroundColor: c1, opacity: s.winner === 'player1' ? 1 : 0.35 }} />
            <div className="rounded-r-full" style={{ width: `${(s.player2Score / total) * 100}%`, backgroundColor: c2, opacity: s.winner === 'player2' ? 1 : 0.35 }} />
          </div>
          <span className={`text-sm tabular-nums ${s.winner === 'player2' ? 'font-bold text-slate-900' : 'text-slate-400'}`}>
            {s.player2Score}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 w-14">
            {extra ? 'prolong.' : close ? 'serré' : ''}
          </span>
        </div>
      );
    })}
  </div>
);

const TeamName: React.FC<{ main: string; partner?: string; won: boolean; color: string; align: 'left' | 'right' }> =
  ({ main, partner, won, color, align }) => (
    <div className={`min-w-0 flex items-center gap-2 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      <span className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: color }} />
      <div className="min-w-0">
        <div className={`truncate text-[15px] leading-tight ${won ? 'font-bold text-slate-900' : 'font-medium text-slate-500'}`}>
          {main}{won && ' 🏆'}
        </div>
        {partner && <div className="truncate text-xs text-slate-400">& {partner}</div>}
      </div>
    </div>
  );

export const MatchCard: React.FC<{
  match: Match;
  colors: Record<string, string>;
  showDate?: boolean;
  actions?: React.ReactNode;
}> = ({ match, colors, showDate, actions }) => {
  const { t1, t2 } = setsWon(match);
  const doubles = match.matchType === 'doubles';
  const c1 = colors[match.player1Id] || '#94a3b8';
  const c2 = colors[match.player2Id] || '#94a3b8';
  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-2 mb-3 text-xs text-slate-400">
        <span>
          {SPORT_EMOJI[match.sportType] ?? '🏅'} {doubles ? 'Double' : 'Simple'}
          {showDate && <> · {new Date(match.date).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short', year: 'numeric' })}</>}
        </span>
        {actions}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-3">
        <TeamName main={match.player1Name} partner={doubles ? match.player3Name : undefined} won={match.winner === 'player1'} color={c1} align="left" />
        <div className="flex items-baseline gap-1.5 tabular-nums">
          <span className={`text-2xl font-extrabold ${match.winner === 'player1' ? 'text-slate-900' : 'text-slate-300'}`}>{t1}</span>
          <span className="text-slate-300">–</span>
          <span className={`text-2xl font-extrabold ${match.winner === 'player2' ? 'text-slate-900' : 'text-slate-300'}`}>{t2}</span>
        </div>
        <TeamName main={match.player2Name} partner={doubles ? match.player4Name : undefined} won={match.winner === 'player2'} color={c2} align="right" />
      </div>
      {match.sets.length > 0 && <SetBars match={match} c1={c1} c2={c2} />}
    </div>
  );
};
