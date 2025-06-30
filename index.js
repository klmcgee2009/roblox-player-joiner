require('dotenv').config(); // Load .env locally, ignored on Render

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
const ROBLOSECURITY = process.env.ROBLOSECURITY;

if (!ROBLOSECURITY) {
  console.error("ERROR: ROBLOSECURITY env variable not set!");
  process.exit(1);
}

// Convert username to userId
async function getUserId(username) {
  const res = await axios.post("https://users.roblox.com/v1/usernames/users", {
    usernames: [username],
    excludeBannedUsers: false,
  });
  return res.data.data[0]?.id || null;
}

// Get presence info using bot cookie
async function getPresence(userId) {
  const res = await axios.post(
    "https://presence.roblox.com/v1/presence/users",
    { userIds: [userId] },
    {
      headers: {
        Cookie: `.ROBLOSECURITY=${ROBLOSECURITY}`,
      },
    }
  );
  return res.data.userPresences[0];
}

app.get("/joininfo", async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ success: false, error: "Missing username" });

  try {
    const userId = await getUserId(username);
    if (!userId) return res.json({ success: false, status: "Invalid Username" });

    const presence = await getPresence(userId);

    if (!presence) return res.json({ success: false, status: "No presence data" });

    if (presence.userPresenceType === 0) {
      return res.json({ success: true, status: "Offline" });
    }

    if (presence.userPresenceType === 2) {
      if (presence.placeId && presence.gameId) {
        return res.json({
          success: true,
          status: "Joinable",
          placeId: presence.placeId,
          jobId: presence.gameId,
        });
      } else {
        return res.json({ success: true, status: "Private Server or Cannot Join" });
      }
    }

    return res.json({ success: true, status: "Online but not in game" });

  } catch (err) {
    console.error(err.response?.data || err.message || err);
    res.status(500).json({ success: false, error: "Internal Error or Invalid Cookie" });
  }
});

app.listen(PORT, () => console.log(`API running on port ${PORT}`));
