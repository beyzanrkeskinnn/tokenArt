// Debug utilities for TokenArt development
// This file can be imported in browser console for testing

// Export wallet manager to global scope for testing
if (typeof window !== 'undefined') {
  // Debug utilities
  window.TokenArtDebug = {
    
    // Test wallet connection
    async testWalletConnection() {
      console.log('🔧 Testing wallet connection...');
      const { WalletManager } = await import('../lib/wallet');
      const manager = WalletManager.getInstance();
      
      const isInstalled = await manager.isFreighterInstalled();
      console.log('📱 Freighter installed:', isInstalled);
      
      if (isInstalled) {
        const connection = await manager.connectWallet();
        console.log('🔗 Connection result:', connection);
        return connection;
      }
      return { error: 'Freighter not installed' };
    },
    
    // Test balance fetching with detailed debug
    async testBalance(address) {
      console.log('💰 Testing balance for:', address);
      
      if (!address) {
        console.log('❌ No address provided, getting from Freighter...');
        const addrResult = await this.getCurrentAddress();
        if (addrResult.error) {
          console.log('❌ Failed to get address:', addrResult.error);
          return { error: 'No address available' };
        }
        address = addrResult.address;
      }
      
      const { WalletManager } = await import('../lib/wallet');
      const manager = WalletManager.getInstance();
      
      console.log('🔍 Starting detailed balance test for:', address);
      
      // Test 1: Direct Horizon API call
      console.log('📡 Test 1: Direct API call to Horizon');
      try {
        const directResponse = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`);
        console.log('📡 Direct API response status:', directResponse.status);
        
        if (directResponse.ok) {
          const accountData = await directResponse.json();
          console.log('📡 Direct API account data available');
          console.log('📡 Direct API balances count:', accountData.balances.length);
          
          const nativeBalance = accountData.balances.find(b => b.asset_type === 'native');
          console.log('📡 Direct API native balance:', nativeBalance ? nativeBalance.balance + ' XLM' : 'Not found');
        } else {
          console.log('📡 Direct API failed:', directResponse.statusText);
        }
      } catch (error) {
        console.error('📡 Direct API error:', error);
      }
      
      // Test 2: Use WalletManager
      console.log('🔧 Test 2: Using WalletManager');
      const balance = await manager.getBalance(address);
      console.log('🔧 WalletManager result:', balance);
      
      return balance;
    },
    
    // Get current address from Freighter
    async getCurrentAddress() {
      console.log('🔍 Getting current address from Freighter...');
      try {
        const { getAddress } = await import('@stellar/freighter-api');
        const result = await getAddress();
        console.log('📍 Current address result:', result);
        return result;
      } catch (error) {
        console.error('❌ Failed to get current address:', error);
        return { error: error.message };
      }
    },
    
    // Get test account from Friendbot
    async fundTestAccount(address) {
      console.log('🏦 Funding test account:', address);
      
      if (!address) {
        console.log('❌ No address provided');
        return { error: 'No address provided' };
      }
      
      try {
        console.log('🏦 Calling Friendbot API...');
        const response = await fetch(`https://friendbot.stellar.org?addr=${address}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        console.log('🏦 Friendbot response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Funding successful:', result);
          
          // Wait a moment then test balance
          console.log('⏳ Waiting 3 seconds for network...');
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          const balanceTest = await this.testBalance(address);
          console.log('🔍 Balance after funding:', balanceTest);
          
          return { success: true, result, balanceTest };
        } else {
          const errorText = await response.text();
          console.log('❌ Friendbot failed:', errorText);
          return { error: `Friendbot failed: ${response.status} - ${errorText}` };
        }
      } catch (error) {
        console.error('❌ Funding failed:', error);
        return { error: error.message };
      }
    },
    
    // Complete wallet test flow
    async fullWalletTest() {
      console.log('🧪 Starting full wallet test...');
      
      // Step 1: Get current address
      const addressResult = await this.getCurrentAddress();
      if (addressResult.error) {
        console.log('❌ Test failed at address fetch:', addressResult.error);
        return { error: addressResult.error };
      }
      
      const address = addressResult.address;
      console.log('📍 Testing with address:', address);
      
      // Step 2: Test current balance
      const balanceResult = await this.testBalance(address);
      console.log('💰 Initial balance:', balanceResult);
      
      // Step 3: If balance is 0 or error, suggest funding
      if (balanceResult.native === '0' || balanceResult.error) {
        console.log('💡 Account needs funding. Use: TokenArtDebug.fundTestAccount("' + address + '")');
        return { 
          address, 
          balance: balanceResult, 
          suggestion: 'Fund account with Friendbot' 
        };
      }
      
      console.log('✅ Full wallet test completed successfully');
      return { address, balance: balanceResult, status: 'success' };
    },
    
    // Test network connectivity
    async testNetwork() {
      console.log('🌐 Testing network connectivity...');
      
      const tests = [
        { name: 'Horizon Testnet', url: 'https://horizon-testnet.stellar.org' },
        { name: 'Friendbot', url: 'https://friendbot.stellar.org' },
        { name: 'Google DNS', url: 'https://8.8.8.8' }
      ];
      
      const results = {};
      
      for (const test of tests) {
        try {
          const start = Date.now();
          const response = await fetch(test.url, { 
            method: 'HEAD',
            mode: 'no-cors'
          });
          const duration = Date.now() - start;
          
          results[test.name] = {
            status: 'success',
            duration: duration + 'ms'
          };
          console.log(`✅ ${test.name}: OK (${duration}ms)`);
        } catch (error) {
          results[test.name] = {
            status: 'failed',
            error: error.message
          };
          console.log(`❌ ${test.name}: FAILED - ${error.message}`);
        }
      }
      
      return results;
    },
    
    // Reset localStorage
    resetWallet() {
      localStorage.removeItem('wallet_connected');
      localStorage.removeItem('public_key');
      localStorage.removeItem('user_investments');
      localStorage.removeItem('user_purchases');
      console.log('🔄 Wallet data reset');
      window.location.reload();
    },
    
    // Show quick help
    help() {
      console.log(`
🚀 TokenArt Debug Commands:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 Basic Commands:
  TokenArtDebug.help()                        - Show this help
  TokenArtDebug.getCurrentAddress()           - Get Freighter address
  TokenArtDebug.testBalance(address)          - Test balance fetch
  TokenArtDebug.fullWalletTest()              - Complete test flow
  
🏦 Account Management:
  TokenArtDebug.fundTestAccount(address)      - Fund with Friendbot
  TokenArtDebug.resetWallet()                 - Clear all data
  
🌐 Network Testing:
  TokenArtDebug.testNetwork()                 - Test connectivity
  
🧪 Quick Test:
  TokenArtDebug.quickTest()                   - Auto test current wallet

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    },
    
    // Quick test for current wallet
    async quickTest() {
      console.log('⚡ Quick test starting...');
      
      const addressResult = await this.getCurrentAddress();
      if (addressResult.error) {
        console.log('❌ No wallet connected');
        return;
      }
      
      const address = addressResult.address;
      console.log('📍 Address:', address);
      
      const balance = await this.testBalance(address);
      console.log('💰 Balance:', balance);
      
      if (balance.native === '0' || balance.error) {
        console.log('💡 Need funding? Run: TokenArtDebug.fundTestAccount("' + address + '")');
      }
      
      return { address, balance };
    }
  };
  
  // Show help on load
  console.log('🚀 TokenArt Debug utilities loaded! Type TokenArtDebug.help() for commands');
}

export default {};
