import React from 'react';
import { Player, Match } from '../types';
import { StatsCalculator } from '../utils/stats';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  players: Player[];
  matches: Match[];
}

const Dashboard: React.FC<DashboardProps> = ({ players, matches }) => {
  const totalMatches = matches.length;
  const totalPlayers = players.length;
  const recentMatches = StatsCalculator.getRecentMatches(matches, 5);

  // Win/loss chart data
  const winLossData = players.map(player => {
    const stats = StatsCalculator.calculatePlayerStats(player.id, matches);
    return {
      name: player.name,
      Wins: stats.totalWins,
      Losses: stats.totalLosses,
    };
  });

  const getMatchDisplay = (match: Match) => {
    if (match.matchType === 'doubles') {
      return `${match.player1Name} & ${match.player3Name} vs ${match.player2Name} & ${match.player4Name}`;
    }
    return `${match.player1Name} vs ${match.player2Name}`;
  };

  const getWinnerDisplay = (match: Match) => {
    if (!match.winner) return 'N/A';
    if (match.matchType === 'doubles') {
      if (match.winner === 'player1') {
        return `${match.player1Name} & ${match.player3Name}`;
      } else {
        return `${match.player2Name} & ${match.player4Name}`;
      }
    }
    return match.winner === 'player1' ? match.player1Name : match.player2Name;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded shadow p-6 text-center">
          <div className="text-3xl font-bold text-primary-600">{totalPlayers}</div>
          <div className="text-gray-500">Players</div>
        </div>
        <div className="bg-white rounded shadow p-6 text-center">
          <div className="text-3xl font-bold text-primary-600">{totalMatches}</div>
          <div className="text-gray-500">Matches</div>
        </div>
        <div className="bg-white rounded shadow p-6">
          <div className="text-gray-500 mb-2">Wins / Losses</div>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={winLossData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={80} />
              <Tooltip />
              <Bar dataKey="Wins" fill="#22c55e" stackId="a" />
              <Bar dataKey="Losses" fill="#ef4444" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Matches</h2>
        <ul className="space-y-3">
          {recentMatches.length === 0 && <li className="text-gray-500">No matches yet.</li>}
          {recentMatches.map(match => (
            <li key={match.id} className="border-b pb-2 last:border-b-0">
              <div className="font-medium">{getMatchDisplay(match)}</div>
              <div className="text-sm text-gray-600">
                {match.sportType} • {match.matchType} • {new Date(match.date).toLocaleDateString()}
              </div>
              <div className="text-sm text-green-600 font-medium">
                Winner: {getWinnerDisplay(match)}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard; 