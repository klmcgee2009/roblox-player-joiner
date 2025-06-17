const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// Your Roblox cookie goes here
const ROBLOSECURITY =  process.env.ROBLOSECURITY;

// Middleware to parse JSON bodies (for POST if needed)
app.use(express.json());

// Example GET endpoint with URL params
app.get('/findPlayer/:universeId/:userId', async (req, res) => {
  const { universeId, userId } = req.params;

  try {
    // Your searching logic here, example:
    // 1. Get list of active servers for universeId
    const serversResponse = await axios.get(`https://games.roblox.com/v1/games/${universeId}/servers/Public?limit=100`, {
      headers: { Cookie: `.ROBLOSECURITY=${ROBLOSECURITY}` }
    });

    const servers = serversResponse.data.data;

    // 2. Search for userId in server player lists
    for (const server of servers) {
      const players = server.players || [];
      if (players.find(p => p.id.toString() === userId)) {
        return res.json({
          found: true,
          serverId: server.id,
          joinLink: `https://www.roblox.com/games/start?placeId=${universeId}&gameInstanceId=${server.id}`
        });
      }
    }

    // Not found
    res.json({ found: false, message: 'Player not found in active servers' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to search servers' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
