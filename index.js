const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Put your Roblox .ROBLOSECURITY cookie here, or set it in environment variable ROBLOSECURITY
const ROBLOSECURITY = process.env.ROBLOSECURITY || "<your_roblosecurity_cookie_here>";

if (!ROBLOSECURITY) {
  console.error("Error: No ROBLOSECURITY cookie found! Set it in your environment or in the script.");
  process.exit(1);
}

const HEADERS = {
  'Cookie': `.ROBLOSECURITY=${ROBLOSECURITY}`,
  'User-Agent': 'Roblox/WinInet',
  'Content-Type': 'application/json'
};

// Function to get user ID from username
async function getUserId(username) {
  try {
    const response = await axios.post(
      'https://users.roblox.com/v1/usernames/users',
      { usernames: [username] },
      { headers: HEADERS }
    );
    return response.data.data[0]?.id || null;
  } catch (err) {
    console.error("Error getting user ID:", err.message);
    return null;
  }
}

// Function to get presence info from user ID
async function getPresence(userId) {
  try {
    const response = await axios.post(
      'https://presence.roblox.com/v1/presence/users',
      { userIds: [userId] },
      { headers: HEADERS }
    );
    return response.data.userPresences[0] || null;
  } catch (err) {
    console.error("Error getting presence data:", err.message);
    return null;
  }
}

// API endpoint to find user info and presence by username
app.get('/find/:username', async (req, res) => {
  const username = req.params.username;

  if (!username) {
    return res.status(400).json({ error: "Username parameter is required" });
  }

  const userId = await getUserId(username);
  if (!userId) {
    return res.status(404).json({ error: "User not found" });
  }

  const presence = await getPresence(userId);
  if (!presence) {
    return res.status(404).json({ error: "User presence data not found" });
  }

  const result = {
    userId,
    username,
    userPresenceType: presence.userPresenceType,
    placeId: presence.lastLocation?.placeId || null,
    universeId: presence.lastLocation?.universeId || null,
    gameId: presence.gameId || null,
    fullPresenceData: presence
  };

  return res.json(result);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Roblox player presence API listening on port ${PORT}`);
});
