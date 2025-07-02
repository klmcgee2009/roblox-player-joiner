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
      status.textContent = '✅ Found! Opening Roblox...';
      // Use Roblox’s official page to trigger native prompt
      window.location.href = data.joinLink;
    } else {
      status.textContent = data.error || '⚠️ Could not find server.';
    }
  } catch (err) {
    console.error('[API ERROR]', err);
    status.textContent = `❌ Error: ${err.message || 'API connection failed'}`;
  }
});
