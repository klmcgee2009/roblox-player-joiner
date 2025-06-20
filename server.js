const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());

const assetTypeIds = [8, 9, 11, 12, 19, 21]; // Hats, Faces, Shirts, Pants, Gear, T-Shirts

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

    let allItems = [];

    // Helper to get inventory per assetTypeId
    async function getInventoryByType(typeId) {
      let items = [];
      let cursor = "";
      let hasMore = true;

      while (hasMore) {
        const url = `https://inventory.roblox.com/v2/users/${userId}/inventory/${typeId}?limit=100${cursor ? `&cursor=${cursor}` : ''}`;
        const invRes = await axios.get(url);
        items = items.concat(invRes.data.data);
        hasMore = invRes.data.nextPageCursor !== null;
        cursor = invRes.data.nextPageCursor;
      }

      return items;
    }

    // Get inventory for all types
    for (const typeId of assetTypeIds) {
      const items = await getInventoryByType(typeId);
      allItems = allItems.concat(items);
    }

    // Get thumbnails for all items (in parallel, but limited to avoid flooding)
    const thumbPromises = allItems.map(async (item) => {
      try {
        const thumbRes = await axios.get(`https://thumbnails.roblox.com/v1/assets?assetIds=${item.assetId}&size=150x150&format=Png&isCircular=false`);
        return {
          name: item.name,
          thumbnail: thumbRes.data.data[0]?.imageUrl || "",
          assetTypeId: item.assetTypeId
        };
      } catch {
        return {
          name: item.name,
          thumbnail: "",
          assetTypeId: item.assetTypeId
        };
      }
    });

    const itemsWithThumbnails = await Promise.all(thumbPromises);

    res.json({ items: itemsWithThumbnails });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Failed to load inventory.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
