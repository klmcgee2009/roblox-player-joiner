const express = require('express');
const axios = require('axios');
const app = express();

const proxies = [
    "https://proxy1.onrender.com",
    "https://proxy2.onrender.com",
    "https://proxy3.onrender.com"
    // add more as you deploy more proxies
];

let proxyIndex = 0;

function getNextProxy() {
    proxyIndex = (proxyIndex + 1) % proxies.length;
    return proxies[proxyIndex];
}

async function proxyRequest(url, method = 'GET', data = null) {
    const proxy = getNextProxy();
    try {
        const res = await axios.post(`${proxy}/forward`, {
            url,
            method,
            headers: { "Cookie": `ROBLOSECURITY=${process.env.ROBLOSECURITY}` },
            data
        });
        return res.data;
    } catch (err) {
        console.error(`Error via proxy ${proxy}:`, err.response?.data || err.message);
        return null;
    }
}

async function scanFriends(userId, visited = new Set()) {
    if (visited.has(userId)) return;
    visited.add(userId);
    console.log(`🔎 Scanning userId ${userId} | Players scanned: ${visited.size}`);

    const url = `https://friends.roblox.com/v1/users/${userId}/friends`;
    const data = await proxyRequest(url);

    if (data?.data) {
        for (const friend of data.data) {
            await scanFriends(friend.id, visited);
        }
    }
}

app.use(express.json());

app.post('/start-scan', async (req, res) => {
    const { userId } = req.body;
    console.log("🔍 Starting full scan...");
    await scanFriends(userId);
    res.send("✅ Scan complete");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Scanner live on port ${PORT}`);
});
