// Working Stellar Payment Integration for TokenArt
import { 
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
    this.validateTreasuryAddress();
  }

  // Get current server or switch to next available server
  private async getWorkingServer(): Promise<Horizon.Server> {
    for (let i = 0; i < HORIZON_SERVERS.length; i++) {
      try {
        const testServer = new Horizon.Server(HORIZON_SERVERS[currentServerIndex]);
        // Test server connectivity with a simple call
        await testServer.feeStats();
        return testServer;
      } catch {
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
    let lastError: Error = new Error('Operation failed');
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt} failed:`, lastError.message);
        
        // Check if it's a timeout or network error
        const errorObj = error as Record<string, unknown>;
        if (errorObj.code === 'ERR_BAD_RESPONSE' || 
            (lastError.message && (
              lastError.message.includes('timeout') || 
              lastError.message.includes('504') ||
              lastError.message.includes('502') ||
              lastError.message.includes('503') ||
              lastError.message.includes('Cannot read properties of undefined')
            ))) {
          
          if (attempt < maxRetries) {
            console.log(`Retrying in ${delayMs}ms... (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            
            // Try switching server on network errors
            try {
              this.server = await this.getWorkingServer();
              console.log('🔄 Switched to new server for retry');
            } catch {
              console.warn('Failed to get working server, using fallback');
              this.server = new Horizon.Server(HORIZON_SERVERS[0]);
            }
            continue;
          }
        } else {
          // For non-network errors, don't retry
          throw lastError;
        }
      }
    }
    
    throw lastError;
  }

  // Create investment memo for transaction
  private createInvestmentMemo(artworkId: string, amount: number): Memo {
    // Keep memo under 28 bytes for Stellar compatibility
    const shortArtworkId = artworkId.replace('art-', '').slice(0, 8);
    const memoText = `INV:${shortArtworkId}:${amount}`;
    
    // Ensure memo doesn't exceed 28 bytes
    if (memoText.length > 28) {
      const truncatedMemo = `INV:${shortArtworkId}:${Math.floor(amount)}`;
      console.warn('⚠️  Memo truncated to fit 28-byte limit:', truncatedMemo);
      return Memo.text(truncatedMemo.slice(0, 28));
    }
    
    console.log('📝 Investment memo:', memoText);
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
    
    try {
      return await this.retryOperation(async () => {
        console.log('💰 [INVESTMENT] Starting real investment transaction...');
        console.log('💰 [INVESTMENT] Artwork:', artworkId);
        console.log('💰 [INVESTMENT] Amount:', amount, 'XLM');
        console.log('💰 [INVESTMENT] From:', publicKey);

        // Validate investment amount
        if (amount <= 0) {
          throw new Error('Yatırım miktarı 0\'dan büyük olmalıdır.');
        }
        
        // Validate amount precision (Stellar supports up to 7 decimal places)
        if (amount.toString().split('.')[1]?.length > 7) {
          throw new Error('Tutar çok fazla ondalık basamak içeriyor. Maksimum 7 ondalık basamak desteklenir.');
        }

        // Ensure server is ready and working
        await this.ensureServerReady();
        const workingServer = this.server;

        // Check user balance first
        const balanceData = await this.walletManager.getBalance(publicKey);
        const currentBalance = parseFloat(balanceData.native);
        
        if (currentBalance < amount) {
          throw new Error(`Yetersiz bakiye. Mevcut: ${currentBalance.toFixed(2)} XLM, Gerekli: ${amount} XLM`);
        }

        // Load user's account for sequence number with retry-enabled server
        console.log('💰 [INVESTMENT] Loading user account...');
        const userAccount = await workingServer.loadAccount(publicKey);
        console.log('📊 Account sequence:', userAccount.sequence);

        // Create payment operation to treasury
        const paymentOperation = Operation.payment({
          destination: TREASURY_ADDRESS,
          asset: Asset.native(),
          amount: amount.toFixed(7), // Ensure proper decimal formatting
          source: publicKey
        });

        // Build transaction with proper fee calculation
        console.log('💰 [INVESTMENT] Building transaction...');
        const baseFee = await workingServer.fetchBaseFee();
        console.log('💰 Base fee:', baseFee);
        
        const transaction = new TransactionBuilder(userAccount, {
          fee: Math.max(baseFee * 100, 10000).toString(), // Use dynamic fee or minimum 0.001 XLM
          networkPassphrase: Networks.TESTNET,
        })
          .addOperation(paymentOperation)
          .addMemo(this.createInvestmentMemo(artworkId, amount))
          .setTimeout(300) // 5 minutes timeout
          .build();

        console.log('💰 [INVESTMENT] Transaction built, requesting signature...');
        console.log('📋 Transaction XDR preview:', transaction.toXDR().slice(0, 100) + '...');

        // Sign transaction with Freighter
        const signedTxXdr = await this.walletManager.signTransaction(transaction.toXDR());
        
        // Submit to network with retry-enabled server
        console.log('💰 [INVESTMENT] Submitting to Stellar network...');
        console.log('📋 Signed transaction XDR preview:', signedTxXdr.slice(0, 100) + '...');
        const txResponse = await workingServer.submitTransaction(
          TransactionBuilder.fromXDR(signedTxXdr, Networks.TESTNET)
        );

        console.log('✅ [INVESTMENT] Transaction successful:', txResponse.hash);

        // Save investment record locally
        this.saveInvestmentRecord(artworkId, amount, txResponse.hash, publicKey);

        return txResponse.hash;
      });
    } catch (error: unknown) {
      console.error('❌ [INVESTMENT] Transaction failed:', error);
      
      const errorObj = error as Record<string, unknown>;
      const errorMessage = (error as Error).message || 'Unknown error';
      
      // Log detailed error information for debugging
      if (errorObj.response && typeof errorObj.response === 'object') {
        const response = errorObj.response as Record<string, unknown>;
        if (response.data) {
          console.error('📋 Detailed error data:', response.data);
        }
        if (response.status) {
          console.error('📊 HTTP Status:', response.status);
        }
      }
      
      if (errorMessage.includes('insufficient funds')) {
        throw new Error('Yetersiz bakiye. Lütfen hesabınıza XLM ekleyin.');
      } else if (errorMessage.includes('user rejected') || errorMessage.includes('rejected')) {
        throw new Error('İşlem kullanıcı tarafından iptal edildi.');
      } else if (errorMessage.includes('Wallet connection lost') || errorMessage.includes('message channel closed')) {
        throw new Error('Wallet bağlantısı kesildi. Lütfen sayfayı yenileyin ve tekrar deneyin.');
      } else if (errorMessage.includes('timeout')) {
        throw new Error('İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.');
      } else if (errorObj.response && typeof errorObj.response === 'object') {
        const response = errorObj.response as Record<string, unknown>;
        if (response.status === 400) {
          // Handle 400 Bad Request errors specifically
          const responseData = response.data as Record<string, unknown>;
          const errorDetails = responseData?.extras as Record<string, unknown>;
          const resultCodes = errorDetails?.result_codes as Record<string, unknown>;
          
          if (resultCodes) {
            console.error('🚨 Transaction error codes:', resultCodes);
            if (resultCodes.transaction === 'tx_bad_seq') {
              throw new Error('Hesap sıra numarası hatası. Lütfen tekrar deneyin.');
            } else if (resultCodes.transaction === 'tx_insufficient_balance') {
              throw new Error('Yetersiz bakiye. Minimum 1.5 XLM gereklidir.');
            } else if (Array.isArray(resultCodes.operations) && resultCodes.operations.includes('op_underfunded')) {
              throw new Error('İşlem için yetersiz bakiye.');
            } else {
              throw new Error(`İşlem hatası: ${resultCodes.transaction || 'Bilinmeyen hata'}`);
            }
          } else {
            throw new Error('Geçersiz işlem. Lütfen bilgileri kontrol edin ve tekrar deneyin.');
          }
        }
      } 
      
      if (errorObj.code === 'ERR_BAD_RESPONSE' || 
          errorMessage.includes('504') || 
          errorMessage.includes('Gateway Timeout')) {
        throw new Error('Stellar ağı şu anda yoğun. Lütfen birkaç saniye sonra tekrar deneyin.');
      } else if (errorMessage.includes('Cannot read properties of undefined')) {
        throw new Error('Bağlantı hatası. Lütfen sayfayı yenileyin ve tekrar deneyin.');
      } else {
        throw new Error(`Yatırım işlemi başarısız: ${errorMessage}`);
      }
    }
  }

  // Validate treasury address format
  private validateTreasuryAddress(): void {
    if (!TREASURY_ADDRESS || TREASURY_ADDRESS.length !== 56 || !TREASURY_ADDRESS.startsWith('G')) {
      throw new Error('Invalid treasury address configuration');
    }
    console.log('✅ Treasury address validated:', TREASURY_ADDRESS.slice(0, 8) + '...');
  }

  // Verify server is ready for operations
  private async ensureServerReady(): Promise<void> {
    try {
      if (!this.server) {
        console.log('🔄 Server not initialized, getting working server...');
        this.server = await this.getWorkingServer();
      }
      
      // Quick connectivity test
      await this.server.feeStats();
    } catch {
      console.warn('⚠️  Current server not ready, switching...');
      this.server = await this.getWorkingServer();
    }
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
          investmentAmount: purchasePrice, // Also store as investmentAmount for compatibility
          timestamp: Date.now().toString(), // Also store as timestamp for compatibility
          owner: walletState.publicKey,
          artworkName: artwork.name,
          artist: artwork.creator,
          txHash: mockTxHash,
          shares: artwork.financial.total_shares // Add shares for completeness
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
  getUserPurchases(): Array<{ owner: string; artworkId: string; shares: number; investmentAmount: number; timestamp: string; txHash: string; artworkName: string; artist: string; purchasePrice: number; purchaseDate: number }> {
    const walletState = this.walletManager.getStoredWalletState();
    if (!walletState.isConnected || !walletState.publicKey) {
      return [];
    }

    if (typeof window !== 'undefined') {
      const purchases = JSON.parse(localStorage.getItem('purchases') || '{}');
      return (Object.values(purchases) as Array<{ owner: string; artworkId: string; shares: number; investmentAmount: number; timestamp: string; txHash: string; artworkName: string; artist: string; purchasePrice: number; purchaseDate: number }>)
        .filter(purchase => purchase.owner === walletState.publicKey);
    }
    return [];
  }

  // Get user's investments
  getUserInvestments(): Array<{ artworkId: string; artworkName: string; artist: string; investmentAmount: number; investmentDate: string; currentValue: number; shares: number }> {
    const walletState = this.walletManager.getStoredWalletState();
    if (!walletState.isConnected || !walletState.publicKey) {
      return [];
    }

    if (typeof window !== 'undefined') {
      const investments = JSON.parse(localStorage.getItem('investments') || '{}');
      const userInvestments = [];
      
      for (const [artworkId, data] of Object.entries(investments) as [string, { investors?: Array<{ address: string; amount: number; shares: number; timestamp: string }> }][]) {
        const userInvestment = data.investors?.find(inv => 
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
  getAvailableForPurchase(): Array<{ 
    id: string; 
    name: string; 
    symbol: string; 
    creator: string; 
    artwork_details: { dimensions: string; medium: string; year: string; condition: string; provenance: string }; 
    creator_info: { name: string; bio: string; certifications: string[] }; 
    financial: { funding_goal: number; current_funding: number; share_price: number; total_shares: number }; 
    totalInvested: number; 
    availableForPurchase: boolean; 
  }> {
    const artworks = this.getSampleArtworks();
    const availableArtworks = [];
    
    for (const artwork of artworks) {
      if (typeof window !== 'undefined') {
        const investments = JSON.parse(localStorage.getItem('investments') || '{}');
        const purchases = JSON.parse(localStorage.getItem('purchases') || '{}');
        
        // Check if fully funded and not already purchased
        const totalInvested = (investments[artwork.id]?.total as number) || artwork.financial.current_funding;
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
    } catch {
      return {
        status: 'offline',
        latency: Date.now() - startTime
      };
    }
  }
}
