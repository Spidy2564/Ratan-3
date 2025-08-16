// Wallet connection utilities similar to ConnectKit
import QRCode from 'qrcode';

// Mobile device detection
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Generate QR Code for wallet connection
export const generateQRCode = async (uri) => {
  try {
    return await QRCode.toDataURL(uri, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return null;
  }
};

// Wallet metadata similar to ConnectKit's wallet registry
export const walletRegistry = {
  metamask: {
    id: 'metamask',
    name: 'MetaMask',
    description: 'Connect using browser wallet',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzEyIiBoZWlnaHQ9IjI5NCIgdmlld0JveD0iMCAwIDMxMiAyOTQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTMwNi4zOCA2OS43NzQzTDMwOS4xNzIgNjcuODg1NEwzMDkuNzY0IDY3LjQ4NzNMMzA5LjE3MiA2Ny44ODU0TDMwNi4zOCA2OS43NzQzWk0yMjUuNDYyIDEzNi45OUwyMjIuNjcgMTM4Ljg3OUwyMjUuNDYyIDEzNi45OVoiIGZpbGw9IiNFNjE3OEEiLz48L3N2Zz4=',
    mobileIcon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzEyIiBoZWlnaHQ9IjI5NCIgdmlld0JveD0iMCAwIDMxMiAyOTQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTMwNi4zOCA2OS43NzQzTDMwOS4xNzIgNjcuODg1NEwzMDkuNzY0IDY3LjQ4NzNMMzA5LjE3MiA2Ny44ODU0TDMwNi4zOCA2OS43NzQzWk0yMjUuNDYyIDEzNi45OUwyMjIuNjcgMTM4Ljg3OUwyMjUuNDYyIDEzNi45OVoiIGZpbGw9IiNFNjE3OEEiLz48L3N2Zz4=',
    installed: typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask,
    downloadUrls: {
      android: 'https://play.google.com/store/apps/details?id=io.metamask',
      ios: 'https://apps.apple.com/app/metamask/id1438144202',
      chrome: 'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn'
    },
    deepLink: (uri) => `https://metamask.app.link/wc?uri=${encodeURIComponent(uri)}`
  },
  trustwallet: {
    id: 'trustwallet',
    name: 'Trust Wallet',
    description: 'Connect to Trust Wallet',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTUgMzBDMjMuMjg0MyAzMCAzMCAyMy4yODQzIDMwIDE1QzMwIDYuNzE1NzMgMjMuMjg0MyAwIDE1IDBDNS43MTU3MyAwIDAgNi43MTU3MyAwIDE1QzAgMjMuMjg0MyA2LjcxNTczIDMwIDE1IDMwWiIgZmlsbD0idXJsKCNwYWludDBfbGluZWFyXzQyXzEyNikiLz48L3N2Zz4=',
    mobileIcon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTUgMzBDMjMuMjg0MyAzMCAzMCAyMy4yODQzIDMwIDE1QzMwIDYuNzE1NzMgMjMuMjg0MyAwIDE1IDBDNS43MTU3MyAwIDAgNi43MTU3MyAwIDE1QzAgMjMuMjg0MyA2LjcxNTczIDMwIDE1IDMwWiIgZmlsbD0idXJsKCNwYWludDBfbGluZWFyXzQyXzEyNikiLz48L3N2Zz4=',
    installed: typeof window !== 'undefined' && window.ethereum && window.ethereum.isTrust,
    downloadUrls: {
      android: 'https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp',
      ios: 'https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409'
    },
    deepLink: (uri) => `trust://wc?uri=${encodeURIComponent(uri)}`
  },
  walletconnect: {
    id: 'walletconnect',
    name: 'WalletConnect',
    description: 'Connect with WalletConnect',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE4NSIgdmlld0JveD0iMCAwIDMwMCAxODUiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTYxLjQzODUgMzYuMjU2MkM5Ni44MjM0IDEuMDYxNTggMTU0LjU3NiAwLjU2NjQxIDE5MC42NSAzNC41N0MyMjYuNzI0IDY4LjU3NDIgMjI4LjA3NiAxMjQuNjEyIDE5Mi42OTEgMTU5LjgwNyIgc3Ryb2tlPSIjMzMzOUY0IiBzdHJva2Utd2lkdGg9IjguMzM5MjEiLz48L3N2Zz4=',
    mobileIcon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE4NSIgdmlld0JveD0iMCAwIDMwMCAxODUiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTYxLjQzODUgMzYuMjU2MkM5Ni44MjM0IDEuMDYxNTggMTU0LjU3NiAwLjU2NjQxIDE5MC42NSAzNC41N0MyMjYuNzI0IDY4LjU3NDIgMjI4LjA3NiAxMjQuNjEyIDE5Mi42OTEgMTU5LjgwNyIgc3Ryb2tlPSIjMzMzOUY0IiBzdHJva2Utd2lkdGg9IjguMzM5MjEiLz48L3N2Zz4=',
    installed: true, // WalletConnect is always "available"
    downloadUrls: {
      android: 'https://walletconnect.com/wallets',
      ios: 'https://walletconnect.com/wallets'
    }
  },
  rainbow: {
    id: 'rainbow',
    name: 'Rainbow',
    description: 'Connect to Rainbow Wallet',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0idXJsKCNyYWluYm93KSIvPjwvc3ZnPg==',
    mobileIcon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0idXJsKCNyYWluYm93KSIvPjwvc3ZnPg==',
    installed: typeof window !== 'undefined' && window.ethereum && window.ethereum.isRainbow,
    downloadUrls: {
      android: 'https://play.google.com/store/apps/details?id=me.rainbow',
      ios: 'https://apps.apple.com/app/rainbow-ethereum-wallet/id1457119021'
    },
    deepLink: (uri) => `https://rnbwapp.com/wc?uri=${encodeURIComponent(uri)}`
  },
  coinbase: {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    description: 'Connect to Coinbase Wallet',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNiIgZmlsbD0iIzAwNTJGRiIvPjwvc3ZnPg==',
    mobileIcon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNiIgZmlsbD0iIzAwNTJGRiIvPjwvc3ZnPg==',
    installed: typeof window !== 'undefined' && window.ethereum && window.ethereum.isCoinbaseWallet,
    downloadUrls: {
      android: 'https://play.google.com/store/apps/details?id=org.toshi',
      ios: 'https://apps.apple.com/app/coinbase-wallet/id1278383455'
    },
    deepLink: (uri) => `https://go.cb-w.com/wc?uri=${encodeURIComponent(uri)}`
  }
};

// Get available wallets based on platform
export const getAvailableWallets = () => {
  const mobile = isMobile();
  const wallets = Object.values(walletRegistry);
  
  return wallets.map(wallet => ({
    ...wallet,
    available: mobile ? true : wallet.installed, // On mobile, all wallets are "available" via deep links
    recommended: mobile ? ['trustwallet', 'metamask'].includes(wallet.id) : wallet.installed
  }));
};

// Connect to injected wallet (MetaMask, Trust Wallet, etc.)
export const connectInjectedWallet = async (walletId) => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No Web3 wallet detected');
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    // Switch to Ethereum mainnet if needed
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1' }] // Ethereum mainnet
      });
    } catch (switchError) {
      // Chain switch failed - might not be supported
      console.warn('Could not switch chain:', switchError);
    }

    return {
      address: accounts[0],
      walletId,
      connected: true
    };
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    throw error;
  }
};

// Open wallet app via deep link (mobile)
export const openWalletApp = (walletId, uri) => {
  const wallet = walletRegistry[walletId];
  if (!wallet || !wallet.deepLink) {
    console.error('Wallet not supported for deep linking');
    return;
  }

  const deepLinkUrl = wallet.deepLink(uri);
  
  // Try to open the app
  const link = document.createElement('a');
  link.href = deepLinkUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Download wallet app
export const downloadWallet = (walletId) => {
  const wallet = walletRegistry[walletId];
  if (!wallet || !wallet.downloadUrls) {
    console.error('Wallet download URLs not available');
    return;
  }

  const mobile = isMobile();
  let downloadUrl;

  if (mobile) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    downloadUrl = isIOS ? wallet.downloadUrls.ios : wallet.downloadUrls.android;
  } else {
    downloadUrl = wallet.downloadUrls.chrome || wallet.downloadUrls.android;
  }

  if (downloadUrl) {
    window.open(downloadUrl, '_blank');
  }
};

// Format wallet address
export const formatWalletAddress = (address, length = 8) => {
  if (!address) return '';
  const start = address.slice(0, 6);
  const end = address.slice(-4);
  return `${start}...${end}`;
};

// Validate Ethereum address
export const isValidEthereumAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};
