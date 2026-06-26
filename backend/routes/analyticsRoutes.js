const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const Meeting = require('../models/Meeting');
const Reply = require('../models/Reply');
const Comment = require('../models/Comment');
const Workspace = require('../models/Workspace');

router.get('/:workspaceId', authenticateToken, async (req, res) => {
    try {
        const { workspaceId } = req.params;
        
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) return res.status(404).json({ error: "Workspace not found" });

        const isMember = workspace.members.some(memberId => memberId.toString() === req.user.userId);
        if (!isMember) {
            return res.status(403).json({ error: "You do not have access to this workspace's analytics." });
        }

        // 1. Calculate high-level metrics
        const activeThreads = await Meeting.countDocuments({ workspaceId, status: 'Open' });
        const resolvedDiscussions = await Meeting.countDocuments({ workspaceId, status: 'Closed' });
        
        const meetings = await Meeting.find({ workspaceId }).select('_id title status');
        const meetingIds = meetings.map(m => m._id);
        const replies = await Reply.find({ meetingId: { $in: meetingIds } });
        const totalVideos = replies.length;

        // 2. Calculate Top Active Discussions
        // We'll calculate engagement score = videos + text comments per meeting
        const comments = await Comment.find({ replyId: { $in: replies.map(r => r._id) } });
        
        const meetingEngagement = {};
        meetings.forEach(m => {
            if (m.status === 'Open') {
                meetingEngagement[m._id] = { title: m.title, score: 0 };
            }
        });

        // Add 1 point per video
        replies.forEach(reply => {
            if (meetingEngagement[reply.meetingId]) {
                meetingEngagement[reply.meetingId].score += 1;
            }
        });

        // Add 1 point per comment
        // A comment belongs to a reply, so we trace it back to the meeting
        const replyToMeetingMap = {};
        replies.forEach(r => replyToMeetingMap[r._id] = r.meetingId);

        comments.forEach(comment => {
            const mId = replyToMeetingMap[comment.replyId];
            if (mId && meetingEngagement[mId]) {
                meetingEngagement[mId].score += 1;
            }
        });

        // Sort by score and take top 5
        const sortedEngagements = Object.values(meetingEngagement).sort((a, b) => b.score - a.score).slice(0, 5);

        // Format for Recharts
        const chartData = sortedEngagements.map(eng => ({
            name: eng.title.length > 15 ? eng.title.substring(0, 15) + '...' : eng.title,
            engagement: eng.score
        }));

        res.status(200).json({
            activeThreads,
            resolvedDiscussions,
            totalVideos,
            chartData
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch analytics" });
    }
});

module.exports = router;
