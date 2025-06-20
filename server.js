const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/getInventory', async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ error: 'Username required' });

  try {
    // Get user ID from username
    const userResponse = await axios.post('https://users.roblox.com/v1/usernames/users', {
      usernames: [username],
      excludeBannedUsers: true
    });

    if (!userResponse.data.data.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResponse.data.data[0].id;

    // Get inventory of hats (assetTypeId 8)
    const inventoryResponse = await axios.get(`https://inventory.roblox.com/v2/users/${userId}/inventory/8?limit=20`);

    // Map items to get thumbnails and names
    const items = await Promise.all(inventoryResponse.data.data.map(async (item) => {
      // Get thumbnail for the asset
      const thumbResponse = await axios.get(`https://thumbnails.roblox.com/v1/assets?assetIds=${item.assetId}&size=150x150&format=Png&isCircular=false`);
      const thumbnailUrl = thumbResponse.data.data[0].imageUrl;

      return {
        name: item.name,
        thumbnail: thumbnailUrl
      };
    }));

    res.json({ items });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Failed to load inventory.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
