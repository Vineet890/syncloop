const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Reply = require('../models/Reply');
const Meeting = require('../models/Meeting');
const Workspace = require('../models/Workspace');
let io;

router.setSocketIo = (socketIo) => { io = socketIo; };

router.post('/', authenticateToken, async (req, res) => {
    try {
        const { replyId, parentCommentId } = req.body;
        const text = String(req.body.text || '').trim();
        
        // Input validation
        if (!text) return res.status(400).json({ error: "Comment text is required." });
        if (text.length > 1000) return res.status(400).json({ error: "Comment is too long (max 1000 characters)." });
        if (!replyId) return res.status(400).json({ error: "Reply ID is required." });

        // Authorization: verify user is member of the workspace
        const reply = await Reply.findById(replyId);
        if (!reply) return res.status(404).json({ error: "Video reply not found." });

        const meeting = await Meeting.findById(reply.meetingId);
        if (!meeting) return res.status(404).json({ error: "Meeting not found." });

        const workspace = await Workspace.findById(meeting.workspaceId);
        if (!workspace) return res.status(404).json({ error: "Workspace not found." });

        const isMember = workspace.members.some(m => m.toString() === req.user.userId);
        if (!isMember) {
            return res.status(403).json({ error: "You do not have access to comment on this video." });
        }

        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ error: "User not found." });
        
        const newComment = new Comment({
            replyId,
            userId: req.user.userId,
            userName: user.name || "Teammate", 
            text,
            parentCommentId: parentCommentId || null 
        });
        
        await newComment.save();

        if (io) {
            io.to(reply.meetingId.toString()).emit('new_comment', newComment);
        }

        res.status(201).json(newComment);
    } catch (error) {
        res.status(500).json({ error: "Failed to post comment" });
    }
});

router.get('/:replyId', authenticateToken, async (req, res) => {
    try {
        const comments = await Comment.find({ replyId: req.params.replyId }).sort({ createdAt: 1 });
        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch comments" });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ error: "Comment not found" });

        if (comment.userId.toString() !== req.user.userId) {
            return res.status(403).json({ error: "You can only delete your own comments." });
        }

        await Comment.deleteMany({ parentCommentId: comment._id });
        await Comment.findByIdAndDelete(req.params.id);

        const reply = await Reply.findById(comment.replyId);
        if (reply && io) {
            io.to(reply.meetingId.toString()).emit('comment_deleted', req.params.id);
        }

        res.status(200).json({ message: "Comment deleted" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete comment" });
    }
});

module.exports = router;
