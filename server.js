// server.js

require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;

app.use(express.json());

const ROBLOSECURITY = process.env.ROBLOSECURITY;

if (!ROBLOSECURITY) {
    console.error("ROBLOSECURITY token missing in .env file!");
    process.exit(1);
}

const robloxApi = axios.create({
    headers: {
        'Cookie': `.ROBLOSECURITY=${ROBLOSECURITY}`,
    }
});

// Web service endpoint
app.post('/findPlayer', async (req, res) => {
    const { universeId, userId } = req.body;

    if (!universeId || !userId) {
        return res.status(400).json({ error: 'universeId and userId are required.' });
    }

    try {
        // Get all places for the universe
        const universeInfo = await robloxApi.get(`https://develop.roblox.com/v1/universes/${universeId}/places`);
        const places = universeInfo.data.data;

        if (places.length === 0) {
            return res.status(404).json({ error: 'No places found for this Universe ID.' });
        }

        // Search all places (usually one, but just in case)
        for (const place of places) {
            const placeId = place.id;
            let cursor = null;

            while (true) {
                const serverList = await robloxApi.get(`https://games.roblox.com/v1/games/${placeId}/servers/Public?limit=100${cursor ? `&cursor=${cursor}` : ''}`);
                const servers = serverList.data.data;

                for (const server of servers) {
                    const serverPlayers = server.playing;
                    const playerIds = server.playerIds || [];

                    if (playerIds.includes(parseInt(userId))) {
                        // Found the player in this server
                        return res.json({
                            found: true,
                            placeId: placeId,
                            serverId: server.id,
                            joinLink: `https://www.roblox.com/games/${placeId}/join?jobId=${server.id}`
                        });
                    }
                }

                if (!serverList.data.nextPageCursor) break;
                cursor = serverList.data.nextPageCursor;
            }
        }

        return res.json({ found: false, message: 'Player not found in any active servers.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error.', details: err.toString() });
    }
});

app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
});
