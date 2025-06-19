import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Player, Match } from './types';
import { apiService } from './utils/api';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import Players from './components/Players';
import Matches from './components/Matches';
import AddMatch from './components/AddMatch';
import PlayerDetail from './components/PlayerDetail';
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
      
      // Check if API is available
      await apiService.healthCheck();
      
      // Load data from API
      const [playersData, matchesData] = await Promise.all([
        apiService.getPlayers(),
        apiService.getMatches()
      ]);
      
      setPlayers(playersData);
      setMatches(matchesData);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to connect to the server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const addPlayer = async (player: Player) => {
    try {
      const newPlayer = await apiService.createPlayer({
        name: player.name,
        email: player.email,
        phone: player.phone
      });
      setPlayers(prev => [...prev, newPlayer]);
    } catch (err) {
      console.error('Failed to add player:', err);
      throw new Error('Failed to add player');
    }
  };

  const updatePlayer = async (updatedPlayer: Player) => {
    try {
      const player = await apiService.updatePlayer(updatedPlayer.id, {
        name: updatedPlayer.name,
        email: updatedPlayer.email,
        phone: updatedPlayer.phone
      });
      setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? player : p));
    } catch (err) {
      console.error('Failed to update player:', err);
      throw new Error('Failed to update player');
    }
  };

  const deletePlayer = async (playerId: string) => {
    try {
      await apiService.deletePlayer(playerId);
      setPlayers(prev => prev.filter(p => p.id !== playerId));
    } catch (err) {
      console.error('Failed to delete player:', err);
      throw new Error('Failed to delete player');
    }
  };

  const addMatch = async (match: Match) => {
    try {
      const newMatch = await apiService.createMatch({
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
        winner: match.winner || undefined,
        date: match.date.toISOString(),
        duration: match.duration,
        notes: match.notes,
        sets: match.sets.map(set => ({
          player1Score: set.player1Score,
          player2Score: set.player2Score,
          winner: set.winner
        }))
      });
      setMatches(prev => [...prev, newMatch]);
    } catch (err) {
      console.error('Failed to add match:', err);
      throw new Error('Failed to add match');
    }
  };

  const updateMatch = async (updatedMatch: Match) => {
    try {
      const match = await apiService.updateMatch(updatedMatch.id, {
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
        winner: updatedMatch.winner || undefined,
        date: updatedMatch.date.toISOString(),
        duration: updatedMatch.duration,
        notes: updatedMatch.notes,
        sets: updatedMatch.sets.map(set => ({
          player1Score: set.player1Score,
          player2Score: set.player2Score,
          winner: set.winner
        }))
      });
      setMatches(prev => prev.map(m => m.id === updatedMatch.id ? match : m));
    } catch (err) {
      console.error('Failed to update match:', err);
      throw new Error('Failed to update match');
    }
  };

  const deleteMatch = async (matchId: string) => {
    try {
      await apiService.deleteMatch(matchId);
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
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 