const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React build directory
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Sport Dashboard API is running' });
});

// Players API
app.get('/api/players', async (req, res) => {
  try {
    const players = await prisma.player.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

app.post('/api/players', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const player = await prisma.player.create({
      data: { name, email, phone }
    });
    res.status(201).json(player);
  } catch (error) {
    console.error('Error creating player:', error);
    res.status(500).json({ error: 'Failed to create player' });
  }
});

app.put('/api/players/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;
    const player = await prisma.player.update({
      where: { id },
      data: { name, email, phone }
    });
    res.json(player);
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ error: 'Failed to update player' });
  }
});

app.delete('/api/players/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.player.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ error: 'Failed to delete player' });
  }
});

// Matches API
app.get('/api/matches', async (req, res) => {
  try {
    const matches = await prisma.match.findMany({
      include: {
        sets: {
          orderBy: { setOrder: 'asc' }
        },
        player1: true,
        player2: true,
        player3: true,
        player4: true
      },
      orderBy: { date: 'desc' }
    });
    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

app.post('/api/matches', async (req, res) => {
  try {
    const {
      sportType,
      matchType,
      player1Id,
      player2Id,
      player3Id,
      player4Id,
      player1Name,
      player2Name,
      player3Name,
      player4Name,
      winner,
      date,
      duration,
      notes,
      sets
    } = req.body;

    const match = await prisma.match.create({
      data: {
        sportType,
        matchType,
        player1Id,
        player2Id,
        player3Id,
        player4Id,
        player1Name,
        player2Name,
        player3Name,
        player4Name,
        winner,
        date: new Date(date),
        duration,
        notes,
        sets: {
          create: sets.map((set, index) => ({
            player1Score: set.player1Score,
            player2Score: set.player2Score,
            winner: set.winner,
            setOrder: index + 1
          }))
        }
      },
      include: {
        sets: true
      }
    });
    res.status(201).json(match);
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ error: 'Failed to create match' });
  }
});

app.put('/api/matches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      sportType,
      matchType,
      player1Id,
      player2Id,
      player3Id,
      player4Id,
      player1Name,
      player2Name,
      player3Name,
      player4Name,
      winner,
      date,
      duration,
      notes,
      sets
    } = req.body;

    // Delete existing sets and recreate them
    await prisma.set.deleteMany({
      where: { matchId: id }
    });

    const match = await prisma.match.update({
      where: { id },
      data: {
        sportType,
        matchType,
        player1Id,
        player2Id,
        player3Id,
        player4Id,
        player1Name,
        player2Name,
        player3Name,
        player4Name,
        winner,
        date: new Date(date),
        duration,
        notes,
        sets: {
          create: sets.map((set, index) => ({
            player1Score: set.player1Score,
            player2Score: set.player2Score,
            winner: set.winner,
            setOrder: index + 1
          }))
        }
      },
      include: {
        sets: true
      }
    });
    res.json(match);
  } catch (error) {
    console.error('Error updating match:', error);
    res.status(500).json({ error: 'Failed to update match' });
  }
});

app.delete('/api/matches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.match.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting match:', error);
    res.status(500).json({ error: 'Failed to delete match' });
  }
});

// Stats API
app.get('/api/stats/players/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get all matches for the player
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { player1Id: id },
          { player2Id: id },
          { player3Id: id },
          { player4Id: id }
        ]
      },
      include: {
        sets: true
      }
    });

    // Calculate stats
    const totalMatches = matches.length;
    const totalWins = matches.filter(match => {
      if (match.player1Id === id) return match.winner === 'player1';
      if (match.player2Id === id) return match.winner === 'player2';
      if (match.player3Id === id) return match.winner === 'player1';
      if (match.player4Id === id) return match.winner === 'player2';
      return false;
    }).length;

    const totalLosses = totalMatches - totalWins;
    const winRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;

    res.json({
      playerId: id,
      totalMatches,
      totalWins,
      totalLosses,
      winRate
    });
  } catch (error) {
    console.error('Error fetching player stats:', error);
    res.status(500).json({ error: 'Failed to fetch player stats' });
  }
});

// Serve React app for all other routes (SPA routing)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
}); 