const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    ownerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    members: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Workspace', workspaceSchema);