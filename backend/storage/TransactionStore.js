// In-memory transaction storage
class TransactionStore {
    constructor() {
        this.transactions = [];
    }

    // Save a new transaction
    async save(transactionData) {
        const transaction = {
            _id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            ...transactionData,
            createdAt: transactionData.createdAt || new Date(),
            executedAt: transactionData.executedAt || new Date()
        };
        
        this.transactions.push(transaction);
        console.log(`✅ Transaction saved to memory store: ${transaction.transactionId}`);
        return transaction;
    }

    // Find all transactions with filters
    async find(filter = {}, options = {}) {
        let results = [...this.transactions];

        // Apply filters
        if (filter.linkId) {
            results = results.filter(tx => tx.linkId === filter.linkId);
        }
        if (filter.status) {
            results = results.filter(tx => tx.status === filter.status);
        }
        if (filter.transactionId) {
            results = results.filter(tx => tx.transactionId === filter.transactionId);
        }

        // Apply sorting
        if (options.sort) {
            if (options.sort.createdAt === -1) {
                results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            }
        }

        // Apply limit
        if (options.limit) {
            results = results.slice(0, options.limit);
        }

        return results;
    }

    // Find one transaction
    async findOne(filter) {
        const results = await this.find(filter);
        return results.length > 0 ? results[0] : null;
    }

    // Count transactions
    async countDocuments(filter = {}) {
        const results = await this.find(filter);
        return results.length;
    }

    // Aggregate for statistics
    async aggregate(pipeline) {
        let results = [...this.transactions];
        
        for (const stage of pipeline) {
            if (stage.$match) {
                // Apply match filters
                Object.keys(stage.$match).forEach(key => {
                    if (key === 'status') {
                        results = results.filter(tx => tx.status === stage.$match[key]);
                    }
                });
            }
            
            if (stage.$group) {
                // Simple group operation for our use case
                if (stage.$group._id === null) {
                    const totalValue = results.reduce((sum, tx) => {
                        return sum + parseFloat(tx.value || '0');
                    }, 0);
                    
                    const totalValueEth = results.reduce((sum, tx) => {
                        return sum + parseFloat(tx.valueInEth || '0');
                    }, 0);
                    
                    results = [{
                        _id: null,
                        totalValue: totalValue.toString(),
                        totalValueEth: totalValueEth.toString(),
                        avgValue: results.length > 0 ? (totalValue / results.length).toString() : '0',
                        avgValueEth: results.length > 0 ? (totalValueEth / results.length).toString() : '0'
                    }];
                }
            }
        }
        
        return results;
    }

    // Get all transactions (for debugging)
    getAll() {
        return this.transactions;
    }

    // Clear all transactions (for testing)
    clear() {
        this.transactions = [];
        console.log('🧹 Transaction store cleared');
    }
}

// Export singleton instance
module.exports = new TransactionStore();
