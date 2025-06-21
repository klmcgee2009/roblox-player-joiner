import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

async function getUserId(username) {
    const res = await axios.post('https://users.roblox.com/v1/usernames/users', {
        usernames: [username]
    });
    return res.data.data[0]?.id;
}

async function getFriends(userId) {
    const res = await axios.get(`https://friends.roblox.com/v1/users/${userId}/friends`);
    return res.data.data.map(friend => ({ id: friend.id, username: friend.name }));
}

async function findConnection(startUsername, targetUsername) {
    const startUserId = await getUserId(startUsername);
    const targetUserId = await getUserId(targetUsername);
    if (!startUserId || !targetUserId) {
        throw new Error('Invalid usernames.');
    }

    let queue = [{ id: startUserId, username: startUsername, path: [{ id: startUserId, username: startUsername }] }];
    let visited = new Set();
    visited.add(startUserId);

    const MAX_DEPTH = 4;

    while (queue.length > 0) {
        const current = queue.shift();

        if (current.id === targetUserId) {
            return current.path;
        }

        if (current.path.length > MAX_DEPTH) continue;

        const friends = await getFriends(current.id);

        for (let friend of friends) {
            if (!visited.has(friend.id)) {
                visited.add(friend.id);
                queue.push({
                    id: friend.id,
                    username: friend.username,
                    path: [...current.path, friend]
                });
            }
        }
    }

    return null;
}

app.post('/findConnection', async (req, res) => {
    const { startUsername, targetUsername } = req.body;

    try {
        const path = await findConnection(startUsername, targetUsername);
        if (path) {
            res.json({ path });
        } else {
            res.json({ path: null });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
