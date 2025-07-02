require("dotenv").config();
const axios = require("axios");
const schedule = require("node-schedule");

const ROBLOX_COOKIE = process.env.ROBLOX_COOKIE;
const GROUP_IDS = process.env.GROUP_IDS?.split(",").map(id => id.trim()) || [];
const SHOUT_MESSAGES = process.env.SHOUT_MESSAGES?.split(",").map(msg => msg.trim()) || [];
const POST_INTERVAL_MINUTES = parseInt(process.env.POST_INTERVAL_MINUTES) || 60;

if (!ROBLOX_COOKIE || GROUP_IDS.length === 0 || SHOUT_MESSAGES.length === 0) {
  console.error("❌ Missing required environment variables.");
  process.exit(1);
}

const usedMessages = {};
GROUP_IDS.forEach(groupId => {
  usedMessages[groupId] = new Set();
});

const axiosInstance = axios.create({
  headers: {
    "Cookie": `.ROBLOSECURITY=${ROBLOX_COOKIE}`,
    "User-Agent": "Mozilla/5.0",
  },
  withCredentials: true,
});

async function getCsrfToken() {
  try {
    await axiosInstance.post("https://auth.roblox.com/v2/logout");
  } catch (err) {
    const token = err.response?.headers["x-csrf-token"];
    if (!token) throw new Error("Failed to retrieve CSRF token.");
    axiosInstance.defaults.headers.common["x-csrf-token"] = token;
    return token;
  }
}

function pickMessage(groupId) {
  const used = usedMessages[groupId];
  const available = SHOUT_MESSAGES.filter(m => !used.has(m));

  if (available.length === 0) {
    usedMessages[groupId] = new Set();
    return pickMessage(groupId);
  }

  const message = available[Math.floor(Math.random() * available.length)];
  used.add(message);
  return message;
}

async function postToGroupWall(groupId, message) {
  try {
    const res = await axiosInstance.post(`https://groups.roblox.com/v1/groups/${groupId}/wall/posts`, {
      body: message
    });

    if (res.status === 200) {
      console.log(`✅ Posted to group wall ${groupId}: "${message}"`);
    } else {
      console.error(`❌ Failed to post to group wall ${groupId}: ${res.status}`);
    }
  } catch (error) {
    console.error(`❌ Error posting to group ${groupId}:`, error.response?.data || error.message);
  }
}

async function postToAllGroups() {
  await getCsrfToken();
  for (const groupId of GROUP_IDS) {
    const msg = pickMessage(groupId);
    await postToGroupWall(groupId, msg);
  }
}

async function run() {
  console.log("🚀 Group Wall Bot started...");
  await postToAllGroups();

  schedule.scheduleJob(`*/${POST_INTERVAL_MINUTES} * * * *`, async () => {
    console.log(`⏰ Posting again at ${new Date().toLocaleTimeString()}`);
    await postToAllGroups();
  });
}

run();
