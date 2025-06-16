const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const ROBLOSECURITY = process.env.ROBLOSECURITY;

const headers = {
  Cookie: `.ROBLOSECURITY=${ROBLOSECURITY}`,
  "User-Agent": "Roblox/WinInet",
  "Content-Type": "application/json"
};

// Get user ID from username
async function getUserId(username) {
  const res = await axios.get(`https://users.roblox.com/v1/usernames/users`, {
    data: { usernames: [username] },
    headers
  });
  if (res.data.data.length === 0) return null;
  return res.data.data[0].id;
}

// Get user presence (online/offline/in-game)
async function getUserPresence(userId) {
  const res = await axios.post(`https://presence.roblox.com/v1/presence/users`, {
    userIds: [userId]
  }, { headers });
  return res.data.userPresences[0];
}

// Try to get the server or game info
async function getGameInstanceData(universeId) {
  try {
    const res = await axios.get(`https://games.roblox.com/v1/games?universeIds=${universeId}`, {
      headers
    });
    return res.data.data[0];
  } catch (err) {
    return null;
  }
}

app.get("/search/:username", async (req, res) => {
  const username = req.params.username;

  try {
    const userId = await getUserId(username);
    if (!userId) return res.status(404).json({ error: "User not found" });

    const presence = await getUserPresence(userId);
    const status = presence.userPresenceType;
    let response = {
      username,
      userId,
      status: status === 0 ? "Offline" : status === 1 ? "Online" : "In Game"
    };

    if (presence.userPresenceType === 2) { // In Game
      response.placeId = presence.lastLocation;
      response.game = presence.lastLocation;
      response.universeId = presence.universeId;

      const gameInfo = await getGameInstanceData(presence.universeId);
      if (gameInfo) {
        response.placeName = gameInfo.name;
        response.joinScript = `roblox://placeId=${presence.placeId}&universeId=${presence.universeId}`;
      }
    }

    res.json(response);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Something went wrong." });
  }
});

app.listen(PORT, () => {
  console.log(`Roblox Player Search API running on port ${PORT}`);
});
