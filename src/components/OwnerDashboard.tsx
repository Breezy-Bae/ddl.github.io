
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useAuctionStatus } from '@/hooks/useAuctionStatus';
import { useTeamData } from '@/hooks/useTeamData';
import { placeBid, validateBid, validateCategoryQuota } from '@/utils/auctionUtils';
import { CATEGORY_COLORS, CATEGORY_LIMITS, BidHistory } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Trophy, DollarSign, Users, Star, Gavel, LogOut, Timer } from 'lucide-react';

const OwnerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { auctionState } = useAuctionStatus();
  const { team, roster, loading } = useTeamData(user?.teamId || null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidHistory, setBidHistory] = useState<BidHistory[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (auctionState?.currentItem) {
      const unsubscribe = onSnapshot(
        query(
          collection(db, 'bidHistory'), 
          orderBy('timestamp', 'desc')
        ),
        (snapshot) => {
          const bids = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          } as BidHistory));
          setBidHistory(bids.slice(0, 10)); // Show last 10 bids
        }
      );
      return unsubscribe;
    }
  }, [auctionState?.currentItem]);

  useEffect(() => {
    if (auctionState?.isActive && auctionState?.timeRemaining > 0) {
      const timer = setInterval(() => {
        const now = Date.now();
        const startTime = auctionState.startTime?.toMillis() || now;
        const elapsed = Math.floor((now - startTime) / 1000);
        const remaining = Math.max(0, 300 - elapsed); // 5 minutes = 300 seconds
        setTimeLeft(remaining);
        
        if (remaining === 0) {
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [auctionState]);

  const handlePlaceBid = async () => {
    if (!user || !team || !auctionState?.currentItem) return;

    const amount = parseInt(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid bid",
        description: "Please enter a valid bid amount",
        variant: "destructive",
      });
      return;
    }

    // Validate bid
    const bidError = validateBid(amount, team.remainingPurse || 0, auctionState.highestBid);
    if (bidError) {
      toast({
        title: "Invalid bid",
        description: bidError,
        variant: "destructive",
      });
      return;
    }

    // Validate category quota
    const categoryError = validateCategoryQuota(
      auctionState.currentItem.category,
      roster,
      team.maxActresses || 0
    );
    if (categoryError) {
      toast({
        title: "Cannot bid",
        description: categoryError,
        variant: "destructive",
      });
      return;
    }

    try {
      await placeBid(amount, user.uid, team.id, team.name, user.displayName);
      setBidAmount('');
      toast({
        title: "Bid placed successfully",
        description: `Your bid of ₹${amount.toLocaleString()} has been placed`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to place bid",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryCount = (category: string) => {
    return roster.filter(actress => actress.category === category).length;
  };

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Team Assigned</h2>
            <p className="text-gray-600">You haven't been assigned to a team yet. Please contact the admin.</p>
            <Button onClick={logout} className="mt-4">
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-purple-800">{team.name}</h1>
              <p className="text-gray-600">Welcome, {user?.displayName}</p>
            </div>
            <Button 
              onClick={logout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Remaining Budget</p>
                  <p className="text-2xl font-bold text-gray-900">₹{(team.remainingPurse || 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Roster</p>
                  <p className="text-2xl font-bold text-gray-900">{team.currentActresses || 0}/{team.maxActresses || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Budget Used</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {team.budget && team.remainingPurse ? 
                      (((team.budget - team.remainingPurse) / team.budget * 100).toFixed(1)) : '0'}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">₹{(team.budget && team.remainingPurse ? (team.budget - team.remainingPurse) : 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Auction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                Current Auction
              </CardTitle>
            </CardHeader>
            <CardContent>
              {auctionState?.isActive && auctionState?.currentItem ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{auctionState.currentItem.name}</h3>
                      <Badge 
                        className="mt-1"
                        style={{ 
                          backgroundColor: CATEGORY_COLORS[auctionState.currentItem.category as keyof typeof CATEGORY_COLORS] || '#gray' 
                        }}
                      >
                        {auctionState.currentItem.category}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-red-600 font-bold">
                        <Timer className="h-4 w-4" />
                        {formatTime(timeLeft)}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Current Highest Bid:</span>
                      <span className="text-xl font-bold">₹{(auctionState.highestBid || 0).toLocaleString()}</span>
                    </div>
                    {auctionState.highestBidderName && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Leading Bidder:</span>
                        <span className="font-medium">{auctionState.highestBidderName}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Enter bid amount"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handlePlaceBid}
                      disabled={!bidAmount || parseInt(bidAmount) <= (auctionState.highestBid || 0)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Place Bid
                    </Button>
                  </div>

                  {/* Quick bid buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {[50000, 100000, 200000, 500000].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => setBidAmount(((auctionState.highestBid || 0) + amount).toString())}
                        disabled={(auctionState.highestBid || 0) + amount > (team.remainingPurse || 0)}
                      >
                        +₹{amount.toLocaleString()}
                      </Button>
                    ))}
                  </div>

                  {/* Recent bids */}
                  <div>
                    <h4 className="font-medium mb-2">Recent Bids</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {bidHistory.map((bid) => (
                        <div key={bid.id} className="flex justify-between items-center text-sm bg-white p-2 rounded border">
                          <span className="font-medium">{bid.bidderName}</span>
                          <span>₹{(bid.amount || 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Gavel className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No active auction at the moment</p>
                  <p className="text-sm">Check back later for upcoming auctions</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Quotas */}
          <Card>
            <CardHeader>
              <CardTitle>Category Quotas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(CATEGORY_LIMITS).map(([category, limit]) => {
                  const count = getCategoryCount(category);
                  const percentage = (count / limit) * 100;
                  
                  return (
                    <div key={category}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{category}</span>
                        <span className="text-sm text-gray-600">{count}/{limit}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-300" 
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#gray' 
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Marquee (no limit) */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Marquee</span>
                    <span className="text-sm text-gray-600">{getCategoryCount('Marquee')} (No limit)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: getCategoryCount('Marquee') > 0 ? '100%' : '0%',
                        backgroundColor: CATEGORY_COLORS['Marquee'] 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Roster */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>My Roster</CardTitle>
          </CardHeader>
          <CardContent>
            {roster.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roster.map((actress) => (
                  <Card key={actress.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{actress.name}</h3>
                        <Badge 
                          style={{ 
                            backgroundColor: CATEGORY_COLORS[actress.category] || '#gray' 
                          }}
                        >
                          {actress.category}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Purchase Price: ₹{(actress.purchasePrice || 0).toLocaleString()}</p>
                        <p>Base Price: ₹{(actress.basePrice || 0).toLocaleString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Your roster is empty</p>
                <p className="text-sm">Start bidding in auctions to build your team!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OwnerDashboard;
