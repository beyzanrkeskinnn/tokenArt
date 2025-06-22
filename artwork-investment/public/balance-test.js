// Enhanced balance test functions for browser console
window.simpleBalanceTest = async function(address) {
  console.log('🔧 [SIMPLE TEST] Starting balance test for:', address);
  
  if (!address) {
    console.log('❌ [SIMPLE TEST] No address provided');
    return;
  }
  
  try {
    console.log('📡 [SIMPLE TEST] Calling Horizon API directly...');
    const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log('📡 [SIMPLE TEST] Response status:', response.status);
    
    if (response.ok) {
      const accountData = await response.json();
      console.log('✅ [SIMPLE TEST] Account data received');
      
      const nativeBalance = accountData.balances?.find(b => b.asset_type === 'native');
      console.log('💰 [SIMPLE TEST] Native balance object:', nativeBalance);
      
      if (nativeBalance) {
        console.log(`✅ [SIMPLE TEST] SUCCESS: ${nativeBalance.balance} XLM found!`);
        return parseFloat(nativeBalance.balance);
      } else {
        console.log('❌ [SIMPLE TEST] No native balance found');
        return 0;
      }
    } else if (response.status === 404) {
      console.log('🔍 [SIMPLE TEST] Account not found (404) - needs funding');
      console.log('💡 [SIMPLE TEST] Fund account at: https://friendbot.stellar.org');
      return 0;
    } else {
      console.log('❌ [SIMPLE TEST] API error:', response.status, response.statusText);
      return null;
    }
  } catch (error) {
    console.error('❌ [SIMPLE TEST] Network error:', error);
    return null;
  }
};

// Quick Friendbot funding
window.fundAccount = async function(address) {
  if (!address) {
    console.log('❌ No address provided');
    return;
  }
  
  console.log('🏦 [FUNDING] Funding account:', address);
  
  try {
    const response = await fetch(`https://friendbot.stellar.org?addr=${address}`, {
      method: 'GET'
    });
    
    console.log('🏦 [FUNDING] Friendbot response:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ [FUNDING] Account funded successfully!', result);
      
      // Test balance after 3 seconds
      setTimeout(() => {
        console.log('🔄 [FUNDING] Testing balance after funding...');
        window.simpleBalanceTest(address);
      }, 3000);
      
      return result;
    } else {
      const errorText = await response.text();
      console.log('❌ [FUNDING] Funding failed:', errorText);
      return null;
    }
  } catch (error) {
    console.error('❌ [FUNDING] Funding error:', error);
    return null;
  }
};

console.log('🔧 Enhanced test functions loaded:');
console.log('  simpleBalanceTest(address) - Test balance directly');
console.log('  fundAccount(address) - Fund account with Friendbot');
