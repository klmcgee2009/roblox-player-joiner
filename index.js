const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const ROBLOSECURITY = _|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_CAEaAhAB.85C8A08E1E04EA8ACCB8917CFB6ED30A42FFDA95A725E274C9E8029AA8EFCF541C70A2F7B5E91D8FCEE7E84CCF025B7C91150F148E67F4FBCD078BE452AAE5EF19C35A473D74712E601A1CDE245E49ABAB7AE5370A9E57866FF2B6414A148997DB6578E8100BC860E64F2817E6495EFDF2199FDD370BC7EA8C731D92BF90513CD65D3F602894B4500B3AED61A11C6CB0C3847BEF89AF3939FE28A7AAAF6EF5F562D08951B20B5C84F60B6BD16E38144256B27C163E7743B2C23E34770623C6BC90E5CA65ED8B751E093C1B36A010C2E68A5C511DFB6FADF2577895B2BB739EB9CAF4C81587CB47003C344C2F7FBC02EDC130E84CCE6F5C2AFF27972325DD01A39B03224ACB1105A14B16D6B8BC64E7A5BB4916B7DCB6BE8D97641BCC40B8445E7F91529CB8EB6A0E726D585D4A6018341B75D8B49D87142C5FF726A934062B4BA1708CACFFC8A57782D480D90D5E841A046F5E60E54CEBAE589B090DE990D8EB9F001F1FD6C2B8152DCFBD8021EDFC8346C271F763509B07DF9BFCF3B20BE0DAC361358D7BB4328CD6C6346C2F753BF78B7EE0DD77728D227EB22B57D4BB7A53F939BFC02FEE89732A80715CB5645FCE3FCB5BE0C8971D1ADB9F849BDE44E9C07F7E91FC23FEE46E294C36B392E5313C7AC931EA875EE404BDB2D84E948C170F643C0D8C9A129E86057830D415C8FD60BD3673E5C52BBB71A3EEB195922A6742F25476CCEDCABEA555DEF50667ABC8E05CEA286BC71FC87810F6DF1C61030003AEFCD62AF525B92BB623C1A783F917ACB0ACA473943D11A02872E9FE9E2C3A34080562941BDEDFAE6364923489DE6C03231CB74235BBCB3C76EDF88D75D095BAC55881C44D4BF1E19A95EFA62B41E47562025596F358D3930E0C41135E18D1B493CC258A699BEC0F2D887E4809C4DA63B67644779DE4EAD389AB8E12016433098E2BE127B98F8AAB24EB1ED6D62A4BBDDA9B19A2C079EDD7B76A70E86CCFD57043735FD9E904CD6F796B3B83D790AC69ED92668987CE52D635A3EB532AE37FB80A6445F81A502B34A8BD93B78971A2E9ADEFD1603465300C0BD0EE322F5D8262E4810E0A0D498C0E3249CC90586C64F6837F2DD4;
if (!ROBLOSECURITY) {
  console.error('Error: ROBLOSECURITY environment variable is not set.');
  process.exit(1);
}

const HEADERS = {
  'Cookie': `.ROBLOSECURITY=${ROBLOSECURITY}`,
  'User-Agent': 'Roblox/WinInet',
  'Content-Type': 'application/json'
};

async function getUserId(username) {
  const res = await axios.post(
    'https://users.roblox.com/v1/usernames/users',
    { usernames: [username] },
    { headers: HEADERS }
  );
  return res.data.data[0]?.id;
}

async function getPresence(userId) {
  const res = await axios.post(
    'https://presence.roblox.com/v1/presence/users',
    { userIds: [userId] },
    { headers: HEADERS }
  );
  return res.data.userPresences[0];
}

async function getPublicServers(placeId) {
  const servers = [];
  let cursor = '';
  while (servers.length < 100) {
    const res = await axios.get(
      `https://games.roblox.com/v1/games/${placeId}/servers/Public?limit=100&cursor=${cursor}`
    );
    servers.push(...res.data.data);
    if (!res.data.nextPageCursor) break;
    cursor = res.data.nextPageCursor;
  }
  return servers;
}

app.get('/find/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const userId = await getUserId(username);

    if (!userId) {
      return res.status(404).json({ error: 'User not found' });
    }

    const presence = await getPresence(userId);

    if (presence.userPresenceType !== 2) {
      return res.status(404).json({ error: 'User is not in a public game' });
    }

    const placeId = presence.lastLocation.placeId;
    const servers = await getPublicServers(placeId);

    for (const server of servers) {
      if (server.playerIds && server.playerIds.includes(userId)) {
        return res.json({
          placeId,
          jobId: server.id
        });
      }
    }

    return res.status(404).json({ error: 'User not found in any public server' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API Server running on port ${PORT}`));

