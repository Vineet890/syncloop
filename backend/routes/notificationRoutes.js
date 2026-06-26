const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');

// Get all notifications for the user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user.userId }).sort({ createdAt: -1 });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
});

// Mark single notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.userId },
            { isRead: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ error: "Notification not found" });
        res.status(200).json(notification);
    } catch (error) {
        res.status(500).json({ error: "Failed to mark as read" });
    }
});

// Mark all as read
router.put('/read-all', authenticateToken, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.userId, isRead: false },
            { $set: { isRead: true } }
        );
        res.status(200).json({ message: "All marked as read" });
    } catch (error) {
        res.status(500).json({ error: "Failed to mark all as read" });
    }
});

module.exports = router;
