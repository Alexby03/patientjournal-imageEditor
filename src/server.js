require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes.js');

const app = express();

app.use(cors());

app.use(express.json({ limit: '16mb' }));
app.use(express.urlencoded({ extended: true, limit: '16mb' }));

app.use('/images', routes);

const PORT = process.env.PORT || 8085;

app.get('/healthz', (req, res) => {
    res.status(200).send('OK');
});


app.listen(PORT, '0.0.0.0', () => {
    console.log(`ImageService running on port ${PORT}`);
});