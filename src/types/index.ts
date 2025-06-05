
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
}

export interface Actress {
  id: string;
  name: string;
  category: 'Marquee' | 'Blockbuster Queens' | 'Global Glam' | 'Drama Diva' | 'Next-Gen Stars' | 'Timeless Icons' | 'Gen-Z';
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
  startTime: any;
  lastBidTime: any;
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
  'Marquee': '#531cb3',
  'Blockbuster Queens': '#944bbb',
  'Global Glam': '#aa7bc3',
  'Drama Diva': '#cc92c2',
  'Next-Gen Stars': '#dba8ac',
  'Timeless Icons': '#7c4fd1',
  'Gen-Z': '#b073cf'
};
