const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.send("Roblox Connection Search API is running.");
});

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
    console.log(`🔍 Searched (${searchedCount}): ${path.join(" → ")}`);

    try {
      const response = await axios.get(`https://friends.roblox.com/v1/users/${currentId}/friends`);
      const friends = response.data.data.map(friend => friend.id.toString());
      console.log(`➡️ ${currentId} has ${friends.length} friends`);

      if (friends.includes(toId)) {
        const fullPath = [...path, toId];
        console.log(`✅ Connection found: ${fullPath.join(" → ")}`);
        return res.json({ searchedCount, connection: fullPath });
      }

      if (path.length < maxDepth) {
        for (const friendId of friends) {
          if (!visited.has(friendId)) {
            queue.push([...path, friendId]);
            console.log(`📥 Enqueue: ${[...path, friendId].join(" → ")}`);
          }
        }
      }

    } catch (err) {
      console.warn(`⚠️ Failed to fetch friends for ${currentId}: ${err.message}`);
    }
  }

  console.log(`❌ No connection found after ${searchedCount} searches.`);
  res.status(404).json({ error: "No connection found", searchedCount });
});

app.listen(PORT, () => {
  console.log(`🌐 Roblox Player Connection API running on port ${PORT}`);
});
