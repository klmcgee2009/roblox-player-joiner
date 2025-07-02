import { useState } from 'react';

export default function Home() {
  const [username, setUsername] = useState('');
  const [joinLink, setJoinLink] = useState('');
  const [error, setError] = useState('');

  async function handleSearch() {
    setError('');
    setJoinLink('');
    const res = await fetch(`/api/getServer?username=${username}`);
    const data = await res.json();

    if (data.joinLink) {
      setJoinLink(data.joinLink);
    } else {
      setError(data.error || 'Something went wrong');
    }
  }

  return (
    <div style={{ padding: 40, fontFamily: 'Arial' }}>
      <h1>🔗 Roblox Server Joiner</h1>
      <input
        type="text"
        placeholder="Enter Roblox Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ padding: 10, width: '300px', marginRight: 10 }}
      />
      <button onClick={handleSearch} style={{ padding: 10 }}>Find Server</button>

      {joinLink && (
        <div style={{ marginTop: 20 }}>
          <p>✅ Join Link:</p>
          <a href={joinLink} target="_blank" rel="noopener noreferrer">
            {joinLink}
          </a>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 20, color: 'red' }}>
          ❌ {error}
        </div>
      )}
    </div>
  );
}

