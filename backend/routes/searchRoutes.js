const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const Meeting = require('../models/Meeting');
const Reply = require('../models/Reply');

router.get('/', authenticateToken, async (req, res) => {
    try {
        const workspaceId = String(req.query.workspaceId || '');
        const rawQuery = String(req.query.q || '').trim();
        if (!rawQuery || !workspaceId) return res.status(400).json({ error: "Missing query or workspace" });
        if (rawQuery.length > 200) return res.status(400).json({ error: "Search query too long (max 200 characters)" });

        // Escape regex special characters to prevent ReDoS
        const q = rawQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const workspace = await require('../models/Workspace').findById(workspaceId);
        if (!workspace) return res.status(404).json({ error: "Workspace not found" });

        const isMember = workspace.members.some(memberId => memberId.toString() === req.user.userId);
        if (!isMember) return res.status(403).json({ error: "Access denied" });

        const meetingMatches = await Meeting.find({
            workspaceId: workspaceId,
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { agenda: { $regex: q, $options: 'i' } }
            ]
        });

        const allWorkspaceMeetings = await Meeting.find({ workspaceId: workspaceId }).select('_id');
        const meetingIds = allWorkspaceMeetings.map(m => m._id);

        const replyMatches = await Reply.find({
            meetingId: { $in: meetingIds },
            transcript: { $regex: q, $options: 'i' }
        });

        const replyMeetingIds = replyMatches.map(r => r.meetingId);
        const additionalMeetings = await Meeting.find({
            _id: { $in: replyMeetingIds }
        });

        const allMatches = [...meetingMatches, ...additionalMeetings];
        const uniqueMeetings = Array.from(new Set(allMatches.map(m => m._id.toString())))
            .map(id => allMatches.find(m => m._id.toString() === id));

        uniqueMeetings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.status(200).json(uniqueMeetings);
    } catch (error) {
        res.status(500).json({ error: "Search failed" });
    }
});

module.exports = router;
