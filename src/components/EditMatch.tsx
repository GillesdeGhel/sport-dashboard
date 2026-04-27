import React, { useState } from 'react';
import { Player, Match, Set, SportType, MatchType } from '../types';

interface EditMatchProps {
  match: Match;
  players: Player[];
  onUpdateMatch: (match: Match) => void;
  onCancel: () => void;
}

const EditMatch: React.FC<EditMatchProps> = ({ match, players, onUpdateMatch, onCancel }) => {
  const [sportType, setSportType] = useState<SportType>(match.sportType);
  const [matchType, setMatchType] = useState<MatchType>(match.matchType);
  const [player1Id, setPlayer1Id] = useState(match.player1Id);
  const [player2Id, setPlayer2Id] = useState(match.player2Id);
  const [player3Id, setPlayer3Id] = useState(match.player3Id || '');
  const [player4Id, setPlayer4Id] = useState(match.player4Id || '');
  const [sets, setSets] = useState<Set[]>(match.sets);
  const [setForm, setSetForm] = useState({ player1Score: '', player2Score: '' });
  const [date, setDate] = useState(() => new Date(match.date).toISOString().slice(0, 10));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getPlayerName = (playerId: string) => players.find(p => p.id === playerId)?.name || '?';

  const getTeam1Label = () => {
    if (matchType === 'doubles') {
      const p1 = player1Id ? getPlayerName(player1Id) : 'J1';
      const p3 = player3Id ? getPlayerName(player3Id) : 'J3';
      return `${p1} & ${p3}`;
    }
    return player1Id ? getPlayerName(player1Id) : 'Joueur 1';
  };

  const getTeam2Label = () => {
    if (matchType === 'doubles') {
      const p2 = player2Id ? getPlayerName(player2Id) : 'J2';
      const p4 = player4Id ? getPlayerName(player4Id) : 'J4';
      return `${p2} & ${p4}`;
    }
    return player2Id ? getPlayerName(player2Id) : 'Joueur 2';
  };

  const handleAddSet = () => {
    setError('');
    const p1 = parseInt(setForm.player1Score, 10);
    const p2 = parseInt(setForm.player2Score, 10);
    if (isNaN(p1) || isNaN(p2)) { setError('Veuillez entrer des scores valides'); return; }
    if (p1 < 0 || p2 < 0) { setError('Les scores ne peuvent pas être négatifs'); return; }
    if (p1 === p2) { setError('Les scores ne peuvent pas être égaux'); return; }
    const winner = p1 > p2 ? 'player1' : 'player2';
    setSets([...sets, { id: crypto.randomUUID(), player1Score: p1, player2Score: p2, winner }]);
    setSetForm({ player1Score: '', player2Score: '' });
  };

  const handleRemoveSet = (id: string) => setSets(sets.filter(s => s.id !== id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!player1Id || !player2Id) { setError('Veuillez sélectionner les deux joueurs'); return; }
    if (player1Id === player2Id) { setError('Un joueur ne peut pas jouer contre lui-même'); return; }
    if (matchType === 'doubles') {
      if (!player3Id || !player4Id) { setError('Veuillez sélectionner les 4 joueurs pour le double'); return; }
      if (player3Id === player4Id || player1Id === player3Id || player2Id === player4Id) {
        setError('Tous les joueurs doivent être différents'); return;
      }
    }
    if (sets.length === 0) { setError('Veuillez ajouter au moins un set'); return; }

    const player1 = players.find(p => p.id === player1Id)!;
    const player2 = players.find(p => p.id === player2Id)!;
    const player3 = matchType === 'doubles' ? players.find(p => p.id === player3Id)! : undefined;
    const player4 = matchType === 'doubles' ? players.find(p => p.id === player4Id)! : undefined;

    const p1SetWins = sets.filter(s => s.winner === 'player1').length;
    const p2SetWins = sets.filter(s => s.winner === 'player2').length;
    let winner: 'player1' | 'player2' | null = null;
    if (p1SetWins > p2SetWins) winner = 'player1';
    else if (p2SetWins > p1SetWins) winner = 'player2';

    onUpdateMatch({
      ...match,
      sportType, matchType,
      player1Id, player2Id,
      player3Id: matchType === 'doubles' ? player3Id : undefined,
      player4Id: matchType === 'doubles' ? player4Id : undefined,
      player1Name: player1.name, player2Name: player2.name,
      player3Name: player3?.name, player4Name: player4?.name,
      sets, winner, date: new Date(date),
    });

    setSuccess('Match mis à jour !');
    setTimeout(() => onCancel(), 1200);
  };

  const availableForTeam1Partner = players.filter(p => p.id !== player1Id && p.id !== player2Id && p.id !== player4Id);
  const availableForTeam2Partner = players.filter(p => p.id !== player1Id && p.id !== player2Id && p.id !== player3Id);
  const p1SetWins = sets.filter(s => s.winner === 'player1').length;
  const p2SetWins = sets.filter(s => s.winner === 'player2').length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Modifier le match</h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center gap-1"
        >
          ✕ Annuler
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
          <span>✅</span> {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Infos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Infos du match</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1.5 text-sm font-medium text-gray-700">Sport</label>
              <select value={sportType} onChange={e => setSportType(e.target.value as SportType)}
                className="border border-gray-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
                <option value="padel">🎾 Padel</option>
                <option value="badminton">🏸 Badminton</option>
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-medium text-gray-700">Type</label>
              <select value={matchType} onChange={e => {
                setMatchType(e.target.value as MatchType);
                if (e.target.value === 'singles') { setPlayer3Id(''); setPlayer4Id(''); }
              }}
                className="border border-gray-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
                <option value="singles">👤 Simple</option>
                <option value="doubles">👥 Double</option>
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-medium text-gray-700">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
            </div>
          </div>
        </div>

        {/* Joueurs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Joueurs</h2>

          {matchType === 'singles' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">Joueur 1</label>
                <select value={player1Id} onChange={e => setPlayer1Id(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
                  <option value="">— Sélectionner —</option>
                  {players.map(p => <option key={p.id} value={p.id} disabled={p.id === player2Id}>{p.name}</option>)}
                </select>
              </div>
              <div className="hidden sm:flex items-center justify-center text-gray-400 font-bold text-xl pt-6">vs</div>
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">Joueur 2</label>
                <select value={player2Id} onChange={e => setPlayer2Id(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
                  <option value="">— Sélectionner —</option>
                  {players.map(p => <option key={p.id} value={p.id} disabled={p.id === player1Id}>{p.name}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Équipe 1</span>
                  {player1Id && player3Id && (
                    <span className="text-sm font-medium text-blue-700 truncate">{getPlayerName(player1Id)} & {getPlayerName(player3Id)}</span>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block mb-1 text-xs font-medium text-blue-700">Joueur 1</label>
                    <select value={player1Id} onChange={e => setPlayer1Id(e.target.value)}
                      className="border border-blue-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                      <option value="">— Sélectionner —</option>
                      {players.map(p => <option key={p.id} value={p.id} disabled={[player2Id, player3Id, player4Id].includes(p.id)}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-medium text-blue-700">Partenaire (J3)</label>
                    <select value={player3Id} onChange={e => setPlayer3Id(e.target.value)}
                      className="border border-blue-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                      <option value="">— Sélectionner —</option>
                      {availableForTeam1Partner.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="sm:hidden flex items-center justify-center">
                <span className="text-gray-400 font-bold text-lg">— VS —</span>
              </div>

              <div className="rounded-xl border-2 border-orange-200 bg-orange-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Équipe 2</span>
                  {player2Id && player4Id && (
                    <span className="text-sm font-medium text-orange-700 truncate">{getPlayerName(player2Id)} & {getPlayerName(player4Id)}</span>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block mb-1 text-xs font-medium text-orange-700">Joueur 2</label>
                    <select value={player2Id} onChange={e => setPlayer2Id(e.target.value)}
                      className="border border-orange-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm">
                      <option value="">— Sélectionner —</option>
                      {players.map(p => <option key={p.id} value={p.id} disabled={[player1Id, player3Id, player4Id].includes(p.id)}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-medium text-orange-700">Partenaire (J4)</label>
                    <select value={player4Id} onChange={e => setPlayer4Id(e.target.value)}
                      className="border border-orange-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm">
                      <option value="">— Sélectionner —</option>
                      {availableForTeam2Partner.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sets */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Sets</h2>
            {sets.length > 0 && (
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="text-blue-600 truncate max-w-[80px]">{getTeam1Label()}</span>
                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-lg font-bold">{p1SetWins} – {p2SetWins}</span>
                <span className="text-orange-600 truncate max-w-[80px]">{getTeam2Label()}</span>
              </div>
            )}
          </div>

          {sets.length > 0 && (
            <ul className="mb-4 space-y-2">
              {sets.map((set, index) => {
                const team1Won = set.winner === 'player1';
                return (
                  <li key={set.id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs text-gray-400 font-medium w-10 shrink-0">Set {index + 1}</span>
                      <span className={`text-sm truncate ${team1Won ? 'font-semibold text-blue-700' : 'text-gray-600'}`}>{getTeam1Label()}</span>
                      <span className="shrink-0 font-bold text-gray-700 bg-white border border-gray-200 px-2 py-0.5 rounded text-sm">
                        {set.player1Score} – {set.player2Score}
                      </span>
                      <span className={`text-sm truncate ${!team1Won ? 'font-semibold text-orange-700' : 'text-gray-600'}`}>{getTeam2Label()}</span>
                    </div>
                    <button type="button" onClick={() => handleRemoveSet(set.id)}
                      className="shrink-0 text-gray-400 hover:text-red-500 transition-colors ml-2">✕</button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-blue-600 mb-1 truncate">{getTeam1Label()}</div>
                <input type="number" min="0" value={setForm.player1Score}
                  onChange={e => setSetForm({ ...setForm, player1Score: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && handleAddSet()}
                  placeholder="0"
                  className="border border-gray-200 rounded-lg px-3 py-2.5 w-full text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              </div>
              <div className="text-gray-400 font-bold text-2xl pt-5">–</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-orange-600 mb-1 truncate">{getTeam2Label()}</div>
                <input type="number" min="0" value={setForm.player2Score}
                  onChange={e => setSetForm({ ...setForm, player2Score: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && handleAddSet()}
                  placeholder="0"
                  className="border border-gray-200 rounded-lg px-3 py-2.5 w-full text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white" />
              </div>
              <div className="pt-5">
                <button type="button" onClick={handleAddSet}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors whitespace-nowrap">
                  + Set
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors shadow-sm">
            Sauvegarder
          </button>
          <button type="button" onClick={onCancel}
            className="px-6 py-3 rounded-xl font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditMatch;
