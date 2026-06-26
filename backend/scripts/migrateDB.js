require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Workspace = require('../models/Workspace');
const Meeting = require('../models/Meeting');

async function migrate() {
    await connectDB();
    console.log("Connected to DB. Starting migration...");

    try {
        const meetings = await Meeting.find({});
        for (const meeting of meetings) {
            if (!meeting.allowedUsers || meeting.allowedUsers.length === 0) {
                const workspace = await Workspace.findById(meeting.workspaceId);
                if (workspace && workspace.members) {
                    meeting.allowedUsers = workspace.members;
                    await meeting.save();
                    console.log(`Migrated Meeting: ${meeting.title}`);
                }
            }
        }
        console.log("Migration complete!");
    } catch (error) {
        console.error("Migration failed", error);
    } finally {
        mongoose.disconnect();
    }
}

migrate();
