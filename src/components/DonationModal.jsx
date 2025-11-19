import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'react-qr-code';
import { DONATION_WALLET_ADDRESS } from '../data/constants';

const DonationModal = ({ onClose, btcAddress = DONATION_WALLET_ADDRESS }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(btcAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-physio-bg-surface border border-physio-border-strong rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-physio-border-subtle flex justify-between items-center bg-physio-bg-core/50">
          <h3 className="text-lg font-bold text-physio-text-primary flex items-center gap-2">
            <span className="text-xl">⚡️</span> Support Development
          </h3>
          <button 
            onClick={onClose}
            className="p-1 text-physio-text-tertiary hover:text-physio-text-primary transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto bg-[#F7931A]/10 rounded-full flex items-center justify-center mb-4 border border-[#F7931A]/20">
              <span className="text-3xl">₿</span>
            </div>
            <p className="text-sm text-physio-text-secondary leading-relaxed">
              PhysioSim is a free tool. If you find it valuable for your research, consider supporting its continued development.
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center py-2">
            <div className="p-3 bg-white rounded-xl shadow-lg">
              <QRCode 
                value={`bitcoin:${btcAddress}`} 
                size={160}
                level="M"
                fgColor="#000000"
                bgColor="#FFFFFF"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-physio-text-tertiary uppercase tracking-wider">
              Bitcoin (BTC) Address
            </label>
            <div 
              onClick={handleCopy}
              className="group relative flex items-center justify-between p-3 bg-physio-bg-core border border-physio-border-subtle rounded-lg cursor-pointer hover:border-physio-accent-primary/50 transition-all"
            >
              <code className="text-xs font-mono text-physio-text-primary break-all mr-2">
                {btcAddress}
              </code>
              <div className="flex-shrink-0 text-physio-text-tertiary group-hover:text-physio-accent-primary transition-colors">
                {copied ? (
                  <span className="text-physio-accent-success font-bold text-xs">COPIED</span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                )}
              </div>
            </div>
            <p className="text-[10px] text-physio-text-tertiary text-center pt-2">
              Click the address to copy to clipboard
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-physio-bg-core/30 border-t border-physio-border-subtle flex justify-center">
          <button 
            onClick={onClose}
            className="text-sm text-physio-text-secondary hover:text-physio-text-primary transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DonationModal;
