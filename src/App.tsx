import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Player, Match } from './types';
import { supabase } from './utils/supabaseClient';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import Players from './components/Players';
import Matches from './components/Matches';
import AddMatch from './components/AddMatch';
import PlayerDetail from './components/PlayerDetail';
import CsvImport from './components/CsvImport';
import './index.css';

function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch players
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*');
      if (playersError) throw playersError;

      // Fetch matches with sets
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*, sets(*)');
      if (matchesError) throw matchesError;

      // Convert date strings to Date objects for matches
      const matchesWithDates = (matchesData || []).map((m: any) => ({
        ...m,
        date: new Date(m.date),
        sets: (m.sets || []).map((s: any) => ({ ...s }))
      }));

      setPlayers(playersData || []);
      setMatches(matchesWithDates);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError('Failed to connect to the database.');
    } finally {
      setLoading(false);
    }
  };

  const addPlayer = async (player: Player) => {
    try {
      const { data, error } = await supabase
        .from('players')
        .insert([{ name: player.name, email: player.email, phone: player.phone }])
        .select();
      if (error) throw error;
      if (data && data[0]) setPlayers(prev => [...prev, data[0]]);
    } catch (err) {
      console.error('Failed to add player:', err);
      throw new Error('Failed to add player');
    }
  };

  const updatePlayer = async (updatedPlayer: Player) => {
    try {
      const { data, error } = await supabase
        .from('players')
        .update({ name: updatedPlayer.name, email: updatedPlayer.email, phone: updatedPlayer.phone })
        .eq('id', updatedPlayer.id)
        .select();
      if (error) throw error;
      if (data && data[0]) setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? data[0] : p));
    } catch (err) {
      console.error('Failed to update player:', err);
      throw new Error('Failed to update player');
    }
  };

  const deletePlayer = async (playerId: string) => {
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId);
      if (error) throw error;
      setPlayers(prev => prev.filter(p => p.id !== playerId));
    } catch (err) {
      console.error('Failed to delete player:', err);
      throw new Error('Failed to delete player');
    }
  };

  const addMatch = async (match: Match) => {
    try {
      // Insert match
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .insert([{
          sportType: match.sportType,
          matchType: match.matchType,
          player1Id: match.player1Id,
          player2Id: match.player2Id,
          player3Id: match.player3Id,
          player4Id: match.player4Id,
          player1Name: match.player1Name,
          player2Name: match.player2Name,
          player3Name: match.player3Name,
          player4Name: match.player4Name,
          winner: match.winner || null,
          date: match.date.toISOString(),
          duration: match.duration,
          notes: match.notes
        }])
        .select();
      if (matchError) throw matchError;
      const newMatch = matchData && matchData[0];
      if (!newMatch) throw new Error('Failed to insert match');

      // Insert sets
      const setsToInsert = match.sets.map(set => ({
        matchId: newMatch.id,
        player1Score: set.player1Score,
        player2Score: set.player2Score,
        winner: set.winner
      }));
      if (setsToInsert.length > 0) {
        const { error: setsError } = await supabase
          .from('sets')
          .insert(setsToInsert);
        if (setsError) throw setsError;
      }
      // Reload all matches
      await loadData();
    } catch (err) {
      console.error('Failed to add match:', err);
      throw new Error('Failed to add match');
    }
  };

  const updateMatch = async (updatedMatch: Match) => {
    try {
      // Update match
      const { error: matchError } = await supabase
        .from('matches')
        .update({
          sportType: updatedMatch.sportType,
          matchType: updatedMatch.matchType,
          player1Id: updatedMatch.player1Id,
          player2Id: updatedMatch.player2Id,
          player3Id: updatedMatch.player3Id,
          player4Id: updatedMatch.player4Id,
          player1Name: updatedMatch.player1Name,
          player2Name: updatedMatch.player2Name,
          player3Name: updatedMatch.player3Name,
          player4Name: updatedMatch.player4Name,
          winner: updatedMatch.winner || null,
          date: updatedMatch.date.toISOString(),
          duration: updatedMatch.duration,
          notes: updatedMatch.notes
        })
        .eq('id', updatedMatch.id);
      if (matchError) throw matchError;

      // Delete old sets
      const { error: delSetsError } = await supabase
        .from('sets')
        .delete()
        .eq('matchId', updatedMatch.id);
      if (delSetsError) throw delSetsError;

      // Insert new sets
      const setsToInsert = updatedMatch.sets.map(set => ({
        matchId: updatedMatch.id,
        player1Score: set.player1Score,
        player2Score: set.player2Score,
        winner: set.winner
      }));
      if (setsToInsert.length > 0) {
        const { error: setsError } = await supabase
          .from('sets')
          .insert(setsToInsert);
        if (setsError) throw setsError;
      }
      // Reload all matches
      await loadData();
    } catch (err) {
      console.error('Failed to update match:', err);
      throw new Error('Failed to update match');
    }
  };

  const deleteMatch = async (matchId: string) => {
    try {
      // Delete sets first (if not ON DELETE CASCADE)
      await supabase.from('sets').delete().eq('matchId', matchId);
      // Delete match
      const { error } = await supabase.from('matches').delete().eq('id', matchId);
      if (error) throw error;
      setMatches(prev => prev.filter(m => m.id !== matchId));
    } catch (err) {
      console.error('Failed to delete match:', err);
      throw new Error('Failed to delete match');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Sport Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Connection Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadData}
            className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route 
              path="/" 
              element={<Dashboard players={players} matches={matches} />} 
            />
            <Route 
              path="/players" 
              element={
                <Players 
                  players={players} 
                  onAddPlayer={addPlayer}
                  onUpdatePlayer={updatePlayer}
                  onDeletePlayer={deletePlayer}
                />
              } 
            />
            <Route 
              path="/players/:playerId" 
              element={
                <PlayerDetail 
                  players={players}
                  matches={matches}
                  onUpdatePlayer={updatePlayer}
                />
              } 
            />
            <Route 
              path="/matches" 
              element={
                <Matches 
                  matches={matches}
                  players={players}
                  onUpdateMatch={updateMatch}
                  onDeleteMatch={deleteMatch}
                />
              } 
            />
            <Route 
              path="/add-match" 
              element={
                <AddMatch 
                  players={players}
                  onAddMatch={addMatch}
                />
              } 
            />
            <Route 
              path="/csv-import" 
              element={<CsvImport />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 