import React, { useState } from 'react';
import { Player, Match } from '../types';
import { StatsCalculator } from '../utils/stats';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
  players: Player[];
  matches: Match[];
}

const Dashboard: React.FC<DashboardProps> = ({ players, matches }) => {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(['cmc902ngv000111nx51ia0i0d', 'cmc902kft000011nx8uw3lz77']);
  const [selectedSport, setSelectedSport] = useState<string>('badminton');
  const [headToHeadOnly, setHeadToHeadOnly] = useState(true);

  // Filtered players and matches
  const filteredPlayers = players.filter(p => selectedPlayers.includes(p.id));
  const filteredMatches = matches.filter(m => {
    if (selectedSport !== 'all' && m.sportType !== selectedSport) return false;
    const matchPlayerIds = [m.player1Id, m.player2Id, m.player3Id, m.player4Id].filter((id): id is string => Boolean(id));
    if (headToHeadOnly) {
      // Only include matches where all selected players are present
      return selectedPlayers.every(pid => matchPlayerIds.includes(pid)) && matchPlayerIds.length === selectedPlayers.length;
    } else {
      // Include matches where any selected player is present
      return matchPlayerIds.some(pid => selectedPlayers.includes(pid));
    }
  });

  const totalMatches = filteredMatches.length;
  const totalPlayers = filteredPlayers.length;
  const recentMatches = StatsCalculator.getRecentMatches(filteredMatches, 5);

  // Win/loss chart data (corrigé pour doubles)
  const winLossData = filteredPlayers.map(player => {
    let totalWins = 0;
    let totalLosses = 0;
    filteredMatches.forEach(match => {
      const isTeam1 = match.player1Id === player.id || match.player3Id === player.id;
      const isTeam2 = match.player2Id === player.id || match.player4Id === player.id;
      if (!isTeam1 && !isTeam2) return;
      if ((isTeam1 && match.winner === 'player1') || (isTeam2 && match.winner === 'player2')) totalWins++;
      else if ((isTeam1 && match.winner === 'player2') || (isTeam2 && match.winner === 'player1')) totalLosses++;
    });
    return {
      name: player.name,
      Wins: totalWins,
      Losses: totalLosses,
    };
  });

  // Set win/loss chart data (corrigé pour doubles)
  const setWinLossData = filteredPlayers.map(player => {
    let setsWon = 0;
    let setsLost = 0;
    filteredMatches.forEach(match => {
      const isTeam1 = match.player1Id === player.id || match.player3Id === player.id;
      const isTeam2 = match.player2Id === player.id || match.player4Id === player.id;
      if (!isTeam1 && !isTeam2) return;
      match.sets.forEach(set => {
        if ((isTeam1 && set.winner === 'player1') || (isTeam2 && set.winner === 'player2')) setsWon++;
        else if ((isTeam1 && set.winner === 'player2') || (isTeam2 && set.winner === 'player1')) setsLost++;
      });
    });
    return {
      name: player.name,
      SetsWon: setsWon,
      SetsLost: setsLost,
    };
  });

  // Win Over Time (corrigé pour doubles)
  const winOverTimeData = (() => {
    // Collect all months present in the data
    const allMonths = Array.from(new Set(
      filteredPlayers.flatMap(player => {
        const months = new Set<string>();
        filteredMatches.forEach(match => {
          const isTeam1 = match.player1Id === player.id || match.player3Id === player.id;
          const isTeam2 = match.player2Id === player.id || match.player4Id === player.id;
          if (!isTeam1 && !isTeam2) return;
          const month = new Date(match.date).toISOString().slice(0, 7);
          months.add(month);
        });
        return Array.from(months);
      })
    )).sort();
    // For each player, build their wins per month
    return allMonths.map(month => {
      const entry: any = { month };
      filteredPlayers.forEach(player => {
        let wins = 0;
        filteredMatches.forEach(match => {
          const isTeam1 = match.player1Id === player.id || match.player3Id === player.id;
          const isTeam2 = match.player2Id === player.id || match.player4Id === player.id;
          if (!isTeam1 && !isTeam2) return;
          const matchMonth = new Date(match.date).toISOString().slice(0, 7);
          if (matchMonth === month && ((isTeam1 && match.winner === 'player1') || (isTeam2 && match.winner === 'player2'))) {
            wins++;
          }
        });
        entry[`${player.name} Wins`] = wins;
      });
      return entry;
    });
  })();

  // Marge moyenne par set et par joueur (corrigé pour doubles)
  const maxSetCount = Math.max(0, ...filteredMatches.map(match => match.sets.length));
  const avgMarginPerPlayerPerSet: { setNumber: number; [playerName: string]: number | undefined }[] = [];
  for (let setIdx = 0; setIdx < maxSetCount; setIdx++) {
    const entry: any = { setNumber: setIdx + 1 };
    filteredPlayers.forEach(player => {
      let totalMargin = 0;
      let count = 0;
      filteredMatches.forEach(match => {
        const isTeam1 = match.player1Id === player.id || match.player3Id === player.id;
        const isTeam2 = match.player2Id === player.id || match.player4Id === player.id;
        if (!isTeam1 && !isTeam2) return;
        const set = match.sets[setIdx];
        if (!set) return;
        let margin = set.player1Score - set.player2Score;
        if (isTeam2) margin = -margin;
        margin = ((isTeam1 && set.winner === 'player1') || (isTeam2 && set.winner === 'player2')) ? Math.abs(margin) : -Math.abs(margin);
        totalMargin += margin;
        count++;
      });
      entry[player.name] = count > 0 ? totalMargin / count : undefined;
    });
    avgMarginPerPlayerPerSet.push(entry);
  }

  // RecentMatches : affichage des noms pour doubles
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

  // Win/loss margin histogram data
  const marginData: { margin: number; count: number }[] = (() => {
    const marginCounts: Record<number, number> = {};
    filteredMatches.forEach(match => {
      // Calculate total margin for the match (sum of set margins)
      let margin = 0;
      match.sets.forEach(set => {
        margin += Math.abs(set.player1Score - set.player2Score);
      });
      if (!marginCounts[margin]) marginCounts[margin] = 0;
      marginCounts[margin]++;
    });
    return Object.entries(marginCounts).map(([margin, count]) => ({ margin: Number(margin), count }));
  })();

  // Pie chart for total set wins by player
  const setWinsPieData = filteredPlayers.map(player => {
    const stats = StatsCalculator.calculatePlayerStats(player.id, filteredMatches);
    return {
      name: player.name,
      value: stats.totalSetsWon,
    };
  });
  const pieColors = ["#f472b6", "#22c55e", "#a78bfa", "#38bdf8", "#fbbf24", "#ef4444", "#facc15", "#818cf8"]; // extend as needed

  // Calculate total points won/lost for each filtered player, grouped by sport
  const pointsStatsBySport = filteredPlayers.map(player => {
    const statsBySport: { [sport: string]: { pointsWon: number, pointsLost: number } } = {};
    filteredMatches.forEach(match => {
      const isTeam1 = match.player1Id === player.id || match.player3Id === player.id;
      const isTeam2 = match.player2Id === player.id || match.player4Id === player.id;
      if (!isTeam1 && !isTeam2) return;
      const sport = match.sportType || 'unknown';
      if (!statsBySport[sport]) statsBySport[sport] = { pointsWon: 0, pointsLost: 0 };
      match.sets.forEach(set => {
        if (isTeam1) {
          statsBySport[sport].pointsWon += set.player1Score;
          statsBySport[sport].pointsLost += set.player2Score;
        } else if (isTeam2) {
          statsBySport[sport].pointsWon += set.player2Score;
          statsBySport[sport].pointsLost += set.player1Score;
        }
      });
    });
    return { name: player.name, statsBySport };
  });

  // 1. Barres groupées : points gagnés par set et par joueur
  const maxSetCountPoints = Math.max(0, ...filteredMatches.map(match => match.sets.length));
  const pointsPerSetPerPlayer: { setNumber: number; [playerName: string]: number | undefined }[] = [];
  for (let setIdx = 0; setIdx < maxSetCountPoints; setIdx++) {
    const entry: any = { setNumber: setIdx + 1 };
    filteredPlayers.forEach(player => {
      let totalPoints = 0;
      let count = 0;
      filteredMatches.forEach(match => {
        const isTeam1 = match.player1Id === player.id || match.player3Id === player.id;
        const isTeam2 = match.player2Id === player.id || match.player4Id === player.id;
        if (!isTeam1 && !isTeam2) return;
        const set = match.sets[setIdx];
        if (!set) return;
        if (isTeam1) totalPoints += set.player1Score;
        else if (isTeam2) totalPoints += set.player2Score;
        count++;
      });
      entry[player.name] = count > 0 ? totalPoints / count : undefined;
    });
    pointsPerSetPerPlayer.push(entry);
  }

  // 2. Courbe : points gagnés par match dans le temps pour chaque joueur
  const pointsPerMatchOverTime = filteredMatches
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((match, idx) => {
      const entry: any = { match: idx + 1, date: new Date(match.date).toLocaleDateString() };
      filteredPlayers.forEach(player => {
        const isTeam1 = match.player1Id === player.id || match.player3Id === player.id;
        const isTeam2 = match.player2Id === player.id || match.player4Id === player.id;
        if (isTeam1) entry[player.name] = match.sets.reduce((sum, set) => sum + set.player1Score, 0);
        else if (isTeam2) entry[player.name] = match.sets.reduce((sum, set) => sum + set.player2Score, 0);
        else entry[player.name] = undefined;
      });
      return entry;
    });

  // 3. Camembert : répartition totale des points gagnés par joueur
  const totalPointsPieData = filteredPlayers.map(player => {
    let value = 0;
    filteredMatches.forEach(match => {
      const isTeam1 = match.player1Id === player.id || match.player3Id === player.id;
      const isTeam2 = match.player2Id === player.id || match.player4Id === player.id;
      if (isTeam1) value += match.sets.reduce((sum, set) => sum + set.player1Score, 0);
      else if (isTeam2) value += match.sets.reduce((sum, set) => sum + set.player2Score, 0);
    });
    return { name: player.name, value };
  });

  // Préparation des données pour un bar chart multi-joueurs
  const avgMarginPerPlayer = [
    filteredPlayers.reduce((acc, player) => {
      let totalMargin = 0;
      let matchCount = 0;
      filteredMatches.forEach(match => {
        const isTeam1 = match.player1Id === player.id || match.player3Id === player.id;
        const isTeam2 = match.player2Id === player.id || match.player4Id === player.id;
        if (!isTeam1 && !isTeam2) return;
        let pointsWon = 0;
        let pointsLost = 0;
        match.sets.forEach(set => {
          if (isTeam1) {
            pointsWon += set.player1Score;
            pointsLost += set.player2Score;
          } else if (isTeam2) {
            pointsWon += set.player2Score;
            pointsLost += set.player1Score;
          }
        });
        totalMargin += (pointsWon - pointsLost);
        matchCount++;
      });
      acc[player.name] = matchCount > 0 ? totalMargin / matchCount : 0;
      return acc;
    }, {} as Record<string, number>)
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Players</label>
          <select
            multiple
            className="border rounded px-2 py-1 w-48 h-24"
            value={selectedPlayers}
            onChange={e => {
              const options = Array.from(e.target.selectedOptions).map(opt => opt.value);
              setSelectedPlayers(options);
            }}
          >
            {players.map(player => (
              <option key={player.id} value={player.id}>{player.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Sport</label>
          <select
            className="border rounded px-2 py-1 w-32"
            value={selectedSport}
            onChange={e => setSelectedSport(e.target.value)}
          >
            <option value="badminton">Badminton</option>
            <option value="padel">Padel</option>
            <option value="all">All</option>
          </select>
        </div>
        <div className="flex items-center mt-2 md:mt-6">
          <input
            type="checkbox"
            id="headToHeadOnly"
            className="mr-2"
            checked={headToHeadOnly}
            onChange={e => setHeadToHeadOnly(e.target.checked)}
          />
          <label htmlFor="headToHeadOnly" className="text-sm">Show only matches containing all selected players</label>
        </div>
      </div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      {/* Groupe 1 : Statistiques de victoires */}
      <h2 className="text-xl font-bold mb-2 mt-8">Statistiques de victoires</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded shadow p-6 text-center">
          <div className="text-3xl font-bold text-primary-600">{totalPlayers}</div>
          <div className="text-gray-500">Players</div>
        </div>
        <div className="bg-white rounded shadow p-6 text-center">
          <div className="text-3xl font-bold text-primary-600">{totalMatches}</div>
          <div className="text-gray-500">Matches</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded shadow p-6">
          <div className="text-gray-500 mb-2">Wins / Losses</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={winLossData} layout="vertical">
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={80} />
              <Tooltip />
              <Bar dataKey="Wins" fill="#22c55e" stackId="a" />
              <Bar dataKey="Losses" fill="#ef4444" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Set Wins / Losses per Player</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={setWinLossData} layout="vertical">
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={80} />
              <Tooltip />
              <Legend />
              <Bar dataKey="SetsWon" fill="#38bdf8" stackId="a" name="Sets Won" />
              <Bar dataKey="SetsLost" fill="#fbbf24" stackId="a" name="Sets Lost" />
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
      {/* Groupe 2 : Statistiques "Over Time" */}
      <h2 className="text-xl font-bold mb-2 mt-12">Statistiques dans le temps</h2>
      <div className="gap-6 mb-8">
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Wins Over Time</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={winOverTimeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              {filteredPlayers.map((player, idx) => (
                <Line key={player.id + '-w'} type="monotone" dataKey={`${player.name} Wins`} stroke={pieColors[idx % pieColors.length]} name={`${player.name} Wins`} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Points gagnés par match dans le temps</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={pointsPerMatchOverTime} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="match" label={{ value: 'Match', position: 'insideBottom', offset: -5 }} allowDecimals={false} />
              <YAxis label={{ value: 'Points gagnés', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              {filteredPlayers.map((player, idx) => (
                <Line key={player.id} type="monotone" dataKey={player.name} stroke={pieColors[idx % pieColors.length]} name={player.name} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Camemberts côte à côte */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Total Set Wins by Player</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={setWinsPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {setWinsPieData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend layout="vertical" verticalAlign="middle" align="right" />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Répartition totale des points gagnés</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={totalPointsPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {totalPointsPieData.map((entry, idx) => (
                  <Cell key={`cell-pt-${idx}`} fill={pieColors[idx % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend layout="vertical" verticalAlign="middle" align="right" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Groupe 3 : Statistiques de points */}
      <h2 className="text-xl font-bold mb-2 mt-12">Statistiques de points</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {pointsStatsBySport.map(playerStat => (
          <div key={playerStat.name} className="bg-white rounded shadow p-6 text-center">
            <div className="text-lg font-semibold mb-2">{playerStat.name}</div>
            {Object.entries(playerStat.statsBySport).map(([sport, stats]) => (
              <div key={sport} className="mb-2">
                <div className="text-md font-medium">{sport.charAt(0).toUpperCase() + sport.slice(1)}</div>
                <div className="text-2xl font-bold text-primary-600">{stats.pointsWon}</div>
                <div className="text-gray-500 mb-1">Points Won</div>
                <div className="text-2xl font-bold text-red-500">{stats.pointsLost}</div>
                <div className="text-gray-500">Points Lost</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="bg-white rounded shadow p-6 mt-8">
        <h2 className="text-xl font-semibold mb-4">Points gagnés par set (moyenne)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={pointsPerSetPerPlayer} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="setNumber" label={{ value: 'Numéro du set', position: 'insideBottom', offset: -5 }} allowDecimals={false} />
            <YAxis label={{ value: 'Points gagnés (moyenne)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            {filteredPlayers.map((player, idx) => (
              <Bar key={player.id} dataKey={player.name} fill={pieColors[idx % pieColors.length]} name={player.name} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Groupe 4 : Statistiques de marge */}
      <h2 className="text-xl font-bold mb-2 mt-12">Statistiques de marge</h2>
      <div className="bg-white rounded shadow p-6 mt-8">
        <h2 className="text-xl font-semibold mb-4">Average Set Margin per Player and Set Number</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={avgMarginPerPlayerPerSet} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="setNumber" label={{ value: 'Set Number', position: 'insideBottom', offset: -5 }} allowDecimals={false} />
            <YAxis label={{ value: 'Avg. Margin', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            {filteredPlayers.map((player, idx) => (
              <Bar key={player.id} dataKey={player.name} fill={pieColors[idx % pieColors.length]} name={player.name} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Nouveau bar graph : marge moyenne totale par match */}
      <div className="bg-white rounded shadow p-6 mt-8">
        <h2 className="text-xl font-semibold mb-4">Marge moyenne totale par match (points gagnés - points perdus)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={avgMarginPerPlayer} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={() => ''} tick={false} />
            <YAxis label={{ value: 'Marge moyenne', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            {filteredPlayers.map((player, idx) => (
              <Bar key={player.id} dataKey={player.name} name={player.name} fill={pieColors[idx % pieColors.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard; 