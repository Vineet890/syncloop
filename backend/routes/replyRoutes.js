const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const streamifier = require('streamifier');
const authenticateToken = require('../middleware/authMiddleware');
const cloudinary = require('../config/cloudinary');
const groq = require('../config/groq');
const Meeting = require('../models/Meeting');
const Workspace = require('../models/Workspace');
const Reply = require('../models/Reply');
const User = require('../models/User');
const sendNotificationEmail = require('../utils/emailService');
let io;

const upload = multer();
router.setSocketIo = (socketIo) => { io = socketIo; };

router.post('/', authenticateToken, upload.single('video'), async (req, res) => {
    try {
        const meetingId = req.body.meetingId;
        
        // Validate file exists
        if (!req.file) {
            return res.status(400).json({ error: "No video file provided." });
        }

        // Authorize: verify user is member of the workspace that owns this meeting
        const meeting = await Meeting.findById(meetingId);
        if (!meeting) return res.status(404).json({ error: "Meeting not found." });

        if (meeting.status === 'Closed') {
            return res.status(403).json({ error: "This meeting is locked. No new videos can be uploaded." });
        }

        const workspace = await Workspace.findById(meeting.workspaceId);
        if (!workspace) return res.status(404).json({ error: "Workspace not found." });

        const isMember = workspace.members.some(m => m.toString() === req.user.userId);
        if (!isMember) {
            return res.status(403).json({ error: "You do not have access to this meeting." });
        }

        let uploadFromBuffer = (buffer) => {
            return new Promise((resolve, reject) => {
                let cld_upload_stream = cloudinary.uploader.upload_stream(
                    { resource_type: 'video' },
                    (error, result) => {
                        if (result) { resolve(result); } else { reject(error); }
                    }
                );
                streamifier.createReadStream(buffer).pipe(cld_upload_stream);
            });
        };

        const result = await uploadFromBuffer(req.file.buffer);
        const tempFilePath = `./temp_${Date.now()}.webm`;
        fs.writeFileSync(tempFilePath, req.file.buffer);

        let transcriptText = "";
        let summaryText = "";

        try {
            const transcription = await groq.audio.transcriptions.create({
                file: fs.createReadStream(tempFilePath),
                model: "whisper-large-v3",
                response_format: "verbose_json",
            });

            transcriptText = transcription.text;

            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    { 
                      role: "system", 
                      content: "You are an AI meeting assistant. Summarize the following transcript in 1 sentence. Then, if there are any tasks mentioned, list them as action items below." 
                    },
                    { 
                      role: "user", 
                      content: transcriptText 
                    }
                ],
                model: "llama-3.3-70b-versatile",
            });

            summaryText = chatCompletion.choices[0].message.content;
        } finally {
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
        }

        const newReply = new Reply({
            meetingId: meetingId,
            userId: req.user.userId,
            videoUrl: result.secure_url,
            public_id: result.public_id, 
            transcript: transcriptText,
            textContent: summaryText
        });

        await newReply.save();

        try {
            const meeting = await Meeting.findById(meetingId);
            if (meeting) {
                const workspace = await Workspace.findById(meeting.workspaceId);
                if (workspace) {
                    const uploader = await User.findById(req.user.userId);
                    const teammates = await User.find({
                        _id: { $in: workspace.members, $ne: req.user.userId }
                    });
                    
                    if (teammates.length > 0) {
                        const targetEmails = teammates.map(u => u.email);
                        sendNotificationEmail(targetEmails, workspace.name, meeting.title, uploader.name, summaryText);
                    }
                }
            }
        } catch (emailErr) {
            console.error("Error sending notifications:", emailErr);
        }

        if (io) io.to(meetingId).emit('new_reply', newReply);
        res.status(201).json(newReply);
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ error: "Failed to process video reply" });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const reply = await Reply.findById(req.params.id);
        if (!reply) return res.status(404).json({ error: "Video not found." });
        
        if (reply.userId.toString() !== req.user.userId) {
            return res.status(403).json({ error: "You can only delete your own videos." });
        }

        if (reply.public_id) {
            await cloudinary.uploader.destroy(reply.public_id, { resource_type: 'video' });
        }

        const Comment = require('../models/Comment');
        await Comment.deleteMany({ replyId: req.params.id });

        await Reply.findByIdAndDelete(req.params.id);
        
        if (io) io.to(reply.meetingId.toString()).emit('reply_deleted', req.params.id);

        res.status(200).json({ message: "Video completely destroyed!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete video" });
    }
});

module.exports = router;
