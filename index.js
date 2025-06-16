const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const ROBLOSECURITY = process.env.ROBLOSECURITY;
if (!ROBLOSECURITY) {
  console.error('Missing ROBLOSECURITY cookie in environment variables!');
  process.exit(1);
}

const HEADERS = {
  'Cookie': `.ROBLOSECURITY=${ROBLOSECURITY}`,
  'User-Agent': 'Roblox/WinInet',
  'Content-Type': 'application/json',
};

// Get list of servers for a universe
async function getServers(universeId, cursor = null) {
  let url = `https://games.roblox.com/v1/games/${universeId}/servers/Public?limit=100`;
  if (cursor) url += `&cursor=${cursor}`;

  const res = await axios.get(url, { headers: HEADERS });
  return res.data;
}

// Check if targetUserId is in server players
function serverHasPlayer(server, targetUserId) {
  return server.players.some(p => p.id === targetUserId);
}

// API endpoint to find user in universe servers
app.get('/find-in-servers/:universeId/:userId', async (req, res) => {
  const universeId = req.params.universeId;
  const targetUserId = Number(req.params.userId);
  if (!universeId || !targetUserId) return res.status(400).json({ error: 'Missing universeId or userId' });

  try {
    let cursor = null;

    do {
      const serverData = await getServers(universeId, cursor);
      for (const server of serverData.data) {
        if (serverHasPlayer(server, targetUserId)) {
          return res.json({
            message: `User found on server ${server.id}`,
            serverId: server.id,
            maxPlayers: server.maxPlayers,
            playing: server.playing,
            currentPlayers: server.players.length,
            playerList: server.players,
          });
        }
      }
      cursor = serverData.nextPageCursor;
    } while (cursor);

    return res.status(404).json({ error: 'User not found in any public server of this universe' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
