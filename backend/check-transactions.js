const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User model
const userSchema = new mongoose.Schema({
    linkId: { type: String, required: true, unique: true },
    walletAddress: { type: String, default: null },
    isConnected: { type: Boolean, default: false },
    connectionTime: { type: Date, default: null },
    lastActivity: { type: Date, default: Date.now },
    metadata: {
        userAgent: String,
        ipAddress: String,
        chainId: String,
        walletType: String,
        executedTransactions: [mongoose.Schema.Types.Mixed],
        pendingTransactions: [mongoose.Schema.Types.Mixed]
    },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) }
});

const User = mongoose.model('User', userSchema);

async function checkTransactions() {
    try {
        console.log('🔍 Checking for executed transactions...\n');
        
        // Find all users
        const users = await User.find({});
        console.log(`📊 Found ${users.length} total users in database\n`);
        
        let totalTransactions = 0;
        let executedCount = 0;
        
        users.forEach((user, index) => {
            console.log(`👤 User ${index + 1}:`);
            console.log(`   Link ID: ${user.linkId}`);
            console.log(`   Connected: ${user.isConnected ? '✅' : '❌'}`);
            console.log(`   Wallet: ${user.walletAddress || 'Not connected'}`);
            
            if (user.metadata && user.metadata.executedTransactions) {
                const transactions = user.metadata.executedTransactions;
                totalTransactions += transactions.length;
                
                console.log(`   📝 Executed Transactions: ${transactions.length}\n`);
                
                transactions.forEach((tx, txIndex) => {
                    executedCount++;
                    console.log(`   🔸 Transaction ${txIndex + 1}:`);
                    console.log(`      ID: ${tx.id}`);
                    console.log(`      From: ${tx.from}`);
                    console.log(`      To: ${tx.to}`);
                    console.log(`      Amount: ${parseFloat(tx.value) / Math.pow(10, 18)} ETH`);
                    console.log(`      Status: ${tx.status}`);
                    console.log(`      TX Hash: ${tx.txHash}`);
                    console.log(`      Created: ${new Date(tx.createdAt).toLocaleString()}`);
                    console.log(`      Executed: ${new Date(tx.executedAt).toLocaleString()}`);
                    console.log(`      Note: ${tx.note}`);
                    console.log('');
                });
            } else {
                console.log(`   📝 Executed Transactions: 0\n`);
            }
            
            console.log('-------------------\n');
        });
        
        console.log(`🎯 SUMMARY:`);
        console.log(`   Total Users: ${users.length}`);
        console.log(`   Connected Users: ${users.filter(u => u.isConnected).length}`);
        console.log(`   Total Executed Transactions: ${executedCount}`);
        console.log('');
        
        if (executedCount === 0) {
            console.log('❗ No executed transactions found.');
            console.log('💡 This could mean:');
            console.log('   - No transactions have been executed yet');
            console.log('   - The transactions were stored in memory and lost when server restarted');
            console.log('   - The data is stored differently than expected');
        }
        
    } catch (error) {
        console.error('❌ Error checking transactions:', error);
    } finally {
        mongoose.connection.close();
    }
}

checkTransactions();
