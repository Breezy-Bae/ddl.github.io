
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
import { CATEGORY_COLORS, BidHistory } from '@/types';
import { formatIndianCurrency } from '@/utils/currencyUtils';
import { toast } from '@/hooks/use-toast';
import { Trophy, DollarSign, Users, Star, Gavel, LogOut, Timer, TrendingUp, IndianRupee } from 'lucide-react';
import AuctionCallouts from './AuctionCallouts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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
    if (auctionState?.isActive && auctionState?.startTime && auctionState?.auctionDuration) {
      const timer = setInterval(() => {
        const now = Date.now();
        const startTime = auctionState.startTime?.toMillis() || now;
        const elapsed = Math.floor((now - startTime) / 1000);
        const duration = auctionState.auctionDuration || 30;
        const remaining = Math.max(0, duration - elapsed);
        setTimeLeft(remaining);
        
        if (remaining === 0) {
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    } else if (!auctionState?.isActive && auctionState?.pausedAt) {
      setTimeLeft(auctionState.pausedAt);
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
        description: `Your bid of ${formatIndianCurrency(amount)} has been placed! Time extended by 3 seconds.`,
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

  // Calculate bid increments based on the current bid
  const getBidIncrements = (currentBid: number) => {
    if (currentBid < 100000) { // < 1 Lakh
      return [10000, 25000, 50000]; // 10k, 25k, 50k
    } else if (currentBid < 1000000) { // < 10 Lakhs
      return [100000, 200000, 500000]; // 1L, 2L, 5L
    } else if (currentBid < 5000000) { // < 50 Lakhs
      return [200000, 500000, 1000000]; // 2L, 5L, 10L
    } else if (currentBid < 10000000) { // < 1 Cr
      return [500000, 1000000, 2000000]; // 5L, 10L, 20L
    } else {
      return [1000000, 2000000, 5000000]; // 10L, 20L, 50L
    }
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

  const teamStyle = {
    backgroundColor: team.primaryColor || 'white',
    color: team.secondaryColor || 'black',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 
                className="text-2xl font-bold px-3 py-1 rounded" 
                style={teamStyle}
              >
                {team ? `${team.name} Dashboard` : 'Team Dashboard'}
              </h1>
              <p className="text-gray-600">Diva Draft League</p>
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
        {team && (
          <>
            {/* Team Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <IndianRupee className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Remaining Budget</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatIndianCurrency(team.remainingPurse || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Star className="h-8 w-8 text-pink-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Actresses</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {roster.length}/{team.maxActresses}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Spent</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatIndianCurrency((team.budget || 0) - (team.remainingPurse || 0))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Available Slots</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {(team.maxActresses || 0) - roster.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="auction" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="auction">Live Auction</TabsTrigger>
                <TabsTrigger value="roster">My Roster</TabsTrigger>
              </TabsList>

              <TabsContent value="auction">
                {/* Auction Callouts for Owners */}
                {auctionState?.currentItem && (
                  <div className="mb-6">
                    <AuctionCallouts
                      currentBid={auctionState.highestBid || 0}
                      bidderName={auctionState.highestBidderName}
                      actressName={auctionState.currentItem.name}
                      timeLeft={timeLeft}
                      isActive={auctionState.isActive || false}
                      bidCount={auctionState.bidCount || 0}
                      pausedBy={auctionState.pausedBy}
                    />
                  </div>
                )}

                {/* Current Auction */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gavel className="h-5 w-5" />
                      Current Auction
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {auctionState?.currentItem ? (
                      <div className="space-y-4">
                        {/* Actress Image and Details */}
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            <img
                              src={auctionState.currentItem.imageUrl || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=200&h=250&fit=crop'}
                              alt={auctionState.currentItem.name}
                              className="w-24 h-32 object-cover rounded-lg border-2"
                              style={{ 
                                borderColor: CATEGORY_COLORS[auctionState.currentItem.category as keyof typeof CATEGORY_COLORS] || 'purple' 
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h3 className="text-lg font-semibold">{auctionState.currentItem.name}</h3>
                                <Badge 
                                  className="mt-1 text-white"
                                  style={{ 
                                    backgroundColor: CATEGORY_COLORS[auctionState.currentItem.category as keyof typeof CATEGORY_COLORS] || 'gray' 
                                  }}
                                >
                                  {auctionState.currentItem.category}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <div className={`flex items-center gap-2 font-bold text-lg ${timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>
                                  <Timer className="h-4 w-4" />
                                  {formatTime(timeLeft)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Active Participating Teams */}
                        {auctionState.activeTeams && auctionState.activeTeams.length > 0 && (
                          <div className="bg-gray-50 p-3 rounded border mb-3">
                            <p className="text-sm font-medium mb-2">Participating Teams:</p>
                            <div className="flex flex-wrap gap-2">
                              {auctionState.activeTeams.map(activeTeam => (
                                <Badge key={activeTeam.id} variant="outline" className="px-3 py-1">
                                  {activeTeam.name} ({activeTeam.ownerName})
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border-2 border-green-200">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">Current Highest Bid:</span>
                            <span className="text-2xl font-bold text-green-600">{formatIndianCurrency(auctionState.highestBid || 0)}</span>
                          </div>
                          {auctionState.highestBidderName && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Leading Bidder:</span>
                              <span className="font-bold text-purple-600">
                                {auctionState.highestBidderName} 
                                {auctionState.highestBidderTeam && (
                                  <span className="text-sm ml-1 opacity-80">
                                    ({auctionState.activeTeams?.find(t => t.id === auctionState.highestBidderTeam)?.name})
                                  </span>
                                )}
                              </span>
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
                            disabled={!auctionState.isActive}
                          />
                          <Button 
                            onClick={handlePlaceBid}
                            disabled={!auctionState.isActive || !bidAmount || parseInt(bidAmount) <= (auctionState.highestBid || 0)}
                            className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
                            style={teamStyle}
                          >
                            <TrendingUp className="h-4 w-4" />
                            Bid
                          </Button>
                        </div>

                        {/* Quick bid buttons */}
                        {auctionState.isActive && (
                          <div className="flex gap-2 flex-wrap">
                            {getBidIncrements(auctionState.highestBid || 0).map((increment) => (
                              <Button
                                key={increment}
                                variant="outline"
                                size="sm"
                                onClick={() => setBidAmount(((auctionState.highestBid || 0) + increment).toString())}
                                disabled={(auctionState.highestBid || 0) + increment > (team.remainingPurse || 0)}
                              >
                                +{formatIndianCurrency(increment)}
                              </Button>
                            ))}
                          </div>
                        )}

                        {/* Recent bids */}
                        <div>
                          <h4 className="font-medium mb-2">Recent Bids</h4>
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {bidHistory.map((bid) => (
                              <div key={bid.id} className="flex justify-between items-center text-sm bg-white p-2 rounded border">
                                <span className="font-medium">
                                  {bid.bidderName}
                                  <span className="text-xs text-gray-500 ml-1">({bid.teamName})</span>
                                </span>
                                <span>{formatIndianCurrency(bid.amount || 0)}</span>
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
              </TabsContent>

              <TabsContent value="roster">
                <Card>
                  <CardHeader>
                    <CardTitle>My Team Roster</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {roster.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {roster.map((actress) => (
                          <Card key={actress.id} className="border" style={{ backgroundColor: team.primaryColor || 'white' }}>
                            <CardContent className="p-4">
                              <div className="flex items-center space-x-4">
                                <img 
                                  src={actress.imageUrl || 'https://via.placeholder.com/80x100'} 
                                  alt={actress.name}
                                  className="w-16 h-20 object-cover rounded"
                                />
                                <div className="flex-1">
                                  <h3 className="font-semibold" style={{ color: team.secondaryColor || 'black' }}>
                                    {actress.name}
                                  </h3>
                                  <Badge 
                                    className="text-white mt-1"
                                    style={{ 
                                      backgroundColor: CATEGORY_COLORS[actress.category as keyof typeof CATEGORY_COLORS] || 'gray' 
                                    }}
                                  >
                                    {actress.category}
                                  </Badge>
                                  <p className="text-sm font-medium text-green-600 mt-1">
                                    {formatIndianCurrency(actress.finalPrice || actress.currentPrice)}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Star className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No actresses yet</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Start bidding in the auction to build your team!
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;
