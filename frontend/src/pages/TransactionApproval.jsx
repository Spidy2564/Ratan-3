import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const TransactionApproval = () => {
  const { transactionId } = useParams();
  const [searchParams] = useSearchParams();
  const linkId = searchParams.get('linkId');
  
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');

  useEffect(() => {
    fetchTransaction();
  }, [transactionId, linkId]);

  const fetchTransaction = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/user/transaction/${transactionId}?linkId=${linkId}`);
      setTransaction(response.data.transaction);
    } catch (error) {
      setError('Transaction not found or expired');
    } finally {
      setLoading(false);
    }
  };

  const approveTransaction = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('Please install Trust Wallet or MetaMask to continue');
      return;
    }

    try {
      setApproving(true);
      setError('');

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts.length === 0) {
        setError('No accounts found. Please unlock your wallet.');
        return;
      }

      const userAddress = accounts[0];
      
      // Verify this is the correct wallet
      if (userAddress.toLowerCase() !== transaction.from.toLowerCase()) {
        setError('Wrong wallet connected. Please connect the correct wallet.');
        return;
      }

      // Prepare transaction parameters
      const transactionParams = {
        from: transaction.from,
        to: transaction.to,
        value: '0x' + parseInt(transaction.value).toString(16), // Convert to hex
        gas: '0x' + parseInt(transaction.gasLimit).toString(16),
        gasPrice: '0x' + parseInt(transaction.gasPrice).toString(16)
      };

      // Send transaction
      const hash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParams]
      });

      // Update backend with transaction hash
      await axios.post(`http://localhost:5000/api/user/execute-transaction/${transactionId}`, {
        linkId: linkId,
        txHash: hash
      });

      setTxHash(hash);
      setApproved(true);
      setTransaction({ ...transaction, status: 'executed', txHash: hash });

    } catch (error) {
      if (error.code === 4001) {
        setError('Transaction rejected by user');
      } else {
        setError(`Transaction failed: ${error.message}`);
      }
    } finally {
      setApproving(false);
    }
  };

  const formatEthValue = (weiValue) => {
    // Convert wei string to ETH
    const wei = BigInt(weiValue);
    const eth = Number(wei) / Math.pow(10, 18);
    return eth.toFixed(6);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="card" style={{ maxWidth: '500px', textAlign: 'center' }}>
          <div className="loading">Loading transaction...</div>
        </div>
      </div>
    );
  }

  if (error && !transaction) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="card" style={{ maxWidth: '500px', textAlign: 'center' }}>
          <h1>❌ Transaction Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (approved) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="card" style={{ maxWidth: '500px', textAlign: 'center' }}>
          <h1>✅ Transaction Approved</h1>
          <p>Your transaction has been successfully submitted!</p>
          
          <div className="card" style={{ marginTop: '24px', textAlign: 'left' }}>
            <h3>Transaction Details</h3>
            <p><strong>Hash:</strong> <span className="wallet-address">{txHash}</span></p>
            <p><strong>From:</strong> <span className="wallet-address">{formatAddress(transaction.from)}</span></p>
            <p><strong>To:</strong> <span className="wallet-address">{formatAddress(transaction.to)}</span></p>
            <p><strong>Amount:</strong> {formatEthValue(transaction.value)} ETH</p>
            <p><strong>Status:</strong> <span className="status-connected">Executed</span></p>
          </div>

          <div className="alert alert-info" style={{ marginTop: '24px' }}>
            <strong>Note:</strong> The transaction is now being processed on the blockchain. 
            It may take a few minutes to confirm.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="card" style={{ maxWidth: '500px', textAlign: 'center' }}>
        <h1>🔐 Approve Transaction</h1>
        <p>Please review and approve the following transaction:</p>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        <div className="card" style={{ marginTop: '24px', textAlign: 'left' }}>
          <h3>Transaction Details</h3>
          <p><strong>From:</strong> <span className="wallet-address">{formatAddress(transaction.from)}</span></p>
          <p><strong>To:</strong> <span className="wallet-address">{formatAddress(transaction.to)}</span></p>
          <p><strong>Amount:</strong> {formatEthValue(transaction.value)} ETH</p>
          <p><strong>Gas Limit:</strong> {parseInt(transaction.gasLimit).toLocaleString()}</p>
          <p><strong>Gas Price:</strong> {parseInt(transaction.gasPrice) / 1000000000} Gwei</p>
          <p><strong>Status:</strong> <span className="status-pending">Pending Approval</span></p>
        </div>

        <div className="alert alert-info" style={{ marginTop: '24px' }}>
          <strong>⚠️ Important:</strong> Make sure you trust the recipient address and 
          verify the transaction amount before approving.
        </div>

        <div style={{ marginTop: '32px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button 
            className="btn btn-danger" 
            onClick={() => window.close()}
          >
            ❌ Reject
          </button>
          <button 
            className="btn btn-success" 
            onClick={approveTransaction}
            disabled={approving}
          >
            {approving ? 'Processing...' : '✅ Approve & Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionApproval;
