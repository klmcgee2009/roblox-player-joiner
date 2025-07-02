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
      status.textContent = '✅ Found! Joining...';
      // Attempt to open Roblox via protocol
      window.location.href = `roblox-player://game/${data.joinLink.split('/games/')[1].replace('?jobId=', '/0/')}`;
    } else {
      status.textContent = data.error || '⚠️ Could not find server.';
    }
  } catch (err) {
    status.textContent = '❌ API error';
    console.error(err);
  }
});
