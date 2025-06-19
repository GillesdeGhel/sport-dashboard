import { Player, Match } from '../types';

const STORAGE_KEYS = {
  PLAYERS: 'sport-dashboard-players',
  MATCHES: 'sport-dashboard-matches',
} as const;

export class StorageManager {
  static getPlayers(): Player[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLAYERS);
      if (!data) return [];
      const players = JSON.parse(data);
      return players.map((player: any) => ({
        ...player,
        createdAt: new Date(player.createdAt),
      }));
    } catch (error) {
      console.error('Error loading players:', error);
      return [];
    }
  }

  static savePlayers(players: Player[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
    } catch (error) {
      console.error('Error saving players:', error);
    }
  }

  static getMatches(): Match[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MATCHES);
      if (!data) return [];
      const matches = JSON.parse(data);
      return matches.map((match: any) => ({
        ...match,
        date: new Date(match.date),
      }));
    } catch (error) {
      console.error('Error loading matches:', error);
      return [];
    }
  }

  static saveMatches(matches: Match[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
    } catch (error) {
      console.error('Error saving matches:', error);
    }
  }

  static addPlayer(player: Player): void {
    const players = this.getPlayers();
    players.push(player);
    this.savePlayers(players);
  }

  static updatePlayer(updatedPlayer: Player): void {
    const players = this.getPlayers();
    const index = players.findIndex(p => p.id === updatedPlayer.id);
    if (index !== -1) {
      players[index] = updatedPlayer;
      this.savePlayers(players);
    }
  }

  static deletePlayer(playerId: string): void {
    const players = this.getPlayers();
    const filteredPlayers = players.filter(p => p.id !== playerId);
    this.savePlayers(filteredPlayers);
  }

  static addMatch(match: Match): void {
    const matches = this.getMatches();
    matches.push(match);
    this.saveMatches(matches);
  }

  static updateMatch(updatedMatch: Match): void {
    const matches = this.getMatches();
    const index = matches.findIndex(m => m.id === updatedMatch.id);
    if (index !== -1) {
      matches[index] = updatedMatch;
      this.saveMatches(matches);
    }
  }

  static deleteMatch(matchId: string): void {
    const matches = this.getMatches();
    const filteredMatches = matches.filter(m => m.id !== matchId);
    this.saveMatches(filteredMatches);
  }
} 