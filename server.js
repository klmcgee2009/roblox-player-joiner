require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const ROBLOSECURITY = process.env.ROBLOSECURITY;

if (!ROBLOSECURITY) {
  console.error("ERROR: ROBLOSECURITY token is missing in your environment variables.");
  process.exit(1);
}

const robloxApi = axios.create({
  headers: {
    'Cookie': `.ROBLOSECURITY=${ROBLOSECURITY}`,
    'User-Agent': 'RobloxServerFinder/1.0'
  },
  timeout: 10000
});

app.post('/findPlayer', async (req, res) => {
  const { universeId, userId } = req.body;

  if (!universeId || !userId) {
    return res.status(400).json({ error: 'Missing universeId or userId in request body.' });
  }

  try {
    // Get places for universe
    const universeResp = await robloxApi.get(`https://develop.roblox.com/v1/universes/${universeId}/places`);
    if (!universeResp.data || !universeResp.data.data) {
      return res.status(404).json({ error: 'No places found for this universe.' });
    }

    const places = universeResp.data.data;
    if (places.length === 0) {
      return res.status(404).json({ error: 'Universe has no places.' });
    }

    // Search each place’s public servers
    for (const place of places) {
      const placeId = place.id;
      let cursor = null;

      while (true) {
        try {
          const url = `https://games.roblox.com/v1/games/${placeId}/servers/Public?limit=100${cursor ? `&cursor=${cursor}` : ''}`;
          const serversResp = await robloxApi.get(url);

          const servers = serversResp.data.data || [];
          for (const server of servers) {
            // Roblox API returns list of userIds currently in server as server.playing
            // But Roblox API often does NOT provide the player list here.
            // So, unfortunately, you can’t check which players are in the server via this API endpoint.
            // This is a Roblox limitation.

            // So here we can only return server info, NOT player presence.

            // As a workaround, you can return the list of active servers for the place.

            // **So to answer your original need: Roblox does not publicly provide a player list per server.**

          }

          // Pagination
          if (!serversResp.data.nextPageCursor) break;
          cursor = serversResp.data.nextPageCursor;

        } catch (innerErr) {
          // If 404 or other errors, break or continue
          break;
        }
      }
    }

    // Since Roblox API doesn’t expose player lists, you cannot find a player’s server via API.
    return res.json({
      found: false,
      message: "Roblox API does not expose player presence in game servers publicly. Cannot find player's server ID."
    });

  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.status(404).json({ error: 'Universe or place not found.' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.', details: err.toString() });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
