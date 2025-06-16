const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const ROBLOSECURITY = process.env.ROBLOSECURITY;
if (!ROBLOSECURITY) {
  console.error('Error: ROBLOSECURITY environment variable is not set.');
  process.exit(1);
}

const HEADERS = {
  'Cookie': `.ROBLOSECURITY=${ROBLOSECURITY}`,
  'User-Agent': 'Roblox/WinInet',
  'Content-Type': 'application/json'
};

async function getUserId(username) {
  const res = await axios.post(
    'https://users.roblox.com/v1/usernames/users',
    { usernames: [username] },
    { headers: HEADERS }
  );
  return res.data.data[0]?.id || null;
}

async function getPresence(userId) {
  const res = await axios.post(
    'https://presence.roblox.com/v1/presence/users',
    { userIds: [userId] },
    { headers: HEADERS }
  );
  return res.data.userPresences[0] || null;
}

async function getServers(universeId, cursor = null) {
  let url = `https://games.roblox.com/v1/games/${universeId}/servers/Public?limit=100&sortOrder=Asc`;
  if (cursor) url += `&cursor=${cursor}`;

  const res = await axios.get(url, { headers: HEADERS });
  return res.data;
}

async function findUserInServers(universeId, userId) {
  let cursor = null;

  do {
    const data = await getServers(universeId, cursor);
    cursor = data.nextPageCursor;

    for (const server of data.data) {
      for (const player of server.playing) {
        if (player.id === userId) {
          return {
            placeId: server.placeId,
            gameId: server.id,
          };
        }
      }
    }
  } while (cursor);

  return null;
}

app.get('/find/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const userId = await getUserId(username);
    if (!userId) return res.status(404).json({ error: 'User not found' });

    const presence = await getPresence(userId);

    if (
      presence &&
      presence.lastLocation?.placeId &&
      presence.gameId
    ) {
      return res.json({
        userId,
        username,
        placeId: presence.lastLocation.placeId,
        universeId: presence.lastLocation.universeId,
        gameId: presence.gameId,
        method: 'direct-presence'
      });
    }

    const universeId = presence?.lastLocation?.universeId;
    if (!universeId) {
      return res.status(404).json({ error: 'Universe ID not found or user offline' });
    }

    const foundServer = await findUserInServers(universeId, userId);
    if (foundServer) {
      return res.json({
        userId,
        username,
        placeId: foundServer.placeId,
        universeId,
        gameId: foundServer.gameId,
        method: 'search-servers'
      });
    } else {
      return res.status(404).json({ error: 'User not found in any active servers' });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
