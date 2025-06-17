import fetch from "node-fetch";

const API_BASE = "https://roblox-player-api.onrender.com";

export async function getUserIdFromUsername(username) {
  const url = `${API_BASE}/user/username/${encodeURIComponent(username)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to get userId for ${username}`);
  const data = await res.json();
  return data.userId; // Adjust if API response differs
}

export async function getConnections(userId) {
  const url = `${API_BASE}/user/${userId}/friends`; // or /connections if API differs
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to get connections for userId ${userId}`);
  const data = await res.json();
  return data.friends || []; // Adjust property name to API response
}
