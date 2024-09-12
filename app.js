const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const OpenAI = require('openai'); // Import OpenAI
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb+srv://pathakharshita04:wlTXDV9MM8ttDA44@cluster0.zkk4gv0.mongodb.net/', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

// OpenAI Configuration
const openai = new OpenAI({
    apiKey: process.env.APIKEY, // Use environment variable for API key
    organization: "org-jQ2PldgKAyE5dF2Sf1fgakpZ",
    project: process.env.PROJECT, // Replace with your actual project ID or use environment variable
});

// User Model (assuming it's defined in ./models/User)
const User = require('./models/user_model');

// Register Route
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        user = new User({ name, email, password: hashedPassword });
        await user.save();

        res.json({ msg: 'User registered successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Login Route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        // Create and return JWT
        const token = jwt.sign({ userId: user._id }, 'jwtSecret', { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

const axios = require('axios');

app.post('/generate', async (req, res) => {
    const { prompt, style } = req.body;

    try {
        const response = await axios.post('https://api-inference.huggingface.co/models/gpt2', {
            inputs: ` ${prompt}`,
        }, {
            headers: {
                'Authorization': `Bearer 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`
            }
        });

        res.json({ generatedContent: response.data[0].generated_text.trim() });
    } catch (error) {
        console.error('Error in /generate:', error);
        res.status(500).json({ error: 'An error occurred while generating content.', details: error.message });
    }
});



// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
