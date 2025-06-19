import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Player, Match } from '../types';
import { StatsCalculator } from '../utils/stats';

interface PlayerDetailProps {
  players: Player[];
  matches: Match[];
  onUpdatePlayer: (player: Player) => void;
}

const PlayerDetail: React.FC<PlayerDetailProps> = ({ players, matches }) => {
  const { playerId } = useParams<{ playerId: string }>();
  const player = players.find(p => p.id === playerId);
  if (!player) return <div className="text-red-500">Player not found.</div>;
  const stats = StatsCalculator.calculatePlayerStats(player.id, matches);
  const history = StatsCalculator.getPlayerMatchHistory(player.id, matches);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{player.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded shadow p-6 text-center">
          <div className="text-3xl font-bold text-primary-600">{stats.totalMatches}</div>
          <div className="text-gray-500">Matches</div>
        </div>
        <div className="bg-white rounded shadow p-6 text-center">
          <div className="text-3xl font-bold text-primary-600">{stats.totalWins}</div>
          <div className="text-gray-500">Wins</div>
        </div>
        <div className="bg-white rounded shadow p-6 text-center">
          <div className="text-3xl font-bold text-primary-600">{stats.totalLosses}</div>
          <div className="text-gray-500">Losses</div>
        </div>
      </div>
      <div className="bg-white rounded shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Stats</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <li>Win Rate: <span className="font-medium">{stats.winRate.toFixed(1)}%</span></li>
          <li>Sets Won: <span className="font-medium">{stats.totalSetsWon}</span></li>
          <li>Sets Lost: <span className="font-medium">{stats.totalSetsLost}</span></li>
          <li>Avg. Score/Set: <span className="font-medium">{stats.averageScorePerSet.toFixed(2)}</span></li>
          <li>Longest Win Streak: <span className="font-medium">{stats.longestWinStreak}</span></li>
          <li>Current Streak: <span className="font-medium">{stats.currentStreak}</span></li>
          <li>Last Played: <span className="font-medium">{stats.lastPlayed ? new Date(stats.lastPlayed).toLocaleDateString() : '-'}</span></li>
        </ul>
      </div>
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Match History</h2>
        <ul>
          {history.length === 0 && <li className="text-gray-500">No matches yet.</li>}
          {history.map(match => (
            <li key={match.id} className="mb-2">
              <span className="font-medium">{match.player1Name}</span> vs <span className="font-medium">{match.player2Name}</span> — {match.sportType} — {new Date(match.date).toLocaleDateString()}<br />
              <span className="text-sm text-gray-500">Winner: {match.winner ? (match.winner === 'player1' ? match.player1Name : match.player2Name) : 'N/A'}</span>
            </li>
          ))}
        </ul>
        <Link to="/players" className="inline-block mt-4 text-primary-600 hover:underline">Back to Players</Link>
      </div>
    </div>
  );
};

export default PlayerDetail; 