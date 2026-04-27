import React, { useState } from 'react';
import { Player, Match, Set, SportType, MatchType } from '../types';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AddMatchProps {
  players: Player[];
  onAddMatch: (match: Match) => void;
}

const AddMatch: React.FC<AddMatchProps> = ({ players, onAddMatch }) => {
  const [sportType, setSportType] = useState<SportType>('padel');
  const [matchType, setMatchType] = useState<MatchType>('singles');
  const [player1Id, setPlayer1Id] = useState('');
  const [player2Id, setPlayer2Id] = useState('');
  const [player3Id, setPlayer3Id] = useState('');
  const [player4Id, setPlayer4Id] = useState('');
  const [sets, setSets] = useState<Set[]>([]);
  const [setForm, setSetForm] = useState({ player1Score: '', player2Score: '' });
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAddSet = () => {
    setError('');
    setSuccess('');
    const p1 = parseInt(setForm.player1Score, 10);
    const p2 = parseInt(setForm.player2Score, 10);
    if (isNaN(p1) || isNaN(p2)) { setError('Veuillez entrer des scores valides'); return; }
    if (p1 < 0 || p2 < 0) { setError('Les scores ne peuvent pas être négatifs'); return; }
    if (p1 === p2) { setError('Les scores ne peuvent pas être égaux - quelqu\'un doit gagner le set'); return; }
    const winner = p1 > p2 ? 'player1' : 'player2';
    const newSet: Set = { id: crypto.randomUUID(), player1Score: p1, player2Score: p2, winner };
    setSets([...sets, newSet]);
    setSetForm({ player1Score: '', player2Score: '' });
  };

  const handleRemoveSet = (id: string) => {
    setSets(sets.filter(s => s.id !== id));
    setSuccess('');
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!player1Id || !player2Id) { setError('Veuillez sélectionner les deux joueurs'); return; }
    if (player1Id === player2Id) { setError('Un joueur ne peut pas jouer contre lui-même'); return; }
    if (matchType === 'doubles') {
      if (!player3Id || !player4Id) { setError('Veuillez sélectionner les 4 joueurs pour le double'); return; }
      if (player3Id === player4Id || player1Id === player3Id || player2Id === player4Id) {
        setError('Tous les joueurs doivent être différents en double'); return;
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

    const match: Match = {
      id: crypto.randomUUID(),
      sportType,
      matchType,
      player1Id,
      player2Id,
      player3Id: matchType === 'doubles' ? player3Id : undefined,
      player4Id: matchType === 'doubles' ? player4Id : undefined,
      player1Name: player1.name,
      player2Name: player2.name,
      player3Name: player3?.name,
      player4Name: player4?.name,
      sets,
      winner,
      date: new Date(date),
      duration: undefined,
      notes: undefined
    };

    onAddMatch(match);

    const matchDisplay = matchType === 'doubles'
      ? `${player1.name} & ${player3?.name} vs ${player2.name} & ${player4?.name}`
      : `${player1.name} vs ${player2.name}`;
    setSuccess(`Match ajouté avec succès : ${matchDisplay} (${sportType})`);

    setSportType('padel');
    setMatchType('singles');
    setPlayer1Id('');
    setPlayer2Id('');
    setPlayer3Id('');
    setPlayer4Id('');
    setSets([]);
    setSetForm({ player1Score: '', player2Score: '' });
    setDate(new Date().toISOString().slice(0, 10));
  };

  const availableForTeam1Partner = players.filter(p => p.id !== player1Id && p.id !== player2Id && p.id !== player4Id);
  const availableForTeam2Partner = players.filter(p => p.id !== player1Id && p.id !== player2Id && p.id !== player3Id);

  const sportEmoji = sportType === 'padel' ? '🎾' : '🏸';

  const p1SetWins = sets.filter(s => s.winner === 'player1').length;
  const p2SetWins = sets.filter(s => s.winner === 'player2').length;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Ajouter un match</h1>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
          <span className="text-lg">⚠️</span> {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
          <span className="text-lg">✅</span> {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sport + Type + Date */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Infos du match</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1.5 text-sm font-medium text-gray-700">Sport</label>
              <select
                value={sportType}
                onChange={e => { setSportType(e.target.value as SportType); setSuccess(''); }}
                className="border border-gray-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              >
                <option value="padel">🎾 Padel</option>
                <option value="badminton">🏸 Badminton</option>
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-medium text-gray-700">Type</label>
              <select
                value={matchType}
                onChange={e => {
                  setMatchType(e.target.value as MatchType);
                  setSuccess('');
                  if (e.target.value === 'singles') { setPlayer3Id(''); setPlayer4Id(''); }
                }}
                className="border border-gray-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              >
                <option value="singles">👤 Simple</option>
                <option value="doubles">👥 Double</option>
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => { setDate(e.target.value); setSuccess(''); }}
                className="border border-gray-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Player selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Joueurs</h2>

          {matchType === 'singles' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">Joueur 1</label>
                <select
                  value={player1Id}
                  onChange={e => { setPlayer1Id(e.target.value); setSuccess(''); }}
                  className="border border-gray-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                >
                  <option value="">— Sélectionner —</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id} disabled={p.id === player2Id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="hidden sm:flex items-center justify-center text-gray-400 font-bold text-xl pt-6">vs</div>
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">Joueur 2</label>
                <select
                  value={player2Id}
                  onChange={e => { setPlayer2Id(e.target.value); setSuccess(''); }}
                  className="border border-gray-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                >
                  <option value="">— Sélectionner —</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id} disabled={p.id === player1Id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            /* DOUBLES: Two team cards */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Team 1 */}
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
                    <select
                      value={player1Id}
                      onChange={e => { setPlayer1Id(e.target.value); setSuccess(''); }}
                      className="border border-blue-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    >
                      <option value="">— Sélectionner —</option>
                      {players.map(p => (
                        <option key={p.id} value={p.id} disabled={[player2Id, player3Id, player4Id].includes(p.id)}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-medium text-blue-700">Partenaire (J3)</label>
                    <select
                      value={player3Id}
                      onChange={e => { setPlayer3Id(e.target.value); setSuccess(''); }}
                      className="border border-blue-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    >
                      <option value="">— Sélectionner —</option>
                      {availableForTeam1Partner.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* VS divider on mobile */}
              <div className="sm:hidden flex items-center justify-center">
                <span className="text-gray-400 font-bold text-lg">— VS —</span>
              </div>

              {/* Team 2 */}
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
                    <select
                      value={player2Id}
                      onChange={e => { setPlayer2Id(e.target.value); setSuccess(''); }}
                      className="border border-orange-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm"
                    >
                      <option value="">— Sélectionner —</option>
                      {players.map(p => (
                        <option key={p.id} value={p.id} disabled={[player1Id, player3Id, player4Id].includes(p.id)}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-medium text-orange-700">Partenaire (J4)</label>
                    <select
                      value={player4Id}
                      onChange={e => { setPlayer4Id(e.target.value); setSuccess(''); }}
                      className="border border-orange-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm"
                    >
                      <option value="">— Sélectionner —</option>
                      {availableForTeam2Partner.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
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
                <span className="text-blue-600">{getTeam1Label()}</span>
                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-lg font-bold">{p1SetWins} – {p2SetWins}</span>
                <span className="text-orange-600">{getTeam2Label()}</span>
              </div>
            )}
          </div>

          {/* Sets list */}
          {sets.length > 0 && (
            <ul className="mb-4 space-y-2">
              {sets.map((set, index) => {
                const team1Won = set.winner === 'player1';
                return (
                  <li key={set.id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs text-gray-400 font-medium w-10 shrink-0">Set {index + 1}</span>
                      <span className={`text-sm truncate ${team1Won ? 'font-semibold text-blue-700' : 'text-gray-600'}`}>
                        {getTeam1Label()}
                      </span>
                      <span className="shrink-0 font-bold text-gray-700 bg-white border border-gray-200 px-2 py-0.5 rounded text-sm">
                        {set.player1Score} – {set.player2Score}
                      </span>
                      <span className={`text-sm truncate ${!team1Won ? 'font-semibold text-orange-700' : 'text-gray-600'}`}>
                        {getTeam2Label()}
                      </span>
                      <span className="ml-auto shrink-0 text-xs px-1.5 py-0.5 rounded font-medium" style={{
                        background: team1Won ? '#dbeafe' : '#ffedd5',
                        color: team1Won ? '#1d4ed8' : '#c2410c'
                      }}>
                        ✓ {team1Won ? getTeam1Label() : getTeam2Label()}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 text-gray-400 hover:text-red-500 transition-colors ml-2"
                      onClick={() => handleRemoveSet(set.id)}
                      title="Supprimer ce set"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Score input */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-blue-600 mb-1 truncate">{getTeam1Label()}</div>
                <input
                  type="number"
                  min="0"
                  value={setForm.player1Score}
                  onChange={e => { setSetForm({ ...setForm, player1Score: e.target.value }); setSuccess(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleAddSet()}
                  placeholder="0"
                  className="border border-gray-200 rounded-lg px-3 py-2.5 w-full text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div className="text-gray-400 font-bold text-2xl pt-5">–</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-orange-600 mb-1 truncate">{getTeam2Label()}</div>
                <input
                  type="number"
                  min="0"
                  value={setForm.player2Score}
                  onChange={e => { setSetForm({ ...setForm, player2Score: e.target.value }); setSuccess(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleAddSet()}
                  placeholder="0"
                  className="border border-gray-200 rounded-lg px-3 py-2.5 w-full text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                />
              </div>
              <div className="pt-5">
                <button
                  type="button"
                  onClick={handleAddSet}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors whitespace-nowrap"
                >
                  + Set
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">Appuyer sur Entrée ou cliquer "+ Set" pour valider</p>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-base transition-colors shadow-sm"
        >
          {sportEmoji} Enregistrer le match
        </button>
      </form>
    </div>
  );
};

export default AddMatch;
