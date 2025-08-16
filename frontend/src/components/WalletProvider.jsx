import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import SignClient from '@walletconnect/sign-client';
import { 
  connectInjectedWallet, 
  isMobile, 
  formatWalletAddress, 
  isValidEthereumAddress 
} from '../utils/walletUtils';

const WalletContext = createContext();

// WalletConnect configuration
const WALLETCONNECT_CONFIG = {
  projectId: 'your-walletconnect-project-id', // You'll need to get this from WalletConnect Cloud
  metadata: {
    name: 'Trust Wallet Admin',
    description: 'Trust Wallet Admin Dashboard',
    url: 'https://your-domain.com',
    icons: ['https://your-domain.com/icon.png']
  },
  relayUrl: 'wss://relay.walletconnect.com'
};

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletType, setWalletType] = useState(null);
  const [signClient, setSignClient] = useState(null);
  const [wcSession, setWcSession] = useState(null);
  const [error, setError] = useState(null);

  // Initialize WalletConnect client
  useEffect(() => {
    const initWalletConnect = async () => {
      try {
        const client = await SignClient.init(WALLETCONNECT_CONFIG);
        setSignClient(client);

        // Check for existing sessions
        const sessions = client.session.getAll();
        if (sessions.length > 0) {
          const session = sessions[0];
          setWcSession(session);
          setAccount(session.namespaces.eip155?.accounts[0]?.split(':')[2]);
          setIsConnected(true);
          setWalletType('walletconnect');
        }

        // Listen for session events
        client.on('session_event', (args) => {
          console.log('WC Session Event:', args);
        });

        client.on('session_update', ({ topic, params }) => {
          console.log('WC Session Update:', topic, params);
        });

        client.on('session_delete', () => {
          console.log('WC Session Deleted');
          disconnect();
        });

      } catch (error) {
        console.error('Failed to initialize WalletConnect:', error);
        setError('Failed to initialize wallet connection');
      }
    };

    initWalletConnect();
  }, []);

  // Check for injected wallet on page load
  useEffect(() => {
    const checkInjectedWallet = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
            
            // Determine wallet type
            if (window.ethereum.isMetaMask) {
              setWalletType('metamask');
            } else if (window.ethereum.isTrust) {
              setWalletType('trustwallet');
            } else if (window.ethereum.isCoinbaseWallet) {
              setWalletType('coinbase');
            } else if (window.ethereum.isRainbow) {
              setWalletType('rainbow');
            } else {
              setWalletType('injected');
            }
          }
        } catch (error) {
          console.error('Error checking injected wallet:', error);
        }
      }
    };

    checkInjectedWallet();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setAccount(accounts[0]);
        }
      });

      window.ethereum.on('chainChanged', () => {
        // Reload the page on chain change
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  // Connect to injected wallet
  const connectInjected = async (walletId) => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    setError(null);

    try {
      const result = await connectInjectedWallet(walletId);
      setAccount(result.address);
      setWalletType(walletId);
      setIsConnected(true);
    } catch (error) {
      setError(error.message);
      console.error('Failed to connect injected wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Connect via WalletConnect
  const connectWalletConnect = async () => {
    if (!signClient || isConnecting) return null;
    
    setIsConnecting(true);
    setError(null);

    try {
      const { uri, approval } = await signClient.connect({
        requiredNamespaces: {
          eip155: {
            methods: [
              'eth_sendTransaction',
              'eth_signTransaction',
              'eth_sign',
              'personal_sign',
              'eth_signTypedData',
            ],
            chains: ['eip155:1'], // Ethereum mainnet
            events: ['chainChanged', 'accountsChanged'],
          },
        },
      });

      if (uri) {
        // Wait for the session to be approved
        const session = await approval();
        setWcSession(session);
        
        const account = session.namespaces.eip155?.accounts[0]?.split(':')[2];
        setAccount(account);
        setWalletType('walletconnect');
        setIsConnected(true);
      }

      return uri;
    } catch (error) {
      setError('Failed to connect with WalletConnect');
      console.error('WalletConnect connection failed:', error);
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnect = async () => {
    try {
      if (wcSession && signClient) {
        await signClient.disconnect({
          topic: wcSession.topic,
          reason: {
            code: 6000,
            message: 'User disconnected',
          },
        });
        setWcSession(null);
      }

      setAccount(null);
      setIsConnected(false);
      setWalletType(null);
      setError(null);
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  // Sign message
  const signMessage = async (message) => {
    if (!account || !isConnected) {
      throw new Error('No wallet connected');
    }

    try {
      let signature;

      if (walletType === 'walletconnect' && signClient && wcSession) {
        // Sign via WalletConnect
        const result = await signClient.request({
          topic: wcSession.topic,
          chainId: 'eip155:1',
          request: {
            method: 'personal_sign',
            params: [ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message)), account],
          },
        });
        signature = result;
      } else if (window.ethereum) {
        // Sign via injected wallet
        signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message)), account],
        });
      } else {
        throw new Error('No signing method available');
      }

      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  };

  // Send transaction
  const sendTransaction = async (transaction) => {
    if (!account || !isConnected) {
      throw new Error('No wallet connected');
    }

    try {
      let txHash;

      if (walletType === 'walletconnect' && signClient && wcSession) {
        // Send via WalletConnect
        const result = await signClient.request({
          topic: wcSession.topic,
          chainId: 'eip155:1',
          request: {
            method: 'eth_sendTransaction',
            params: [transaction],
          },
        });
        txHash = result;
      } else if (window.ethereum) {
        // Send via injected wallet
        txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [transaction],
        });
      } else {
        throw new Error('No transaction method available');
      }

      return txHash;
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  };

  const value = {
    // State
    account,
    isConnected,
    isConnecting,
    walletType,
    error,
    formattedAccount: account ? formatWalletAddress(account) : null,
    
    // Methods
    connectInjected,
    connectWalletConnect,
    disconnect,
    signMessage,
    sendTransaction,
    
    // Utils
    isMobile: isMobile(),
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
