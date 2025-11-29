// models/Chat.js - Chat conversation model
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: [true, 'Nội dung tin nhắn là bắt buộc'],
        trim: true,
        maxlength: [1000, 'Tin nhắn không được quá 1000 ký tự']
    },
    type: {
        type: String,
        enum: ['text', 'file', 'image', 'price_negotiation'],
        default: 'text'
    },
    fileUrl: {
        type: String,
        default: null
    },
    fileName: {
        type: String,
        default: null
    },
    metadata: {
        priceOffer: {
            type: Number,
            default: null
        },
        originalPrice: {
            type: Number,
            default: null
        }
    },
    readAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const ChatSchema = new mongoose.Schema({
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DichVu',
        required: true
    },
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['customer', 'provider'],
            required: true
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        lastReadAt: {
            type: Date,
            default: Date.now
        }
    }],
    messages: [MessageSchema],
    status: {
        type: String,
        enum: ['active', 'completed', 'archived'],
        default: 'active'
    },
    lastMessage: {
        type: MessageSchema,
        default: null
    },
    lastActivity: {
        type: Date,
        default: Date.now
    },
    priceNegotiation: {
        originalPrice: {
            type: Number,
            default: null
        },
        currentOffer: {
            type: Number,
            default: null
        },
        agreedPrice: {
            type: Number,
            default: null
        },
        status: {
            type: String,
            enum: ['none', 'pending', 'agreed', 'rejected'],
            default: 'none'
        }
    }
}, {
    timestamps: true
});

// Indexes for performance
ChatSchema.index({ service: 1 });
ChatSchema.index({ 'participants.user': 1 });
ChatSchema.index({ lastActivity: -1 });
ChatSchema.index({ status: 1 });

// Methods
ChatSchema.methods.addMessage = async function(messageData) {
    const message = {
        sender: messageData.sender,
        content: messageData.content,
        type: messageData.type || 'text',
        fileUrl: messageData.fileUrl || null,
        fileName: messageData.fileName || null,
        metadata: messageData.metadata || {},
        createdAt: new Date()
    };
    
    this.messages.push(message);
    this.lastMessage = message;
    this.lastActivity = new Date();
    
    // Update price negotiation if it's a price offer
    if (messageData.type === 'price_negotiation' && messageData.metadata.priceOffer) {
        this.priceNegotiation.currentOffer = messageData.metadata.priceOffer;
        this.priceNegotiation.status = 'pending';
    }
    
    return this.save();
};

ChatSchema.methods.markAsRead = function(userId) {
    const participant = this.participants.find(p => p.user.toString() === userId.toString());
    if (participant) {
        participant.lastReadAt = new Date();
        
        // Mark messages as read for this user
        this.messages.forEach(message => {
            if (message.sender.toString() !== userId.toString() && !message.readAt) {
                message.readAt = new Date();
            }
        });
    }
    
    return this.save();
};

ChatSchema.methods.getUnreadCount = function(userId) {
    return this.messages.filter(message => 
        message.sender.toString() !== userId.toString() && !message.readAt
    ).length;
};

// Static methods
ChatSchema.statics.findByUser = function(userId) {
    return this.find({ 
        'participants.user': userId,
        status: 'active'
    })
    .populate('service', 'TenDichVu Gia')
    .populate('participants.user', 'name email avatar')
    .sort({ lastActivity: -1 });
};

ChatSchema.statics.findByService = function(serviceId) {
    return this.findOne({ 
        service: serviceId,
        status: 'active'
    })
    .populate('participants.user', 'name email avatar')
    .populate('messages.sender', 'name email avatar');
};

module.exports = mongoose.model('Chat', ChatSchema);
