require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;
const COOKIE = process.env.ROBLOSECURITY;

let totalSearches = 0; // Count how many players have been searched

app.get('/search/:username', async (req, res) => {
  const username = req.params.username;
  totalSearches++; // Increase the counter
  console.log(`[SEARCH #${totalSearches}] Searching for user: ${username}`);

  try {
    // Get userId from username
    const userResponse = await axios.post(
      `https://users.roblox.com/v1/usernames/users`,
      { usernames: [username] },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const userData = userResponse.data.data[0];
    if (!userData) {
      return res.json({ error: 'User not found', searched: totalSearches });
    }

    const userId = userData.id;

    // Get presence (online status)
    const presenceResponse = await axios.post(
      `https://presence.roblox.com/v1/presence/users`,
      { userIds: [userId] },
      {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `.ROBLOSECURITY=${COOKIE}`
        }
      }
    );

    const presenceInfo = presenceResponse.data.userPresences[0];
    res.json({
      searched: totalSearches,
      username: userData.name,
      userId: userData.id,
      displayName: userData.displayName,
      status: presenceInfo.userPresenceType === 2 ? 'In Game' :
              presenceInfo.userPresenceType === 1 ? 'Online' : 'Offline',
      lastLocation: presenceInfo.lastLocation,
      placeId: presenceInfo.lastLocation?.placeId || null,
      universeId: presenceInfo.universeId || null
    });
  } catch (error) {
    console.error(`[ERROR] While searching for ${username}:`, error.message);
    res.status(500).json({ error: 'Internal server error', searched: totalSearches });
  }
});

// Optional endpoint to show search count
app.get('/stats', (req, res) => {
  res.json({ totalSearches });
});

app.listen(PORT, () => {
  console.log(`Roblox Player Search API running on port ${PORT}`);
});
