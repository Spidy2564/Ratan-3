import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, walletAPI } from '../utils/api';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }
    fetchAllTransactions();
  }, [navigate]);

  const fetchAllTransactions = async () => {
    try {
      setLoading(true);
      
      // Get users for metadata
      const usersResponse = await adminAPI.getUsers();
      const allUsers = usersResponse.data;
      setUsers(allUsers);
      
      // Create a mapping of linkId to user info
      const userMap = {};
      allUsers.forEach(user => {
        userMap[user.linkId] = {
          userName: user.linkId.substring(0, 8) + '...',
          userAddress: user.walletAddress,
          isConnected: user.isConnected
        };
      });
      
      // Get transactions from MongoDB Transaction model
      const transactionsResponse = await fetch('/api/admin/transactions?limit=100', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!transactionsResponse.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const transactionsData = await transactionsResponse.json();
      
      // Map transactions with user info
      const allTransactions = transactionsData.transactions.map(tx => ({
        id: tx.transactionId,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        valueInEth: tx.valueInEth,
        gasLimit: tx.gasLimit,
        gasPrice: tx.gasPrice,
        status: tx.status,
        txHash: tx.txHash,
        createdAt: tx.createdAt,
        executedAt: tx.executedAt,
        note: tx.note,
        userName: userMap[tx.linkId]?.userName || tx.linkId?.substring(0, 8) + '...' || 'Unknown',
        userAddress: userMap[tx.linkId]?.userAddress || 'Unknown',
        linkId: tx.linkId
      }));
      
      setTransactions(allTransactions);
      
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin');
  };

  const goToDashboard = () => {
    navigate('/admin/dashboard');
  };

  const formatAddress = (address) => {
    if (!address) return 'Unknown';
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  const formatAmount = (valueWei) => {
    try {
      // Simple conversion from wei to ETH (wei / 10^18)
      const ethValue = parseFloat(valueWei) / Math.pow(10, 18);
      return ethValue.toFixed(4);
    } catch {
      return 'N/A';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'executed':
        return <span className="status-connected">✅ Executed</span>;
      case 'pending':
        return <span className="status-pending">⏳ Pending</span>;
      case 'failed':
        return <span style={{ color: '#ef4444', fontWeight: '600' }}>❌ Failed</span>;
      default:
        return <span style={{ color: '#6b7280' }}>Unknown</span>;
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  return (
    <div>
      <nav className="navbar">
        <div className="container">
          <div className="navbar-content">
            <div className="navbar-brand">Trust Wallet Admin - Transaction History</div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-primary" onClick={goToDashboard}>
                Dashboard
              </button>
              <button className="btn btn-outline" onClick={logout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{transactions.length}</div>
            <div className="stat-label">Total Transactions</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{transactions.filter(tx => tx.status === 'executed').length}</div>
            <div className="stat-label">Executed</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{transactions.filter(tx => tx.status === 'pending').length}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {transactions.reduce((sum, tx) => {
                try {
                  const ethValue = parseFloat(tx.value || '0') / Math.pow(10, 18);
                  return sum + ethValue;
                } catch {
                  return sum;
                }
              }, 0).toFixed(2)}
            </div>
            <div className="stat-label">Total ETH Sent</div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2>All Transactions</h2>
            <button className="btn btn-primary" onClick={fetchAllTransactions}>
              🔄 Refresh
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              <h3>No transactions found</h3>
              <p>Execute some transactions from the dashboard to see them here.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>TX Hash</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Time</th>
                    <th>User</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, index) => (
                    <tr key={tx.id || index}>
                      <td>
                        <span 
                          className="wallet-address" 
                          style={{ cursor: 'pointer' }}
                          onClick={() => copyToClipboard(tx.txHash)}
                          title="Click to copy"
                        >
                          {tx.txHash ? formatAddress(tx.txHash) : 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span 
                          className="wallet-address"
                          style={{ cursor: 'pointer' }}
                          onClick={() => copyToClipboard(tx.from)}
                          title="Click to copy full address"
                        >
                          {formatAddress(tx.from)}
                        </span>
                      </td>
                      <td>
                        <span 
                          className="wallet-address"
                          style={{ cursor: 'pointer' }}
                          onClick={() => copyToClipboard(tx.to)}
                          title="Click to copy full address"
                        >
                          {formatAddress(tx.to)}
                        </span>
                      </td>
                      <td>
                        <strong>{formatAmount(tx.value)} ETH</strong>
                      </td>
                      <td>
                        {getStatusBadge(tx.status)}
                      </td>
                      <td>
                        {formatDate(tx.executedAt || tx.createdAt)}
                      </td>
                      <td>
                        <span className="wallet-address">{tx.userName}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {tx.txHash && (
                            <button 
                              className="btn btn-outline"
                              style={{ padding: '4px 8px', fontSize: '10px' }}
                              onClick={() => copyToClipboard(tx.txHash)}
                            >
                              Copy Hash
                            </button>
                          )}
                          <button 
                            className="btn btn-primary"
                            style={{ padding: '4px 8px', fontSize: '10px' }}
                            onClick={() => {
                              const details = `Transaction Details:\n\nHash: ${tx.txHash}\nFrom: ${tx.from}\nTo: ${tx.to}\nAmount: ${formatAmount(tx.value)} ETH\nStatus: ${tx.status}\nTime: ${formatDate(tx.executedAt || tx.createdAt)}\nGas Limit: ${tx.gasLimit}\nGas Price: ${tx.gasPrice}\nNote: ${tx.note || 'N/A'}`;
                              alert(details);
                            }}
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {transactions.length > 0 && (
          <div className="card">
            <h3>Quick Actions</h3>
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <button 
                className="btn btn-success"
                onClick={() => {
                  const csvContent = "data:text/csv;charset=utf-8," + 
                    "Hash,From,To,Amount (ETH),Status,Time,User\n" +
                    transactions.map(tx => 
                      `"${tx.txHash || 'N/A'}","${tx.from}","${tx.to}","${formatAmount(tx.value)}","${tx.status}","${formatDate(tx.executedAt || tx.createdAt)}","${tx.userName}"`
                    ).join("\n");
                  
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", "transactions.csv");
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                📊 Export CSV
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  const executedCount = transactions.filter(tx => tx.status === 'executed').length;
                  const totalValue = transactions.reduce((sum, tx) => {
                    try {
                      const ethValue = parseFloat(tx.value || '0') / Math.pow(10, 18);
                      return sum + ethValue;
                    } catch {
                      return sum;
                    }
                  }, 0);
                  
                  alert(`Transaction Summary:\n\nTotal Transactions: ${transactions.length}\nExecuted: ${executedCount}\nTotal Value: ${totalValue.toFixed(4)} ETH\nActive Users: ${users.filter(u => u.isConnected).length}`);
                }}
              >
                📈 Summary
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
