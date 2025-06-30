const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// Helper to get userId from username
async function getUserId(username) {
  const res = await axios.post("https://users.roblox.com/v1/usernames/users", {
    usernames: [username],
    excludeBannedUsers: false,
  });
  return res.data.data[0]?.id || null;
}

// Helper to get presence
async function getPresence(userId) {
  const res = await axios.post("https://presence.roblox.com/v1/presence/users", {
    userIds: [userId],
  });
  return res.data.userPresences[0];
}

// Main endpoint
app.get("/joininfo", async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ success: false, error: "Missing username" });

  try {
    const userId = await getUserId(username);
    if (!userId) return res.json({ success: false, status: "Invalid Username" });

    const presence = await getPresence(userId);

    if (presence.userPresenceType === 0) {
      return res.json({ success: true, status: "Offline" });
    }

    if (presence.userPresenceType === 2) {
      if (presence.lastLocation.includes("private server") || !presence.placeId || !presence.gameId) {
        return res.json({ success: true, status: "In Private Server or Privacy Settings Blocked" });
      } else {
        return res.json({
          success: true,
          status: "Joinable",
          placeId: presence.placeId,
          jobId: presence.gameId,
        });
      }
    }

    return res.json({ success: true, status: "Online but not in game" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

app.listen(PORT, () => console.log(`API running on port ${PORT}`));
