// Types for TokenArt - Artwork Investment Platform

export interface ArtAsset {
  id: string;
  name: string;
  symbol: string;
  asset_type: 'painting' | 'sculpture' | 'photography' | 'digital';
  creator_info: {
    name: string;
    location: string;
    experience_years: number;
    certifications: string[];
  };
  asset_details: {
    dimensions: string;
    medium: string;
    provenance: string;
    authenticity_certified: boolean;
  };
  timeline_info: {
    creation_date: string;
    exhibition_date: string;
    estimated_sale_date: string;
    quality_grade: 'A' | 'B' | 'C';
  };
  financial: {
    funding_goal: number;
    current_funding: number;
    share_price: number;
    total_shares: number;
  };
}

export interface WalletState {
  isConnected: boolean;
  publicKey: string | null;
  error?: string | null;
  balance?: string;
}

export interface InvestmentData {
  artworkId: string;
  totalInvested: number;
  lastInvestor: string;
  isFullyFunded: boolean;
}