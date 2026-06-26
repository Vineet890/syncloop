const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: { error: "Too many login/register attempts from this IP, please try again after 15 minutes." }
});

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

router.post('/register', authLimiter, async (req, res) => {
    try {
        const name = String(req.body.name || '');
        const email = String(req.body.email || '');
        const password = String(req.body.password || '');
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        const savedUser = await newUser.save();

        const token = jwt.sign({ userId: savedUser._id }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { id: savedUser._id, name: savedUser.name, email: savedUser.email } });
    } catch (error) {
        res.status(500).json({ error: "Registration failed" });
    }
});

router.post('/login', authLimiter, async (req, res) => {
    try {
        const email = String(req.body.email || '');
        const password = String(req.body.password || '');
        
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ error: "Login failed" });
    }
});

module.exports = router;
