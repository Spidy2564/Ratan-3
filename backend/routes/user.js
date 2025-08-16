const express = require('express');
const User = require('../models/User');

const router = express.Router();

// Verify link and get user info
router.get('/verify/:linkId', async (req, res) => {
    try {
        const user = await User.findOne({ linkId: req.params.linkId });
        
        if (!user) {
            return res.status(404).json({ message: 'Invalid or expired link' });
        }
        
        if (new Date() > user.expiresAt) {
            await User.findByIdAndDelete(user._id);
            return res.status(410).json({ message: 'Link has expired' });
        }
        
        res.json({
            linkId: user.linkId,
            isConnected: user.isConnected,
            walletAddress: user.walletAddress,
            message: 'Link is valid'
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Connect wallet to link
router.post('/connect/:linkId', async (req, res) => {
    try {
        const { walletAddress, chainId, walletType } = req.body;
        
        const user = await User.findOne({ linkId: req.params.linkId });
        
        if (!user) {
            return res.status(404).json({ message: 'Invalid or expired link' });
        }
        
        if (new Date() > user.expiresAt) {
            await User.findByIdAndDelete(user._id);
            return res.status(410).json({ message: 'Link has expired' });
        }
        
        // Update user with wallet connection
        user.walletAddress = walletAddress;
        user.isConnected = true;
        user.connectionTime = new Date();
        user.lastActivity = new Date();
        user.metadata = {
            ...user.metadata,
            chainId,
            walletType: walletType || 'Trust Wallet',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        };
        
        await user.save();
        
        res.json({
            message: 'Wallet connected successfully',
            walletAddress,
            chainId,
            connectionTime: user.connectionTime
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update user activity
router.post('/activity/:linkId', async (req, res) => {
    try {
        const user = await User.findOneAndUpdate(
            { linkId: req.params.linkId },
            { lastActivity: new Date() },
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ message: 'Activity updated', lastActivity: user.lastActivity });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get pending transaction for approval
router.get('/transaction/:transactionId', async (req, res) => {
    try {
        const { linkId } = req.query;
        const user = await User.findOne({ linkId });
        
        if (!user || !user.isConnected) {
            return res.status(404).json({ message: 'User not found or wallet not connected' });
        }
        
        const pendingTransactions = user.metadata.pendingTransactions || [];
        const transaction = pendingTransactions.find(tx => tx.id === req.params.transactionId);
        
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        
        res.json({
            transaction,
            message: 'Transaction ready for approval'
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Execute transaction (user approves)
router.post('/execute-transaction/:transactionId', async (req, res) => {
    try {
        const { linkId, txHash } = req.body;
        const user = await User.findOne({ linkId });
        
        if (!user || !user.isConnected) {
            return res.status(404).json({ message: 'User not found or wallet not connected' });
        }
        
        // Find and update the transaction
        const pendingTransactions = user.metadata.pendingTransactions || [];
        const transactionIndex = pendingTransactions.findIndex(tx => tx.id === req.params.transactionId);
        
        if (transactionIndex === -1) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        
        // Update transaction status
        pendingTransactions[transactionIndex].status = 'executed';
        pendingTransactions[transactionIndex].txHash = txHash;
        pendingTransactions[transactionIndex].executedAt = new Date();
        
        user.metadata.pendingTransactions = pendingTransactions;
        await user.save();
        
        res.json({
            message: 'Transaction executed successfully',
            txHash: txHash,
            transaction: pendingTransactions[transactionIndex]
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
