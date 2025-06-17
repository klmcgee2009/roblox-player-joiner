const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Simple game search endpoint
app.get('/searchGames', async (req, res) => {
    const name = req.query.name;
    if (!name) return res.status(400).json({ error: 'Missing name query parameter' });

    try {
        // Use Roblox API to search experiences
        const response = await axios.get(`https://games.roblox.com/v1/games/list?keyword=${encodeURIComponent(name)}&limit=10`);
        const games = response.data.data.map(game => ({
            placeId: game.rootPlaceId,
            name: game.name
        }));
        res.json({ games });
    } catch (error) {
        console.error('Error fetching games:', error);
        res.status(500).json({ error: 'Failed to fetch games' });
    }
});

// Simulated player search endpoint (you’ll need to replace with actual logic)
app.get('/searchPlayer', async (req, res) => {
    const { gameId, username } = req.query;
    if (!gameId || !username) return res.status(400).json({ error: 'Missing gameId or username parameter' });

    // Placeholder simulated response:
    // Replace this part with actual scanning system if you develop further.
    if (Math.random() > 0.5) {
        res.json({ status: "found", serverId: "abcde12345" });
    } else {
        res.json({ status: "offline" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Roblox Player API live on port ${PORT}`);
});
