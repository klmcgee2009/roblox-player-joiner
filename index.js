const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 10000;

app.get("/connections/:fromId/:toId", async (req, res) => {
  const { fromId, toId } = req.params;

  let searchedCount = 0;
  let visited = new Set();
  let queue = [[fromId]];
  
  while (queue.length > 0) {
    let path = queue.shift();
    let lastId = path[path.length - 1];

    // Avoid rechecking
    if (visited.has(lastId)) continue;
    visited.add(lastId);
    searchedCount++;

    // Get friends of this user
    try {
      const response = await axios.get(`https://friends.roblox.com/v1/users/${lastId}/friends`);
      const friends = response.data.data.map(user => user.id.toString());

      // Check if target is among friends
      if (friends.includes(toId)) {
        return res.json({
          from: fromId,
          to: toId,
          connectionPath: [...path, toId],
          searchedCount
        });
      }

      // Add unvisited friends to queue
      for (const friendId of friends) {
        if (!visited.has(friendId)) {
          queue.push([...path, friendId]);
        }
      }

    } catch (err) {
      console.log(`Error fetching friends for ${lastId}:`, err.message);
    }
  }

  return res.status(404).json({
    error: "No connection found",
    searchedCount
  });
});

app.listen(PORT, () => {
  console.log(`Roblox Friend Connection API running on port ${PORT}`);
});
