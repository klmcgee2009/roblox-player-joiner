const axios = require('axios');

// Delay helper function
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Counter for total searched players
let searchedCount = 0;

// Fetch friends of a userId with retry on 429
async function fetchUserFriends(userId) {
  try {
    const url = `https://friends.roblox.com/v1/users/${userId}/friends`;
    const response = await axios.get(url);

    searchedCount++;
    console.log(`🔍 (#${searchedCount}) Searched userId: ${userId} → Found ${response.data.data.length} friends`);

    return response.data.data.map(friend => friend.id);
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.warn(`⚠️ Rate limited for userId ${userId}. Waiting 3 seconds before retrying...`);
      await delay(3000);
      return fetchUserFriends(userId); // retry
    } else {
      console.error(`❌ Error fetching userId ${userId}: ${error.message || error}`);
      return []; // return empty array on error so crawler continues
    }
  }
}

// Main crawl function with BFS-like approach and depth limit
async function crawl(startUserId, maxDepth = 2) {
  let queue = [startUserId];
  let visited = new Set();
  let depth = 0;

  while (queue.length > 0 && depth < maxDepth) {
    let nextQueue = [];

    for (const userId of queue) {
      if (visited.has(userId)) continue;
      visited.add(userId);

      const friends = await fetchUserFriends(userId);

      // Add friends for next level of crawl
      nextQueue.push(...friends);

      // Wait 1 second between requests to avoid hitting rate limits
      await delay(1000);
    }

    queue = nextQueue;
    depth++;
  }

  console.log(`✅ Crawling finished. Total searched players: ${searchedCount}`);
}

// Replace this with the user ID you want to start searching from
const startingUserId = '681198824';

// Start the crawler
crawl(startingUserId).catch(err => console.error("Crawler failed:", err));
