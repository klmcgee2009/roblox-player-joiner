require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 10000;

const ROBLOSECURITY = process.env.ROBLOSECURITY;
if (!ROBLOSECURITY) {
  console.error("🚨 Missing ROBLOSECURITY. Set it in your environment.");
  process.exit(1);
}

const api = axios.create({
  headers: {
    Cookie: `.ROBLOSECURITY=${ROBLOSECURITY}`,
    "User-Agent": "Roblox/WinInet"
  },
  timeout: 10000
});

// BFS for friend connections
app.get("/connections/:fromId/:toId", async (req, res) => {
  const { fromId, toId } = req.params;
  const visited = new Set();
  const queue = [[fromId]];
  let searchedCount = 0;
  const maxDepth = 8;

  while (queue.length) {
    const path = queue.shift();
    const currentId = path[path.length - 1];
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    searchedCount++;
    console.log(`🔍 (#${searchedCount}) Current path: ${path.join(" → ")}`);

    try {
      const { data } = await api.get(`https://friends.roblox.com/v1/users/${currentId}/friends`);
      const friends = data.data.map(f => f.id.toString());
      console.log(`↳ ${currentId} → ${friends.length} friends`);

      if (friends.includes(toId)) {
        const connection = [...path, toId];
        console.log(`✅ Found connection: ${connection.join(" → ")}`);
        return res.json({ searchedCount, connection });
      }

      if (path.length < maxDepth) {
        for (const fid of friends) {
          if (!visited.has(fid)) queue.push([...path, fid]);
        }
      }
    } catch (err) {
      console.warn(`⚠️ Error for ${currentId}: ${err.response?.status || err.message}`);
    }
  }

  return res.status(404).json({
    error: "No connection found",
    searchedCount
  });
});

app.listen(PORT, () => console.log(`🚀 Roblox Connection API live on port ${PORT}`));
