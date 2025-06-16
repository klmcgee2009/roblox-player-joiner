const express = require("express");
const axios = require("axios");

const app = express();
const PORT = 10000;

app.get("/search/:username", async (req, res) => {
  const username = req.params.username;
  let playersSearched = 0;
  let foundServerId = null;
  let nextCursor = null;
  let placeId = null;

  try {
    // Step 1: Get user info by username
    const userRes = await axios.get(
      `https://api.roblox.com/users/get-by-username?username=${username}`
    );

    if (userRes.data && userRes.data.Id) {
      const userId = userRes.data.Id;

      // Step 2: Get the user's current placeId by checking their presence
      // We'll try to get presence info (online/offline and place)
      const presenceRes = await axios.post(
        "https://presence.roblox.com/v1/presence/users",
        { userIds: [userId] }
      );

      const presenceInfo = presenceRes.data.userPresences[0];
      if (presenceInfo.userPresenceType === "Offline") {
        // Player is offline, return immediately
        return res.json({
          searchedPlayers: playersSearched,
          status: "Offline",
          playerName: username,
          playerId: userId,
          message: "Player is offline, not in any game."
        });
      }

      if (presenceInfo.lastLocation) {
        placeId = presenceInfo.lastLocation.placeId;
      }

      if (!placeId) {
        return res.json({
          searchedPlayers: playersSearched,
          status: "In game but place ID unknown",
          playerName: username,
          playerId: userId,
          message: "Cannot determine the place the player is in."
        });
      }

      // Step 3: Now we search all servers for that place
      let url = `https://games.roblox.com/v1/games/${placeId}/servers/Public?sortOrder=Asc&limit=100`;

      do {
        const serversRes = await axios.get(url + (nextCursor ? `&cursor=${nextCursor}` : ""));

        if (serversRes.data && serversRes.data.data) {
          const servers = serversRes.data.data;

          // Search every player in each server
          for (const server of servers) {
            for (const player of server.players) {
              playersSearched++;

              if (player.id === userId) {
                foundServerId = server.id;
                break;
              }
            }
            if (foundServerId) break;
          }

          if (foundServerId) break;

          nextCursor = serversRes.data.nextPageCursor || null;
        } else {
          break;
        }
      } while (nextCursor);

      if (foundServerId) {
        return res.json({
          searchedPlayers: playersSearched,
          status: "Player Found",
          playerName: username,
          playerId: userId,
          serverId: foundServerId,
          message: `Player found in server ${foundServerId}`
        });
      } else {
        return res.json({
          searchedPlayers: playersSearched,
          status: "Player Not Found in any server",
          playerName: username,
          playerId: userId,
          message: "Player not found in any active public server."
        });
      }
    } else {
      return res.status(404).json({ error: "Player not found" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Roblox Player Search API running on port ${PORT}`);
});
