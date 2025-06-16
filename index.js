require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const ROBLOSECURITY = process.env.ROBLOSECURITY;
if (!ROBLOSECURITY) {
  console.error('Error: ROBLOSECURITY is not set in .env');
  process.exit(1);
}

const HEADERS = {
  Cookie: `.ROBLOSECURITY=${ROBLOSECURITY}`,
  'User-Agent': 'Roblox/WinInet',
  'Content-Type': 'application/json',
};

// Helper: Get userId from username
async function getUserId(username) {
  const res = await axios.post(
    'https://users.roblox.com/v1/usernames/users',
    { usernames: [username] },
    { headers: HEADERS }
  );
  return res.data.data[0]?.id || null;
}

// Helper: Get user presence info
async function getUserPresence(userId) {
  const res = await axios.post(
    'https://presence.roblox.com/v1/presence/users',
    { userIds: [userId] },
    { headers: HEADERS }
  );
  return res.data.userPresences[0] || null;
}

// Helper: Get servers for universeId (with pagination)
async function getAllServers(universeId) {
  let servers = [];
  let cursor = null;

  while (true) {
    const url = `https://games.roblox.com/v1/games/${universeId}/servers/Public?sortOrder=Asc&limit=100${cursor ? `&cursor=${cursor}` : ''}`;
    const res = await axios.get(url, { headers: HEADERS });
    servers = servers.concat(res.data.data);
    cursor = res.data.nextPageCursor;
    if (!cursor) break;
  }
  return servers;
}

// Main: Find server by scanning players
async function findServerByUsername(universeId, username, onProgress) {
  const servers = await getAllServers(universeId);
  let playersSearched = 0;

  for (const server of servers) {
    try {
      const res = await axios.get(
        `https://games.roblox.com/v1/games/${universeId}/servers/${server.id}/players`,
        { headers: HEADERS }
      );

      playersSearched += res.data.players.length;
      if (onProgress) onProgress(playersSearched);

      if (res.data.players.some(p => p.userName.toLowerCase() === username.toLowerCase())) {
        return server;
      }
    } catch (e) {
      // Ignore errors and continue
    }
  }
  return null;
}

// Route: SSE stream progress while finding player
app.get('/find-progress/:username', async (req, res) => {
  const username = req.params.username;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const userId = await getUserId(username);
    if (!userId) {
      res.write(`data: ${JSON.stringify({ error: "User not found" })}\n\n`);
      return res.end();
    }

    const presence = await getUserPresence(userId);
    if (!presence || presence.userPresenceType !== 2) {
      res.write(`data: ${JSON.stringify({ error: "User not in game or presence unavailable" })}\n\n`);
      return res.end();
    }

    const universeId = presence.universeId || presence.lastLocation?.universeId;
    if (!universeId) {
      res.write(`data: ${JSON.stringify({ error: "Universe ID not found" })}\n\n`);
      return res.end();
    }

    // If presence has gameId, return immediately
    if (presence.gameId) {
      res.write(`data: ${JSON.stringify({
        message: "Found user by presence",
        username,
        userId,
        universeId,
        serverId: presence.gameId
      })}\n\n`);
      return res.end();
    }

    // Otherwise, scan all servers and stream progress
    await findServerByUsername(universeId, username, (playersSearched) => {
      res.write(`data: ${JSON.stringify({ playersSearched })}\n\n`);
    }).then(server => {
      if (server) {
        res.write(`data: ${JSON.stringify({
          message: "Found user by scanning servers",
          username,
          userId,
          universeId,
          serverId: server.id
        })}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify({ error: "User not found in any active servers" })}\n\n`);
      }
      res.end();
    });

  } catch (err) {
    console.error(err);
    res.write(`data: ${JSON.stringify({ error: "Internal Server Error" })}\n\n`);
    res.end();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
