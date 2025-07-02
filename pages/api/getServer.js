export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    // Step 1: Get userId from username
    const userRes = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [username] }),
    });

    const userData = await userRes.json();
    const userId = userData.data?.[0]?.id;

    if (!userId) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Step 2: Get presence (game server)
    const presenceRes = await fetch('https://presence.roblox.com/v1/presence/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: [userId] }),
    });

    const presenceData = await presenceRes.json();
    const info = presenceData.userPresences?.[0];

    if (info && info.placeId && info.gameId) {
      const joinLink = `https://www.roblox.com/games/${info.placeId}?jobId=${info.gameId}`;
      return res.json({ joinLink });
    } else {
      return res.json({ error: 'User is not in a public game' });
    }

  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
