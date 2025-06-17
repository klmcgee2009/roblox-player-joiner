const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

app.post('/forward', async (req, res) => {
    const { url, method, headers, data } = req.body;

    try {
        const response = await axios({
            url,
            method,
            headers,
            data
        });

        res.status(response.status).send(response.data);
    } catch (err) {
        res.status(err.response?.status || 500).send(err.response?.data || err.message);
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
});
