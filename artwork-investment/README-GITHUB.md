# 🎨 TokenArt - Blockchain Art Investment Platform

A decentralized platform for investing in and trading digital art assets using Stellar blockchain technology.

![TokenArt Platform](https://img.shields.io/badge/Platform-Stellar-blue)
![Framework](https://img.shields.io/badge/Framework-Next.js-black)
![Wallet](https://img.shields.io/badge/Wallet-Freighter-purple)

## 🚀 Features

- **🔗 Freighter Wallet Integration**: Connect your Stellar wallet seamlessly
- **💰 Real XLM Transactions**: Actual blockchain transactions for investments
- **🖼️ Art Gallery**: Browse curated digital artworks
- **📈 Investment Tracking**: Monitor your art investment portfolio
- **🛒 Marketplace**: Purchase fully funded artworks
- **🔍 Balance Fetching**: Real-time XLM balance display from testnet

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Blockchain**: Stellar SDK, Horizon API
- **Wallet**: Freighter Wallet Integration
- **Network**: Stellar Testnet

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/tokenart-investment.git
   cd tokenart-investment
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🧪 Testing Setup

### Prerequisites

1. **Install Freighter Wallet**
   - Add [Freighter Extension](https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk) to Chrome
   - Create or import a testnet account
   - Switch to **Testnet** network

2. **Fund Your Test Account**
   - Visit [Stellar Friendbot](https://friendbot.stellar.org)
   - Paste your wallet address
   - Click "Fund Account" to receive 10,000 test XLM

### Testing Commands

Open browser console (F12) and use these debug commands:

```javascript
// Quick wallet and balance test
TokenArtDebug.quickTest()

// Test specific address balance
simpleBalanceTest("GABCD...XYZ")

// Auto-fund account if needed
fundAccount("GABCD...XYZ")

// Get current Freighter address
TokenArtDebug.getCurrentAddress()
```

## 🎯 How It Works

### Investment Flow

1. **Connect Wallet**: Link your Freighter wallet
2. **Browse Gallery**: Explore available artworks
3. **Invest XLM**: Make real blockchain transactions
4. **Track Progress**: Monitor funding progress
5. **Purchase Art**: Buy fully funded pieces

### Real Blockchain Integration

- **Payment Operations**: Actual XLM transfers to treasury
- **Transaction Signing**: Freighter wallet signatures
- **Network Submission**: Stellar testnet transactions
- **Balance Updates**: Real-time wallet balance changes

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Wallet connection page
│   ├── main/              # Main gallery interface
│   └── artwork/           # Individual artwork details
├── lib/
│   ├── wallet.ts          # Freighter wallet integration
│   ├── contract.ts        # Blockchain transaction logic
│   ├── simple-balance.ts  # Direct API balance fetching
│   └── types.ts           # TypeScript definitions
└── utils/
    └── debug.js           # Development testing utilities
```

## 🔧 Key Components

### Wallet Manager
- Freighter wallet connection
- XLM balance fetching with fallbacks
- Transaction signing and submission

### Contract Manager
- Real investment transactions
- Treasury payment operations
- Investment tracking and history

### Balance Fetching
- Multiple fallback methods
- Direct Horizon API calls
- Stellar SDK integration
- Network connectivity testing

## 🐛 Debugging

### Common Issues

**Balance shows 0:**
- Ensure Freighter is on Testnet (not Mainnet)
- Fund account via [Friendbot](https://friendbot.stellar.org)
- Use console: `fundAccount(address)`

**Connection fails:**
- Check Freighter installation
- Verify testnet network selection
- Refresh page and retry

**Transaction errors:**
- Verify sufficient XLM balance
- Check network connectivity
- Try with lower amounts

### Debug Tools

The platform includes comprehensive debugging utilities:

- **Balance Testing**: Direct API balance verification
- **Network Testing**: Connectivity diagnostics
- **Wallet Testing**: Connection and address validation
- **Auto Funding**: Automated testnet account funding

## 📊 Features Overview

### Gallery Interface
- 4-tab navigation (Gallery, Investments, Sales, Purchases)
- Visual funding progress indicators
- 100% funded artwork highlighting
- Investment and purchase tracking

### Real Transactions
- Stellar blockchain integration
- XLM payment operations
- Transaction hash tracking
- Network fee handling

### Balance Management
- Real-time balance display
- Multiple fetching strategies
- Error handling and fallbacks
- Auto-refresh capabilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- [Stellar Documentation](https://developers.stellar.org/)
- [Freighter Wallet](https://freighter.app/)
- [Stellar Testnet](https://horizon-testnet.stellar.org/)
- [Friendbot (Testnet Funding)](https://friendbot.stellar.org/)

## 🎨 About TokenArt

TokenArt democratizes art investment by enabling fractional ownership of digital artworks through blockchain technology. Our platform combines the beauty of art with the innovation of decentralized finance, creating new opportunities for both artists and investors.

---

**Built with ❤️ using Stellar Blockchain**
