const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

const ROBLOX_API = 'https://friends.roblox.com/v1/users/';
const scannedUsers = new Set();
let totalScanned = 0;

// Helper to pause execution
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch friends with rate limit handling
async function fetchFriends(userId, retry = 0) {
    try {
        const res = await axios.get(`${ROBLOX_API}${userId}/friends`);
        return res.data.data || [];
    } catch (err) {
        if (err.response?.status === 429) {
            const wait = Math.min(3000 * (retry + 1), 15000);
            console.warn(`⚠️ Rate limited for userId ${userId}. Waiting ${wait / 1000}s before retrying...`);
            await sleep(wait);
            return fetchFriends(userId, retry + 1);
        } else {
            console.error(`❌ Error fetching friends for userId ${userId}:`, err.response?.status || err.message);
            return [];
        }
    }
}

// Breadth-First Search to explore all friend connections
async function searchUser(targetId, onScanUpdate) {
    const queue = [targetId];
    scannedUsers.add(targetId);
    totalScanned++;

    while (queue.length > 0) {
        const currentId = queue.shift();
        onScanUpdate(totalScanned);

        const friends = await fetchFriends(currentId);

        for (const friend of friends) {
            if (!scannedUsers.has(friend.id)) {
                scannedUsers.add(friend.id);
                queue.push(friend.id);
                totalScanned++;
            }
        }
    }

    return Array.from(scannedUsers);
}

// API route
app.get('/search/:userId', async (req, res) => {
    scannedUsers.clear();
    totalScanned = 0;

    const userId = req.params.userId;
    console.log(`🔍 Starting scan from userId ${userId}`);

    await searchUser(userId, (count) => {
        console.log(`🔄 Players scanned: ${count}`);
    });

    res.json({ scannedCount: totalScanned, users: Array.from(scannedUsers) });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Roblox Connection API live on port ${PORT}`);
});
