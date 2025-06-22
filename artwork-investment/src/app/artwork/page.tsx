'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WalletManager } from '@/lib/wallet';
import { ContractManager } from '@/lib/contract';
import { WalletState, InvestmentData } from '@/lib/types';

function ArtworkDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const artworkId = searchParams.get('id');

  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    publicKey: null,
    error: null,
    balance: undefined
  });
  
  const [investmentAmount, setInvestmentAmount] = useState<string>('');
  const [investmentData, setInvestmentData] = useState<InvestmentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [txResult, setTxResult] = useState<string>('');
  
  const walletManager = WalletManager.getInstance();
  const contractManager = useMemo(() => new ContractManager(), []);

  const loadInvestmentData = useCallback(async () => {
    if (!artworkId) return;
    try {
      const data = await contractManager.getInvestmentData(artworkId);
      setInvestmentData(data);
    } catch (error) {
      console.error('Failed to load investment data:', error);
    }
  }, [artworkId, contractManager]);

  useEffect(() => {
    // Check wallet connection
    const storedState = walletManager.getStoredWalletState();
    if (!storedState.isConnected) {
      router.push('/');
      return;
    }
    setWalletState(storedState);
    
    if (artworkId) {
      loadInvestmentData();
    }
    
    // Load balance
    loadBalance();
  }, [router, artworkId, walletManager, loadInvestmentData]);

  const loadBalance = async () => {
    const storedState = walletManager.getStoredWalletState();
    if (storedState.publicKey) {
      const balanceData = await walletManager.getBalance(storedState.publicKey);
      setWalletState(prev => ({
        ...prev,
        balance: balanceData.native
      }));
    }
  };

  const handleInvest = async () => {
    if (!investmentAmount || isNaN(Number(investmentAmount)) || Number(investmentAmount) <= 0) {
      alert('Please enter a valid investment amount');
      return;
    }

    setIsLoading(true);
    setTxResult('');

    try {
      const amount = Number(investmentAmount);
      const txHash = await contractManager.investInArtwork(artworkId!, amount);
      
      setTxResult(`Investment successful! Transaction: ${txHash}`);
      setInvestmentAmount('');
      
      // Reload investment data and balance
      await loadInvestmentData();
      await loadBalance();
    } catch (error) {
      setTxResult(`Investment failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    const result = walletManager.disconnectWallet();
    setWalletState(result);
    router.push('/');
  };

  const artwork = contractManager.getSampleArtworks().find((art: { id: string }) => art.id === artworkId);
  
  if (!artwork) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Artwork Not Found</h1>
          <button 
            onClick={() => router.push('/main')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Gallery
          </button>
        </div>
      </div>
    );
  }

  const progressPercentage = investmentData 
    ? Math.min(Math.round((investmentData.totalInvested / artwork.financial.funding_goal) * 100), 100)
    : Math.min(Math.round((artwork.financial.current_funding / artwork.financial.funding_goal) * 100), 100);

  const totalInvested = investmentData?.totalInvested || artwork.financial.current_funding;
  const availableShares = Math.floor((artwork.financial.funding_goal - totalInvested) / artwork.financial.share_price);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <button 
                onClick={() => router.push('/main')}
                className="mr-4 p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <span className="text-xl">←</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-purple-900 flex items-center">
                  <span className="mr-2">🎨</span>
                  {artwork.name}
                </h1>
                <p className="text-purple-600 text-sm mt-1">
                  Connected: {walletState.publicKey?.slice(0, 8)}...{walletState.publicKey?.slice(-8)}
                </p>
                {walletState.balance !== undefined && (
                  <p className="text-green-600 text-sm font-semibold flex items-center mt-1">
                    <span className="mr-1">💰</span>
                    Balance: {parseFloat(walletState.balance).toFixed(2)} XLM
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Artwork Details */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="aspect-[4/3] bg-gradient-to-br from-orange-200 to-pink-200 rounded-xl mb-6 flex items-center justify-center">
              <div className="text-center">
                <span className="text-6xl">🖼️</span>
                <p className="text-sm text-gray-600 mt-2">{artwork.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Artwork Details</h2>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Artist:</span>
                    <p className="text-gray-600">{artwork.creator}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Medium:</span>
                    <p className="text-gray-600">{artwork.artwork_details.medium}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Dimensions:</span>
                    <p className="text-gray-600">{artwork.artwork_details.dimensions}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Created:</span>
                    <p className="text-gray-600">{artwork.artwork_details.year}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Condition:</span>
                    <p className="text-gray-600">{artwork.artwork_details.condition}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Provenance:</span>
                    <p className="text-gray-600">{artwork.artwork_details.provenance}</p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">Artist Bio</h3>
                  <p className="text-sm text-gray-600 mb-3">{artwork.creator_info.bio}</p>
                  <h4 className="font-semibold text-purple-800 mb-2">Certifications</h4>
                  <div className="flex flex-wrap gap-2">
                    {artwork.creator_info.certifications.map((cert: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-purple-200 text-purple-800 text-xs rounded-full">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Investment Panel */}
          <div className="space-y-6">
            {/* Investment Form */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <span className="mr-2">💰</span>
                Make Investment
              </h2>

              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold text-purple-900 mb-2 flex items-center">
                    <span className="mr-2">🎯</span>
                    Selected Artwork: {artwork.name}
                  </h3>
                  <p className="text-purple-700 text-sm">Artist: {artwork.creator}</p>
                  <p className="text-purple-700 text-sm mt-1">Share Price: {artwork.financial.share_price} XLM</p>
                  <p className="text-purple-700 text-sm">Available Shares: {availableShares}</p>
                </div>

                {/* Investment Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Investment Amount (XLM)
                  </label>
                  <input
                    type="number"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    placeholder="Enter amount in XLM"
                    min="1"
                    step="1"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum investment: 1 XLM
                  </p>
                </div>

                {/* Invest Button */}
                {investmentData?.isFullyFunded ? (
                  // Fully funded - Investment disabled
                  <div className="space-y-3">
                    <div className="w-full py-3 rounded-xl font-semibold text-white bg-green-600 flex items-center justify-center">
                      <span className="mr-2">🎉</span>
                      100% Funded - This is now for sale!
                    </div>
                    <p className="text-sm text-center text-gray-600">
                      This artwork has reached 100% funding and is now available for purchase.
                    </p>
                  </div>
                ) : (
                  // Investment still available
                  <button
                    onClick={handleInvest}
                    disabled={isLoading || !investmentAmount}
                    className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 ${
                      isLoading || !investmentAmount
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700 hover:shadow-lg transform hover:-translate-y-0.5'
                    }`}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Processing Investment...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <span className="mr-2">🚀</span>
                        Invest in Artwork
                      </div>
                    )}
                  </button>
                )}

                {/* Transaction Result */}
                {txResult && (
                  <div className={`p-4 rounded-lg ${
                    txResult.includes('successful') 
                      ? 'bg-green-50 border border-green-200 text-green-800' 
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}>
                    <div className="flex items-start">
                      <span className="mr-2 mt-0.5">
                        {txResult.includes('successful') ? '✅' : '❌'}
                      </span>
                      <p className="text-sm">{txResult}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Investment Status */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <span className="mr-2">📊</span>
                Investment Status
              </h2>

              {investmentData ? (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-800">
                        {totalInvested}
                      </div>
                      <div className="text-sm text-blue-600">Total Invested (XLM)</div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-800">
                        {progressPercentage}%
                      </div>
                      <div className="text-sm text-green-600">Funding Progress</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Funding Progress</span>
                      <span>{totalInvested} / {artwork.financial.funding_goal} XLM</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${progressPercentage}%` 
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Last Investor */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">Last Investor</h3>
                    <p className="text-sm text-gray-600 font-mono">
                      {investmentData.lastInvestor === 'None' ? 'No investors yet' : 
                       `${investmentData.lastInvestor.slice(0, 12)}...${investmentData.lastInvestor.slice(-12)}`}
                    </p>
                  </div>

                  {/* Funding Status */}
                  <div className={`p-4 rounded-lg ${
                    investmentData.isFullyFunded 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">
                        {investmentData.isFullyFunded ? '🎉' : '⏳'}
                      </span>
                      <div>
                        <h3 className={`font-semibold ${
                          investmentData.isFullyFunded ? 'text-green-800' : 'text-yellow-800'
                        }`}>
                          {investmentData.isFullyFunded ? 'Fully Funded!' : 'Funding in Progress'}
                        </h3>
                        <p className={`text-sm ${
                          investmentData.isFullyFunded ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {investmentData.isFullyFunded 
                            ? 'This artwork is ready for sale or auction'
                            : 'Investment opportunities still available'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📊</div>
                  <p>Loading investment data...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-purple-600">
          <p>🔗 Powered by Stellar Blockchain • 🧪 Testnet Environment</p>
        </div>
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function ArtworkDetailLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🎨</div>
        <p className="text-purple-600">Loading artwork details...</p>
      </div>
    </div>
  );
}

// Main export with Suspense wrapper
export default function ArtworkDetailPage() {
  return (
    <Suspense fallback={<ArtworkDetailLoading />}>
      <ArtworkDetailContent />
    </Suspense>
  );
}
