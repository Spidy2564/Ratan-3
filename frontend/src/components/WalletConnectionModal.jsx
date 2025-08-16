import React, { useState, useEffect } from 'react';
import { QRCode } from 'react-qr-code';
import { useWallet } from './WalletProvider';
import { 
  getAvailableWallets, 
  isMobile, 
  openWalletApp, 
  downloadWallet, 
  generateQRCode 
} from '../utils/walletUtils';
import './WalletConnectionModal.css';

const WalletConnectionModal = ({ isOpen, onClose, onConnect }) => {
  const { connectInjected, connectWalletConnect, isConnecting, error } = useWallet();
  const [qrUri, setQrUri] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [step, setStep] = useState('wallets'); // 'wallets', 'qr', 'connecting'
  const [availableWallets, setAvailableWallets] = useState([]);

  const mobile = isMobile();

  useEffect(() => {
    if (isOpen) {
      setAvailableWallets(getAvailableWallets());
      setStep('wallets');
      setSelectedWallet(null);
      setQrUri('');
      setQrCodeImage('');
    }
  }, [isOpen]);

  useEffect(() => {
    const generateQR = async () => {
      if (qrUri) {
        const qrImage = await generateQRCode(qrUri);
        setQrCodeImage(qrImage);
      }
    };
    generateQR();
  }, [qrUri]);

  const handleWalletClick = async (wallet) => {
    if (isConnecting) return;

    setSelectedWallet(wallet);

    if (wallet.id === 'walletconnect') {
      setStep('qr');
      try {
        const uri = await connectWalletConnect();
        if (uri) {
          setQrUri(uri);
        }
      } catch (error) {
        console.error('WalletConnect error:', error);
        setStep('wallets');
      }
    } else if (mobile && !wallet.installed) {
      // On mobile, if wallet is not installed, show options to download or open
      handleMobileWalletConnect(wallet);
    } else if (wallet.installed) {
      // Desktop: connect to installed wallet
      setStep('connecting');
      try {
        await connectInjected(wallet.id);
        onConnect && onConnect();
        onClose();
      } catch (error) {
        console.error('Connection error:', error);
        setStep('wallets');
      }
    } else {
      // Desktop: wallet not installed, redirect to download
      downloadWallet(wallet.id);
    }
  };

  const handleMobileWalletConnect = async (wallet) => {
    if (wallet.id === 'walletconnect') {
      handleWalletClick(wallet);
      return;
    }

    try {
      const uri = await connectWalletConnect();
      if (uri) {
        // Try to open the wallet app directly
        openWalletApp(wallet.id, uri);
        setStep('connecting');
        setQrUri(uri);
      }
    } catch (error) {
      console.error('Mobile wallet connect error:', error);
    }
  };

  const handleCopyUri = () => {
    if (qrUri) {
      navigator.clipboard.writeText(qrUri);
      // You could show a toast notification here
    }
  };

  const handleBack = () => {
    setStep('wallets');
    setSelectedWallet(null);
    setQrUri('');
    setQrCodeImage('');
  };

  if (!isOpen) return null;

  return (
    <div className="wallet-modal-overlay" onClick={onClose}>
      <div className="wallet-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="wallet-modal-header">
          {step !== 'wallets' && (
            <button className="back-button" onClick={handleBack} aria-label="Back">
              ←
            </button>
          )}
          <h2 className="wallet-modal-title">
            {step === 'wallets' && 'Connect Wallet'}
            {step === 'qr' && 'Scan QR Code'}
            {step === 'connecting' && 'Connecting...'}
          </h2>
          <button className="close-button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="wallet-modal-content">
          {step === 'wallets' && (
            <div className="wallets-grid">
              {availableWallets.map((wallet) => (
                <button
                  key={wallet.id}
                  className={`wallet-option ${wallet.recommended ? 'recommended' : ''} ${!wallet.available ? 'unavailable' : ''}`}
                  onClick={() => handleWalletClick(wallet)}
                  disabled={isConnecting || !wallet.available}
                >
                  <div className="wallet-icon">
                    <img 
                      src={mobile ? wallet.mobileIcon : wallet.icon} 
                      alt={wallet.name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="wallet-info">
                    <div className="wallet-name">{wallet.name}</div>
                    <div className="wallet-description">{wallet.description}</div>
                    {wallet.recommended && <span className="recommended-badge">Recommended</span>}
                    {!wallet.installed && !mobile && (
                      <span className="install-badge">Install</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 'qr' && (
            <div className="qr-section">
              <div className="qr-instructions">
                <h3>Scan with your wallet</h3>
                <p>Open your wallet app and scan this QR code to connect</p>
              </div>
              
              <div className="qr-container">
                {qrCodeImage ? (
                  <img src={qrCodeImage} alt="QR Code" className="qr-code" />
                ) : qrUri ? (
                  <QRCode value={qrUri} size={280} className="qr-code" />
                ) : (
                  <div className="qr-loading">Generating QR Code...</div>
                )}
              </div>

              {mobile && qrUri && (
                <div className="mobile-actions">
                  <button className="copy-button" onClick={handleCopyUri}>
                    Copy to clipboard
                  </button>
                  
                  <div className="wallet-apps">
                    <p>Or choose a wallet:</p>
                    <div className="mobile-wallet-options">
                      {availableWallets.filter(w => w.id !== 'walletconnect').map(wallet => (
                        <button
                          key={wallet.id}
                          className="mobile-wallet-button"
                          onClick={() => openWalletApp(wallet.id, qrUri)}
                        >
                          <img src={wallet.mobileIcon} alt={wallet.name} />
                          <span>{wallet.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'connecting' && (
            <div className="connecting-section">
              <div className="spinner"></div>
              <h3>Connecting to {selectedWallet?.name}</h3>
              <p>Confirm the connection in your wallet</p>
              
              {mobile && qrUri && (
                <button 
                  className="retry-button"
                  onClick={() => openWalletApp(selectedWallet.id, qrUri)}
                >
                  Open {selectedWallet?.name}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'wallets' && (
          <div className="wallet-modal-footer">
            <p>
              {mobile ? 
                'Connect your wallet by selecting an option above or scanning a QR code' :
                'Connect your wallet to continue. Install the extension if you don\'t have it.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletConnectionModal;
