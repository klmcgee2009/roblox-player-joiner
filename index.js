const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 10000;

// Roblox API base URLs
const ROBLOX_USER_API = "https://users.roblox.com/v1/users";
const ROBLOX_PLAYER_API = "https://games.roblox.com/v1/games";

// Simple cache to avoid redundant calls (optional, small scale)
const userCache = new Map();

// Helper: Get user ID from username
async function getUserId(username) {
  if (userCache.has(username.toLowerCase())) return userCache.get(username.toLowerCase());
  try {
    const res = await axios.get(`https://api.roblox.com/users/get-by-username?username=${username}`);
    if (res.data && res.data.Id && res.data.Id !== 0) {
      userCache.set(username.toLowerCase(), res.data.Id);
      return res.data.Id;
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Helper: Get servers info for a game - to find players in servers (use PlaceId or UniverseId)
async function getServers(placeId, cursor = null) {
  const url = `https://games.roblox.com/v1/games/${placeId}/servers/Public?sortOrder=Asc&limit=100${cursor ? `&cursor=${cursor}` : ""}`;
  const res = await axios.get(url);
  return res.data;
}

// Helper: Get player list from a server
// Roblox doesn’t give full player list on public API, but you can get limited info on server lists or friends lists.
// For demonstration, this will be a stub returning empty list since Roblox API doesn't expose all players easily.
async function getPlayersInServer(server) {
  // Cannot get full list of players from Roblox public APIs, so here we only simulate
  // In your real implementation, you might store or collect data differently
  return server.playerIds || [];
}

// Endpoint: Get user info by username
app.get("/search/:username", async (req, res) => {
  const username = req.params.username;
  const userId = await getUserId(username);
  if (!userId) return res.status(404).json({ error: "User not found" });
  res.json({ username, userId });
});

// Endpoint: Find connections from one userId to another userId
app.get("/connections/:startUserId/:targetUserId", async (req, res) => {
  const startUserId = req.params.startUserId;
  const targetUserId = req.params.targetUserId;

  if (startUserId === targetUserId) {
    return res.json({ path: [startUserId], searchedCount: 1 });
  }

  // BFS to find path from startUserId to targetUserId through mutual game servers or friends
  // Roblox API does not provide full public data for players in servers or friends, so this is a simplified demo

  // For demonstration, we'll simulate the search by friends API to try to find a connection path
  // This BFS will check friends of friends up to a max depth

  async function getFriends(userId) {
    try {
      const response = await axios.get(`https://friends.roblox.com/v1/users/${userId}/friends`);
      return response.data.data.map(friend => friend.id.toString());
    } catch {
      return [];
    }
  }

  const maxDepth = 5; // Limit to 5 levels of friends to avoid long or infinite search
  const queue = [[startUserId]];
  const visited = new Set([startUserId]);
  let searchedCount = 0;

  while (queue.length > 0) {
    const path = queue.shift();
    const lastUser = path[path.length - 1];
    searchedCount++;

    if (lastUser === targetUserId) {
      return res.json({ path, searchedCount });
    }

    if (path.length > maxDepth) continue;

    const friends = await getFriends(lastUser);
    for (const friendId of friends) {
      if (!visited.has(friendId)) {
        visited.add(friendId);
        queue.push([...path, friendId]);
      }
    }
  }

  res.status(404).json({ error: "No connection found", searchedCount });
});

// Start server
app.listen(PORT, () => {
  console.log(`Roblox Player Connections API running on port ${PORT}`);
});
