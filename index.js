const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

// Dummy game list with categories (replace with real data)
const games = [
  { id: 1, name: "Adopt Me", category: "Popular" },
  { id: 2, name: "Brookhaven", category: "Popular" },
  { id: 3, name: "Tower of Hell", category: "Obby" },
  { id: 4, name: "Blox Fruits", category: "Adventure" },
];

// Get games by category
app.get("/games", (req, res) => {
  const category = req.query.category?.toLowerCase() || "";
  const filteredGames = games.filter(g =>
    g.category.toLowerCase().includes(category)
  );
  res.json(filteredGames);
});

// Search for player in a game universe (dummy simulation)
app.post("/search-player", (req, res) => {
  const { universeId, username } = req.body;
  // Simulate search result
  const found = Math.random() < 0.5; // 50% chance
  if (found) {
    res.json({
      found: true,
      universeId,
      username,
      serverId: "1234567890",
      etaSeconds: 10,
    });
  } else {
    res.json({ found: false });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
