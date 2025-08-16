const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/admin', require('./routes/admin'));
app.use('/api/user', require('./routes/user'));
app.use('/api/wallet', require('./routes/wallet'));

// MongoDB Connection
mongoose.connect("mongodb+srv://ironspidy25:spidy25@cluster0.y0cb8.mongodb.net/trustwallet-admin")
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Trust Wallet Admin Backend API' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
