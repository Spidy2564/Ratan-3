const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    linkId: {
        type: String,
        required: true,
        unique: true
    },
    walletAddress: {
        type: String,
        default: null
    },
    isConnected: {
        type: Boolean,
        default: false
    },
    connectionTime: {
        type: Date,
        default: null
    },
    lastActivity: {
        type: Date,
        default: Date.now
    },
    metadata: {
        userAgent: String,
        ipAddress: String,
        chainId: String,
        walletType: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }
});

// Index for automatic cleanup of expired links
userSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('User', userSchema);
