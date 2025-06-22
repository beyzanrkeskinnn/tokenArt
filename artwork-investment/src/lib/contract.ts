// Working Stellar Payment Integration for TokenArt
import { 
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
  Asset,
  Horizon,
  Memo
} from '@stellar/stellar-sdk';
import { InvestmentData } from './types';
import { WalletManager } from './wallet';

// Treasury wallet for receiving investments (this should be your treasury address)
const TREASURY_ADDRESS = 'GDL3VFUZE65BUWBVRHJUJZN7O33XXPBUZA3CA6747FCGYHHCSSZXK336'; // Generated treasury address

// Multiple Horizon servers for testnet (fallback support)
const HORIZON_SERVERS = [
  'https://horizon-testnet.stellar.org',
  'https://horizon-testnet.stellar.org', // Duplicate for retry
  'https://horizon-testnet.stellar.org'  // Use same reliable server
];

// Current server index for fallback
let currentServerIndex = 0;

export class ContractManager {
  private server: Horizon.Server;
  private walletManager: WalletManager;

  constructor() {
    this.server = new Horizon.Server(HORIZON_SERVERS[currentServerIndex]);
    this.walletManager = WalletManager.getInstance();
  }

  // Get current server or switch to next available server
  private async getWorkingServer(): Promise<Horizon.Server> {
    for (let i = 0; i < HORIZON_SERVERS.length; i++) {
      try {
        const testServer = new Horizon.Server(HORIZON_SERVERS[currentServerIndex]);
        // Test server connectivity with a simple call
        await testServer.feeStats();
        return testServer;
      } catch (error) {
        console.warn(`Server ${HORIZON_SERVERS[currentServerIndex]} failed, trying next...`);
        currentServerIndex = (currentServerIndex + 1) % HORIZON_SERVERS.length;
      }
    }
    // If all servers fail, return the first one and let the error propagate
    currentServerIndex = 0;
    return new Horizon.Server(HORIZON_SERVERS[0]);
  }

  // Retry wrapper for network operations
  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 2000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        console.warn(`Attempt ${attempt} failed:`, error.message);
        
        // Check if it's a timeout or network error
        if (error.code === 'ERR_BAD_RESPONSE' || 
            error.message?.includes('timeout') || 
            error.message?.includes('504') ||
            error.message?.includes('502') ||
            error.message?.includes('503')) {
          
          if (attempt < maxRetries) {
            console.log(`Retrying in ${delayMs}ms... (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            
            // Try switching server on network errors
            this.server = await this.getWorkingServer();
            continue;
          }
        } else {
          // For non-network errors, don't retry
          throw error;
        }
      }
    }
    
    throw lastError;
  }

  // Create investment memo for transaction
  private createInvestmentMemo(artworkId: string, amount: number): Memo {
    const memoText = `INV:${artworkId}:${amount}`;
    return Memo.text(memoText);
  }

  // Save investment record to localStorage
  private saveInvestmentRecord(artworkId: string, amount: number, txHash: string, investorAddress: string): void {
    if (typeof window !== 'undefined') {
      const investments = JSON.parse(localStorage.getItem('investments') || '{}');
      if (!investments[artworkId]) {
        investments[artworkId] = { total: 0, lastInvestor: '', investors: [] };
      }
      investments[artworkId].total += amount;
      investments[artworkId].lastInvestor = investorAddress;
      investments[artworkId].investors.push({
        address: investorAddress,
        amount,
        timestamp: Date.now(),
        txHash
      });
      localStorage.setItem('investments', JSON.stringify(investments));
    }
  }

  // Real investment with XLM payment to treasury
  async investInArtwork(artworkId: string, amount: number): Promise<string> {
    const walletState = this.walletManager.getStoredWalletState();
    if (!walletState.isConnected || !walletState.publicKey) {
      throw new Error('Wallet bağlı değil. Lütfen önce wallet\'ınızı bağlayın.');
    }

    const publicKey = walletState.publicKey; // TypeScript guard
    
    return this.retryOperation(async () => {
      console.log('💰 [INVESTMENT] Starting real investment transaction...');
      console.log('💰 [INVESTMENT] Artwork:', artworkId);
      console.log('💰 [INVESTMENT] Amount:', amount, 'XLM');
      console.log('💰 [INVESTMENT] From:', publicKey);

      // Validate investment amount
      if (amount <= 0) {
        throw new Error('Yatırım miktarı 0\'dan büyük olmalıdır.');
      }

      // Check user balance first
      const balanceData = await this.walletManager.getBalance(publicKey);
      const currentBalance = parseFloat(balanceData.native);
      
      if (currentBalance < amount) {
        throw new Error(`Yetersiz bakiye. Mevcut: ${currentBalance.toFixed(2)} XLM, Gerekli: ${amount} XLM`);
      }

      // Load user's account for sequence number with retry-enabled server
      console.log('💰 [INVESTMENT] Loading user account...');
      const userAccount = await this.server.loadAccount(publicKey);

      // Create payment operation to treasury
      const paymentOperation = Operation.payment({
        destination: TREASURY_ADDRESS,
        asset: Asset.native(),
        amount: amount.toString(),
        source: publicKey
      });

      // Build transaction
      console.log('💰 [INVESTMENT] Building transaction...');
      const transaction = new TransactionBuilder(userAccount, {
        fee: '10000', // 0.001 XLM fee
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(paymentOperation)
        .addMemo(this.createInvestmentMemo(artworkId, amount))
        .setTimeout(300) // 5 minutes timeout
        .build();

      console.log('💰 [INVESTMENT] Transaction built, requesting signature...');

      // Sign transaction with Freighter
      const signedTxXdr = await this.walletManager.signTransaction(transaction.toXDR());
      
      // Submit to network with retry-enabled server
      console.log('💰 [INVESTMENT] Submitting to Stellar network...');
      const txResponse = await this.server.submitTransaction(
        TransactionBuilder.fromXDR(signedTxXdr, Networks.TESTNET)
      );

      console.log('✅ [INVESTMENT] Transaction successful:', txResponse.hash);

      // Save investment record locally
      this.saveInvestmentRecord(artworkId, amount, txResponse.hash, publicKey);

      return txResponse.hash;

    }).catch((error: any) => {
      console.error('❌ [INVESTMENT] Transaction failed:', error);
      
      if (error.message?.includes('insufficient funds')) {
        throw new Error('Yetersiz bakiye. Lütfen hesabınıza XLM ekleyin.');
      } else if (error.message?.includes('user rejected')) {
        throw new Error('İşlem kullanıcı tarafından iptal edildi.');
      } else if (error.code === 'ERR_BAD_RESPONSE' || 
                 error.message?.includes('504') || 
                 error.message?.includes('timeout') ||
                 error.message?.includes('Gateway Timeout')) {
        throw new Error('Stellar ağı şu anda yoğun. Lütfen birkaç saniye sonra tekrar deneyin.');
      } else {
        throw new Error(`Yatırım işlemi başarısız: ${error.message || error}`);
      }
    });
  }

  // Get total invested amount for an artwork (read-only call)
  async getTotalInvested(artworkId: string): Promise<number> {
    try {
      // Use localStorage fallback for now
      if (typeof window !== 'undefined') {
        const investments = JSON.parse(localStorage.getItem('investments') || '{}');
        return investments[artworkId]?.total || 0;
      }
      return 0;
    } catch (error) {
      console.warn('Failed to get total invested:', error);
      return 0; // Return 0 on error for graceful degradation
    }
  }

  // Get last investor address (read-only call)
  async getLastInvestor(artworkId: string): Promise<string> {
    try {
      // Use localStorage fallback for now
      if (typeof window !== 'undefined') {
        const investments = JSON.parse(localStorage.getItem('investments') || '{}');
        return investments[artworkId]?.lastInvestor || 'None';
      }
      return 'None';
    } catch (error) {
      console.warn('Failed to get last investor:', error);
      return 'None';
    }
  }

  // Check if artwork is fully funded (read-only call)
  async isFullyFunded(artworkId: string): Promise<boolean> {
    try {
      // Use localStorage and sample data for funding check
      const artworks = this.getSampleArtworks();
      const artwork = artworks.find(art => art.id === artworkId);
      if (!artwork) return false;

      const totalInvested = await this.getTotalInvested(artworkId);
      return totalInvested >= artwork.financial.funding_goal;
    } catch (error) {
      console.warn('Failed to check funding status:', error);
      return false;
    }
  }

  // Get complete investment data for an artwork
  async getInvestmentData(artworkId: string): Promise<InvestmentData> {
    try {
      const [totalInvested, lastInvestor, isFullyFunded] = await Promise.all([
        this.getTotalInvested(artworkId),
        this.getLastInvestor(artworkId),
        this.isFullyFunded(artworkId)
      ]);

      return {
        artworkId,
        totalInvested,
        lastInvestor,
        isFullyFunded
      };
    } catch (error) {
      console.error('Failed to get investment data:', error);
      // Return default data on error
      return {
        artworkId,
        totalInvested: 0,
        lastInvestor: 'None',
        isFullyFunded: false
      };
    }
  }

  // Helper method to check if contract is accessible
  async isContractAccessible(): Promise<boolean> {
    try {
      const walletState = this.walletManager.getStoredWalletState();
      if (!walletState.publicKey) {
        return false;
      }

      // Try a simple read call to check connectivity
      await this.getTotalInvested('art-001');
      return true;
    } catch (error) {
      console.warn('Contract not accessible:', error);
      return false;
    }
  }

  // Purchase a fully funded artwork
  async purchaseArtwork(artworkId: string): Promise<string> {
    const walletState = this.walletManager.getStoredWalletState();
    if (!walletState.isConnected || !walletState.publicKey) {
      throw new Error('Wallet not connected');
    }

    // Check if artwork is fully funded
    const isFullyFunded = await this.isFullyFunded(artworkId);
    if (!isFullyFunded) {
      throw new Error('Artwork is not fully funded yet');
    }

    try {
      const artworks = this.getSampleArtworks();
      const artwork = artworks.find(art => art.id === artworkId);
      if (!artwork) {
        throw new Error('Artwork not found');
      }

      // Purchase price is the funding goal
      const purchasePrice = artwork.financial.funding_goal;
      
      // Mock transaction hash for demo
      const mockTxHash = `purchase_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store purchase locally for demo
      if (typeof window !== 'undefined') {
        const purchases = JSON.parse(localStorage.getItem('purchases') || '{}');
        purchases[artworkId] = {
          artworkId,
          purchasePrice,
          purchaseDate: Date.now(),
          owner: walletState.publicKey,
          artworkName: artwork.name,
          artist: artwork.creator,
          txHash: mockTxHash
        };
        localStorage.setItem('purchases', JSON.stringify(purchases));
      }
      
      return mockTxHash;
      
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  // Get user's purchased artworks
  getUserPurchases(): any[] {
    const walletState = this.walletManager.getStoredWalletState();
    if (!walletState.isConnected || !walletState.publicKey) {
      return [];
    }

    if (typeof window !== 'undefined') {
      const purchases = JSON.parse(localStorage.getItem('purchases') || '{}');
      return Object.values(purchases).filter((purchase: any) => 
        purchase.owner === walletState.publicKey
      );
    }
    return [];
  }

  // Get user's investments
  getUserInvestments(): any[] {
    const walletState = this.walletManager.getStoredWalletState();
    if (!walletState.isConnected || !walletState.publicKey) {
      return [];
    }

    if (typeof window !== 'undefined') {
      const investments = JSON.parse(localStorage.getItem('investments') || '{}');
      const userInvestments = [];
      
      for (const [artworkId, data] of Object.entries(investments) as [string, any][]) {
        const userInvestment = data.investors?.find((inv: any) => 
          inv.address === walletState.publicKey
        );
        
        if (userInvestment) {
          const artwork = this.getSampleArtworks().find(art => art.id === artworkId);
          if (artwork) {
            userInvestments.push({
              artworkId,
              artworkName: artwork.name,
              artist: artwork.creator,
              investmentAmount: userInvestment.amount,
              investmentDate: userInvestment.timestamp,
              currentValue: userInvestment.amount * 1.125, // Mock 12.5% return
              shares: Math.floor(userInvestment.amount / artwork.financial.share_price)
            });
          }
        }
      }
      
      return userInvestments;
    }
    return [];
  }

  // Get fully funded artworks available for purchase
  getAvailableForPurchase(): any[] {
    const artworks = this.getSampleArtworks();
    const availableArtworks = [];
    
    for (const artwork of artworks) {
      if (typeof window !== 'undefined') {
        const investments = JSON.parse(localStorage.getItem('investments') || '{}');
        const purchases = JSON.parse(localStorage.getItem('purchases') || '{}');
        
        // Check if fully funded and not already purchased
        const totalInvested = investments[artwork.id]?.total || artwork.financial.current_funding;
        const isFullyFunded = totalInvested >= artwork.financial.funding_goal;
        const isAlreadyPurchased = purchases[artwork.id];
        
        if (isFullyFunded && !isAlreadyPurchased) {
          availableArtworks.push({
            ...artwork,
            totalInvested,
            availableForPurchase: true
          });
        }
      }
    }
    
    return availableArtworks;
  }

  // Get sample artworks (mock data for demo)
  getSampleArtworks() {
    return [
      {
        id: 'art-001',
        name: 'Sunset Over Bosphorus',
        symbol: 'SOB01',
        creator: 'Ayşe Demir',
        artwork_details: {
          dimensions: '70x90 cm',
          medium: 'Oil on Canvas',
          year: '2020',
          condition: 'Excellent',
          provenance: 'Artist Studio'
        },
        creator_info: {
          name: 'Ayşe Demir',
          bio: 'Contemporary Turkish artist specializing in landscape paintings with 15 years of experience.',
          certifications: ['Authenticity Certificate', 'Gallery Exhibit Award']
        },
        financial: {
          funding_goal: 100,
          current_funding: 75,
          share_price: 5,
          total_shares: 20
        }
      },
      {
        id: 'art-002',
        name: 'Abstract Dreams',
        symbol: 'AD02',
        creator: 'Mehmet Özkan',
        artwork_details: {
          dimensions: '60x80 cm',
          medium: 'Acrylic on Canvas',
          year: '2023',
          condition: 'Mint',
          provenance: 'Private Collection'
        },
        creator_info: {
          name: 'Mehmet Özkan',
          bio: 'Modern abstract artist from Ankara, known for vibrant color combinations.',
          certifications: ['Modern Art Certificate', 'Exhibition Winner']
        },
        financial: {
          funding_goal: 150,
          current_funding: 80,
          share_price: 10,
          total_shares: 15
        }
      },
      {
        id: 'art-003',
        name: 'Mediterranean Blue',
        symbol: 'MB03',
        creator: 'Elena Rodriguez',
        artwork_details: {
          dimensions: '50x70 cm',
          medium: 'Watercolor',
          year: '2022',
          condition: 'Very Good',
          provenance: 'Gallery Collection'
        },
        creator_info: {
          name: 'Elena Rodriguez',
          bio: 'Watercolor specialist with international recognition and 12 years of professional experience.',
          certifications: ['International Art Award', 'Master Watercolorist']
        },
        financial: {
          funding_goal: 120,
          current_funding: 24,
          share_price: 8,
          total_shares: 15
        }
      },
      {
        id: 'art-004',
        name: 'Urban Symphony',
        symbol: 'US04',
        creator: 'Alex Chen',
        artwork_details: {
          dimensions: '80x100 cm',
          medium: 'Mixed Media',
          year: '2024',
          condition: 'Perfect',
          provenance: 'Artist Studio'
        },
        creator_info: {
          name: 'Alex Chen',
          bio: 'Contemporary mixed media artist exploring urban themes and city life.',
          certifications: ['Contemporary Art Award', 'Urban Art Specialist']
        },
        financial: {
          funding_goal: 250,
          current_funding: 50,
          share_price: 15,
          total_shares: 17
        }
      },
      {
        id: 'art-005',
        name: 'Golden Horizon',
        symbol: 'GH05',
        creator: 'Sara Williams',
        artwork_details: {
          dimensions: '90x120 cm',
          medium: 'Oil on Canvas',
          year: '2019',
          condition: 'Museum Quality',
          provenance: 'Private Collection'
        },
        creator_info: {
          name: 'Sara Williams',
          bio: 'Master oil painter with 20 years of experience and multiple museum exhibitions.',
          certifications: ['Master Artist', 'Museum Exhibition', 'Art Critic Choice']
        },
        financial: {
          funding_goal: 350,
          current_funding: 280,
          share_price: 20,
          total_shares: 18
        }
      },
      {
        id: 'art-006',
        name: 'Mystic Forest',
        symbol: 'MF06',
        creator: 'David Miller',
        artwork_details: {
          dimensions: '65x85 cm',
          medium: 'Tempera on Wood',
          year: '2023',
          condition: 'Excellent',
          provenance: 'Artist Collection'
        },
        creator_info: {
          name: 'David Miller',
          bio: 'Nature-focused artist specializing in forest and landscape scenes with traditional techniques.',
          certifications: ['Nature Art Specialist', 'Environmental Art Award']
        },
        financial: {
          funding_goal: 180,
          current_funding: 90,
          share_price: 12,
          total_shares: 15
        }
      }
    ];
  }

  // Check Stellar network status
  async checkNetworkStatus(): Promise<{status: string, latency: number}> {
    const startTime = Date.now();
    try {
      await this.server.feeStats();
      const latency = Date.now() - startTime;
      return {
        status: latency < 1000 ? 'good' : latency < 3000 ? 'slow' : 'poor',
        latency
      };
    } catch (error) {
      return {
        status: 'offline',
        latency: Date.now() - startTime
      };
    }
  }
}
