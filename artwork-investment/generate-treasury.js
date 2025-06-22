const { Keypair } = require('@stellar/stellar-sdk');

// Generate a new keypair for treasury
const treasuryKeypair = Keypair.random();

console.log('=== TREASURY WALLET GENERATED ===');
console.log('Public Key (Address):', treasuryKeypair.publicKey());
console.log('Secret Key:', treasuryKeypair.secret());
console.log('');
console.log('⚠️  IMPORTANT: Save the secret key securely!');
console.log('⚠️  This is your treasury wallet that will receive all investments.');
console.log('');
console.log('Copy the Public Key to use as TREASURY_ADDRESS in contract.ts');