const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Meeting = require('../models/Meeting');
const Reply = require('../models/Reply');
const Comment = require('../models/Comment');

router.put('/rename', authenticateToken, async (req, res) => {
    try {
        const name = String(req.body.name || '').trim();
        if (!name) return res.status(400).json({ error: "Name is required" });
        if (name.length > 50) return res.status(400).json({ error: "Name is too long (max 50 characters)" });

        const updatedUser = await User.findByIdAndUpdate(req.user.userId, { name }, { new: true });
        
        res.status(200).json({ user: { id: updatedUser._id, name: updatedUser.name, email: updatedUser.email } });
    } catch (error) {
        res.status(500).json({ error: "Failed to update name" });
    }
});

router.delete('/delete', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const userWorkspaces = await Workspace.find({ ownerId: userId });
        const workspaceIds = userWorkspaces.map(ws => ws._id);
        
        const meetingsToDelete = await Meeting.find({ workspaceId: { $in: workspaceIds } });
        const meetingIds = meetingsToDelete.map(m => m._id);

        const repliesToDelete = await Reply.find({ 
            $or: [
                { meetingId: { $in: meetingIds } },
                { userId: userId }
            ]
        });
        
        const cloudinary = require('cloudinary').v2;
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });

        for (const reply of repliesToDelete) {
            if (reply.public_id) {
                try {
                    await cloudinary.uploader.destroy(reply.public_id, { resource_type: 'video' });
                } catch (e) {
                    console.error("Failed to destroy Cloudinary video:", e);
                }
            }
        }

        const replyIds = repliesToDelete.map(r => r._id);

        await Comment.deleteMany({ replyId: { $in: replyIds } });
        await Reply.deleteMany({ _id: { $in: replyIds } });
        await Meeting.deleteMany({ workspaceId: { $in: workspaceIds } });
        await Workspace.deleteMany({ ownerId: userId });
        
        await Reply.deleteMany({ userId: userId });
        await Comment.deleteMany({ userId: userId });
        
        await Workspace.updateMany({ members: userId }, { $pull: { members: userId } });
        await User.findByIdAndDelete(userId);

        res.status(200).json({ message: "Account completely deleted" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete account" });
    }
});

module.exports = router;
