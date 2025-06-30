require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // to parse JSON POST bodies

const PORT = process.env.PORT || 3000;

// Simple in-memory store (reset on restart)
// Structure:
// {
//   username1: { totalSeconds: 12345, games: { gameName1: seconds, gameName2: seconds } },
//   username2: {...}
// }
const playtimeData = {};

// Track playtime POST /track
// Body JSON: { username: string, game: string, sessionSeconds: number }
app.post('/track', (req, res) => {
  const { username, game, sessionSeconds } = req.body;
  if (!username || !game || !sessionSeconds || sessionSeconds <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid data' });
  }

  if (!playtimeData[username]) {
    playtimeData[username] = { totalSeconds: 0, games: {} };
  }

  playtimeData[username].totalSeconds += sessionSeconds;
  playtimeData[username].games[game] = (playtimeData[username].games[game] || 0) + sessionSeconds;

  res.json({ success: true, message: 'Tracked successfully' });
});

// Get user stats GET /user?username=...
app.get('/user', (req, res) => {
  const username = req.query.username;
  if (!username || !playtimeData[username]) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const data = playtimeData[username];
  // Convert seconds to hours (2 decimals)
  const totalHours = (data.totalSeconds / 3600).toFixed(2);

  // Sort games by time played desc
  const gamesSorted = Object.entries(data.games)
    .sort((a, b) => b[1] - a[1])
    .map(([game, seconds]) => ({ game, hours: (seconds / 3600).toFixed(2) }));

  res.json({ success: true, username, totalHours, topGames: gamesSorted });
});

// Get leaderboard GET /leaderboard
app.get('/leaderboard', (req, res) => {
  // Sort all users by totalSeconds desc
  const leaderboard = Object.entries(playtimeData)
    .sort((a, b) => b[1].totalSeconds - a[1].totalSeconds)
    .slice(0, 10)
    .map(([username, data]) => ({
      username,
      totalHours: (data.totalSeconds / 3600).toFixed(2)
    }));

  res.json({ success: true, leaderboard });
});

app.listen(PORT, () => {
  console.log(`Playtime tracking API running on port ${PORT}`);
});
