const express = require('express');
const app = express();

const PORT = process.env.PORT || 10000;

// Example in-memory player graph (adjacency list)
// Key = username, value = array of connected usernames
const playerGraph = {
  "Alice": ["Bob", "Charlie"],
  "Bob": ["Alice", "Diana", "Eve"],
  "Charlie": ["Alice", "Frank"],
  "Diana": ["Bob", "Grace"],
  "Eve": ["Bob"],
  "Frank": ["Charlie"],
  "Grace": ["Diana", "Heidi"],
  "Heidi": ["Grace", "Ivan"],
  "Ivan": ["Heidi", "Judy"],
  "Judy": ["Ivan"]
};

// BFS to find shortest path between two players
function findShortestPath(graph, start, end) {
  if (!graph[start] || !graph[end]) {
    return null; // One or both players not in graph
  }

  let queue = [[start]];
  let visited = new Set();

  while (queue.length > 0) {
    let path = queue.shift();
    let node = path[path.length - 1];

    if (node === end) {
      return path;
    }

    if (!visited.has(node)) {
      visited.add(node);

      let neighbors = graph[node];
      for (let neighbor of neighbors) {
        let newPath = path.slice();
        newPath.push(neighbor);
        queue.push(newPath);
      }
    }
  }

  return null; // No path found
}

app.get('/search-path', (req, res) => {
  const fromUser = req.query.from;
  const toUser = req.query.to;

  if (!fromUser || !toUser) {
    return res.status(400).json({ error: "Please provide 'from' and 'to' query parameters." });
  }

  const path = findShortestPath(playerGraph, fromUser, toUser);

  if (!path) {
    return res.json({
      message: `No connection path found between '${fromUser}' and '${toUser}'.`,
      path: []
    });
  }

  // Format the path as objects with username and dummy userId (for demo)
  const formattedPath = path.map((username, idx) => ({
    userId: 1000 + idx, // Dummy IDs
    username
  }));

  return res.json({
    message: `Found connection path between '${fromUser}' and '${toUser}'.`,
    path: formattedPath,
    length: formattedPath.length
  });
});

app.listen(PORT, () => {
  console.log(`Roblox Player Connection API running on port ${PORT}`);
});
