import { Player, Match, PlayerStats, SportStats, SportType } from '../types';

export class StatsCalculator {
  static calculatePlayerStats(playerId: string, matches: Match[]): PlayerStats {
    const playerMatches = matches.filter(m => 
      m.player1Id === playerId || m.player2Id === playerId
    );

    const totalMatches = playerMatches.length;
    const totalWins = playerMatches.filter(m => {
      if (m.player1Id === playerId) return m.winner === 'player1';
      return m.winner === 'player2';
    }).length;
    const totalLosses = totalMatches - totalWins;
    const winRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;

    let totalSetsWon = 0;
    let totalSetsLost = 0;
    let totalScore = 0;
    let totalSets = 0;

    playerMatches.forEach(match => {
      match.sets.forEach(set => {
        const isPlayer1 = match.player1Id === playerId;
        const playerScore = isPlayer1 ? set.player1Score : set.player2Score;
        const opponentScore = isPlayer1 ? set.player2Score : set.player1Score;
        
        totalScore += playerScore;
        totalSets++;
        
        if (set.winner === (isPlayer1 ? 'player1' : 'player2')) {
          totalSetsWon++;
        } else {
          totalSetsLost++;
        }
      });
    });

    const averageScorePerSet = totalSets > 0 ? totalScore / totalSets : 0;

    // Calculate streaks
    const sortedMatches = playerMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let currentStreak = 0;
    let longestWinStreak = 0;
    let tempStreak = 0;

    for (let i = sortedMatches.length - 1; i >= 0; i--) {
      const match = sortedMatches[i];
      const isWin = (match.player1Id === playerId && match.winner === 'player1') ||
                   (match.player2Id === playerId && match.winner === 'player2');
      
      if (isWin) {
        tempStreak++;
        if (i === sortedMatches.length - 1) {
          currentStreak = tempStreak;
        }
      } else {
        longestWinStreak = Math.max(longestWinStreak, tempStreak);
        tempStreak = 0;
        if (i === sortedMatches.length - 1) {
          currentStreak = 0;
        }
      }
    }
    longestWinStreak = Math.max(longestWinStreak, tempStreak);

    const lastPlayed = playerMatches.length > 0 
      ? new Date(Math.max(...playerMatches.map(m => new Date(m.date).getTime())))
      : null;

    return {
      playerId,
      playerName: this.getPlayerName(playerId, matches),
      totalMatches,
      totalWins,
      totalLosses,
      winRate,
      totalSetsWon,
      totalSetsLost,
      averageScorePerSet,
      longestWinStreak,
      currentStreak,
      lastPlayed,
    };
  }

  static calculateSportStats(sportType: SportType, matches: Match[], players: Player[]): SportStats {
    const sportMatches = matches.filter(m => m.sportType === sportType);
    const totalMatches = sportMatches.length;
    const totalPlayers = players.length;

    const totalDuration = sportMatches.reduce((sum, match) => sum + (match.duration || 0), 0);
    const averageMatchDuration = totalMatches > 0 ? totalDuration / totalMatches : 0;

    // Find most active player
    const playerMatchCounts = new Map<string, number>();
    sportMatches.forEach(match => {
      playerMatchCounts.set(match.player1Id, (playerMatchCounts.get(match.player1Id) || 0) + 1);
      playerMatchCounts.set(match.player2Id, (playerMatchCounts.get(match.player2Id) || 0) + 1);
    });

    let mostActivePlayer = '';
    let maxMatches = 0;
    playerMatchCounts.forEach((count, playerId) => {
      if (count > maxMatches) {
        maxMatches = count;
        mostActivePlayer = this.getPlayerName(playerId, matches);
      }
    });

    // Find highest scoring match
    let highestScoringMatch = '';
    let maxTotalScore = 0;
    sportMatches.forEach(match => {
      const totalScore = match.sets.reduce((sum, set) => sum + set.player1Score + set.player2Score, 0);
      if (totalScore > maxTotalScore) {
        maxTotalScore = totalScore;
        highestScoringMatch = `${match.player1Name} vs ${match.player2Name}`;
      }
    });

    return {
      sportType,
      totalMatches,
      totalPlayers,
      averageMatchDuration,
      mostActivePlayer,
      highestScoringMatch,
    };
  }

  private static getPlayerName(playerId: string, matches: Match[]): string {
    const match = matches.find(m => m.player1Id === playerId || m.player2Id === playerId);
    if (!match) return 'Unknown Player';
    return match.player1Id === playerId ? match.player1Name : match.player2Name;
  }

  static getRecentMatches(matches: Match[], limit: number = 10): Match[] {
    return matches
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  static getPlayerMatchHistory(playerId: string, matches: Match[]): Match[] {
    return matches
      .filter(m => m.player1Id === playerId || m.player2Id === playerId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  static getWinLossByMonth(playerId: string, matches: Match[]): { month: string; wins: number; losses: number }[] {
    const playerMatches = matches.filter(m => 
      m.player1Id === playerId || m.player2Id === playerId
    );

    const monthlyStats = new Map<string, { wins: number; losses: number }>();

    playerMatches.forEach(match => {
      const month = new Date(match.date).toISOString().slice(0, 7); // YYYY-MM format
      const isWin = (match.player1Id === playerId && match.winner === 'player1') ||
                   (match.player2Id === playerId && match.winner === 'player2');

      if (!monthlyStats.has(month)) {
        monthlyStats.set(month, { wins: 0, losses: 0 });
      }

      const stats = monthlyStats.get(month)!;
      if (isWin) {
        stats.wins++;
      } else {
        stats.losses++;
      }
    });

    return Array.from(monthlyStats.entries())
      .map(([month, stats]) => ({ month, ...stats }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }
} 