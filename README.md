# Sport Dashboard

A modern web application for tracking sports scores and statistics for padel and badminton matches. Built with React, TypeScript, PostgreSQL, and Express.

## Features

- 🏓 **Multi-sport support**: Padel and Badminton
- 👥 **Player management**: Add, edit, and delete players
- 🎾 **Match tracking**: Singles and doubles matches with set-by-set scoring
- 📊 **Statistics**: Win rates, match history, and performance analytics
- 🎨 **Modern UI**: Clean, responsive design with Tailwind CSS
- 💾 **Persistent storage**: PostgreSQL database with Prisma ORM

## Tech Stack

### Frontend
- React 18 with TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Recharts for data visualization

### Backend
- Node.js with Express
- PostgreSQL database
- Prisma ORM for type-safe database operations
- CORS enabled for frontend communication

## Prerequisites

- Node.js 16+ 
- PostgreSQL 12+
- npm or yarn

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd sport-dashboard
npm install
```

### 2. Database Setup

#### Option A: Local PostgreSQL

1. **Install PostgreSQL** on your system
2. **Create a database**:
   ```sql
   CREATE DATABASE sport_dashboard;
   ```
3. **Create a user** (optional):
   ```sql
   CREATE USER sport_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE sport_dashboard TO sport_user;
   ```

#### Option B: Cloud PostgreSQL (Recommended)

Use a cloud provider like:
- **Supabase** (Free tier available)
- **Railway** (Free tier available)
- **PlanetScale** (Free tier available)
- **Neon** (Free tier available)

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/sport_dashboard"

# Server
PORT=3001

# Environment
NODE_ENV=development
```

**For cloud databases**, use the connection string provided by your provider.

### 4. Database Migration

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations (if you have migrations)
npm run db:migrate
```

### 5. Start the Application

#### Development Mode (Both Frontend and Backend)
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:3001`
- Frontend on `http://localhost:3000`

#### Production Mode
```bash
# Build frontend
npm run build

# Start backend only
npm run server
```

## API Endpoints

### Players
- `GET /api/players` - Get all players
- `POST /api/players` - Create a new player
- `PUT /api/players/:id` - Update a player
- `DELETE /api/players/:id` - Delete a player

### Matches
- `GET /api/matches` - Get all matches
- `POST /api/matches` - Create a new match
- `PUT /api/matches/:id` - Update a match
- `DELETE /api/matches/:id` - Delete a match

### Stats
- `GET /api/stats/players/:id` - Get player statistics

### Health
- `GET /api/health` - Health check endpoint

## Database Schema

### Players
- `id` - Unique identifier
- `name` - Player name
- `email` - Email address (optional)
- `phone` - Phone number (optional)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Matches
- `id` - Unique identifier
- `sportType` - 'padel' or 'badminton'
- `matchType` - 'singles' or 'doubles'
- `player1Id`, `player2Id` - Required players
- `player3Id`, `player4Id` - Optional players (doubles)
- `winner` - 'player1' or 'player2'
- `date` - Match date
- `duration` - Match duration in minutes (optional)
- `notes` - Additional notes (optional)

### Sets
- `id` - Unique identifier
- `matchId` - Reference to match
- `player1Score`, `player2Score` - Set scores
- `winner` - 'player1' or 'player2'
- `setOrder` - Order of set in match

## Development

### Available Scripts

```bash
# Frontend
npm start          # Start React development server
npm run build      # Build for production
npm test           # Run tests

# Backend
npm run server     # Start Express server
npm run dev        # Start both frontend and backend

# Database
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:migrate     # Run migrations
npm run db:studio      # Open Prisma Studio
```

### Database Management

**Prisma Studio** - Visual database browser:
```bash
npm run db:studio
```

**Reset Database**:
```bash
# Drop and recreate database
npm run db:push --force-reset
```

## Deployment

### Frontend Deployment
- **Vercel**: Connect your GitHub repo
- **Netlify**: Drag and drop the `build` folder
- **GitHub Pages**: Use `gh-pages` package

### Backend Deployment
- **Railway**: Connect your GitHub repo
- **Heroku**: Use the Procfile
- **DigitalOcean**: Deploy to App Platform
- **AWS**: Use Elastic Beanstalk

### Environment Variables for Production
```env
DATABASE_URL="your_production_database_url"
PORT=3001
NODE_ENV=production
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

If you encounter any issues:
1. Check the console for error messages
2. Ensure PostgreSQL is running
3. Verify your database connection string
4. Check that all dependencies are installed

For database issues, you can use Prisma Studio to inspect your data:
```bash
npm run db:studio
``` 