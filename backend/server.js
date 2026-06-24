const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config(); 
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('./cloudinaryConfig');

// --- DATABASE MODELS ---
const Reply = require('./models/Reply'); 
const Meeting = require('./models/Meeting');
const User = require('./models/User');
const Workspace = require('./models/Workspace');
const authenticateToken = require('./middleware/auth');

// --- GROQ AI SETUP ---
const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- SOCKET.IO SETUP ---
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Create HTTP Server and attach Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] }
});

// Listen for WebSocket connections
io.on('connection', (socket) => {
    console.log('⚡ A user connected via WebSocket:', socket.id);
    
    socket.on('joinMeeting', (meetingId) => {
        socket.join(meetingId);
        console.log(`User ${socket.id} joined meeting room: ${meetingId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { family: 4 })
  .then(() => console.log("Successfully connected to MongoDB Cloud!"))
  .catch((error) => console.log("Error connecting to MongoDB:", error));

// --- AUTHENTICATION ROUTES ---
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// The Secret Key used to sign the VIP Wristbands 
const JWT_SECRET = "super_secret_silent_meeting_key";

// Register a new user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // 1. Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "Email already in use" });

        // 2. The Blender: Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Save the new user
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        // 4. Create a default "Personal Workspace" for them
        const newWorkspace = new Workspace({
            name: `${name}'s Workspace`,
            ownerId: newUser._id,
            members: [newUser._id]
        });
        await newWorkspace.save();

        // 5. Hand them their VIP Wristband (JWT Token)
        const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token, user: { id: newUser._id, name: newUser.name, email: newUser.email } });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ error: "Registration failed" });
    }
});

// Log an existing user in
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find the user
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        // 2. Check the password against the hashed version
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        // 3. Hand them a new wristband
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Login failed" });
    }
});

// --- MEETING & REPLY ROUTES ---
// 0. Get all Workspaces for the logged-in user
app.get('/api/workspaces', authenticateToken, async (req, res) => {
    try {
        // Find every workspace where this user's ID is in the "members" array
        const userWorkspaces = await Workspace.find({ members: req.user.userId });
        res.status(200).json(userWorkspaces);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch workspaces" });
    }
});

// 0.5. Invite a teammate to a Workspace
app.post('/api/workspaces/invite', authenticateToken, async (req, res) => {
    try {
        const { workspaceId, email } = req.body;

        // 1. Find the workspace
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) return res.status(404).json({ error: "Workspace not found" });

        // Security Check: Only the owner of the workspace can invite people!
        if (workspace.ownerId.toString() !== req.user.userId) {
            return res.status(403).json({ error: "Only the workspace owner can invite members" });
        }

        // 2. Look up the user by their email
        const userToInvite = await User.findOne({ email });
        if (!userToInvite) return res.status(404).json({ error: "User not found. Tell them to register first!" });

        // 3. Prevent duplicate invites
        if (workspace.members.includes(userToInvite._id)) {
            return res.status(400).json({ error: "User is already in this workspace" });
        }

        // 4. Add them to the team!
        workspace.members.push(userToInvite._id);
        await workspace.save();

        res.status(200).json({ message: `Successfully added ${userToInvite.name} to the workspace!` });
    } catch (error) {
        res.status(500).json({ error: "Failed to invite teammate" });
    }
});

// 1. Get a specific meeting
app.get('/api/meetings/:id', authenticateToken, async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);
        if (!meeting) return res.status(404).json({ error: "Meeting not found" });
        res.status(200).json(meeting);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch meeting" });
    }
});

// 2. Get meetings (Filtered by the currently selected Workspace)
app.get('/api/meetings', authenticateToken, async (req, res) => {
    try {
        const { workspaceId } = req.query;

        // If the Frontend specifically asks for a workspace, only fetch those meetings!
        if (workspaceId) {
            const meetings = await Meeting.find({ workspaceId: workspaceId }).sort({ createdAt: -1 });
            return res.status(200).json(meetings);
        }

        // Fallback: If no workspace is selected, just grab everything
        const userWorkspaces = await Workspace.find({ members: req.user.userId });
        const workspaceIds = userWorkspaces.map(ws => ws._id);
        const meetings = await Meeting.find({ workspaceId: { $in: workspaceIds } }).sort({ createdAt: -1 });
        res.status(200).json(meetings);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch meetings" });
    }
});

// 3. Create a new meeting in this user's workspace
app.post('/api/meetings', authenticateToken, async (req, res) => {
    try {
        const userWorkspace = await Workspace.findOne({ members: req.user.userId });
        
        const newMeeting = new Meeting({ 
            title: req.body.title, 
            agenda: req.body.agenda,
            // Prioritize the frontend's active workspace, but fallback to the default!
            workspaceId: req.body.workspaceId || userWorkspace._id 
        });
        
        const savedMeeting = await newMeeting.save(); 
        res.status(201).json(savedMeeting);
    } catch (error) {
        res.status(500).json({ error: "Failed to create meeting" });
    }
});

// 4. Get all replies for a meeting
app.get('/api/replies/:meetingId', authenticateToken, async (req, res) => {
    try {
        const replies = await Reply.find({ meetingId: req.params.meetingId }).sort({ createdAt: -1 });
        res.status(200).json(replies);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch replies" });
    }
});

// --- THE AI VIDEO UPLOAD PIPELINE ---
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/replies', upload.single('video'), async (req, res) => {
    try {
        const { meetingId } = req.body;
        const file = req.file; 

        if (!file) return res.status(400).json({ error: 'No video file provided' });

        console.log("1. Video Caught! Uploading to Cloudinary...");

        let uploadFromBuffer = (req) => {
            return new Promise((resolve, reject) => {
                let cld_upload_stream = cloudinary.uploader.upload_stream(
                    { resource_type: "video", folder: "silent-meeting" },
                    (error, result) => {
                        if (result) resolve(result);
                        else reject(error);
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);
            });
        };
        const result = await uploadFromBuffer(req);
        console.log("2. Cloudinary Upload complete!");

        console.log("3. Passing video to Groq AI (Whisper) for transcription...");
        const tempFilePath = path.join(__dirname, `temp_${Date.now()}.webm`);
        fs.writeFileSync(tempFilePath, file.buffer);

        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(tempFilePath),
            model: "whisper-large-v3",
            response_format: "text"
        });
        
        fs.unlinkSync(tempFilePath); 
        console.log("Transcript generated!");

        console.log("4. Passing transcript to Llama-3 for summarization...");
        const completion = await groq.chat.completions.create({
            messages: [
                { 
                    role: "system", 
                    content: "You are an executive assistant. Read this meeting transcript and output exactly 3 things: 1. A 1-sentence summary. 2. A bulleted list of Decisions. 3. A bulleted list of Action Items. Keep it extremely short and professional." 
                },
                { role: "user", content: transcription }
            ],
            model: "llama-3.3-70b-versatile",
        });

        const transcriptText = completion.choices[0].message.content;
        console.log("5. AI Analysis complete!\n", transcriptText);

        const newReply = new Reply({
            meetingId: meetingId,
            videoUrl: result.secure_url,
            transcript: transcriptText 
        });

        await newReply.save();
        
        // Push over WebSocket
        io.to(meetingId).emit('newReply', newReply);

        res.status(201).json(newReply);

    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Failed to upload video" });
    }
});

// Call server.listen so WebSockets work
server.listen(PORT, () => {
    console.log(`Server is running live on http://localhost:${PORT}`);
});