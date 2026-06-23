const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
    
    meetingId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Meeting',
        required: true 
    },
    
   
    textContent: { 
        type: String, 
        required: true 
    },
    
    
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Reply', replySchema);