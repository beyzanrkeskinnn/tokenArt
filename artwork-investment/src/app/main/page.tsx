'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WalletManager } from '@/lib/wallet';
import { ContractManager } from '@/lib/contract';
import { WalletState } from '@/lib/types';

export default function MainPage() {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    publicKey: null
  });
  
  const [activeTab, setActiveTab] = useState<'gallery' | 'investments' | 'sales' | 'purchases'>('gallery');
  const [userInvestments, setUserInvestments] = useState<Array<{ artworkId: string; artworkName: string; artist: string; investmentAmount: number; investmentDate: string; currentValue: number; shares: number }>>([]);
  const [userSales, setUserSales] = useState<Array<{ artworkId: string; artworkName: string; artist: string; investmentAmount: number; saleDate: string; currentValue: number; shares: number; isFullyFunded: boolean }>>([]);
  const [userPurchases, setUserPurchases] = useState<Array<{ owner: string; artworkId: string; shares: number; investmentAmount: number; timestamp: string; txHash: string; artworkName: string; artist: string; purchasePrice: number; purchaseDate: number }>>([]);
  const [availableForPurchase, setAvailableForPurchase] = useState<Array<{ id: string; name: string; symbol: string; creator: string; financial: { funding_goal: number; current_funding: number; share_price: number; total_shares: number }; totalInvested: number; availableForPurchase: boolean }>>([]);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  
  const router = useRouter();
  const walletManager = WalletManager.getInstance();
  const contractManager = new ContractManager();

  useEffect(() => {
    // Check wallet connection
    const storedState = walletManager.getStoredWalletState();
    if (!storedState.isConnected) {
      router.push('/');
      return;
    }
    setWalletState(storedState);
    
    // Load user data
    loadUserData();
    
    // Load balance
    loadBalance();
  }, [router, walletManager]);

  const loadBalance = async () => {
    const storedState = walletManager.getStoredWalletState();
    if (storedState.publicKey) {
      setIsLoadingBalance(true);
      console.log('🔄 [MAIN] Loading balance for:', storedState.publicKey);
      
      try {
        // First try with wallet manager
        const balanceData = await walletManager.getBalance(storedState.publicKey);
        console.log('📊 [MAIN] Balance data received:', balanceData);
        
        if (balanceData.error) {
          console.warn('⚠️ [MAIN] Balance fetch returned error:', balanceData.error);
          
          // Try simple direct API call as fallback
          console.log('🔄 [MAIN] Trying direct API call as fallback...');
          try {
            const directResult = await testDirectBalance(storedState.publicKey);
            if (directResult !== null) {
              console.log('✅ [MAIN] Direct API call succeeded:', directResult);
              setWalletState(prev => ({
                ...prev,
                balance: directResult.toString(),
                error: null
              }));
              return;
            }
          } catch (directError) {
            console.warn('⚠️ [MAIN] Direct API call also failed:', directError);
          }
          
          setWalletState(prev => ({
            ...prev,
            balance: balanceData.native,
            error: balanceData.error
          }));
        } else {
          setWalletState(prev => ({
            ...prev,
            balance: balanceData.native,
            error: null
          }));
        }
      } catch (error) {
        console.error('❌ [MAIN] Balance loading failed:', error);
        setWalletState(prev => ({
          ...prev,
          balance: '0',
          error: `Balance loading failed: ${error}`
        }));
      } finally {
        setIsLoadingBalance(false);
      }
    }
  };

  // Direct balance test function
  const testDirectBalance = async (address: string): Promise<number | null> => {
    try {
      console.log('📡 [DIRECT] Testing direct API call to:', address);
      const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('📡 [DIRECT] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        const nativeBalance = data.balances.find((b: { asset_type: string; balance: string }) => b.asset_type === 'native');
        const balance = nativeBalance ? parseFloat(nativeBalance.balance) : 0;
        console.log('💰 [DIRECT] Direct balance found:', balance);
        return balance;
      } else if (response.status === 404) {
        console.log('🔍 [DIRECT] Account not found (needs funding)');
        return 0;
      } else {
        console.log('❌ [DIRECT] API error:', response.status);
        return null;
      }
    } catch (error) {
      console.error('❌ [DIRECT] Direct API call failed:', error);
      return null;
    }
  };

  const loadUserData = () => {
    const investments = contractManager.getUserInvestments();
    const sales = contractManager.getUserSales();
    const purchases = contractManager.getUserPurchases();
    const available = contractManager.getAvailableForPurchase();
    
    setUserInvestments(investments);
    setUserSales(sales);
    setUserPurchases(purchases);
    setAvailableForPurchase(available);
  };

  const handlePurchaseArtwork = async (artworkId: string) => {
    try {
      const txHash = await contractManager.purchaseArtwork(artworkId);
      alert(`Purchase successful! Transaction: ${txHash}`);
      loadUserData(); // Refresh data
      await loadBalance(); // Refresh balance
    } catch (error) {
      alert(`Purchase failed: ${error}`);
    }
  };

  const handleDisconnect = () => {
    const result = walletManager.disconnectWallet();
    setWalletState(result);
    router.push('/');
  };

  const artworks = contractManager.getSampleArtworks();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-purple-900 flex items-center">
                <span className="mr-2">🎨</span>
                TokenArt Gallery
              </h1>
              <p className="text-purple-600 text-sm mt-1">
                Connected: {walletState.publicKey?.slice(0, 12)}...{walletState.publicKey?.slice(-12)}
              </p>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                Full: {walletState.publicKey}
              </p>
              {isLoadingBalance ? (
                <p className="text-blue-600 text-sm font-semibold flex items-center mt-1">
                  <span className="mr-1">⏳</span>
                  Loading balance...
                </p>
              ) : walletState.balance !== undefined ? (
                <div className="mt-1">
                  <p className="text-green-600 text-sm font-semibold flex items-center">
                    <span className="mr-1">💰</span>
                    Balance: {parseFloat(walletState.balance).toFixed(2)} XLM
                  </p>
                  {walletState.error && (
                    <p className="text-orange-600 text-xs mt-1 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {walletState.error}
                    </p>
                  )}
                  {parseFloat(walletState.balance) === 0 && (
                    <div className="text-blue-600 text-xs mt-1">
                      <p>💡 Need testnet XLM? Visit{' '}
                        <a 
                          href="https://friendbot.stellar.org" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="underline font-semibold"
                        >
                          friendbot.stellar.org
                        </a>
                      </p>
                      <button
                        onClick={async () => {
                          if (walletState.publicKey && (window as { fundAccount?: (publicKey: string) => Promise<void> }).fundAccount) {
                            console.log('🏦 Auto-funding account...');
                            await ((window as unknown) as { fundAccount: (publicKey: string) => Promise<void> }).fundAccount(walletState.publicKey);
                            setTimeout(() => loadBalance(), 3000);
                          }
                        }}
                        className="mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors"
                      >
                        🏦 Auto Fund Account
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm flex items-center mt-1">
                  <span className="mr-1">💰</span>
                  Balance: --
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={loadBalance}
                disabled={isLoadingBalance}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md transition-colors disabled:opacity-50"
              >
                {isLoadingBalance ? '⏳' : '🔄'} Refresh
              </button>
              <button
                onClick={() => {
                  console.log('🔧 [DEBUG] Current wallet state:', walletState);
                  console.log('🔧 [DEBUG] Stored state:', walletManager.getStoredWalletState());
                  if (walletState.publicKey && (window as { simpleBalanceTest?: (publicKey: string) => void }).simpleBalanceTest) {
                    console.log('🔧 [DEBUG] Running simple balance test...');
                    ((window as unknown) as { simpleBalanceTest: (publicKey: string) => void }).simpleBalanceTest(walletState.publicKey);
                  }
                }}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
              >
                🐛 Debug
              </button>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'gallery'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">🖼️</span>
              Gallery
            </button>
            <button
              onClick={() => setActiveTab('investments')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'investments'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">💰</span>
              My Investments
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'sales'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">📈</span>
              My Sales
            </button>
            <button
              onClick={() => setActiveTab('purchases')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'purchases'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">🛒</span>
              My Purchases
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'gallery' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
              <span className="mr-3">🖼️</span>
              Artwork Gallery
            </h2>
            <p className="text-gray-600 mb-6">
              Discover and invest in premium artworks. Click on any piece to view details and make an investment.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {artworks.map(artwork => {
                const investments = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('investments') || '{}') : {};
                const totalInvested = investments[artwork.id]?.total || artwork.financial.current_funding;
                const rawProgressPercentage = (totalInvested / artwork.financial.funding_goal) * 100;
                const progressPercentage = Math.min(Math.round(rawProgressPercentage), 100); // Cap at 100%
                const isFullyFunded = rawProgressPercentage >= 100;
                
                return (
                  <div 
                    key={artwork.id}
                    onClick={() => router.push(`/artwork?id=${artwork.id}`)}
                    className={`cursor-pointer transition-all duration-300 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transform hover:-translate-y-1 bg-white hover:bg-gray-50 ${
                      isFullyFunded ? 'ring-2 ring-green-300' : ''
                    }`}
                  >
                    {/* Artwork Image Placeholder */}
                    <div className="h-48 bg-gradient-to-br from-purple-200 via-pink-200 to-yellow-200 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                      <div className="text-6xl opacity-80">🎨</div>
                      <div className="absolute top-3 right-3">
                        <span className={`text-white text-xs px-2 py-1 rounded-full flex items-center ${
                          isFullyFunded ? 'bg-green-500' : 'bg-green-500'
                        }`}>
                          {isFullyFunded ? '🎉 Available for Purchase' : '✅ Verified'}
                        </span>
                      </div>
                      {isFullyFunded && (
                        <div className="absolute bottom-3 left-3">
                          <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                            100% Funded
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Artwork Info */}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-900 text-lg">{artwork.name}</h3>
                        <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded">
                          {artwork.symbol || artwork.id.toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 flex items-center">
                        <span className="mr-1">👨‍🎨</span>
                        {artwork.creator_info.name || artwork.creator}
                      </p>
                      
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-700">
                          <strong>Medium:</strong> {artwork.artwork_details.medium}
                        </p>
                        <p className="text-gray-700">
                          <strong>Size:</strong> {artwork.artwork_details.dimensions}
                        </p>
                      </div>
                      
                      {/* Funding Progress */}
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Funding Progress</span>
                          <span>{progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              isFullyFunded 
                                ? 'bg-gradient-to-r from-green-500 to-green-600' 
                                : 'bg-gradient-to-r from-purple-500 to-pink-500'
                            }`}
                            style={{ 
                              width: `${progressPercentage}%` 
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{totalInvested} XLM raised</span>
                          <span>{artwork.financial.funding_goal} XLM goal</span>
                        </div>
                      </div>
                      
                      {/* Investment Details */}
                      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600">Share Price</p>
                          <p className="font-bold text-purple-700">{artwork.financial.share_price} XLM</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total Shares</p>
                          <p className="font-bold text-gray-800">{artwork.financial.total_shares}</p>
                        </div>
                      </div>
                      
                      {/* Call to Action */}
                      <div className="mt-4 text-center">
                        <span className={`inline-flex items-center text-sm font-medium transition-colors ${
                          isFullyFunded 
                            ? 'text-green-600 hover:text-green-800' 
                            : 'text-purple-600 hover:text-purple-800'
                        }`}>
                          <span className="mr-1">{isFullyFunded ? '🛒' : '👆'}</span>
                          {isFullyFunded ? 'Available for Purchase!' : 'Click to View Details & Invest'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Investments Tab */}
        {activeTab === 'investments' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
              <span className="mr-3">💰</span>
              My Investments
            </h2>
            <p className="text-gray-600 mb-6">
              View your invested artworks and earnings.
            </p>
            
            {userInvestments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userInvestments.map((investment) => {
                  const returnPercentage = ((investment.currentValue - investment.investmentAmount) / investment.investmentAmount * 100).toFixed(1);
                  const isPositive = parseFloat(returnPercentage) >= 0;
                  
                  return (
                    <div key={investment.artworkId} className="bg-white rounded-2xl shadow-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">{investment.artworkName}</h3>
                        <span className={`text-sm px-2 py-1 rounded ${
                          isPositive 
                            ? 'text-green-600 bg-green-100' 
                            : 'text-red-600 bg-red-100'
                        }`}>
                          {isPositive ? '+' : ''}{returnPercentage}%
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Investment Amount:</span>
                          <span className="font-semibold">{investment.investmentAmount} XLM</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Current Value:</span>
                          <span className={`font-semibold ${
                            isPositive ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {investment.currentValue.toFixed(2)} XLM
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Shares Owned:</span>
                          <span className="font-semibold">{investment.shares} shares</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Investment Date:</span>
                          <span className="text-sm text-gray-500">
                            {new Date(investment.investmentDate).toLocaleDateString('en-US')}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => router.push(`/artwork?id=${investment.artworkId}`)}
                            className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-purple-700 transition-colors"
                          >
                            View Details
                          </button>
                          <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                            Sell
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-gray-600 mb-2">No Investments Yet</h3>
                <p className="text-sm text-gray-500 mb-4">Start by investing in artworks you like from the Gallery</p>
                <button 
                  onClick={() => setActiveTab('gallery')}
                  className="bg-purple-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-purple-700 transition-colors"
                >
                  Go to Gallery
                </button>
              </div>
            )}

            {/* Investment Summary */}
            {userInvestments.length > 0 && (
              <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Investment Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {userInvestments.reduce((sum, inv) => sum + inv.investmentAmount, 0)} XLM
                    </div>
                    <div className="text-sm text-blue-600">Total Investment</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {userInvestments.reduce((sum, inv) => sum + inv.currentValue, 0).toFixed(2)} XLM
                    </div>
                    <div className="text-sm text-green-600">Current Value</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      +{(userInvestments.reduce((sum, inv) => sum + inv.currentValue, 0) - 
                         userInvestments.reduce((sum, inv) => sum + inv.investmentAmount, 0)).toFixed(2)} XLM
                    </div>
                    <div className="text-sm text-purple-600">Net Profit</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      +{(((userInvestments.reduce((sum, inv) => sum + inv.currentValue, 0) - 
                           userInvestments.reduce((sum, inv) => sum + inv.investmentAmount, 0)) / 
                         userInvestments.reduce((sum, inv) => sum + inv.investmentAmount, 0)) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-yellow-600">Total Return</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
              <span className="mr-3">📈</span>
              My Sales
            </h2>
            <p className="text-gray-600 mb-6">
              Fully funded artworks ready for sale. Your investments are now profitable!
            </p>
            
            {userSales.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userSales.map((sale) => {
                  const returnPercentage = ((sale.currentValue - sale.investmentAmount) / sale.investmentAmount * 100).toFixed(1);
                  const isPositive = parseFloat(returnPercentage) >= 0;
                  
                  return (
                    <div key={sale.artworkId} className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">{sale.artworkName}</h3>
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          🎉 100% Funded
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">Artist: {sale.artist}</p>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Your Investment:</span>
                          <span className="font-semibold">{sale.investmentAmount} XLM</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Current Value:</span>
                          <span className={`font-semibold ${
                            isPositive ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {sale.currentValue.toFixed(2)} XLM
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Potential Return:</span>
                          <span className={`font-semibold ${
                            isPositive ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {isPositive ? '+' : ''}{returnPercentage}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Your Shares:</span>
                          <span className="font-semibold">{sale.shares} shares</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Investment Date:</span>
                          <span className="text-sm text-gray-500">
                            {new Date(sale.saleDate).toLocaleDateString('en-US')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => router.push(`/artwork?id=${sale.artworkId}`)}
                            className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-purple-700 transition-colors"
                          >
                            View Details
                          </button>
                          <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-green-700 transition-colors">
                            Sell Shares
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="text-4xl mb-4">📈</div>
                <h3 className="text-gray-600 mb-2">No Sales Available Yet</h3>
                <p className="text-sm text-gray-500 mb-4">Artworks become available for sale when they reach 100% funding</p>
                <button 
                  onClick={() => setActiveTab('gallery')}
                  className="bg-purple-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-purple-700 transition-colors"
                >
                  Go to Gallery
                </button>
              </div>
            )}

            {/* Sales Summary */}
            {userSales.length > 0 && (
              <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Sales Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {userSales.reduce((sum, sale) => sum + sale.currentValue, 0).toFixed(2)} XLM
                    </div>
                    <div className="text-sm text-green-600">Total Sale Value</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{userSales.length}</div>
                    <div className="text-sm text-blue-600">Artworks Ready</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      +{(userSales.reduce((sum, sale) => sum + sale.currentValue, 0) - 
                         userSales.reduce((sum, sale) => sum + sale.investmentAmount, 0)).toFixed(2)} XLM
                    </div>
                    <div className="text-sm text-purple-600">Potential Profit</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      +{(((userSales.reduce((sum, sale) => sum + sale.currentValue, 0) - 
                           userSales.reduce((sum, sale) => sum + sale.investmentAmount, 0)) / 
                         userSales.reduce((sum, sale) => sum + sale.investmentAmount, 0)) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-yellow-600">Average Return</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Purchases Tab */}
        {activeTab === 'purchases' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
              <span className="mr-3">🛒</span>
              My Purchases
            </h2>
            <p className="text-gray-600 mb-6">
              Artworks you completely purchased and own.
            </p>

            {/* Available for Purchase Section */}
            {availableForPurchase.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">🎯</span>
                  Available for Purchase (100% Funded)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {availableForPurchase.map(artwork => (
                    <div key={artwork.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-green-200">
                      <div className="h-48 bg-gradient-to-br from-green-200 to-emerald-200 flex items-center justify-center relative">
                        <span className="text-6xl">🖼️</span>
                        <div className="absolute top-3 right-3">
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                            ✅ Available for Purchase
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-gray-900 text-lg mb-2">{artwork.name}</h4>
                        <p className="text-gray-600 text-sm mb-3">{artwork.creator}</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Purchase Price:</span>
                            <span className="font-semibold text-green-600">{artwork.financial.funding_goal} XLM</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Funded Amount:</span>
                            <span className="font-semibold">{artwork.totalInvested} XLM</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className="font-semibold text-green-600">100% Funded</span>
                          </div>
                        </div>
                        <div className="mt-4">
                          <button 
                            onClick={() => handlePurchaseArtwork(artwork.id)}
                            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-green-700 transition-colors"
                          >
                            🛒 Purchase
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Owned Artworks Section */}
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">🏆</span>
              Artworks I Own
            </h3>
            
            {userPurchases.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userPurchases.map(purchase => (
                  <div key={purchase.artworkId} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="h-48 bg-gradient-to-br from-purple-200 to-blue-200 flex items-center justify-center">
                      <span className="text-6xl">🖼️</span>
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-gray-900 text-lg mb-2">{purchase.artworkName}</h4>
                      <p className="text-gray-600 text-sm mb-3">{purchase.artist}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Purchase Price:</span>
                          <span className="font-semibold">{purchase.investmentAmount} XLM</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ownership Date:</span>
                          <span className="text-gray-500">
                            {new Date(purchase.timestamp).toLocaleDateString('en-US')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Current Value:</span>
                          <span className="font-semibold text-green-600">
                            {(purchase.investmentAmount * 1.2).toFixed(0)} XLM
                          </span>
                        </div>
                      </div>                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex space-x-2">
                            <button className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-purple-700 transition-colors">
                              View Details
                            </button>
                            <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                              Sell
                            </button>
                          </div>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !availableForPurchase.length && (
                <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center text-center">
                  <div className="text-4xl mb-4">🎨</div>
                  <h3 className="text-gray-600 mb-2">No Artworks Purchased Yet</h3>
                  <p className="text-sm text-gray-500 mb-4">100% funded artworks will become available for purchase</p>
                  <button 
                    onClick={() => setActiveTab('gallery')}
                    className="bg-purple-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-purple-700 transition-colors"
                  >
                    Go to Gallery
                  </button>
                </div>
              )
            )}

            {/* Purchase Summary */}
            {userPurchases.length > 0 && (
              <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Purchase Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{userPurchases.length}</div>
                    <div className="text-sm text-blue-600">Owned Artworks</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {userPurchases.reduce((sum, purchase) => sum + purchase.investmentAmount, 0)} XLM
                    </div>
                    <div className="text-sm text-green-600">Total Spent</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {userPurchases.reduce((sum, purchase) => sum + (purchase.investmentAmount * 1.2), 0).toFixed(0)} XLM
                    </div>
                    <div className="text-sm text-purple-600">Current Value</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-purple-600">
          <p>🔗 Powered by Stellar Blockchain • 🧪 Testnet Environment</p>
        </div>
      </div>
    </div>
  );
}
