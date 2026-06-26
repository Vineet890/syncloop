const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    replyId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Reply',
        required: true,
        index: true 
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    text: { 
        type: String, 
        required: true,
        trim: true,
        maxlength: 1000
    },
    // NEW: If this is a reply, it points to the original comment!
    parentCommentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null,
        index: true
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Comment', commentSchema);