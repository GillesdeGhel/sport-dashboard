export type SportType = 'padel' | 'badminton';
export type MatchType = 'singles' | 'doubles';

export interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt: Date;
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
}

export interface Set {
  id: string;
  player1Score: number;
  player2Score: number;
  winner: 'player1' | 'player2';
}

export interface Match {
  id: string;
  sportType: SportType;
  matchType: MatchType;
  player1Id: string;
  player2Id: string;
  player3Id?: string; // For doubles - partner of player1
  player4Id?: string; // For doubles - partner of player2
  player1Name: string;
  player2Name: string;
  player3Name?: string;
  player4Name?: string;
  sets: Set[];
  winner: 'player1' | 'player2' | null;
  date: Date;
  duration?: number; // in minutes
  notes?: string;
}

export interface PlayerStats {
  playerId: string;
  playerName: string;
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  totalSetsWon: number;
  totalSetsLost: number;
  averageScorePerSet: number;
  longestWinStreak: number;
  currentStreak: number;
  lastPlayed: Date | null;
}

export interface SportStats {
  sportType: SportType;
  totalMatches: number;
  totalPlayers: number;
  averageMatchDuration: number;
  mostActivePlayer: string;
  highestScoringMatch: string;
} 