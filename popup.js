document.getElementById('joinBtn').addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();
  const status = document.getElementById('status');

  if (!username) {
    status.textContent = '❗ Enter a username.';
    return;
  }

  status.textContent = '🔎 Searching...';

  try {
    const res = await fetch(`https://roblox-player-joiner.onrender.com/getServer?username=${username}`);
    const data = await res.json();

    if (data.joinLink) {
      status.textContent = '✅ Found! Launching...';

      const [placeId, jobId] = data.joinLink
        .split('/games/')[1]
        .split('?jobId=');

      const protocolUrl = `roblox-player://game/${placeId}/0/${jobId}`;
      window.open(protocolUrl, '_self'); // open in current tab (no extra tabs)

    } else {
      status.textContent = data.error || '⚠️ Could not find player or server.';
    }
  } catch (err) {
    console.error(err);
    status.textContent = '❌ Error contacting server.';
  }
});
