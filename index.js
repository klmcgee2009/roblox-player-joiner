const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 10000;

app.get("/connections/:fromId/:toId", async (req, res) => {
  const { fromId, toId } = req.params;
  
  let searchedCount = 0;
  const visited = new Set();
  const queue = [ [fromId] ];
  const maxDepth = 6; // Adjust as needed

  while (queue.length) {
    const path = queue.shift();
    const current = path[path.length - 1];

    if (visited.has(current)) continue;
    visited.add(current);
    searchedCount++;

    // Log every 10 players checked
    if (searchedCount % 10 === 0) {
      console.log(`Searched ${searchedCount} users so far...`);
    }

    // If depth limit reached, skip expanding this path
    if (path.length > maxDepth) continue;

    try {
      const resp = await axios.get(`https://friends.roblox.com/v1/users/${current}/friends`);
      const friends = resp.data.data.map(u => u.id.toString());

      // If the target is among these friends, return the full path
      if (friends.includes(toId)) {
        const fullPath = [...path, toId];
        console.log(`Found connection in ${searchedCount} searches.`);
        return res.json({ searchedCount, path: fullPath });
      }

      // Add unvisited friends to the queue to expand BFS
      for (const friendId of friends) {
        if (!visited.has(friendId)) {
          queue.push([...path, friendId]);
        }
      }

    } catch (e) {
      console.warn(`Skipping user ${current}: ${e.message}`);
    }
  }

  // No connection found within max depth
  res.status(404).json({ error: "No connection found", searchedCount });
});

// Start the server
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
