const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 10000;

// BFS friend search
app.get("/connections/:fromId/:toId", async (req, res) => {
  const { fromId, toId } = req.params;
  const visited = new Set();
  const queue = [[fromId]];
  let searchedCount = 0;
  const maxDepth = 7; // You can increase this, but higher depth = longer search time

  while (queue.length > 0) {
    const path = queue.shift();
    const currentId = path[path.length - 1];

    if (visited.has(currentId)) continue;
    visited.add(currentId);
    searchedCount++;

    console.log(`Searching ${searchedCount}: ${currentId}`);

    try {
      const response = await axios.get(`https://friends.roblox.com/v1/users/${currentId}/friends`);
      const friends = response.data.data.map(f => f.id.toString());

      if (friends.includes(toId)) {
        const fullPath = [...path, toId];
        return res.json({
          searchedCount,
          from: fromId,
          to: toId,
          path: fullPath
        });
      }

      if (path.length < maxDepth) {
        for (const friendId of friends) {
          if (!visited.has(friendId)) {
            queue.push([...path, friendId]);
          }
        }
      }

    } catch (error) {
      console.warn(`Error fetching friends of ${currentId}: ${error.message}`);
      continue;
    }
  }

  return res.status(404).json({
    error: "No connection found",
    searchedCount
  });
});

app.listen(PORT, () => {
  console.log(`Roblox Connection Search API running on port ${PORT}`);
});
