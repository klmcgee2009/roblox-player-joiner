const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- Mock database of games
const gamesDB = [
  { id: "1", name: "Adopt Me", placeId: 920587237, universeId: 920587237 },
  { id: "2", name: "Bloxburg", placeId: 185655149, universeId: 185655149 },
  { id: "3", name: "Tower of Hell", placeId: 1962086868, universeId: 1962086868 },
  { id: "4", name: "Jailbreak", placeId: 606849621, universeId: 606849621 },
];

// --- Simulated search jobs stored here
const searchJobs = {};

// --- GET /games/search?query=xxx
app.get("/games/search", (req, res) => {
  const query = (req.query.query || "").toLowerCase();
  if (!query) return res.json({ games: [] });

  // Return games where name includes query (case-insensitive)
  const results = gamesDB.filter((g) => g.name.toLowerCase().includes(query));
  res.json({ games: results });
});

// --- POST /search/start { username, gameId }
app.post("/search/start", (req, res) => {
  const { username, gameId } = req.body;
  if (!username || !gameId) {
    return res.status(400).json({ error: "Missing username or gameId" });
  }

  // Create a new job
  const jobId = uuidv4();

  // Simulate job state
  searchJobs[jobId] = {
    username,
    gameId,
    found: false,
    placeId: null,
    serverId: null,
    eta: 10, // seconds estimated time
    timeStarted: Date.now(),
  };

  // Simulate "finding" player after 10 seconds
  setTimeout(() => {
    searchJobs[jobId].found = true;
    searchJobs[jobId].placeId = gamesDB.find(g => g.id === gameId).placeId;
    searchJobs[jobId].serverId = "server_" + Math.floor(Math.random() * 100000);
    searchJobs[jobId].eta = 0;
  }, 10000);

  res.json({ jobId });
});

// --- GET /search/status?jobId=xxx
app.get("/search/status", (req, res) => {
  const jobId = req.query.jobId;
  if (!jobId || !searchJobs[jobId]) {
    return res.status(404).json({ error: "Job not found" });
  }

  const job = searchJobs[jobId];

  // Update ETA dynamically
  if (!job.found) {
    const elapsed = (Date.now() - job.timeStarted) / 1000;
    job.eta = Math.max(10 - elapsed, 0);
  }

  res.json({
    found: job.found,
    placeId: job.placeId,
    serverId: job.serverId,
    eta: Math.round(job.eta),
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
