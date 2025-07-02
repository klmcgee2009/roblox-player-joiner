document.getElementById('joinBtn').addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();
  const status = document.getElementById('status');

  if (!username) {
    status.textContent = '❗ Enter a username.';
    return;
  }

  status.textContent = '🔎 Searching...';

  try {
    const res = await fetch(`https://roblox-player-joiner.onrender.com/getServer?username=${encodeURIComponent(username)}`);
    const data = await res.json();

    if (data.joinLink) {
      status.textContent = '✅ Found! Launching Roblox...';

      // STEP 1: Open the Roblox game page in a new tab
      window.open(data.joinLink, '_blank');

      // STEP 2: Launch the server directly using protocol
      const [placeId, jobId] = data.joinLink.split('/games/')[1].split('?jobId=');
      const protocolUrl = `roblox-player://game/${placeId}/0/${jobId}`;

      setTimeout(() => {
        window.location.href = protocolUrl;
      }, 1200); // delay to let the game page open

    } else {
      status.textContent = data.error || '⚠️ Could not find server.';
    }
  } catch (err) {
    console.error('[API ERROR]', err);
    status.textContent = `❌ Error: ${err.message || 'API connection failed'}`;
  }
});
