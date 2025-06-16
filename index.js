const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;

app.get('/connections/:fromId/:toId', async (req, res) => {
  const { fromId, toId } = req.params;

  console.log(`Searching connections from ${fromId} to ${toId}`);

  let queue = [[fromId]];
  let visited = new Set([fromId]);
  let searchedCount = 0;
  const maxDepth = 6;

  while (queue.length) {
    let path = queue.shift();
    let currentUserId = path[path.length - 1];
    searchedCount++;

    if (searchedCount % 10 === 0) {
      console.log(`Searched ${searchedCount} players so far...`);
    }

    if (currentUserId === toId) {
      console.log(`Found connection! Total players searched: ${searchedCount}`);
      return res.json({
        searchedCount,
        from: fromId,
        to: toId,
        connectionChain: path,
      });
    }

    if (path.length > maxDepth) {
      continue; // Skip paths deeper than maxDepth
    }

    try {
      // Roblox friends API
      const response = await axios.get(`https://friends.roblox.com/v1/users/${currentUserId}/friends`);
      const friends = response.data.data.map(f => f.id.toString());

      for (const friendId of friends) {
        if (!visited.has(friendId)) {
          visited.add(friendId);
          queue.push([...path, friendId]);
        }
      }
    } catch (err) {
      // API error, skip this node but keep searching others
      console.error(`Error fetching friends of user ${currentUserId}:`, err.message);
      continue;
    }
  }

  console.log(`No connection found after searching ${searchedCount} players.`);
  res.json({
    searchedCount,
    from: fromId,
    to: toId,
    connectionChain: null,
    message: 'Connection not found within max search depth.',
  });
});

app.listen(PORT, () => {
  console.log(`Roblox Player Connections API running on port ${PORT}`);
});
