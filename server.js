const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const COOKIE = process.env.ROBLOSECURITY;
const API_KEY = process.env.API_KEY;

app.get('/getServer', async (req, res) => {
  const { username, key } = req.query;

  // ✅ Check API key
  if (!key || key !== API_KEY) {
    return res.status(403).json({ error: 'Invalid or missing API key' });
  }

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    // Step 1: Get userId from username
    const userRes = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `.ROBLOSECURITY=${COOKIE}`
      },
      body: JSON.stringify({ usernames: [username] })
    });

    const userData = await userRes.json();
    const userId = userData.data?.[0]?.id;
    if (!userId) return res.status(404).json({ error: 'User not found' });

    // Step 2: Get presence
    const presenceRes = await fetch('https://presence.roblox.com/v1/presence/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `.ROBLOSECURITY=${COOKIE}`
      },
      body: JSON.stringify({ userIds: [userId] })
    });

    const presenceData = await presenceRes.json();
    const info = presenceData.userPresences?.[0];

    if (info?.placeId && info?.gameId) {
      const joinLink = `https://www.roblox.com/games/${info.placeId}?jobId=${info.gameId}`;
      return res.json({ joinLink });
    } else {
      return res.json({ error: 'User is not in a public game or cannot be accessed.' });
    }

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Roblox Join Server API running on port ${PORT}`);
});
