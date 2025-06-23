import React, { useState } from 'react';
import { Match, Player } from '../types';
import EditMatch from './EditMatch';

interface MatchesProps {
  matches: Match[];
  players: Player[];
  onUpdateMatch: (match: Match) => void;
  onDeleteMatch: (matchId: string) => void;
}

const Matches: React.FC<MatchesProps> = ({ matches, players, onUpdateMatch, onDeleteMatch }) => {
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  const getPlayerDisplay = (match: Match) => {
    if (match.matchType === 'doubles') {
      return (
        <div>
          <div className="font-medium">Team 1: {match.player1Name} & {match.player3Name}</div>
          <div className="font-medium">Team 2: {match.player2Name} & {match.player4Name}</div>
        </div>
      );
    }
    return (
      <div>
        <div>{match.player1Name}</div>
        <div>{match.player2Name}</div>
      </div>
    );
  };

  const getWinnerDisplay = (match: Match) => {
    if (!match.winner) return '-';
    if (match.matchType === 'doubles') {
      if (match.winner === 'player1') {
        return `${match.player1Name} & ${match.player3Name}`;
      } else {
        return `${match.player2Name} & ${match.player4Name}`;
      }
    }
    return match.winner === 'player1' ? match.player1Name : match.player2Name;
  };

  const handleEditMatch = (match: Match) => {
    setEditingMatch(match);
  };

  const handleCancelEdit = () => {
    setEditingMatch(null);
  };

  const handleUpdateMatch = (updatedMatch: Match) => {
    onUpdateMatch(updatedMatch);
    setEditingMatch(null);
  };

  // If we're editing a match, show the edit form
  if (editingMatch) {
    return (
      <EditMatch
        match={editingMatch}
        players={players}
        onUpdateMatch={handleUpdateMatch}
        onCancel={handleCancelEdit}
      />
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Matches</h1>
      <div className="bg-white rounded shadow p-6">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2">Date</th>
              <th className="py-2">Sport</th>
              <th className="py-2">Type</th>
              <th className="py-2">Players</th>
              <th className="py-2">Sets</th>
              <th className="py-2">Winner</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {matches.length === 0 && (
              <tr><td colSpan={7} className="text-gray-500 py-4 text-center">No matches yet.</td></tr>
            )}
            {matches.map(match => (
              <tr key={match.id} className="border-t align-top">
                <td className="py-2">{new Date(match.date).toLocaleDateString()}</td>
                <td className="py-2 capitalize">{match.sportType}</td>
                <td className="py-2 capitalize">{match.matchType}</td>
                <td className="py-2">
                  {getPlayerDisplay(match)}
                </td>
                <td className="py-2">
                  <ul className="text-sm">
                    {match.sets.map((set, index) => (
                      <li key={set.id}>
                        Set {index + 1}: {set.player1Score} - {set.player2Score} 
                        <span className="text-green-600 font-medium ml-1">
                          ({set.winner === 'player1' ? 'Team 1' : 'Team 2'})
                        </span>
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="py-2 font-medium text-green-600">{getWinnerDisplay(match)}</td>
                <td className="py-2">
                  <div className="flex gap-2">
                    <button
                      className="text-blue-500 hover:text-blue-700 hover:underline"
                      onClick={() => handleEditMatch(match)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-500 hover:text-red-700 hover:underline"
                      onClick={() => onDeleteMatch(match.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Matches; 