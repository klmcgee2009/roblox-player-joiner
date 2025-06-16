const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Get userId from username
async function getUserId(username) {
  const res = await axios.post(
    'https://users.roblox.com/v1/usernames/users',
    { usernames: [username] }
  );
  return res.data.data[0]?.id || null;
}

// Get presence info for userId
async function getPresence(userId) {
  const res = await axios.post(
    'https://presence.roblox.com/v1/presence/users',
    { userIds: [userId] }
  );
  return res.data.userPresences[0] || null;
}

// Get servers for universeId (public servers only)
async function getServers(universeId, cursor = null, servers = []) {
  let url = `https://games.roblox.com/v1/games/${universeId}/servers/Public?limit=100`;
  if (cursor) url += `&cursor=${cursor}`;

  const res = await axios.get(url);
  servers = servers.concat(res.data.data);

  if (res.data.nextPageCursor) {
    return getServers(universeId, res.data.nextPageCursor, servers);
  } else {
    return servers;
  }
}

app.get('/findserver/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const userId = await getUserId(username);
    if (!userId) return res.status(404).json({ error: 'User not found' });

    const presence = await getPresence(userId);
    if (!presence || !presence.universeId) {
      return res.status(404).json({ error: 'User not in a game' });
    }

    const universeId = presence.universeId;

    const servers = await getServers(universeId);

    // Search servers for userId
    const server = servers.find(s => s.playing.includes(userId));

    if (!server) {
      return res.status(404).json({ error: 'User server not found' });
    }

    // Return server info including JobId to join
    return res.json({
      userId,
      username,
      universeId,
      placeId: server.placeId,
      jobId: server.id,  // server instance JobId
      maxPlayers: server.maxPlayers,
      playing: server.playing.length
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
