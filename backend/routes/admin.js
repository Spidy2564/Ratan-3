const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Admin login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Simple admin authentication (you can enhance this with a proper admin model)
        if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(
                { username, role: 'admin' },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            res.json({ token, message: 'Login successful' });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Generate user link
router.post('/generate-link', authenticateAdmin, async (req, res) => {
    try {
        const linkId = uuidv4();
        
        const newUser = new User({
            linkId,
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            }
        });
        
        await newUser.save();
        
        const userLink = `${req.protocol}://${req.get('host')}/connect/${linkId}`;
        
        res.json({
            linkId,
            link: userLink,
            expiresAt: newUser.expiresAt,
            message: 'Link generated successfully'
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all users/connections
router.get('/users', authenticateAdmin, async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get specific user by linkId
router.get('/user/:linkId', authenticateAdmin, async (req, res) => {
    try {
        const user = await User.findOne({ linkId: req.params.linkId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete user/connection
router.delete('/user/:linkId', authenticateAdmin, async (req, res) => {
    try {
        const user = await User.findOneAndDelete({ linkId: req.params.linkId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all transactions from database (No auth for debugging)
router.get('/transactions', async (req, res) => {
    try {
        console.log('🔍 Fetching transactions from database...');
        
        const { status, linkId, limit = 50, page = 1 } = req.query;
        console.log('📋 Query params:', { status, linkId, limit, page });
        
        // Build query filters
        const filter = {};
        if (status) filter.status = status;
        if (linkId) filter.linkId = linkId;
        console.log('🔎 Database filter:', filter);
        
        // Calculate pagination
        const skip = (page - 1) * limit;
        
        // Get transactions with pagination (without populate for now)
        const transactions = await Transaction.find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);
        
        console.log(`📊 Found ${transactions.length} transactions in database`);
        
        // Get total count for pagination
        const totalCount = await Transaction.countDocuments(filter);
        console.log(`📈 Total transaction count: ${totalCount}`);
        
        res.json({
            transactions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount,
                pages: Math.ceil(totalCount / limit)
            },
            summary: {
                total: totalCount,
                executed: await Transaction.countDocuments({ ...filter, status: 'executed' }),
                pending: await Transaction.countDocuments({ ...filter, status: 'pending' }),
                failed: await Transaction.countDocuments({ ...filter, status: 'failed' })
            }
        });
    } catch (error) {
        console.error('❌ Transaction fetch error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get transactions for a specific user
router.get('/transactions/:linkId', authenticateAdmin, async (req, res) => {
    try {
        const { linkId } = req.params;
        const { status, limit = 20 } = req.query;
        
        // Build query
        const filter = { linkId };
        if (status) filter.status = status;
        
        const transactions = await Transaction.find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));
        
        res.json({ transactions });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get transaction by transaction ID
router.get('/transaction/:transactionId', authenticateAdmin, async (req, res) => {
    try {
        const transaction = await Transaction.findOne({ 
            transactionId: req.params.transactionId 
        }).populate('linkId', 'walletAddress isConnected connectionTime');
        
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        
        res.json({ transaction });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get transaction statistics
router.get('/stats/transactions', authenticateAdmin, async (req, res) => {
    try {
        const stats = await Promise.all([
            Transaction.countDocuments(),
            Transaction.countDocuments({ status: 'executed' }),
            Transaction.countDocuments({ status: 'pending' }),
            Transaction.countDocuments({ status: 'failed' }),
            Transaction.aggregate([
                { $match: { status: 'executed' } },
                { 
                    $group: {
                        _id: null,
                        totalValue: { $sum: { $toDouble: '$value' } },
                        totalValueEth: { $sum: { $toDouble: '$valueInEth' } },
                        avgValue: { $avg: { $toDouble: '$value' } },
                        avgValueEth: { $avg: { $toDouble: '$valueInEth' } }
                    }
                }
            ]),
            Transaction.find({ status: 'executed' })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('transactionId from to valueInEth txHash createdAt')
        ]);
        
        const [total, executed, pending, failed, valueStats, recentTxs] = stats;
        
        res.json({
            counts: {
                total,
                executed,
                pending,
                failed
            },
            values: valueStats[0] || {
                totalValue: '0',
                totalValueEth: '0',
                avgValue: '0',
                avgValueEth: '0'
            },
            recentTransactions: recentTxs
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Debug endpoint to check transaction status
router.get('/debug/transactions', authenticateAdmin, async (req, res) => {
    try {
        console.log('🔍 Debug: Checking transaction status...');
        
        // Check MongoDB connection and transactions
        let mongoTransactions = [];
        let mongoError = null;
        try {
            mongoTransactions = await Transaction.find().sort({ createdAt: -1 }).limit(10);
            console.log(`📊 Found ${mongoTransactions.length} transactions in MongoDB`);
        } catch (error) {
            mongoError = error.message;
            console.log('❌ MongoDB error:', error.message);
        }
        
        // Check user metadata transactions
        const users = await User.find();
        let metadataTransactions = [];
        users.forEach(user => {
            if (user.metadata?.executedTransactions) {
                metadataTransactions.push(...user.metadata.executedTransactions.map(tx => ({
                    ...tx,
                    source: 'user_metadata',
                    linkId: user.linkId
                })));
            }
        });
        
        console.log(`📋 Found ${metadataTransactions.length} transactions in user metadata`);
        
        res.json({
            debug: true,
            timestamp: new Date().toISOString(),
            mongodb: {
                connected: !mongoError,
                error: mongoError,
                transactionCount: mongoTransactions.length,
                transactions: mongoTransactions.map(tx => ({
                    id: tx.transactionId,
                    linkId: tx.linkId,
                    from: tx.from,
                    to: tx.to,
                    value: tx.valueInEth,
                    status: tx.status,
                    createdAt: tx.createdAt
                }))
            },
            userMetadata: {
                transactionCount: metadataTransactions.length,
                transactions: metadataTransactions.slice(0, 10)
            },
            users: users.map(u => ({
                linkId: u.linkId,
                connected: u.isConnected,
                hasMetadataTransactions: !!(u.metadata?.executedTransactions?.length),
                metadataTransactionCount: u.metadata?.executedTransactions?.length || 0
            }))
        });
        
    } catch (error) {
        console.error('❌ Debug endpoint error:', error);
        res.status(500).json({ 
            debug: true, 
            error: error.message, 
            stack: error.stack 
        });
    }
});

module.exports = router;
