const { Keypair } = require('@stellar/stellar-sdk');

// Treasury details from generate-treasury.js
const TREASURY_PUBLIC_KEY = 'GDL3VFUZE65BUWBVRHJUJZN7O33XXPBUZA3CA6747FCGYHHCSSZXK336';
const TREASURY_SECRET_KEY = 'SC6OM2KZ6BPXTCIKH3BYA2UEXGJPDKSWLUAJQWVOQOODXTMLYDMDU6LJ';

console.log('🏦 TokenArt Treasury Funding Guide');
console.log('=================================\n');

console.log('📋 Treasury Details:');
console.log('Public Key:', TREASURY_PUBLIC_KEY);
console.log('Secret Key:', TREASURY_SECRET_KEY);
console.log('');

console.log('💰 How to Fund Treasury on Stellar Testnet:');
console.log('');
console.log('1. Visit Stellar Laboratory:');
console.log('   https://laboratory.stellar.org/#account-creator?network=test');
console.log('');
console.log('2. Create Account:');
console.log(`   - Enter Public Key: ${TREASURY_PUBLIC_KEY}`);
console.log('   - Click "Create Account"');
console.log('');
console.log('3. Alternative - Use Friendbot:');
console.log('   curl -X POST \\');
console.log(`     "https://friendbot.stellar.org/?addr=${TREASURY_PUBLIC_KEY}"`);
console.log('');
console.log('4. Verify Account Created:');
console.log('   https://laboratory.stellar.org/#explorer?resource=accounts&endpoint=single&values=eyJhY2NvdW50X2lkIjoiIn0%3D&network=test');
console.log('');

// Verify keypair matches
try {
  const keypair = Keypair.fromSecret(TREASURY_SECRET_KEY);
  if (keypair.publicKey() === TREASURY_PUBLIC_KEY) {
    console.log('✅ Treasury keypair verified - keys match correctly');
  } else {
    console.log('❌ ERROR: Treasury keys do not match!');
  }
} catch (error) {
  console.log('❌ ERROR: Invalid treasury secret key');
}

console.log('');
console.log('⚠️  SECURITY NOTE:');
console.log('   - This is a TESTNET treasury for development only');
console.log('   - Never use these keys on MAINNET');
console.log('   - For production, generate new keys securely');
console.log('');
console.log('🎯 After funding, your investment transactions should work!');
