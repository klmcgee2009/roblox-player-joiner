import { getUserIdFromUsername, getConnections } from "./utils.js";

async function areUsersConnected(startUserId, targetUserId) {
  const queue = [startUserId];
  const visited = new Set();
  let playersScanned = 0;

  while (queue.length > 0) {
    const currentUserId = queue.shift();

    if (currentUserId === targetUserId) {
      console.log(`Connected! Found user ${targetUserId} after scanning ${playersScanned} users.`);
      return true;
    }

    if (visited.has(currentUserId)) continue;
    visited.add(currentUserId);

    playersScanned++;
    if (playersScanned % 50 === 0) {
      console.log(`Players scanned: ${playersScanned}`);
    }

    try {
      const connections = await getConnections(currentUserId);
      for (const userId of connections) {
        if (!visited.has(userId)) {
          queue.push(userId);
        }
      }
    } catch (err) {
      console.error(`Error fetching connections for ${currentUserId}:`, err.message);
      // optionally wait or skip depending on rate limit error
    }
  }

  console.log(`No connection found after scanning ${playersScanned} users.`);
  return false;
}

async function main() {
  try {
    const startUsername = process.argv[2];
    const targetUsername = process.argv[3];

    if (!startUsername || !targetUsername) {
      console.log("Usage: node index.js <startUsername> <targetUsername>");
      process.exit(1);
    }

    console.log(`Resolving user IDs for ${startUsername} and ${targetUsername}...`);

    const startUserId = await getUserIdFromUsername(startUsername);
    const targetUserId = await getUserIdFromUsername(targetUsername);

    console.log(`Start userId: ${startUserId}, Target userId: ${targetUserId}`);

    const connected = await areUsersConnected(startUserId, targetUserId);
    console.log(connected ? "Users ARE connected." : "Users are NOT connected.");
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
