const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    linkId: {
        type: String,
        required: true,
        ref: 'User'
    },
    from: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: true
    },
    value: {
        type: String, // Store as string to handle big numbers
        required: true
    },
    valueInEth: {
        type: String, // Human readable ETH amount
        required: true
    },
    gasLimit: {
        type: String,
        default: '21000'
    },
    gasPrice: {
        type: String,
        default: '20000000000' // 20 gwei
    },
    txHash: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'executed', 'failed'],
        default: 'executed'
    },
    network: {
        type: String,
        default: 'Ethereum Mainnet'
    },
    chainId: {
        type: String,
        default: '1'
    },
    note: {
        type: String,
        default: ''
    },
    metadata: {
        adminAddress: String,
        userAgent: String,
        ipAddress: String,
        executedBy: { type: String, default: 'admin' }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    executedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for better query performance
transactionSchema.index({ linkId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ txHash: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
