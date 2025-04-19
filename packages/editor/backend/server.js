const express = require('express');
const cors = require('cors');
const app = express()

// cors
const corsOptions = {
    origin: 'http://localhost:5173'
}
// app.use(cors(corsOptions));
app.use(cors());

// middleware
app.use(express.json());

// routes
const generateRouter = require('./routes/generate');

app.use('/generate', generateRouter);

app.get('/', (req, res) => {
    res.send('Hello World!')
});

module.exports = app;