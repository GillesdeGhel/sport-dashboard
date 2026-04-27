import React, { useState } from 'react';
import { Match, Player } from '../types';
import EditMatch from './EditMatch';

interface MatchesProps {
  matches: Match[];
  players: Player[];
  onUpdateMatch: (match: Match) => void;
  onDeleteMatch: (matchId: string) => void;
}

const SPORT_EMOJI: Record<string, string> = { padel: '🎾', badminton: '🏸' };

const Matches: React.FC<MatchesProps> = ({ matches, players, onUpdateMatch, onDeleteMatch }) => {
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [filterSport, setFilterSport] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleUpdateMatch = (updatedMatch: Match) => {
    onUpdateMatch(updatedMatch);
    setEditingMatch(null);
  };

  if (editingMatch) {
    return (
      <EditMatch
        match={editingMatch}
        players={players}
        onUpdateMatch={handleUpdateMatch}
        onCancel={() => setEditingMatch(null)}
      />
    );
  }

  // Sort newest first, then filter
  const sorted = [...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const filtered = sorted.filter(m => {
    if (filterSport !== 'all' && m.sportType !== filterSport) return false;
    if (filterType !== 'all' && m.matchType !== filterType) return false;
    return true;
  });

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('fr-BE', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Matchs</h1>
          <span className="bg-gray-100 text-gray-600 text-sm font-semibold px-2.5 py-0.5 rounded-full">
            {filtered.length}
          </span>
        </div>
        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={filterSport}
            onChange={e => setFilterSport(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les sports</option>
            <option value="padel">🎾 Padel</option>
            <option value="badminton">🏸 Badminton</option>
          </select>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Simple & Double</option>
            <option value="singles">👤 Simple</option>
            <option value="doubles">👥 Double</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
          <div className="text-5xl mb-3">🎾</div>
          <p className="font-medium">Aucun match trouvé</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(match => {
          const isDoubles = match.matchType === 'doubles';
          const team1Won = match.winner === 'player1';
          const team2Won = match.winner === 'player2';
          const setsWonTeam1 = match.sets.filter(s => s.winner === 'player1').length;
          const setsWonTeam2 = match.sets.filter(s => s.winner === 'player2').length;
          const sportEmoji = SPORT_EMOJI[match.sportType] ?? '🏅';

          const team1Name = isDoubles
            ? `${match.player1Name} & ${match.player3Name}`
            : match.player1Name;
          const team2Name = isDoubles
            ? `${match.player2Name} & ${match.player4Name}`
            : match.player2Name;

          return (
            <div
              key={match.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            >
              {/* Top bar: date + sport + type */}
              <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                  <span>{formatDate(match.date)}</span>
                  <span className="text-gray-300">•</span>
                  <span>{sportEmoji} {match.sportType.charAt(0).toUpperCase() + match.sportType.slice(1)}</span>
                  <span className="text-gray-300">•</span>
                  <span>{isDoubles ? '👥 Double' : '👤 Simple'}</span>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1">
                  {confirmDeleteId === match.id ? (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-gray-500">Confirmer ?</span>
                      <button
                        onClick={() => { onDeleteMatch(match.id); setConfirmDeleteId(null); }}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded font-medium transition-colors"
                      >Oui</button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded font-medium transition-colors"
                      >Non</button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingMatch(match)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Modifier"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(match.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Supprimer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Main score row */}
              <div className="px-4 py-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                {/* Team 1 */}
                <div className={`flex flex-col items-start gap-1 ${team1Won ? '' : 'opacity-60'}`}>
                  <span className={`font-bold text-base leading-tight ${team1Won ? 'text-gray-900' : 'text-gray-600'}`}>
                    {isDoubles ? (
                      <>
                        <span className="block">{match.player1Name}</span>
                        <span className="block text-sm text-gray-500 font-medium">&amp; {match.player3Name}</span>
                      </>
                    ) : team1Name}
                  </span>
                  {team1Won && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                      🏆 Vainqueur
                    </span>
                  )}
                </div>

                {/* Score center */}
                <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
                  <div className="flex items-center gap-1">
                    <span className={`text-3xl font-black ${team1Won ? 'text-gray-900' : 'text-gray-400'}`}>
                      {setsWonTeam1}
                    </span>
                    <span className="text-xl font-light text-gray-300 mx-0.5">–</span>
                    <span className={`text-3xl font-black ${team2Won ? 'text-gray-900' : 'text-gray-400'}`}>
                      {setsWonTeam2}
                    </span>
                  </div>
                  {/* Set detail pills */}
                  <div className="flex gap-1 flex-wrap justify-center">
                    {match.sets.map((set, idx) => (
                      <span
                        key={set.id}
                        className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600"
                        title={`Set ${idx + 1}`}
                      >
                        {set.player1Score}–{set.player2Score}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Team 2 */}
                <div className={`flex flex-col items-end gap-1 ${team2Won ? '' : 'opacity-60'}`}>
                  <span className={`font-bold text-base leading-tight text-right ${team2Won ? 'text-gray-900' : 'text-gray-600'}`}>
                    {isDoubles ? (
                      <>
                        <span className="block">{match.player2Name}</span>
                        <span className="block text-sm text-gray-500 font-medium">&amp; {match.player4Name}</span>
                      </>
                    ) : team2Name}
                  </span>
                  {team2Won && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                      🏆 Vainqueur
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Matches;
