const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    agenda: { 
        type: String, 
        required: true 
    },
    workspaceId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Workspace',
        required: true 
    },
    status: { 
        type: String, 
        enum: ['Open', 'Closed'], 
        default: 'Open' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Meeting', meetingSchema);