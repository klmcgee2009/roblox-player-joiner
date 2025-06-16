// index.js

require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const ROBLOSECURITY = process.env.ROBLOSECURITY;
if (!ROBLOSECURITY) {
  console.error("Missing ROBLOSECURITY token in .env");
  process.exit(1);
}

const HEADERS = {
  'Cookie': `.ROBLOSECURITY=${ROBLOSECURITY}`,
  'User-Agent': 'Roblox/WinInet',
  'Content-Type': 'application/json'
};

// 1) Get userId from username
async function getUserId(username) {
  const res = await axios.post(
    'https://users.roblox.com/v1/usernames/users',
    { usernames: [username] },
    { headers: HEADERS }
  );
  return res.data.data[0]?.id || null;
}

// 2) Get user's presence to find universeId and jobId
async function getUserPresence(userId) {
  const res = await axios.post(
    'https://presence.roblox.com/v1/presence/users',
    { userIds: [userId] },
    { headers: HEADERS }
  );
  return res.data.userPresences[0] || null;
}

// 3) List all servers for a universe (paginated)
async function getAllServers(universeId, cursor = null, servers = []) {
  let url = `https://games.roblox.com/v1/games/${universeId}/servers/Public?sortOrder=Asc&limit=100`;
  if (cursor) url += `&cursor=${cursor}`;

  const res = await axios.get(url, { headers: HEADERS });
  servers.push(...res.data.data);

  if (res.data.nextPageCursor) {
    return getAllServers(universeId, res.data.nextPageCursor, servers);
  }
  return servers;
}

// 4) Find server containing the user in all servers
async function findServerByUsername(universeId, username) {
  const servers = await getAllServers(universeId);
  for (const server of servers) {
    // each server has a player list? Unfortunately no API for player list directly
    // We must use Server's endpoint to get players (not officially documented but can be accessed):
    // https://games.roblox.com/v1/games/{universeId}/servers/{serverId}/players
    try {
      const res = await axios.get(
        `https://games.roblox.com/v1/games/${universeId}/servers/${server.id}/players`,
        { headers: HEADERS }
      );
      if (res.data.players.some(p => p.userName.toLowerCase() === username.toLowerCase())) {
        return server;
      }
    } catch (e) {
      // ignore errors (likely private or no permission)
    }
  }
  return null;
}

app.get('/find/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const userId = await getUserId(username);
    if (!userId) return res.status(404).json({ error: "User not found" });

    const presence = await getUserPresence(userId);
    if (!presence || presence.userPresenceType !== 2) { // 2 means in-game
      return res.status(404).json({ error: "User not in a game or presence unavailable" });
    }

    const universeId = presence.universeId || presence.lastLocation?.universeId;
    if (!universeId) return res.status(404).json({ error: "Universe ID not found" });

    // Try to get the jobId (server ID) from presence
    if (presence.gameId) {
      return res.json({
        message: "Found user in game by presence",
        username,
        userId,
        universeId,
        serverId: presence.gameId // this is JobId (server id)
      });
    }

    // If no direct jobId, search all servers for the user
    const server = await findServerByUsername(universeId, username);

    if (server) {
      return res.json({
        message: "Found user by scanning servers",
        username,
        userId,
        universeId,
        serverId: server.id,
        maxPlayers: server.maxPlayers,
        playing: server.playing,
      });
    }

    res.status(404).json({ error: "User not found in any active servers" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
