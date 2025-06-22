// Freighter Wallet Integration for TokenArt using official API
import { 
  isConnected,
  requestAccess,
  getAddress,
  signTransaction,
} from '@stellar/freighter-api';
import { WalletState } from './types';
import { Keypair, Horizon } from '@stellar/stellar-sdk';
import { SimpleBalanceFetcher } from './simple-balance';

export class WalletManager {
  private static instance: WalletManager;
  private server: Horizon.Server;
  
  constructor() {
    // Testnet server
    this.server = new Horizon.Server('https://horizon-testnet.stellar.org');
  }
  
  static getInstance(): WalletManager {
    if (!WalletManager.instance) {
      WalletManager.instance = new WalletManager();
    }
    return WalletManager.instance;
  }

  // Check if Freighter is installed
  async isFreighterInstalled(): Promise<boolean> {
    try {
      // Check if Freighter API is available
      const { isAllowed } = await import('@stellar/freighter-api');
      
      // First check if extension is available
      if (typeof window !== 'undefined' && (window as any).freighter) {
        console.log('🔍 [FREIGHTER] Extension detected via window.freighter');
        return true;
      }
      
      // Fallback check via API
      const allowed = await isAllowed();
      console.log('🔍 [FREIGHTER] API allowed check:', allowed);
      
      return allowed.isAllowed;
    } catch (error) {
      console.log('🔍 [FREIGHTER] Extension not found:', error);
      return false;
    }
  }

  // Connect wallet
  async connectWallet(): Promise<WalletState> {
    try {
      console.log('🔗 [CONNECT] Starting wallet connection...');
      
      if (!(await this.isFreighterInstalled())) {
        console.log('❌ [CONNECT] Freighter not installed');
        return {
          isConnected: false,
          publicKey: null,
          error: 'Freighter wallet not installed. Please install Freighter extension and refresh the page.',
          balance: undefined
        };
      }

      console.log('✅ [CONNECT] Freighter detected, requesting access...');
      const { address, error } = await requestAccess();
      
      if (error) {
        console.log('❌ [CONNECT] Access denied:', error);
        return {
          isConnected: false,
          publicKey: null,
          error: error,
          balance: undefined
        };
      }

      console.log('✅ [CONNECT] Access granted, address:', address);

      // Get the current active address from Freighter (this ensures we get the active wallet)
      console.log('🔍 [CONNECT] Getting current active address from Freighter...');
      let activeAddress = address;
      try {
        const currentAddr = await this.getCurrentAddress();
        if (currentAddr && currentAddr !== address) {
          console.log('🔄 [CONNECT] Freighter active address differs from requestAccess:', currentAddr);
          activeAddress = currentAddr;
        }
      } catch (addrError) {
        console.warn('⚠️ [CONNECT] Could not get current address, using requestAccess result:', addrError);
      }

      console.log('✅ [CONNECT] Final address to use:', activeAddress);

      // Get balance immediately after connection with multiple attempts
      let balance = '0';
      let balanceError = null;
      
      try {
        console.log('💰 [CONNECT] Attempting to fetch balance for active address:', activeAddress);
        const balanceData = await this.getBalance(activeAddress);
        balance = balanceData.native;
        balanceError = balanceData.error;
        
        console.log('💰 [CONNECT] Balance fetch result:', { balance, error: balanceError });
      } catch (fetchError) {
        console.warn('⚠️ [CONNECT] Balance fetch failed during connection:', fetchError);
        balanceError = `Balance fetch failed: ${fetchError}`;
      }

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('wallet_connected', 'true');
        localStorage.setItem('public_key', activeAddress);
        console.log('💾 [CONNECT] Wallet state saved to localStorage');
      }

      return {
        isConnected: true,
        publicKey: activeAddress,
        error: balanceError,
        balance: balance
      };
    } catch (error) {
      console.error('❌ [CONNECT] Connection failed:', error);
      return {
        isConnected: false,
        publicKey: null,
        error: `Connection failed: ${error}`,
        balance: undefined
      };
    }
  }
  // Disconnect wallet
  disconnectWallet(): WalletState {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wallet_connected');
      localStorage.removeItem('public_key');
    }
    
    return {
      isConnected: false,
      publicKey: null
    };
  }

  // Get stored wallet state
  getStoredWalletState(): WalletState {
    if (typeof window === 'undefined') {
      return { isConnected: false, publicKey: null };
    }

    const isConnected = localStorage.getItem('wallet_connected') === 'true';
    const publicKey = localStorage.getItem('public_key');

    return {
      isConnected: isConnected && !!publicKey,
      publicKey: publicKey
    };
  }

  // Get wallet balance with retry mechanism and proper error handling
  async getBalance(publicKey?: string): Promise<{ native: string; error?: string }> {
    const MAX_RETRIES = 2; // Reduced retries
    const RETRY_DELAY = 1000; // 1 second
    
    // Get the address to use (do this once, outside the loop)
    let address = publicKey;
    
    // If no address provided, try stored state first, then current address
    if (!address) {
      const stored = this.getStoredWalletState();
      address = stored.publicKey || undefined;
      
      if (!address) {
        console.log('🔍 [BALANCE] No stored address, getting current from Freighter...');
        address = await this.getCurrentAddress() || undefined;
      }
    }
    
    if (!address) {
      console.warn('❌ [BALANCE] No wallet address available');
      return { native: '0', error: 'No wallet address available' };
    }

    // Validate address format
    if (!this.isValidStellarAddress(address)) {
      console.error('❌ [BALANCE] Invalid Stellar address format:', address);
      return { native: '0', error: 'Invalid wallet address format' };
    }

    console.log('🔍 [BALANCE] Starting balance fetch for:', address);
    
    // First try simple fetcher (more reliable)
    console.log('🔄 [BALANCE] Trying simple fetcher first...');
    try {
      const simpleResult = await SimpleBalanceFetcher.getBalance(address);
      if (!simpleResult.error) {
        console.log('✅ [BALANCE] Simple fetcher succeeded:', simpleResult.balance, 'XLM');
        return { native: simpleResult.balance };
      } else {
        console.warn('⚠️ [BALANCE] Simple fetcher failed:', simpleResult.error);
      }
    } catch (simpleError) {
      console.warn('⚠️ [BALANCE] Simple fetcher exception:', simpleError);
    }
    
    // Fallback to Stellar SDK
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`🌐 [BALANCE ATTEMPT ${attempt}/${MAX_RETRIES}] Using Stellar SDK...`);
        console.log('🌐 [BALANCE] Server URL:', this.server.serverURL);
        
        // Load account using Stellar SDK
        const account = await this.server.loadAccount(address);
        console.log('✅ [BALANCE] Account loaded successfully via SDK');
        
        // Find native (XLM) balance
        const nativeBalance = account.balances.find(
          (balance: any) => balance.asset_type === 'native'
        );

        if (!nativeBalance) {
          console.warn('⚠️ [BALANCE] No native balance found in account');
          return { native: '0', error: 'No XLM balance found in account' };
        }

        const balance = nativeBalance.balance;
        console.log('💰 [BALANCE] Native XLM balance found via SDK:', balance);

        // Validate balance format
        if (typeof balance !== 'string' || isNaN(parseFloat(balance))) {
          console.error('❌ [BALANCE] Invalid balance format:', balance);
          return { native: '0', error: 'Invalid balance format received' };
        }

        console.log(`✅ [BALANCE ATTEMPT ${attempt}] SDK Success:`, balance, 'XLM');
        return { native: balance };
        
      } catch (error: any) {
        console.error(`❌ [BALANCE ATTEMPT ${attempt}/${MAX_RETRIES}] SDK Error:`, error);
        
        // Handle 404 - account not found
        if (error.response?.status === 404) {
          console.warn('🔍 [BALANCE] Account not found on testnet - needs funding');
          return { 
            native: '0', 
            error: 'Account not found on testnet. Fund it at https://friendbot.stellar.org' 
          };
        }
        
        // If this is the last attempt, return error
        if (attempt === MAX_RETRIES) {
          const errorMsg = error.message || error.toString();
          console.error('❌ [BALANCE] All SDK attempts failed:', errorMsg);
          return { 
            native: '0', 
            error: `Balance fetch failed: ${errorMsg}` 
          };
        }
        
        // Wait before retry
        console.log(`⏳ [BALANCE] Waiting ${RETRY_DELAY}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
    
    // This should never be reached, but just in case
    return { native: '0', error: 'Unexpected error in balance fetch' };
  }

  // Validate Stellar address format
  private isValidStellarAddress(address: string): boolean {
    try {
      // Stellar addresses start with G and are 56 characters long
      return address.length === 56 && address.startsWith('G');
    } catch {
      return false;
    }
  }

  // Test Horizon server connectivity
  private async testHorizonConnectivity(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🌐 [CONNECTIVITY] Testing Horizon server...');
      const response = await fetch('https://horizon-testnet.stellar.org', {
        method: 'HEAD'
      });
      
      if (response.ok) {
        console.log('✅ [CONNECTIVITY] Horizon server is reachable');
        return { success: true };
      } else {
        console.warn('⚠️ [CONNECTIVITY] Horizon server returned:', response.status);
        return { success: false, error: `Server returned ${response.status}` };
      }
    } catch (error: any) {
      console.error('❌ [CONNECTIVITY] Horizon server unreachable:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Sign transaction with Freighter
  async signTransaction(transactionXdr: string): Promise<string> {
    try {
      const result = await signTransaction(transactionXdr, {
        networkPassphrase: 'Test SDF Network ; September 2015'
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.signedTxXdr;
    } catch (error) {
      throw new Error(`Transaction signing failed: ${error}`);
    }
  }

  // Get current wallet address with enhanced logging
  async getCurrentAddress(): Promise<string | null> {
    try {
      console.log('📍 [GET_ADDR] Getting current address from Freighter...');
      
      const result = await getAddress();
      console.log('📍 [GET_ADDR] Freighter getAddress result:', result);
      
      if (result.error) {
        console.error('📍 [GET_ADDR] Freighter address error:', result.error);
        throw new Error(result.error);
      }
      
      console.log('📍 [GET_ADDR] Current address retrieved:', result.address);
      return result.address;
    } catch (error) {
      console.error('📍 [GET_ADDR] Failed to get current address:', error);
      return null;
    }
  }

  // Create a temporary keypair for testing (only for development)
  createTestKeypair(): Keypair {
    console.warn('Creating test keypair - this should only be used for development');
    return Keypair.random();
  }
}