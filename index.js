require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Read the ROBLOSECURITY cookie from environment variables
const ROBLOSECURITY = process.env.ROBLOSECURITY;

if (!ROBLOSECURITY) {
  console.error('❌ Error: ROBLOSECURITY environment variable is not set.');
  process.exit(1);
}

const HEADERS = {
  'Cookie': `.ROBLOSECURITY=${ROBLOSECURITY}`,
  'User-Agent': 'Roblox/WinInet',
  'Content-Type': 'application/json'
};

// Get userId from username
async function getUserId(username) {
  const res = await axios.post(
    'https://users.roblox.com/v1/usernames/users',
    { usernames: [username] },
    { headers: HEADERS }
  );
  return res.data.data[0]?.id || null;
}

// Get presence info from userId
async function getPresence(userId) {
  const res = await axios.post(
    'https://presence.roblox.com/v1/presence/users',
    { userIds: [userId] },
    { headers: HEADERS }
  );
  return res.data.userPresences[0] || null;
}

// API endpoint to find user presence
app.get('/find/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const userId = await getUserId(username);

    if (!userId) {
      return res.status(404).json({ error: 'User not found' });
    }

    const presence = await getPresence(userId);

    if (!presence) {
      return res.status(404).json({ error: 'User presence not available' });
    }

    const response = {
      userId,
      username,
      userPresenceType: presence.userPresenceType,
      placeId: presence.lastLocation?.placeId || null,
      universeId: presence.lastLocation?.universeId || null,
      gameId: presence.gameId || null,
      fullPresenceData: presence
    };

    return res.json(response);

  } catch (err) {
    console.error('❌ API error:', err.message);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ API server running on port ${PORT}`);
});
