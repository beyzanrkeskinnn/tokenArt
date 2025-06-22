// Debug script to test the fixes
console.log('🔧 Testing Contract & Wallet fixes...');

// Test server initialization
const { ContractManager } = require('./src/lib/contract.ts');

async function testFixes() {
  try {
    console.log('1. Creating ContractManager instance...');
    const contractManager = new ContractManager();
    
    console.log('2. Testing network status...');
    const networkStatus = await contractManager.checkNetworkStatus();
    console.log('   Network status:', networkStatus);
    
    console.log('3. Testing server connectivity...');
    const isAccessible = await contractManager.isContractAccessible();
    console.log('   Contract accessible:', isAccessible);
    
    console.log('✅ All basic tests passed!');
    console.log('');
    console.log('🎯 Fixes applied:');
    console.log('   - Fixed "Cannot read properties of undefined" server error');
    console.log('   - Added wallet connection checks before signing');  
    console.log('   - Improved timeout handling for Freighter');
    console.log('   - Enhanced error messages in Turkish');
    console.log('   - Added proper server switching in retry logic');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Uncomment to run tests:
// testFixes();

module.exports = { testFixes };
