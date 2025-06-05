
import React, { useState, useEffect } from 'react';
import { doc, setDoc, updateDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuctionStatus } from '@/hooks/useAuctionStatus';
import { Actress } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Play, Pause, Square, Timer, Gavel } from 'lucide-react';

interface AuctionControlProps {
  actresses: Actress[];
}

const AuctionControl: React.FC<AuctionControlProps> = ({ actresses }) => {
  const { auctionState } = useAuctionStatus();
  const [selectedActress, setSelectedActress] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (auctionState?.isActive && auctionState?.startTime) {
      const timer = setInterval(() => {
        const now = Date.now();
        const startTime = auctionState.startTime?.toMillis() || now;
        const elapsed = Math.floor((now - startTime) / 1000);
        const remaining = Math.max(0, 300 - elapsed); // 5 minutes
        setTimeLeft(remaining);
        
        if (remaining === 0) {
          handleEndAuction();
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [auctionState]);

  const startAuction = async () => {
    if (!selectedActress) {
      toast({
        title: "No actress selected",
        description: "Please select an actress to auction",
        variant: "destructive",
      });
      return;
    }

    const actress = actresses.find(a => a.id === selectedActress);
    if (!actress) return;

    try {
      await setDoc(doc(db, 'auction', 'current'), {
        isActive: true,
        currentItem: {
          id: actress.id,
          name: actress.name,
          category: actress.category,
          basePrice: actress.basePrice,
          imageUrl: actress.imageUrl
        },
        highestBid: actress.basePrice,
        highestBidder: null,
        highestBidderTeam: null,
        highestBidderName: null,
        timeRemaining: 300, // 5 minutes
        startTime: serverTimestamp(),
        lastBidTime: null
      });

      // Mark actress as on auction
      await updateDoc(doc(db, 'actresses', actress.id), {
        isOnAuction: true,
        currentPrice: actress.basePrice
      });

      toast({
        title: "Auction started",
        description: `Auction for ${actress.name} has started`,
      });
    } catch (error) {
      console.error('Error starting auction:', error);
      toast({
        title: "Failed to start auction",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const pauseAuction = async () => {
    try {
      await updateDoc(doc(db, 'auction', 'current'), {
        isActive: false
      });

      toast({
        title: "Auction paused",
        description: "The auction has been paused",
      });
    } catch (error) {
      console.error('Error pausing auction:', error);
    }
  };

  const resumeAuction = async () => {
    try {
      await updateDoc(doc(db, 'auction', 'current'), {
        isActive: true
      });

      toast({
        title: "Auction resumed",
        description: "The auction has been resumed",
      });
    } catch (error) {
      console.error('Error resuming auction:', error);
    }
  };

  const handleEndAuction = async () => {
    if (!auctionState?.currentItem) return;

    try {
      await runTransaction(db, async (transaction) => {
        const auctionRef = doc(db, 'auction', 'current');
        const actressRef = doc(db, 'actresses', auctionState.currentItem!.id);
        
        // First, do ALL reads before any writes
        let teamDoc = null;
        if (auctionState.highestBidder && auctionState.highestBidderTeam) {
          const teamRef = doc(db, 'teams', auctionState.highestBidderTeam);
          teamDoc = await transaction.get(teamRef);
        }

        // Now do ALL writes
        // End auction
        transaction.update(auctionRef, {
          isActive: false,
          currentItem: null,
          highestBid: 0,
          highestBidder: null,
          highestBidderTeam: null,
          highestBidderName: null,
          timeRemaining: 0
        });

        // Update actress status
        if (auctionState.highestBidder && auctionState.highestBidderTeam) {
          // Sold to highest bidder
          transaction.update(actressRef, {
            isOnAuction: false,
            isAvailable: false,
            teamId: auctionState.highestBidderTeam,
            soldToTeam: auctionState.highestBidderTeam,
            finalPrice: auctionState.highestBid,
            purchasePrice: auctionState.highestBid,
            soldAt: serverTimestamp()
          });

          // Update team budget and count
          if (teamDoc && teamDoc.exists()) {
            const teamData = teamDoc.data();
            const teamRef = doc(db, 'teams', auctionState.highestBidderTeam);
            transaction.update(teamRef, {
              remainingPurse: (teamData.remainingPurse || 0) - auctionState.highestBid,
              currentActresses: (teamData.currentActresses || 0) + 1
            });
          }
        } else {
          // No bids - return to pool
          transaction.update(actressRef, {
            isOnAuction: false,
            isAvailable: true
          });
        }
      });

      toast({
        title: "Auction ended",
        description: auctionState.highestBidder 
          ? `${auctionState.currentItem.name} sold to ${auctionState.highestBidderName} for ₹${auctionState.highestBid.toLocaleString()}`
          : `${auctionState.currentItem.name} returned to pool (no bids)`,
      });
    } catch (error) {
      console.error('Error ending auction:', error);
      toast({
        title: "Failed to end auction",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Current Auction Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Current Auction Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auctionState?.currentItem ? (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{auctionState.currentItem.name}</h3>
                  <Badge variant="secondary" className="mt-1">
                    {auctionState.currentItem.category}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-2">
                    Base Price: ₹{auctionState.currentItem.basePrice.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-red-600 font-bold text-xl">
                    <Timer className="h-5 w-5" />
                    {formatTime(timeLeft)}
                  </div>
                  <Badge variant={auctionState.isActive ? "default" : "secondary"} className="mt-2">
                    {auctionState.isActive ? "Active" : "Paused"}
                  </Badge>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Current Highest Bid</p>
                    <p className="text-2xl font-bold">₹{auctionState.highestBid.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Leading Bidder</p>
                    <p className="text-lg font-medium">
                      {auctionState.highestBidderName || 'No bids yet'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {auctionState.isActive ? (
                  <Button onClick={pauseAuction} variant="outline" className="flex items-center gap-2">
                    <Pause className="h-4 w-4" />
                    Pause Auction
                  </Button>
                ) : (
                  <Button onClick={resumeAuction} className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Resume Auction
                  </Button>
                )}
                <Button onClick={handleEndAuction} variant="destructive" className="flex items-center gap-2">
                  <Square className="h-4 w-4" />
                  End Auction
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Gavel className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No active auction</p>
              <p className="text-sm">Select an actress below to start an auction</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Start New Auction */}
      <Card>
        <CardHeader>
          <CardTitle>Start New Auction</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select Actress to Auction</label>
              <Select value={selectedActress} onValueChange={setSelectedActress}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose an actress" />
                </SelectTrigger>
                <SelectContent>
                  {actresses.map((actress) => (
                    <SelectItem key={actress.id} value={actress.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{actress.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {actress.category}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={startAuction}
              disabled={!selectedActress || !!auctionState?.currentItem}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Auction (5 minutes)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Actresses */}
      <Card>
        <CardHeader>
          <CardTitle>Available Actresses ({actresses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {actresses.map((actress) => (
              <Card 
                key={actress.id} 
                className={`border cursor-pointer transition-all hover:shadow-md ${
                  selectedActress === actress.id ? 'ring-2 ring-purple-500' : ''
                }`}
                onClick={() => setSelectedActress(actress.id)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{actress.name}</h3>
                    <Badge variant="outline">
                      {actress.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Base Price: ₹{actress.basePrice.toLocaleString()}
                  </p>
                  {actress.isOnAuction && (
                    <Badge variant="destructive" className="mt-2">
                      Currently on Auction
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuctionControl;
