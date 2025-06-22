//! Artwork Investment Smart Contract
//! 
//! A minimal Soroban contract for fractional artwork investment.
//! Functions:
//! - invest: Record investment in an artwork
//! - get_total_invested: Get total amount invested in an artwork
//! - get_last_investor: Get the last investor address for an artwork
//! - is_fully_funded: Check if artwork reached funding goal

#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Bytes, Env};

// Storage keys for persistent data
#[contracttype]
pub enum DataKey {
    // Total invested amount for each artwork (artwork_id -> u32)
    TotalInvested(Bytes),
    // Last investor for each artwork (artwork_id -> Address) 
    LastInvestor(Bytes),
    // Funding goal for each artwork (artwork_id -> u32)
    FundingGoal(Bytes),
}

#[contract]
pub struct ArtworkInvestmentContract;

#[contractimpl]
impl ArtworkInvestmentContract {
    /// Record an investment in an artwork
    /// 
    /// # Arguments
    /// * `artwork_id` - Unique identifier for the artwork
    /// * `investor` - Address of the investor
    /// * `amount` - Investment amount in stroops
    pub fn invest(env: Env, artwork_id: Bytes, investor: Address, amount: u32) {
        // Require investor to authorize this transaction
        investor.require_auth();
        
        // Get current total invested amount (default to 0 if not exists)
        let current_total: u32 = env
            .storage()
            .persistent()
            .get(&DataKey::TotalInvested(artwork_id.clone()))
            .unwrap_or(0);
            
        // Add new investment to total
        let new_total = current_total + amount;
        
        // Update total invested amount
        env.storage()
            .persistent()
            .set(&DataKey::TotalInvested(artwork_id.clone()), &new_total);
            
        // Update last investor
        env.storage()
            .persistent()
            .set(&DataKey::LastInvestor(artwork_id), &investor);
    }
    
    /// Get total amount invested in an artwork
    /// 
    /// # Arguments
    /// * `artwork_id` - Unique identifier for the artwork
    /// 
    /// # Returns
    /// Total amount invested in stroops
    pub fn get_total_invested(env: Env, artwork_id: Bytes) -> u32 {
        env.storage()
            .persistent()
            .get(&DataKey::TotalInvested(artwork_id))
            .unwrap_or(0)
    }
    
    /// Get the last investor address for an artwork
    /// 
    /// # Arguments
    /// * `artwork_id` - Unique identifier for the artwork
    /// 
    /// # Returns
    /// Address of the last investor, or None if no investments yet
    pub fn get_last_investor(env: Env, artwork_id: Bytes) -> Option<Address> {
        env.storage()
            .persistent()
            .get(&DataKey::LastInvestor(artwork_id))
    }
    
    /// Set funding goal for an artwork (only callable once per artwork)
    /// 
    /// # Arguments
    /// * `artwork_id` - Unique identifier for the artwork
    /// * `goal` - Funding goal in stroops
    pub fn set_funding_goal(env: Env, artwork_id: Bytes, goal: u32) {
        // Check if goal already exists
        let existing_goal: Option<u32> = env
            .storage()
            .persistent()
            .get(&DataKey::FundingGoal(artwork_id.clone()));
            
        // Only allow setting goal if it doesn't exist
        if existing_goal.is_none() {
            env.storage()
                .persistent()
                .set(&DataKey::FundingGoal(artwork_id), &goal);
        }
    }
    
    /// Check if artwork has reached its funding goal
    /// 
    /// # Arguments
    /// * `artwork_id` - Unique identifier for the artwork
    /// 
    /// # Returns
    /// True if fully funded, false otherwise
    pub fn is_fully_funded(env: Env, artwork_id: Bytes) -> bool {
        let total_invested = Self::get_total_invested(env.clone(), artwork_id.clone());
        let funding_goal: u32 = env
            .storage()
            .persistent()
            .get(&DataKey::FundingGoal(artwork_id))
            .unwrap_or(u32::MAX); // If no goal set, return false
            
        total_invested >= funding_goal
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Bytes, Env};

    #[test]
    fn test_investment_flow() {
        let env = Env::default();
        let contract_id = env.register_contract(None, ArtworkInvestmentContract);
        let client = ArtworkInvestmentContractClient::new(&env, &contract_id);
        
        // Create test data - using simple string
        let artwork_id = Bytes::from_slice(&env, b"art-001");
        let investor1 = Address::generate(&env);
        let investor2 = Address::generate(&env);
        
        // Set funding goal
        client.set_funding_goal(&artwork_id, &10000);
        
        // Test initial state
        assert_eq!(client.get_total_invested(&artwork_id), 0);
        assert_eq!(client.get_last_investor(&artwork_id), None);
        assert_eq!(client.is_fully_funded(&artwork_id), false);
        
        // First investment - using mock_all_auths to bypass auth
        env.mock_all_auths();
        client.invest(&artwork_id, &investor1, &5000);
            
        assert_eq!(client.get_total_invested(&artwork_id), 5000);
        assert_eq!(client.get_last_investor(&artwork_id), Some(investor1.clone()));
        assert_eq!(client.is_fully_funded(&artwork_id), false);
        
        // Second investment to reach goal
        client.invest(&artwork_id, &investor2, &5000);
            
        assert_eq!(client.get_total_invested(&artwork_id), 10000);
        assert_eq!(client.get_last_investor(&artwork_id), Some(investor2));
        assert_eq!(client.is_fully_funded(&artwork_id), true);
    }
}
