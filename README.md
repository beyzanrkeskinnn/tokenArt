# TokenArt - Blockchain Art Investment Platform

<div align="center">
  <h3>🎨 Fractional Art Investment on Stellar Blockchain</h3>
  <p>A decentralized platform for investing in and trading fractional ownership of premium artworks</p>
  
  ![Stellar](https://img.shields.io/badge/Stellar-Blockchain-blue)
  ![Next.js](https://img.shields.io/badge/Next.js-14-black)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
  ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC)
  ![Rust](https://img.shields.io/badge/Rust-Smart%20Contracts-orange)
</div>

## 🌟 Overview

TokenArt revolutionizes art investment by enabling fractional ownership of premium artworks through blockchain technology. Built on the Stellar network, our platform allows investors to purchase shares in valuable art pieces, democratizing access to high-value art markets.

### Key Features

- **🎯 Fractional Investment**: Invest in portions of expensive artworks with as little as 1 XLM
- **🏪 Marketplace Trading**: Trade artwork shares on a decentralized marketplace
- **💳 Freighter Wallet Integration**: Seamless blockchain transactions with Stellar wallets
- **📊 Real-time Analytics**: Track investment performance and funding progress
- **🔒 Blockchain Security**: All transactions secured on Stellar testnet
- **🎨 Curated Collection**: High-quality artworks from verified artists

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Freighter Wallet browser extension
- Stellar testnet account with XLM

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/tokenart.git
   cd tokenart
   ```

2. **Install dependencies**
   ```bash
   cd artwork-investment
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

### Smart Contract Setup

1. **Build the contract**
   ```bash
   cd artwork-contract
   cargo build --target wasm32-unknown-unknown --release
   ```

2. **Deploy to Stellar testnet**
   ```bash
   stellar contract deploy \
     --wasm target/wasm32-unknown-unknown/release/artwork_contract.wasm \
     --source your-account \
     --network testnet
   ```

## 🏗️ Architecture

### Frontend (`artwork-investment/`)
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Wallet Integration**: Freighter API
- **State Management**: React hooks with localStorage

### Smart Contract (`artwork-contract/`)
- **Language**: Rust with Soroban SDK
- **Blockchain**: Stellar Network
- **Functions**: Investment tracking, funding management

### Key Components

```
src/
├── app/                    # Next.js app router
│   ├── main/              # Main gallery page
│   ├── investment-detail/ # Individual artwork investment
│   ├── marketplace-detail/# Marketplace trading
│   └── page.tsx          # Landing page
├── lib/
│   ├── contract.ts       # Smart contract interactions
│   ├── wallet.ts         # Freighter wallet management
│   └── types.ts          # TypeScript definitions
```

## 🎨 Platform Features

### Investment Flow
1. **Connect Wallet**: Link your Freighter wallet
2. **Browse Artworks**: Explore curated art collection
3. **Invest**: Purchase fractional shares with XLM
4. **Track Progress**: Monitor funding and returns
5. **Trade**: Sell shares on the marketplace

### Artwork Categories
- **Investment Opportunities**: Artworks seeking funding
- **Marketplace**: Fully funded artworks available for trading
- **Satın Alınanlar**: Your personal investment portfolio

### Transaction Types
- **Fractional Investment**: Buy shares in artworks under funding
- **Full Purchase**: Acquire complete ownership of funded artworks
- **Marketplace Trading**: Trade shares with other investors

## 🔧 Technical Details

### Smart Contract Functions

```rust
// Record investment in artwork
pub fn invest(env: Env, artwork_id: Bytes, investor: Address, amount: u32)

// Get total investment amount
pub fn get_total_invested(env: Env, artwork_id: Bytes) -> u32

// Get last investor address
pub fn get_last_investor(env: Env, artwork_id: Bytes) -> Option<Address>

// Check if artwork is fully funded
pub fn is_fully_funded(env: Env, artwork_id: Bytes) -> bool
```

### Frontend API Integration

```typescript
// Investment management
class ContractManager {
  async investInArtwork(artworkId: string, amount: number): Promise<string>
  async getUserInvestments(userAddress: string): Promise<Investment[]>
  async getUserPurchases(userAddress: string): Promise<Purchase[]>
}

// Wallet connectivity
class WalletManager {
  async connectWallet(): Promise<WalletState>
  async signTransaction(xdr: string): Promise<string>
}
```

## 🛠️ Development

### Environment Setup

1. **Install Stellar CLI**
   ```bash
   cargo install --locked stellar-cli
   ```

2. **Configure testnet**
   ```bash
   stellar network add --global testnet \
     --rpc-url https://soroban-testnet.stellar.org:443 \
     --network-passphrase "Test SDF Network ; September 2015"
   ```

3. **Create test account**
   ```bash
   stellar keys generate --global alice --network testnet
   stellar keys fund alice --network testnet
   ```

### Testing

```bash
# Frontend tests
cd artwork-investment
npm test

# Smart contract tests
cd artwork-contract
cargo test
```

### Deployment

```bash
# Build for production
npm run build

# Deploy smart contract
stellar contract deploy --source alice --network testnet
```

## 📊 Sample Data

The platform includes curated sample artworks:

- **"Eternal Sunset"** by Marina Rodriguez - Oil on Canvas
- **"Digital Dreams"** by Alex Chen - Digital Mixed Media  
- **"Abstract Emotions"** by Sarah Williams - Acrylic Paint
- **"Modern Minimalism"** by David Kim - Sculpture
- **"Nature's Symphony"** by Emma Thompson - Watercolor
- **"Urban Landscapes"** by Michael Brown - Photography

## 🔐 Security

- **Smart Contract Auditing**: Rust-based contracts with Soroban security features
- **Wallet Integration**: Secure transaction signing with Freighter
- **Network Security**: Protected by Stellar's consensus mechanism
- **Input Validation**: Comprehensive validation on all user inputs

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Team

This project was developed by:

- **Ayşegül Kervan** - Lead Developer & Smart Contract Architecture
- **Beyzanur Keskin** - Frontend Development & UI/UX Design  
- **Merve Altınışık** - Blockchain Integration & Testing

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌐 Links

- **Live Demo**: [https://tokenart-demo.vercel.app](https://tokenart-demo.vercel.app)
- **Smart Contract**: [Stellar Expert](https://stellar.expert/explorer/testnet)
- **Documentation**: [Wiki](https://github.com/your-username/tokenart/wiki)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/tokenart/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/tokenart/discussions)
- **Email**: support@tokenart.com

## 🚨 Disclaimer

This is a testnet demonstration project. Do not use real funds. All transactions are performed on Stellar testnet with test XLM tokens.

## 🔧 Troubleshooting

### Common Transaction Issues

**Transaction Timeout Errors:**
- **Problem**: "Transaction timeout" or "txTooLate" errors
- **Solution**: The application now automatically retries failed transactions. If the issue persists, wait 10-30 seconds and try again.

**Insufficient Balance:**
- **Problem**: "Insufficient balance" error
- **Solution**: Ensure your testnet account has enough XLM for the transaction plus fees (minimum 0.1 XLM extra for fees).

**Account Not Found:**
- **Problem**: "Account not found" error  
- **Solution**: Your testnet account needs to be funded. Get test XLM from the Stellar testnet faucet.

**Wallet Connection Issues:**
- **Problem**: "Wallet not connected" error
- **Solution**: Ensure Freighter extension is installed and connected to the Stellar testnet.

### Getting Test XLM

1. Install Freighter wallet extension
2. Switch to "Testnet" network in Freighter
3. Copy your testnet public key
4. Visit [Stellar Laboratory](https://laboratory.stellar.org/#account-creator) to fund your account
5. Or use the Stellar CLI: `stellar keys fund your-key --network testnet`

### Performance Tips

- **Network Busy**: If transactions are slow, the testnet might be busy. The application will automatically retry.
- **Multiple Investments**: Wait for each transaction to complete before starting the next one.
- **Browser Issues**: Clear browser cache if you experience persistent wallet connection issues.

---

<div align="center">
  <p>Built with ❤️ for the future of art investment</p>
  <p>Powered by <a href="https://stellar.org">Stellar Blockchain</a></p>
</div>
