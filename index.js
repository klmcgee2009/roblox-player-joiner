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
  return res.data.data[0]?.id;
}

async function getPresence(userId) {
  const res = await axios.post(
    'https://presence.roblox.com/v1/presence/users',
    { userIds: [userId] },
    { headers: HEADERS }
  );
  return res.data.userPresences[0];
}

async function getPublicServers(placeId) {
  const servers = [];
  let cursor = '';
  while (servers.length < 100) {
    const res = await axios.get(
      `https://games.roblox.com/v1/games/${placeId}/servers/Public?limit=100&cursor=${cursor}`
    );
    servers.push(...res.data.data);
    if (!res.data.nextPageCursor) break;
    cursor = res.data.nextPageCursor;
  }
  return servers;
}

app.get('/find/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const userId = await getUserId(username);

    if (!userId) {
      return res.status(404).json({ error: 'User not found' });
    }

    const presence = await getPresence(userId);

    if (presence.userPresenceType !== 2) {
      return res.status(404).json({ error: 'User is not in a public game' });
    }

    const placeId = presence.lastLocation.placeId;
    const servers = await getPublicServers(placeId);

    for (const server of servers) {
      if (server.playerIds && server.playerIds.includes(userId)) {
        return res.json({
          placeId,
          jobId: server.id
        });
      }
    }

    return res.status(404).json({ error: 'User not found in any public server' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API Server running on port ${PORT}`));

