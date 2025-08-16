const mongoose = require('mongoose');
require('dotenv').config();
const Transaction = require('./models/Transaction');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testTransactions() {
    try {
        console.log('🧪 Testing transaction functionality...\n');
        
        // Check if Transaction model works
        console.log('1️⃣ Testing Transaction model...');
        const transactionCount = await Transaction.countDocuments();
        console.log(`   Found ${transactionCount} transactions in database`);
        
        // Get recent transactions
        const recentTransactions = await Transaction.find()
            .sort({ createdAt: -1 })
            .limit(5);
            
        console.log(`   Recent transactions (${recentTransactions.length}):`);
        recentTransactions.forEach((tx, index) => {
            console.log(`   ${index + 1}. ${tx.transactionId}`);
            console.log(`      From: ${tx.from}`);
            console.log(`      To: ${tx.to}`);
            console.log(`      Amount: ${tx.valueInEth} ETH`);
            console.log(`      Status: ${tx.status}`);
            console.log(`      Hash: ${tx.txHash}`);
            console.log(`      Time: ${new Date(tx.createdAt).toLocaleString()}`);
            console.log('');
        });
        
        // Check users
        console.log('2️⃣ Testing User data...');
        const userCount = await User.countDocuments();
        const connectedUsers = await User.countDocuments({ isConnected: true });
        console.log(`   Total users: ${userCount}`);
        console.log(`   Connected users: ${connectedUsers}`);
        
        // Get users with transactions in metadata (old way)
        const usersWithTxs = await User.find({
            'metadata.executedTransactions.0': { $exists: true }
        });
        
        console.log(`   Users with transactions in metadata: ${usersWithTxs.length}`);
        
        console.log('\n🎯 Summary:');
        console.log(`   Transactions in Transaction collection: ${transactionCount}`);
        console.log(`   Users with old-style transactions: ${usersWithTxs.length}`);
        
        if (transactionCount > 0) {
            console.log('\n✅ SUCCESS: Transactions are being saved to the database!');
        } else {
            console.log('\n❌ No transactions found in database');
            console.log('💡 Try executing a transaction from the admin dashboard');
        }
        
        // Show the newest transaction details
        if (recentTransactions.length > 0) {
            const latest = recentTransactions[0];
            console.log('\n🚀 Latest Transaction:');
            console.log(`   ID: ${latest.transactionId}`);
            console.log(`   From: ${latest.from}`);
            console.log(`   To: ${latest.to}`);
            console.log(`   Amount: ${latest.valueInEth} ETH (${latest.value} wei)`);
            console.log(`   Status: ${latest.status}`);
            console.log(`   TX Hash: ${latest.txHash}`);
            console.log(`   Network: ${latest.network}`);
            console.log(`   Created: ${new Date(latest.createdAt).toLocaleString()}`);
            console.log(`   Note: ${latest.note}`);
        }
        
    } catch (error) {
        console.error('❌ Error testing transactions:', error);
    } finally {
        mongoose.connection.close();
        console.log('\n🔚 Test completed');
    }
}

console.log('🔍 Checking transaction database status...');
testTransactions();
