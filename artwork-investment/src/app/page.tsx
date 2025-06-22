'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WalletManager } from '@/lib/wallet';
import { WalletState } from '@/lib/types';

export default function Home() {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    publicKey: null,
    error: null
  });
  
  const [isConnecting, setIsConnecting] = useState(false);
  const router = useRouter();
  const walletManager = WalletManager.getInstance();

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      const result = await walletManager.connectWallet();
      setWalletState(result);
      
      if (result.isConnected) {
        router.push('/main');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎨</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">TokenArt</h1>
          <p className="text-gray-600">Invest in Art with Blockchain</p>
        </div>

        {/* Wallet Connection */}
        <div className="space-y-6">
          {!walletState.isConnected ? (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Connect Your Wallet
                </h2>
                <p className="text-sm text-gray-600">
                  Connect your Stellar wallet to start investing in artworks
                </p>
              </div>

              <button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-200 ${
                  isConnecting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 hover:shadow-lg transform hover:-translate-y-0.5'
                }`}
              >
                {isConnecting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Connecting...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="mr-2">🚀</span>
                    Connect Freighter Wallet
                  </div>
                )}
              </button>

              {walletState.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{walletState.error}</p>
                </div>
              )}

              <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2">Features</h3>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Browse curated artwork collection</li>
                  <li>• Invest in fractional art ownership</li>
                  <li>• Track your investment portfolio</li>
                  <li>• Secure blockchain transactions</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="text-green-600 text-4xl mb-4">✅</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Wallet Connected!
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {walletState.publicKey?.slice(0, 8)}...{walletState.publicKey?.slice(-8)}
              </p>
              <button
                onClick={() => router.push('/main')}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                Enter Gallery
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-gray-500">
          <p>🔗 Powered by Stellar Blockchain</p>
          <p className="mt-1">🧪 Testnet Environment</p>
        </div>
      </div>
    </div>
  );
}
