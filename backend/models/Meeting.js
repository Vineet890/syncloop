const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true,
        trim: true,
        maxlength: 100
    },
    agenda: { 
        type: String, 
        required: true,
        trim: true,
        maxlength: 2000
    },
    workspaceId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Workspace',
        required: true,
        index: true 
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