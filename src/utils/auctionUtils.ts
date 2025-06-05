
import { doc, updateDoc, addDoc, collection, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CATEGORY_LIMITS } from '@/types';

export const placeBid = async (
  amount: number,
  userId: string,
  teamId: string,
  teamName: string,
  bidderName: string
) => {
  try {
    await runTransaction(db, async (transaction) => {
      const auctionRef = doc(db, 'auction', 'current');
      const auctionDoc = await transaction.get(auctionRef);
      
      if (!auctionDoc.exists()) {
        throw new Error('No active auction');
      }
      
      const auctionData = auctionDoc.data();
      
      if (!auctionData.isActive) {
        throw new Error('Auction is not active');
      }
      
      if (amount <= auctionData.highestBid) {
        throw new Error('Bid must be higher than current highest bid');
      }
      
      // Extend auction time by 3 seconds when a bid is placed
      const currentDuration = auctionData.auctionDuration || 30;
      const newDuration = currentDuration + 3;
      
      // Update auction state
      transaction.update(auctionRef, {
        highestBid: amount,
        highestBidder: userId,
        highestBidderTeam: teamId,
        highestBidderName: bidderName,
        lastBidTime: serverTimestamp(),
        auctionDuration: newDuration,
        bidCount: (auctionData.bidCount || 0) + 1
      });
      
      // Add to bid history
      const bidHistoryRef = collection(db, 'bidHistory');
      transaction.set(doc(bidHistoryRef), {
        userId,
        teamId,
        teamName,
        bidderName,
        amount,
        timestamp: serverTimestamp()
      });
    });
  } catch (error) {
    console.error('Error placing bid:', error);
    throw error;
  }
};

export const validateBid = (
  amount: number,
  teamRemainingBudget: number,
  currentHighestBid: number
): string | null => {
  if (amount <= currentHighestBid) {
    return 'Bid must be higher than current highest bid';
  }
  
  if (amount > teamRemainingBudget) {
    return 'Insufficient budget for this bid';
  }
  
  return null;
};

export const validateCategoryQuota = (
  category: string,
  currentRoster: any[],
  maxActresses: number
): string | null => {
  if (currentRoster.length >= maxActresses) {
    return 'Team roster is full';
  }
  
  if (category !== 'Marquee' && CATEGORY_LIMITS[category as keyof typeof CATEGORY_LIMITS]) {
    const categoryCount = currentRoster.filter(actress => actress.category === category).length;
    const limit = CATEGORY_LIMITS[category as keyof typeof CATEGORY_LIMITS];
    
    if (categoryCount >= limit) {
      return `Maximum ${limit} ${category} actresses allowed`;
    }
  }
  
  return null;
};
