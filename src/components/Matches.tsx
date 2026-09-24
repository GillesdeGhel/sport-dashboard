import React, { useMemo, useState } from 'react';
import { Match, Player } from '../types';
import EditMatch from './EditMatch';
import {
  fmtDay, groupSessions, inPeriod, matchPlayerIds, Period, PERIOD_LABEL,
  playerColorMap, SPORT_EMOJI, SPORT_LABEL,
} from '../utils/analytics';
import { Card, Chip, ChipRow, MatchCard, PageTitle } from './ui';

interface MatchesProps {
  matches: Match[];
  players: Player[];
  onUpdateMatch: (match: Match) => void;
  onDeleteMatch: (matchId: string) => void;
}

const Matches: React.FC<MatchesProps> = ({ matches, players, onUpdateMatch, onDeleteMatch }) => {
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [sport, setSport] = useState<string>('all');
  const [type, setType] = useState<string>('all');
  const [playerId, setPlayerId] = useState<string>('all');
  const [period, setPeriod] = useState<Period>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const colors = useMemo(() => playerColorMap(players), [players]);
  const sortedPlayers = useMemo(() => [...players].sort((a, b) => a.name.localeCompare(b.name, 'fr')), [players]);

  const filtered = useMemo(() => matches.filter(m => {
    if (sport !== 'all' && m.sportType !== sport) return false;
    if (type !== 'all' && m.matchType !== type) return false;
    if (playerId !== 'all' && !matchPlayerIds(m).includes(playerId)) return false;
    return inPeriod(m.date, period);
  }), [matches, sport, type, playerId, period]);

  const sessions = useMemo(() => groupSessions(filtered), [filtered]);

  if (editingMatch) {
    return (
      <EditMatch
        match={editingMatch}
        players={players}
        onUpdateMatch={m => { onUpdateMatch(m); setEditingMatch(null); }}
        onCancel={() => setEditingMatch(null)}
      />
    );
  }

  const actions = (match: Match) =>
    confirmDeleteId === match.id ? (
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-slate-500">Supprimer ?</span>
        <button
          onClick={() => { onDeleteMatch(match.id); setConfirmDeleteId(null); }}
          className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg font-medium"
        >Oui</button>
        <button
          onClick={() => setConfirmDeleteId(null)}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-medium"
        >Non</button>
      </div>
    ) : (
      <div className="flex items-center -my-1.5">
        <button
          onClick={() => setEditingMatch(match)}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
          title="Modifier" aria-label="Modifier"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => setConfirmDeleteId(match.id)}
          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
          title="Supprimer" aria-label="Supprimer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto">
      <PageTitle
        title="Matchs"
        right={
          <span className="text-sm font-semibold text-slate-500 tabular-nums">
            {filtered.length} match{filtered.length !== 1 ? 's' : ''} · {sessions.length} soirée{sessions.length !== 1 ? 's' : ''}
          </span>
        }
      />

      <Card className="p-4 space-y-3 mb-6 overflow-hidden">
        <ChipRow label="Sport">
          {['all', 'badminton', 'padel'].map(s => (
            <Chip key={s} active={sport === s} onClick={() => setSport(s)}>{SPORT_EMOJI[s]} {SPORT_LABEL[s]}</Chip>
          ))}
        </ChipRow>
        <ChipRow label="Type">
          {[['all', 'Tous'], ['singles', '👤 Simple'], ['doubles', '👥 Double']].map(([v, l]) => (
            <Chip key={v} active={type === v} onClick={() => setType(v)}>{l}</Chip>
          ))}
        </ChipRow>
        <ChipRow label="Joueur">
          <Chip active={playerId === 'all'} onClick={() => setPlayerId('all')}>Tous</Chip>
          {sortedPlayers.map(p => (
            <Chip key={p.id} active={playerId === p.id} onClick={() => setPlayerId(p.id)} color={colors[p.id]}>{p.name}</Chip>
          ))}
        </ChipRow>
        <ChipRow label="Période">
          {(Object.keys(PERIOD_LABEL) as Period[]).map(p => (
            <Chip key={p} active={period === p} onClick={() => setPeriod(p)}>{PERIOD_LABEL[p]}</Chip>
          ))}
        </ChipRow>
      </Card>

      {sessions.length === 0 && (
        <Card className="p-12 text-center text-slate-400">
          <div className="text-5xl mb-3">🏸</div>
          <p className="font-medium">Aucun match trouvé</p>
        </Card>
      )}

      <div className="space-y-6">
        {sessions.map(session => (
          <section key={session.key}>
            <div className="flex items-center justify-between gap-3 px-1 mb-2">
              <h2 className="text-sm font-bold text-slate-800">{fmtDay(session.date)}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums min-w-0 overflow-hidden">
                {session.matches.length > 1 && session.tally.slice(0, 4).map(t => (
                  <span key={t.id} className="flex items-center gap-1 whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[t.id] || '#94a3b8' }} />
                    {t.name} <b className="text-slate-800">{t.wins}</b>
                  </span>
                ))}
                {session.matches.length === 1 && <span>1 match</span>}
              </div>
            </div>
            <Card className="divide-y divide-slate-100">
              {session.matches.map(m => (
                <MatchCard key={m.id} match={m} colors={colors} actions={actions(m)} />
              ))}
            </Card>
          </section>
        ))}
      </div>
    </div>
  );
};

export default Matches;
