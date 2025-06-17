const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Helper to get games matching query from Roblox API
async function searchGames(query) {
  try {
    const res = await axios.get(
      `https://games.roblox.com/v1/games/list?keyword=${encodeURIComponent(query)}&limit=10`
    );
    return res.data.data; // Array of games
  } catch (error) {
    console.error("Error fetching games:", error.message);
    return [];
  }
}

// Helper to get servers for a universeId
async function getServers(universeId, cursor = "") {
  try {
    let url = `https://games.roblox.com/v1/games/${universeId}/servers/Public?sortOrder=Asc&limit=100`;
    if (cursor) url += `&cursor=${cursor}`;
    const res = await axios.get(url);
    return res.data; // Contains data array + nextPageCursor
  } catch (error) {
    console.error("Error fetching servers:", error.message);
    return null;
  }
}

// Endpoint: Search for games by name keyword
app.get("/games/search", async (req, res) => {
  const query = req.query.query;
  if (!query) return res.status(400).json({ error: "Missing query parameter" });

  const games = await searchGames(query);
  res.json({ games });
});

// Endpoint: Check if a user is online in any server of a given universeId
app.get("/player/search", async (req, res) => {
  const { universeId, username } = req.query;
  if (!universeId || !username) {
    return res.status(400).json({ error: "Missing universeId or username parameter" });
  }

  let cursor = "";
  let found = false;
  let serverId = null;

  while (!found) {
    const serversData = await getServers(universeId, cursor);
    if (!serversData) break; // error fetching servers

    for (const server of serversData.data) {
      // server.players is an array of player objects
      const players = server.players || [];
      if (players.find(p => p.userName.toLowerCase() === username.toLowerCase())) {
        found = true;
        serverId = server.id;
        break;
      }
    }

    if (found) break;
    if (!serversData.nextPageCursor) break; // no more servers
    cursor = serversData.nextPageCursor;
  }

  if (found) {
    res.json({ status: "online", serverId });
  } else {
    res.json({ status: "offline" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Roblox Connection API live on port ${PORT}`);
});
