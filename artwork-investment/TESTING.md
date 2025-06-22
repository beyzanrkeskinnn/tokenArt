# TokenArt Testing Guide

## 🚀 Quick Start Testing

### 1. Install Freighter Wallet
1. Go to [Chrome Web Store](https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk)
2. Add Freighter to Chrome
3. Pin the extension to your toolbar

### 2. Setup Testnet Account
1. Open Freighter extension
2. Create a new wallet OR import existing wallet
3. Switch to **Testnet** network in Freighter settings
4. Copy your wallet address

### 3. Fund Your Test Account
1. Visit [Stellar Friendbot](https://friendbot.stellar.org)
2. Paste your wallet address
3. Click "Fund Account" to get 10,000 test XLM
4. Wait 5-10 seconds for transaction to complete

### 4. Test TokenArt
1. Open TokenArt at `http://localhost:3005`
2. Click "Connect Freighter Wallet"
3. Approve connection in Freighter popup
4. Your balance should appear automatically
5. Click "Enter Gallery" to explore features

## 📊 Expected Behavior

### Wallet Connection
- ✅ Balance should show: `10000.00 XLM` (if funded with Friendbot)
- ✅ Address should display: `GABCD...XYZ` format
- ✅ Connection should persist on page refresh

### Gallery Features
- ✅ View artwork collection
- ✅ See investment progress bars
- ✅ Identify fully funded artworks (green rings)
- ✅ Purchase available artworks
- ✅ Track investments and purchases in tabs

## 🐛 Troubleshooting

### Wallet Not Connecting
1. Ensure Freighter is installed and unlocked
2. Check if you're on Testnet (not Mainnet)
3. Try refreshing the page
4. Check browser console for errors (F12)

### Balance Shows "0" or "--"
1. Verify account is funded via Friendbot
2. Wait 30 seconds and click "Refresh" button
3. Check if you're on correct network (Testnet)
4. Ensure account exists on Stellar network

### Console Debugging
Open browser console (F12) and look for:
- 🔍 "Fetching balance for address: ..."
- ✅ "Balance found: ... XLM"
- ❌ Any error messages

## 🔧 Development Testing

### Test Account Creation
```javascript
// In browser console, test wallet functions:
const walletManager = window.walletManager || new WalletManager();
await walletManager.getBalance('YOUR_ADDRESS_HERE');
```

### Manual Balance Check
Visit: `https://horizon-testnet.stellar.org/accounts/YOUR_ADDRESS_HERE`

### Sample Test Addresses
These are example testnet addresses (DO NOT USE IN PRODUCTION):
- `GABC123...` - Use your own generated address
- Fund via Friendbot, do not share private keys

## 📝 Test Scenarios

### Basic Wallet Flow
1. ✅ Connect wallet
2. ✅ View balance
3. ✅ Navigate to gallery
4. ✅ Browse artworks
5. ✅ Make test investment
6. ✅ Check investment tab

### Investment Flow
1. ✅ Find artwork with < 100% funding
2. ✅ Click "Invest Now"
3. ✅ Enter investment amount
4. ✅ Confirm transaction
5. ✅ See updated progress
6. ✅ View in "Investments" tab

### Purchase Flow
1. ✅ Find artwork with 100% funding (green ring)
2. ✅ Click "Purchase"
3. ✅ Confirm transaction
4. ✅ See in "Purchases" tab
5. ✅ Verify it's removed from "Sales" tab

## 🎯 Success Metrics

- [ ] Wallet connects successfully
- [ ] Balance loads and displays correctly
- [ ] All navigation works smoothly
- [ ] Investments are tracked properly
- [ ] Purchases work for 100% funded art
- [ ] Data persists across sessions
- [ ] No critical console errors

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Look at browser console errors
3. Verify testnet setup
4. Try with a fresh wallet/account
