require('dotenv').config();
const axios = require('axios');
const schedule = require('node-schedule');

const ROBLOX_COOKIE = process.env.ROBLOX_COOKIE;
const GROUP_IDS = process.env.GROUP_IDS ? process.env.GROUP_IDS.split(',').map(id => id.trim()) : [];
const POST_INTERVAL_MINUTES = parseInt(process.env.POST_INTERVAL_MINUTES) || 60;
const SHOUT_MESSAGES = process.env.SHOUT_MESSAGES ? process.env.SHOUT_MESSAGES.split(',').map(msg => msg.trim()) : [];

if (!ROBLOX_COOKIE) {
  console.error('Missing .ROBLOSECURITY cookie in .env');
  process.exit(1);
}
if (GROUP_IDS.length === 0) {
  console.error('No GROUP_IDS specified in .env');
  process.exit(1);
}
if (SHOUT_MESSAGES.length === 0) {
  console.error('No SHOUT_MESSAGES specified in .env');
  process.exit(1);
}

// Track used messages per group to avoid repeats
const usedMessages = {};
GROUP_IDS.forEach(groupId => {
  usedMessages[groupId] = new Set();
});

const axiosInstance = axios.create({
  baseURL: 'https://www.roblox.com',
  headers: {
    Cookie: `.ROBLOSECURITY=${ROBLOX_COOKIE}`,
    'User-Agent': 'Mozilla/5.0',
  },
  withCredentials: true,
});

async function getCsrfToken() {
  try {
    await axiosInstance.post('/chat/api/get-auth-token');
  } catch (error) {
    const token = error.response.headers['x-csrf-token'];
    if (!token) throw new Error('Failed to get CSRF token');
    return token;
  }
  throw new Error('Unexpected success on get-auth-token request');
}

function pickMessageForGroup(groupId) {
  const usedSet = usedMessages[groupId];

  // Messages not used yet for this group
  const unusedMessages = SHOUT_MESSAGES.filter((msg) => !usedSet.has(msg));

  // If all messages have been used, reset for this group
  if (unusedMessages.length === 0) {
    usedMessages[groupId] = new Set();
    return pickMessageForGroup(groupId); // recurse after reset
  }

  // Pick a random unused message
  const message = unusedMessages[Math.floor(Math.random() * unusedMessages.length)];

  // Mark it as used
  usedMessages[groupId].add(message);

  return message;
}

async function postGroupShout(csrfToken, groupId, message) {
  try {
    const res = await axiosInstance.post(
      `/groups/api/groups/${groupId}/status`,
      { body: message },
      {
        headers: {
          'x-csrf-token': csrfToken,
          'Content-Type': 'application/json',
        },
      }
    );
    if (res.status === 200) {
      console.log(`✅ Posted shout to group ${groupId} at ${new Date().toLocaleString()}`);
    } else {
      console.error(`❌ Failed to post shout to group ${groupId}`, res.status, res.data);
    }
  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.warn('CSRF token expired or invalid. Refreshing token and retrying...');
      const newToken = await getCsrfToken();
      return postGroupShout(newToken, groupId, message);
    }
    console.error(`Error posting shout to group ${groupId}:`, error.message);
  }
}

async function postAllGroups() {
  let csrfToken;
  try {
    csrfToken = await getCsrfToken();
  } catch (error) {
    console.error('Error getting CSRF token:', error.message);
    return;
  }

  for (const groupId of GROUP_IDS) {
    const message = pickMessageForGroup(groupId);
    await postGroupShout(csrfToken, groupId, message);
  }
}

async function runBot() {
  console.log('🚀 Starting Roblox Group Shout Bot...');
  await postAllGroups();

  // Schedule posts every POST_INTERVAL_MINUTES
  schedule.scheduleJob(`*/${POST_INTERVAL_MINUTES} * * * *`, async () => {
    console.log('⏰ Scheduled post: posting shouts to all groups...');
    await postAllGroups();
  });
}

runBot();
