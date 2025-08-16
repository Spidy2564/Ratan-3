import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { userAPI } from '../utils/api';
import { useWallet } from '../components/WalletProvider';
import WalletConnectionModal from '../components/WalletConnectionModal';

const UserConnect = () => {
  const { linkId } = useParams();
  const { account, isConnected, walletType, formattedAccount } = useWallet();
  const [status, setStatus] = useState('loading'); // loading, valid, invalid, expired, connected
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);

  useEffect(() => {
    verifyLink();
  }, [linkId]);

  const verifyLink = async () => {
    try {
      const response = await userAPI.verifyLink(linkId);
      if (response.data.isConnected) {
        setStatus('connected');
        setWalletAddress(response.data.walletAddress);
      } else {
        setStatus('valid');
      }
    } catch (error) {
      if (error.response?.status === 410) {
        setStatus('expired');
      } else {
        setStatus('invalid');
      }
    }
  };

  // Handle wallet connection from the enhanced modal
  const handleWalletConnect = async () => {
    try {
      setError('');
      
      if (!account || !isConnected) {
        setError('Please connect your wallet first');
        return;
      }

      // Get chain ID
      const chainId = await window.ethereum?.request({ 
        method: 'eth_chainId' 
      }) || '0x1';

      // Connect wallet to our backend
      const response = await userAPI.connectWallet(linkId, {
        walletAddress: account,
        chainId,
        walletType: walletType || 'Unknown'
      });

      setSuccess('Wallet connected successfully!');
      setWalletAddress(account);
      setStatus('connected');
      
      // Update activity every 30 seconds
      const activityInterval = setInterval(() => {
        userAPI.updateActivity(linkId);
      }, 30000);

      // Clean up interval on unmount
      return () => clearInterval(activityInterval);
      
    } catch (error) {
      console.log(error);
      setError(error.response?.data?.message || 'Failed to connect wallet');
    }
  };

  // Check if wallet is connected and handle auto-connection
  useEffect(() => {
    if (isConnected && account && status === 'valid') {
      handleWalletConnect();
    }
  }, [isConnected, account, status]);

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="loading">
            <p>Verifying link...</p>
          </div>
        );

      case 'invalid':
        return (
          <div className="wallet-connect">
            <h1>❌ Invalid Link</h1>
            <p>This link is not valid or has been removed.</p>
          </div>
        );

      case 'expired':
        return (
          <div className="wallet-connect">
            <h1>⏰ Link Expired</h1>
            <p>This link has expired. Please request a new one.</p>
          </div>
        );

      case 'connected':
        return (
          <div className="wallet-connect">
            <h1>✅ Wallet Connected</h1>
            <p>Your wallet has been successfully connected!</p>
            <div className="card" style={{ marginTop: '32px', textAlign: 'left' }}>
              <h3>Connection Details</h3>
              <p style={{ marginTop: '16px' }}>
                <strong>Wallet Address:</strong><br />
                <span className="wallet-address" style={{ fontSize: '16px' }}>{walletAddress}</span>
              </p>
              <p style={{ marginTop: '16px' }}>
                <strong>Status:</strong> <span className="status-connected">Active</span>
              </p>
              <div className="alert alert-info" style={{ marginTop: '24px' }}>
                <strong>Note:</strong> Keep this page open to maintain your connection. 
                The admin can now interact with your wallet.
              </div>
            </div>
          </div>
        );

      case 'valid':
        return (
          <div className="wallet-connect">
            <h1>🔗 Connect Your Wallet</h1>
            <p>Connect your Trust Wallet to proceed with the secure connection.</p>
            
            {error && (
              <div className="alert alert-danger">
                {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                {success}
              </div>
            )}

            <div className="card" style={{ marginTop: '32px' }}>
              <h3>Instructions:</h3>
              <ol style={{ textAlign: 'left', marginTop: '16px', lineHeight: '1.8' }}>
                <li>Make sure Trust Wallet or MetaMask is installed on your device</li>
                <li>Click "Connect Wallet" below</li>
                <li>Approve the connection in your wallet</li>
                <li>Keep this page open to maintain the connection</li>
              </ol>
            </div>

            {isConnected && account ? (
              <div className="card" style={{ marginTop: '32px', background: '#f0f9ff', border: '2px solid #0ea5e9' }}>
                <p style={{ marginBottom: '16px', color: '#0ea5e9', fontWeight: '600' }}>
                  ✅ Wallet Connected: {formattedAccount}
                </p>
                <button 
                  className="btn btn-success" 
                  style={{ fontSize: '16px', padding: '12px 24px' }}
                  onClick={handleWalletConnect}
                >
                  Continue with {walletType || 'Wallet'}
                </button>
              </div>
            ) : (
              <>
                <button 
                  className="btn btn-primary" 
                  style={{ marginTop: '32px', fontSize: '18px', padding: '16px 32px' }}
                  onClick={() => setShowWalletModal(true)}
                >
                  🔐 Connect Wallet
                </button>
                
                <div style={{ marginTop: '32px', fontSize: '14px', color: '#6b7280' }}>
                  <p>Choose from multiple wallet options including Trust Wallet, MetaMask, and more</p>
                </div>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div className="card" style={{ 
          maxWidth: '600px', 
          width: '100%', 
          margin: '0',
          textAlign: 'center'
        }}>
          {renderContent()}
        </div>
      </div>
      
      <WalletConnectionModal 
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={() => {
          setShowWalletModal(false);
          // The wallet connection will be handled automatically by the useEffect
        }}
      />
    </>
  );
};

export default UserConnect;
