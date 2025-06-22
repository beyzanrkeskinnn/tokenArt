// Direct balance fetcher without Stellar SDK
export class SimpleBalanceFetcher {
  
  static async getBalance(stellarAddress: string): Promise<{ balance: string; error?: string }> {
    try {
      console.log('🔍 [SIMPLE FETCH] Getting balance for:', stellarAddress);
      
      // Validate address format
      if (!stellarAddress || stellarAddress.length !== 56 || !stellarAddress.startsWith('G')) {
        return { balance: '0', error: 'Invalid Stellar address format' };
      }
      
      // Direct API call to Horizon
      const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${stellarAddress}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🔍 [SIMPLE FETCH] API response status:', response.status);
      
      if (response.ok) {
        const accountData = await response.json();
        console.log('🔍 [SIMPLE FETCH] Account data received');
        
        // Find native XLM balance
        const nativeBalance = accountData.balances?.find((balance: { asset_type: string; balance: string }) => 
          balance.asset_type === 'native'
        );
        
        if (nativeBalance) {
          console.log('💰 [SIMPLE FETCH] Balance found:', nativeBalance.balance, 'XLM');
          return { balance: nativeBalance.balance };
        } else {
          console.log('❌ [SIMPLE FETCH] No native balance found');
          return { balance: '0', error: 'No XLM balance found' };
        }
      } else if (response.status === 404) {
        console.log('🔍 [SIMPLE FETCH] Account not found - needs funding');
        return { 
          balance: '0', 
          error: 'Account not found on testnet. Fund at https://friendbot.stellar.org' 
        };
      } else {
        const errorText = await response.text();
        console.log('❌ [SIMPLE FETCH] API error:', response.status, errorText);
        return { 
          balance: '0', 
          error: `API error: ${response.status} ${response.statusText}` 
        };
      }
    } catch (error: unknown) {
      console.error('❌ [SIMPLE FETCH] Network error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { 
        balance: '0', 
        error: `Network error: ${errorMessage}` 
      };
    }
  }
  
  static async fundAccount(stellarAddress: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🏦 [SIMPLE FETCH] Funding account:', stellarAddress);
      
      const response = await fetch(`https://friendbot.stellar.org?addr=${stellarAddress}`, {
        method: 'GET'
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ [SIMPLE FETCH] Account funded:', result);
        return { success: true };
      } else {
        const errorText = await response.text();
        console.log('❌ [SIMPLE FETCH] Funding failed:', errorText);
        return { success: false, error: errorText };
      }
    } catch (error: unknown) {
      console.error('❌ [SIMPLE FETCH] Funding error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }
}
