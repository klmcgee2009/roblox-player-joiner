const joinBtn = document.getElementById('joinBtn');
const usernameInput = document.getElementById('username');
const status = document.getElementById('status');

// Change this to your deployed backend URL
const API_BASE = 'https://your-api-url.onrender.com';

joinBtn.addEventListener('click', async () => {
  const username = usernameInput.value.trim();
  if (!username) {
    status.textContent = '❗ Enter a username';
    return;
  }

  status.textContent = '🔎 Joining...';

  try {
    // Call backend to make alt join the target user's server
    const joinRes = await fetch(`${API_BASE}/joinServer?username=${encodeURIComponent(username)}`);
    const joinData = await joinRes.json();

    if (joinData.success) {
      status.textContent = '✅ Alt joined server! Fetching join link...';

      // Get alt's current server info
      const altRes = await fetch(`${API_BASE}/getAltServer`);
      const altData = await altRes.json();

      if (altData.placeId && altData.jobId) {
        const robloxJoinLink = `roblox-player://game/${altData.placeId}/0/${altData.jobId}`;

        status.innerHTML = `✅ Ready to join! <br>
          <a href="${robloxJoinLink}" id="openRoblox" target="_blank">Click here to open Roblox and join</a>`;

        // Optional: Auto open the roblox protocol (may be blocked by browser)
        // window.location.href = robloxJoinLink;
      } else {
        status.textContent = '⚠️ Could not get alt server info';
      }
    } else {
      status.textContent = joinData.error || '❌ Failed to join server';
    }
  } catch (err) {
    status.textContent = '❌ API error';
    console.error(err);
  }
});
