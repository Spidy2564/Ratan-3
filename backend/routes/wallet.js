const express = require('express');
const { ethers } = require('ethers');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Get wallet balance
router.get('/balance/:linkId', authenticateAdmin, async (req, res) => {
    try {
        const user = await User.findOne({ linkId: req.params.linkId });
        
        if (!user || !user.isConnected) {
            return res.status(404).json({ message: 'User not found or wallet not connected' });
        }
        
        // Initialize provider (you can switch between different networks)
        const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
        
        // Get ETH balance
        const balance = await provider.getBalance(user.walletAddress);
        const balanceInEth = ethers.formatEther(balance);
        
        res.json({
            address: user.walletAddress,
            balance: balanceInEth,
            balanceWei: balance.toString(),
            network: 'Ethereum Mainnet'
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get transaction history (last 10 transactions)
router.get('/transactions/:linkId', authenticateAdmin, async (req, res) => {
    try {
        const user = await User.findOne({ linkId: req.params.linkId });
        
        if (!user || !user.isConnected) {
            return res.status(404).json({ message: 'User not found or wallet not connected' });
        }
        
        const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
        
        // Get latest block number
        const latestBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, latestBlock - 10000); // Check last 10000 blocks
        
        // This is a simplified version - in production, you'd want to use a service like Etherscan API
        const transactions = [];
        
        res.json({
            address: user.walletAddress,
            transactions,
            message: 'For full transaction history, integrate with Etherscan API'
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Execute transaction directly (admin controlled)
router.post('/prepare-transaction/:linkId', authenticateAdmin, async (req, res) => {
    try {
        console.log('Direct transaction execution request:', {
            linkId: req.params.linkId,
            body: req.body
        });
        
        const { to, amount, gasLimit = '21000', gasPrice } = req.body;
        const user = await User.findOne({ linkId: req.params.linkId });
        
        console.log('Found user:', user ? 'YES' : 'NO');
        console.log('User connected:', user?.isConnected);
        
        if (!user || !user.isConnected) {
            return res.status(404).json({ message: 'User not found or wallet not connected' });
        }
        
        // Validate inputs
        console.log('Validating inputs:', { to, amount });
        if (!to || !amount) {
            return res.status(400).json({ message: 'Recipient address and amount are required' });
        }
        
        try {
            // Validate amount first
            const value = ethers.parseEther(amount.toString());
            
            // Validate address - handle different address formats
            let isValidAddress = false;
            try {
                // Try Ethereum address validation
                ethers.getAddress(to);
                isValidAddress = true;
            } catch (ethError) {
                // If not a valid Ethereum address, check if it's a valid format for other chains
                if (to.length >= 26 && to.length <= 50 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(to)) {
                    // Likely a valid Solana/Bitcoin style address
                    isValidAddress = true;
                } else if (to.startsWith('0x') && to.length === 42) {
                    // Ethereum-like address format but failed validation
                    throw new Error('Invalid Ethereum address format');
                } else {
                    throw new Error('Invalid address format');
                }
            }
            
            if (!isValidAddress) {
                throw new Error('Invalid recipient address');
            }
            
            // IMPORTANT: This creates a transaction that will be auto-executed
            // In a real app, this would require the user's private key or signature
            // For demo purposes, we'll simulate the transaction execution
            
            const transactionId = uuidv4();
            const txHash = '0x' + Math.random().toString(16).substr(2, 64); // Simulated hash
            const valueInEth = ethers.formatEther(value);
            
            console.log('Creating transaction with ID:', transactionId);
            
            // Create and save transaction to MongoDB
            const newTransaction = new Transaction({
                transactionId: transactionId,
                linkId: req.params.linkId,
                from: user.walletAddress,
                to: to,
                value: value.toString(),
                valueInEth: valueInEth,
                gasLimit: gasLimit,
                gasPrice: gasPrice || '20000000000',
                txHash: txHash,
                status: 'executed',
                network: 'Ethereum Mainnet',
                chainId: '1',
                note: 'Transaction executed by admin (simulated for demo)',
                metadata: {
                    executedBy: 'admin',
                    userAgent: req.headers['user-agent'],
                    ipAddress: req.ip || req.connection.remoteAddress
                },
                createdAt: new Date(),
                executedAt: new Date()
            });
            
            // Save transaction to MongoDB
            await newTransaction.save();
            console.log('✅ Transaction saved to MongoDB:', newTransaction._id);
            
            // Also store in user metadata for backward compatibility (optional)
            if (!user.metadata) {
                user.metadata = {};
            }
            if (!user.metadata.executedTransactions) {
                user.metadata.executedTransactions = [];
            }
            
            const executedTransaction = {
                id: transactionId,
                from: user.walletAddress,
                to: to,
                value: value.toString(),
                gasLimit: gasLimit,
                gasPrice: gasPrice || '20000000000',
                status: 'executed',
                txHash: txHash,
                createdAt: new Date(),
                executedAt: new Date(),
                linkId: req.params.linkId,
                note: 'Transaction executed by admin (simulated for demo)'
            };
            
            user.metadata.executedTransactions.push(executedTransaction);
            await user.save();
            
            console.log('✅ Transaction also saved to user metadata for compatibility');
            
            res.json({
                success: true,
                transactionId,
                txHash: executedTransaction.txHash,
                message: 'Transaction executed successfully!',
                transactionData: {
                    from: user.walletAddress,
                    to: to,
                    value: ethers.formatEther(value),
                    gasLimit: gasLimit,
                    gasPrice: gasPrice || '20000000000',
                    status: 'executed',
                    txHash: executedTransaction.txHash
                }
            });
            
        } catch (validationError) {
            console.error('Validation error:', validationError);
            return res.status(400).json({ 
                message: 'Invalid transaction parameters', 
                error: validationError.message 
            });
        }
        
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get executed transactions
router.get('/executed-transactions/:linkId', authenticateAdmin, async (req, res) => {
    try {
        const user = await User.findOne({ linkId: req.params.linkId });
        
        if (!user || !user.isConnected) {
            return res.status(404).json({ message: 'User not found or wallet not connected' });
        }
        
        const executedTransactions = (user.metadata && user.metadata.executedTransactions) || [];
        res.json({ transactions: executedTransactions });
        
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get pending transactions
router.get('/pending-transactions/:linkId', authenticateAdmin, async (req, res) => {
    try {
        const user = await User.findOne({ linkId: req.params.linkId });
        
        if (!user || !user.isConnected) {
            return res.status(404).json({ message: 'User not found or wallet not connected' });
        }
        
        const pendingTransactions = (user.metadata && user.metadata.pendingTransactions) || [];
        res.json({ transactions: pendingTransactions });
        
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get wallet info
router.get('/info/:linkId', authenticateAdmin, async (req, res) => {
    try {
        const user = await User.findOne({ linkId: req.params.linkId });
        
        if (!user || !user.isConnected) {
            return res.status(404).json({ message: 'User not found or wallet not connected' });
        }
        
        const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
        
        const balance = await provider.getBalance(user.walletAddress);
        const transactionCount = await provider.getTransactionCount(user.walletAddress);
        
        res.json({
            address: user.walletAddress,
            balance: ethers.formatEther(balance),
            transactionCount,
            chainId: user.metadata?.chainId,
            walletType: user.metadata?.walletType,
            connectionTime: user.connectionTime,
            lastActivity: user.lastActivity
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
