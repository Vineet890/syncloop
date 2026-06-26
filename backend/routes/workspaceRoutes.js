const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const Workspace = require('../models/Workspace');
const User = require('../models/User');

router.post('/', authenticateToken, async (req, res) => {
    try {
        const name = String(req.body.name || '').trim();
        if (!name) return res.status(400).json({ error: "Workspace name is required." });
        if (name.length > 50) return res.status(400).json({ error: "Workspace name is too long (max 50 characters)." });

        const newWorkspace = new Workspace({
            name,
            ownerId: req.user.userId,
            members: [req.user.userId] 
        });
        await newWorkspace.save();
        res.status(201).json(newWorkspace);
    } catch (error) {
        res.status(500).json({ error: "Failed to create workspace" });
    }
});

router.get('/', authenticateToken, async (req, res) => {
    try {
        const workspaces = await Workspace.find({ members: req.user.userId });
        res.status(200).json(workspaces);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch workspaces" });
    }
});

router.post('/:id/invite', authenticateToken, async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        if (!email) return res.status(400).json({ error: "Email is required." });

        const workspace = await Workspace.findById(req.params.id);
        
        if (!workspace) return res.status(404).json({ error: "Workspace not found" });
        if (workspace.ownerId.toString() !== req.user.userId) {
            return res.status(403).json({ error: "Only the owner can invite teammates." });
        }

        const userToInvite = await User.findOne({ email });
        if (!userToInvite) return res.status(404).json({ error: "User is not registered on the platform yet." });

        if (!workspace.members.includes(userToInvite._id)) {
            workspace.members.push(userToInvite._id);
            await workspace.save();
        }
        res.status(200).json({ message: "User added successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to invite teammate" });
    }
});

module.exports = router;
