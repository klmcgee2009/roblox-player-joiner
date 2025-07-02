require("dotenv").config();
const puppeteer = require("puppeteer");
const schedule = require("node-schedule");

const ROBLOX_COOKIE = process.env.ROBLOX_COOKIE;
const GROUP_IDS = process.env.GROUP_IDS?.split(",").map(id => id.trim()) || [];
const SHOUT_MESSAGES = process.env.SHOUT_MESSAGES?.split(",").map(m => m.trim()) || [];
const POST_INTERVAL_MINUTES = parseInt(process.env.POST_INTERVAL_MINUTES || "60");

const usedMessages = {};
GROUP_IDS.forEach(id => usedMessages[id] = new Set());

function pickMessage(groupId) {
  const used = usedMessages[groupId];
  const unused = SHOUT_MESSAGES.filter(msg => !used.has(msg));
  if (unused.length === 0) {
    usedMessages[groupId] = new Set();
    return pickMessage(groupId);
  }
  const msg = unused[Math.floor(Math.random() * unused.length)];
  used.add(msg);
  return msg;
}

async function postToGroupWall(groupId, message) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();

  // Set .ROBLOSECURITY cookie
  await page.setCookie({
    name: '.ROBLOSECURITY',
    value: ROBLOX_COOKIE.replace('.ROBLOSECURITY=', ''),
    domain: '.roblox.com',
    httpOnly: true,
    secure: true
  });

  try {
    const wallURL = `https://www.roblox.com/groups/${groupId}/`;
    await page.goto(wallURL, { waitUntil: 'networkidle2' });

    // Wait for the wall post input to appear
    await page.waitForSelector('textarea[placeholder*="Say something"]', { timeout: 15000 });

    // Type the message with human-like delays
    for (const char of message) {
      await page.type('textarea[placeholder*="Say something"]', char, {
        delay: 50 + Math.random() * 150
      });
    }

    // Wait a bit then click post
    await page.waitForTimeout(500 + Math.random() * 500);
    await page.click('button[data-testid="post-button"]');

    console.log(`✅ Posted to group ${groupId}: "${message}"`);
  } catch (err) {
    console.error(`❌ Failed to post to group ${groupId}:`, err.message);
  } finally {
    await browser.close();
  }
}

async function postAllGroups() {
  for (const groupId of GROUP_IDS) {
    const msg = pickMessage(groupId);
    await postToGroupWall(groupId, msg);
  }
}

async function run() {
  console.log("🚀 Starting human-like group wall bot...");
  await postAllGroups();

  schedule.scheduleJob(`*/${POST_INTERVAL_MINUTES} * * * *`, async () => {
    console.log("⏰ Scheduled post started...");
    await postAllGroups();
  });
}

run();
