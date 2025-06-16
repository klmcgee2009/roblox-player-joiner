require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const ROBLOSECURITY = process.env.ROBLOSECURITY;

if (!ROBLOSECURITY) {
  console.error('❌ Error: .ROBLOSECURITY token not set in environment.');
  process.exit(1);
}

const HEADERS = {
  Cookie: `.ROBLOSECURITY=${ROBLOSECURITY}`,
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

// Get presence data
async function getPresence(userId) {
  const res = await axios.post(
    'https://presence.roblox.com/v1/presence/users',
    { userIds: [userId] },
    { headers: HEADERS }
  );
  return res.data.userPresences[0] || null;
}

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
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API running on port ${PORT}`));
