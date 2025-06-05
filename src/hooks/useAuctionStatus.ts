
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AuctionState } from '@/types';

export const useAuctionStatus = () => {
  const [auctionState, setAuctionState] = useState<AuctionState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'auction', 'current'),
      (doc) => {
        if (doc.exists()) {
          setAuctionState(doc.data() as AuctionState);
        } else {
          setAuctionState(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to auction state:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return { auctionState, loading };
};
