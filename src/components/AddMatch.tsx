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
    
    if (isNaN(p1) || isNaN(p2)) {
      setError('Please enter valid scores');
      return;
    }
    
    if (p1 < 0 || p2 < 0) {
      setError('Scores cannot be negative');
      return;
    }
    
    if (p1 === p2) {
      setError('Scores cannot be equal - someone must win the set');
      return;
    }
    
    const winner = p1 > p2 ? 'player1' : 'player2';
    const newSet: Set = { 
      id: crypto.randomUUID(), 
      player1Score: p1, 
      player2Score: p2, 
      winner 
    };
    
    setSets([...sets, newSet]);
    setSetForm({ player1Score: '', player2Score: '' });
  };

  const handleRemoveSet = (id: string) => {
    setSets(sets.filter(s => s.id !== id));
    setSuccess('');
  };

  const getPlayerName = (playerId: string) => {
    return players.find(p => p.id === playerId)?.name || 'Unknown Player';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validation
    if (!player1Id || !player2Id) {
      setError('Please select both players');
      return;
    }
    
    if (player1Id === player2Id) {
      setError('Players cannot play against themselves');
      return;
    }
    
    if (matchType === 'doubles') {
      if (!player3Id || !player4Id) {
        setError('Please select all four players for doubles');
        return;
      }
      if (player3Id === player4Id || player1Id === player3Id || player2Id === player4Id) {
        setError('All players must be different in doubles');
        return;
      }
    }
    
    if (sets.length === 0) {
      setError('Please add at least one set');
      return;
    }
    
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
    };
    
    onAddMatch(match);
    
    // Show success message
    const matchDisplay = matchType === 'doubles' 
      ? `${player1.name} & ${player3?.name} vs ${player2.name} & ${player4?.name}`
      : `${player1.name} vs ${player2.name}`;
    setSuccess(`Match successfully added: ${matchDisplay} (${sportType})`);
    
    // Reset form
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

  const availablePlayers = players.filter(p => 
    p.id !== player1Id && p.id !== player2Id && 
    (matchType === 'singles' || (p.id !== player3Id && p.id !== player4Id))
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Add Match</h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          ✅ {success}
        </div>
      )}
      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-6 mb-6">
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1 font-medium">Sport</label>
            <select 
              value={sportType} 
              onChange={e => {
                setSportType(e.target.value as SportType);
                setSuccess('');
              }} 
              className="border rounded px-3 py-2 w-full"
            >
              <option value="padel">Padel</option>
              <option value="badminton">Badminton</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">Match Type</label>
            <select 
              value={matchType} 
              onChange={e => {
                setMatchType(e.target.value as MatchType);
                setSuccess('');
                if (e.target.value === 'singles') {
                  setPlayer3Id('');
                  setPlayer4Id('');
                }
              }} 
              className="border rounded px-3 py-2 w-full"
            >
              <option value="singles">Singles</option>
              <option value="doubles">Doubles</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">Date</label>
            <input 
              type="date" 
              value={date} 
              onChange={e => {
                setDate(e.target.value);
                setSuccess('');
              }} 
              className="border rounded px-3 py-2 w-full" 
            />
          </div>
        </div>
        
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">Player 1</label>
            <select 
              value={player1Id} 
              onChange={e => {
                setPlayer1Id(e.target.value);
                setSuccess('');
              }} 
              className="border rounded px-3 py-2 w-full"
            >
              <option value="">Select Player 1</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">Player 2</label>
            <select 
              value={player2Id} 
              onChange={e => {
                setPlayer2Id(e.target.value);
                setSuccess('');
              }} 
              className="border rounded px-3 py-2 w-full"
            >
              <option value="">Select Player 2</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          {matchType === 'doubles' && (
            <>
              <div>
                <label className="block mb-1 font-medium">Player 3 (Partner of Player 1)</label>
                <select 
                  value={player3Id} 
                  onChange={e => {
                    setPlayer3Id(e.target.value);
                    setSuccess('');
                  }} 
                  className="border rounded px-3 py-2 w-full"
                >
                  <option value="">Select Player 3</option>
                  {availablePlayers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Player 4 (Partner of Player 2)</label>
                <select 
                  value={player4Id} 
                  onChange={e => {
                    setPlayer4Id(e.target.value);
                    setSuccess('');
                  }} 
                  className="border rounded px-3 py-2 w-full"
                >
                  <option value="">Select Player 4</option>
                  {availablePlayers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
        
        <div className="mb-4">
          <div className="font-medium mb-2">Sets ({sets.length})</div>
          {sets.length > 0 && (
            <ul className="mb-4 space-y-2">
              {sets.map((set, index) => (
                <li key={set.id} className="bg-gray-50 p-2 rounded flex justify-between items-center">
                  <span>
                    Set {index + 1}: {getPlayerName(player1Id)} {set.player1Score} - {getPlayerName(player2Id)} {set.player2Score} 
                    <span className="font-medium text-green-600 ml-2">
                      (Winner: {set.winner === 'player1' ? getPlayerName(player1Id) : getPlayerName(player2Id)})
                    </span>
                  </span>
                  <button 
                    type="button" 
                    className="text-red-500 hover:text-red-700 hover:underline" 
                    onClick={() => handleRemoveSet(set.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          
          <div className="flex gap-2 items-end">
            <input
              type="number"
              min="0"
              name="player1Score"
              value={setForm.player1Score}
              onChange={e => {
                setSetForm({ ...setForm, player1Score: e.target.value });
                setSuccess('');
              }}
              placeholder="P1 Score"
              className="border rounded px-3 py-2"
            />
            <input
              type="number"
              min="0"
              name="player2Score"
              value={setForm.player2Score}
              onChange={e => {
                setSetForm({ ...setForm, player2Score: e.target.value });
                setSuccess('');
              }}
              placeholder="P2 Score"
              className="border rounded px-3 py-2"
            />
            <button 
              type="button" 
              onClick={handleAddSet}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              Add Set
            </button>
          </div>
        </div>
        
        <button 
          type="submit" 
          className="bg-primary-600 text-white px-6 py-2 rounded font-semibold hover:bg-primary-700 transition-colors"
        >
          Add Match
        </button>
      </form>
    </div>
  );
};

export default AddMatch; 