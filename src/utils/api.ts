const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Handle 204 No Content responses
      if (response.status === 204) {
        return {} as T;
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Players API
  async getPlayers() {
    return this.request<any[]>('/players');
  }

  async createPlayer(player: { name: string; email?: string; phone?: string }) {
    return this.request<any>('/players', {
      method: 'POST',
      body: JSON.stringify(player),
    });
  }

  async updatePlayer(id: string, player: { name: string; email?: string; phone?: string }) {
    return this.request<any>(`/players/${id}`, {
      method: 'PUT',
      body: JSON.stringify(player),
    });
  }

  async deletePlayer(id: string) {
    return this.request(`/players/${id}`, {
      method: 'DELETE',
    });
  }

  // Matches API
  async getMatches() {
    return this.request<any[]>('/matches');
  }

  async createMatch(match: {
    sportType: string;
    matchType: string;
    player1Id: string;
    player2Id: string;
    player3Id?: string;
    player4Id?: string;
    player1Name: string;
    player2Name: string;
    player3Name?: string;
    player4Name?: string;
    winner?: string;
    date: string;
    duration?: number;
    notes?: string;
    sets: Array<{
      player1Score: number;
      player2Score: number;
      winner: string;
    }>;
  }) {
    return this.request<any>('/matches', {
      method: 'POST',
      body: JSON.stringify(match),
    });
  }

  async updateMatch(id: string, match: {
    sportType: string;
    matchType: string;
    player1Id: string;
    player2Id: string;
    player3Id?: string;
    player4Id?: string;
    player1Name: string;
    player2Name: string;
    player3Name?: string;
    player4Name?: string;
    winner?: string;
    date: string;
    duration?: number;
    notes?: string;
    sets: Array<{
      player1Score: number;
      player2Score: number;
      winner: string;
    }>;
  }) {
    return this.request<any>(`/matches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(match),
    });
  }

  async deleteMatch(id: string) {
    return this.request(`/matches/${id}`, {
      method: 'DELETE',
    });
  }

  // Stats API
  async getPlayerStats(playerId: string) {
    return this.request<any>(`/stats/players/${playerId}`);
  }

  // Health check
  async healthCheck() {
    return this.request<any>('/health');
  }
}

export const apiService = new ApiService(); 