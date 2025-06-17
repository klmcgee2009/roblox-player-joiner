const axios = require('axios');

const API_BASE = 'https://roblox-player-api.onrender.com';

const RATE_LIMIT_WAIT = 3000; // 3 seconds wait if rate limited

async function getFriends(userId) {
  try {
    const res = await axios.get(`${API_BASE}/user/${userId}/friends`);
    return res.data;
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.warn(`Rate limited on user ${userId}, waiting ${RATE_LIMIT_WAIT}ms...`);
      await new Promise(res => setTimeout(res, RATE_LIMIT_WAIT));
      return getFriends(userId); // retry after wait
    }
    console.error(`Error fetching friends for user ${userId}: ${error.message}`);
    return [];
  }
}

async function findConnection(startUserId, targetUserId, maxDepth = 5) {
  const visited = new Set();
  const queue = [{ userId: startUserId, depth: 0 }];
  visited.add(startUserId);

  console.log(`🔍 Starting scan from userId ${startUserId}`);
  let playersScanned = 0;

  while (queue.length > 0) {
    const { userId, depth } = queue.shift();
    playersScanned++;
    if (playersScanned % 100 === 0) {
      console.log(`🔄 Players scanned: ${playersScanned}`);
    }

    if (userId === targetUserId) {
      console.log(`✅ Found connection to user ${targetUserId} at depth ${depth}`);
      return true;
    }

    if (depth >= maxDepth) continue;

    const friends = await getFriends(userId);
    for (const friend of friends) {
      const friendId = friend.id || friend.userId || friend.UserId;
      if (!visited.has(friendId)) {
        visited.add(friendId);
        queue.push({ userId: friendId, depth: depth + 1 });
      }
    }
  }

  console.log(`❌ No connection found to user ${targetUserId} within depth ${maxDepth}`);
  return false;
}

// Example usage:
// Replace these IDs with whatever start and target users you want to test
const startUser = 681198824;
const targetUser = 123456789;

(async () => {
  const connected = await findConnection(startUser, targetUser, 4);
  if (connected) {
    console.log('🎉 Users are connected!');
  } else {
    console.log('😞 Users are not connected.');
  }
})();
