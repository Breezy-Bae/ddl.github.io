
export interface User {
  uid: string;
  displayName: string;
  email: string;
  role: 'admin' | 'owner';
  teamId?: string;
  createdAt: any;
}

export interface Team {
  id: string;
  name: string;
  budget: number;
  remainingPurse: number;
  budgetUsed: number;
  maxActresses: number;
  currentActresses: number;
  ownerId: string | null;
  ownerName: string | null;
  createdAt: any;
  isActive: boolean;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface Actress {
  id: string;
  name: string;
  category: 'Blockbuster Queens' | 'Global Glam' | 'Drama Diva' | 'Next-Gen Stars' | 'Timeless Icons' | 'Gen-Z';
  basePrice: number;
  currentPrice: number;
  imageUrl: string;
  isAvailable: boolean;
  isOnAuction: boolean;
  teamId?: string;
  soldToTeam?: string;
  finalPrice?: number;
  purchasePrice?: number;
  soldAt?: any;
  createdAt: any;
}

export interface AuctionState {
  isActive: boolean;
  currentItem: {
    id: string;
    name: string;
    category: string;
    basePrice: number;
    imageUrl: string;
  } | null;
  highestBid: number;
  highestBidder: string | null;
  highestBidderTeam: string | null;
  highestBidderName: string | null;
  timeRemaining: number;
  auctionDuration: number;
  bidCount: number;
  startTime: any;
  lastBidTime: any;
  pausedAt?: number;
  pausedBy?: string;
  activeTeams?: Array<{id: string, name: string, ownerName: string}>;
}

export interface BidHistory {
  id: string;
  userId: string;
  teamId: string;
  teamName: string;
  bidderName: string;
  amount: number;
  timestamp: any;
}

export const CATEGORY_LIMITS = {
  'Blockbuster Queens': 4,
  'Global Glam': 2,
  'Drama Diva': 2,
  'Next-Gen Stars': 2,
  'Timeless Icons': 2,
  'Gen-Z': 2
};

export const CATEGORY_COLORS = {
  'Blockbuster Queens': '#e53e3e', // Red
  'Global Glam': '#805ad5', // Purple
  'Drama Diva': '#3182ce', // Blue
  'Next-Gen Stars': '#dd6b20', // Orange
  'Timeless Icons': '#8b4513', // Brown
  'Gen-Z': '#38a169' // Green
};
