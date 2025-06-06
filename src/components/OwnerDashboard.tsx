
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
import CategoryStatus from './CategoryStatus';

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
    if (currentBid < 10000000) { // < 1 Cr
      return [1000000, 2000000, 5000000]; // 10L, 20L, 50L
    } else if (currentBid < 50000000) { // 1-5 Cr
      return [2000000, 5000000, 10000000]; // 20L, 50L, 1Cr
    } else if (currentBid < 100000000) { // 5-10 Cr
      return [5000000, 10000000, 20000000]; // 50L, 1Cr, 2Cr
    } else {
      return [5000000, 10000000, 20000000]; // 50L, 1Cr, 2Cr (10+ Cr)
    }
  };

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#96031a] mx-auto mb-4"></div>
          <p className="text-[#fbfffe]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md bg-[#fbfffe] border-[#96031a]">
          <CardContent className="p-6 text-center">
            <Trophy className="h-12 w-12 text-[#6d676e] mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-[#1b1b1e]">No Team Assigned</h2>
            <p className="text-[#6d676e]">You haven't been assigned to a team yet. Please contact the admin.</p>
            <Button onClick={logout} className="mt-4 bg-[#96031a] hover:bg-[#96031a]/90 text-[#fbfffe]">
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const teamStyle = {
    backgroundColor: team.primaryColor || '#96031a',
    color: team.secondaryColor || '#fbfffe',
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#96031a] to-[#1b1b1e] shadow-lg border-b border-[#6d676e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 
                className="text-2xl font-bold px-4 py-2 rounded-lg shadow-lg" 
                style={teamStyle}
              >
                {team ? `${team.name} Dashboard` : 'Team Dashboard'}
              </h1>
              <p className="text-[#fbfffe] mt-1 font-medium">Diva Draft League</p>
            </div>
            <Button 
              onClick={logout}
              variant="outline"
              className="flex items-center gap-2 bg-transparent text-[#fbfffe] border-[#fbfffe] hover:bg-[#fbfffe] hover:text-[#96031a]"
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
              <div className="bg-[#fbfffe] p-6 rounded-xl shadow-lg border border-[#6d676e]">
                <div className="flex items-center">
                  <IndianRupee className="h-8 w-8 text-[#faa916]" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-[#6d676e]">Remaining Budget</p>
                    <p className="text-2xl font-bold text-[#1b1b1e]">
                      {formatIndianCurrency(team.remainingPurse || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#fbfffe] p-6 rounded-xl shadow-lg border border-[#6d676e]">
                <div className="flex items-center">
                  <Star className="h-8 w-8 text-[#96031a]" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-[#6d676e]">Actresses</p>
                    <p className="text-2xl font-bold text-[#1b1b1e]">
                      {roster.length}/{team.maxActresses}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#fbfffe] p-6 rounded-xl shadow-lg border border-[#6d676e]">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-[#faa916]" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-[#6d676e]">Total Spent</p>
                    <p className="text-2xl font-bold text-[#1b1b1e]">
                      {formatIndianCurrency((team.budget || 0) - (team.remainingPurse || 0))}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#fbfffe] p-6 rounded-xl shadow-lg border border-[#6d676e]">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-[#96031a]" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-[#6d676e]">Available Slots</p>
                    <p className="text-2xl font-bold text-[#1b1b1e]">
                      {(team.maxActresses || 0) - roster.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Tabs defaultValue="auction" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-[#fbfffe] border border-[#6d676e]">
                <TabsTrigger value="auction" className="text-[#1b1b1e] data-[state=active]:bg-[#96031a] data-[state=active]:text-[#fbfffe]">Live Auction</TabsTrigger>
                <TabsTrigger value="roster" className="text-[#1b1b1e] data-[state=active]:bg-[#96031a] data-[state=active]:text-[#fbfffe]">My Roster</TabsTrigger>
                <TabsTrigger value="categories" className="text-[#1b1b1e] data-[state=active]:bg-[#96031a] data-[state=active]:text-[#fbfffe]">Category Status</TabsTrigger>
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
                <div className="bg-[#fbfffe] rounded-xl shadow-lg border border-[#6d676e]">
                  <div className="p-6 border-b border-[#6d676e]">
                    <h2 className="text-xl font-bold text-[#1b1b1e] flex items-center gap-2">
                      <Gavel className="h-5 w-5" />
                      Current Auction
                    </h2>
                  </div>
                  <div className="p-6">
                    {auctionState?.currentItem ? (
                      <div className="space-y-6">
                        {/* Actress Image and Details */}
                        <div className="flex gap-6">
                          <div className="flex-shrink-0">
                            <img
                              src={auctionState.currentItem.imageUrl || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=200&h=250&fit=crop'}
                              alt={auctionState.currentItem.name}
                              className="w-32 h-40 object-cover rounded-xl border-4 shadow-lg"
                              style={{ 
                                borderColor: CATEGORY_COLORS[auctionState.currentItem.category as keyof typeof CATEGORY_COLORS] || '#96031a' 
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="text-2xl font-bold text-[#1b1b1e]">{auctionState.currentItem.name}</h3>
                                <Badge 
                                  className="mt-2 text-white px-3 py-1 text-sm"
                                  style={{ 
                                    backgroundColor: CATEGORY_COLORS[auctionState.currentItem.category as keyof typeof CATEGORY_COLORS] || '#96031a' 
                                  }}
                                >
                                  {auctionState.currentItem.category}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <div className={`flex items-center gap-2 font-bold text-2xl ${timeLeft <= 10 ? 'text-[#96031a] animate-pulse' : 'text-[#faa916]'}`}>
                                  <Timer className="h-6 w-6" />
                                  {formatTime(timeLeft)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Active Participating Teams */}
                        {auctionState.activeTeams && auctionState.activeTeams.length > 0 && (
                          <div className="bg-gradient-to-r from-[#6d676e]/20 to-[#faa916]/20 p-4 rounded-lg border-l-4 border-[#96031a]">
                            <p className="font-medium mb-3 text-[#1b1b1e]">Participating Teams:</p>
                            <div className="flex flex-wrap gap-2">
                              {auctionState.activeTeams.map(activeTeam => (
                                <Badge 
                                  key={activeTeam.id} 
                                  variant="outline" 
                                  className="px-3 py-1 border-2"
                                  style={{
                                    borderColor: activeTeam.primaryColor || '#6d676e',
                                    backgroundColor: activeTeam.primaryColor || '#fbfffe',
                                    color: activeTeam.secondaryColor || '#1b1b1e'
                                  }}
                                >
                                  {activeTeam.name} ({activeTeam.ownerName})
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="bg-gradient-to-r from-[#96031a] to-[#1b1b1e] p-6 rounded-xl border-2 border-[#faa916] shadow-lg">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[#fbfffe] font-medium">Current Highest Bid:</span>
                            <span className="text-3xl font-bold text-[#faa916]">{formatIndianCurrency(auctionState.highestBid || 0)}</span>
                          </div>
                          {auctionState.highestBidderName && (
                            <div className="flex justify-between items-center">
                              <span className="text-[#fbfffe] font-medium">Leading Bidder:</span>
                              <span className="font-bold text-[#faa916]">
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

                        <div className="flex gap-3">
                          <Input
                            type="number"
                            placeholder="Enter bid amount"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            className="flex-1 border-2 border-[#96031a] focus:border-[#faa916] bg-[#fbfffe] text-[#1b1b1e]"
                            disabled={!auctionState.isActive}
                            min={(auctionState.highestBid || 0) === 0 ? auctionState.currentItem.basePrice : (auctionState.highestBid || 0) + 1}
                          />
                          <Button 
                            onClick={handlePlaceBid}
                            disabled={!auctionState.isActive || !bidAmount || parseInt(bidAmount) <= (auctionState.highestBid || 0)}
                            className="px-6 py-2 font-bold shadow-lg"
                            style={teamStyle}
                          >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Bid
                          </Button>
                        </div>

                        {/* Quick bid buttons */}
                        {auctionState.isActive && (
                          <div className="flex gap-2 flex-wrap">
                            {(auctionState.highestBid || 0) === 0 ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setBidAmount(auctionState.currentItem.basePrice.toString())}
                                disabled={auctionState.currentItem.basePrice > (team.remainingPurse || 0)}
                                className="border-[#faa916] text-[#faa916] hover:bg-[#faa916] hover:text-[#fbfffe] bg-[#fbfffe]"
                              >
                                Base Price: {formatIndianCurrency(auctionState.currentItem.basePrice)}
                              </Button>
                            ) : (
                              getBidIncrements(auctionState.highestBid || 0).map((increment) => (
                                <Button
                                  key={increment}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setBidAmount(((auctionState.highestBid || 0) + increment).toString())}
                                  disabled={(auctionState.highestBid || 0) + increment > (team.remainingPurse || 0)}
                                  className="border-[#96031a] text-[#96031a] hover:bg-[#96031a] hover:text-[#fbfffe] bg-[#fbfffe]"
                                >
                                  +{formatIndianCurrency(increment)}
                                </Button>
                              ))
                            )}
                          </div>
                        )}

                        {/* Recent bids */}
                        <div className="bg-gradient-to-r from-[#6d676e]/10 to-[#faa916]/10 p-4 rounded-lg border border-[#6d676e]">
                          <h4 className="font-medium mb-3 text-[#1b1b1e]">Recent Bids</h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {bidHistory.map((bid) => (
                              <div key={bid.id} className="flex justify-between items-center text-sm bg-[#fbfffe] p-3 rounded-lg border border-[#6d676e] shadow-sm">
                                <span className="font-medium text-[#1b1b1e]">
                                  {bid.bidderName}
                                  <span className="text-xs text-[#6d676e] ml-1">({bid.teamName})</span>
                                </span>
                                <span className="font-bold text-[#faa916]">{formatIndianCurrency(bid.amount || 0)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-[#6d676e]">
                        <Gavel className="h-16 w-16 mx-auto mb-4 text-[#6d676e]" />
                        <p className="text-lg font-medium">No active auction at the moment</p>
                        <p className="text-sm">Check back later for upcoming auctions</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="roster">
                <div className="bg-[#fbfffe] rounded-xl shadow-lg border border-[#6d676e]">
                  <div className="p-6 border-b border-[#6d676e]">
                    <h2 className="text-xl font-bold text-[#1b1b1e]">My Team Roster</h2>
                  </div>
                  <div className="p-6">
                    {roster.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {roster.map((actress) => (
                          <div 
                            key={actress.id} 
                            className="bg-[#fbfffe] rounded-lg p-4 border-l-4 shadow-lg"
                            style={{ 
                              borderLeftColor: CATEGORY_COLORS[actress.category as keyof typeof CATEGORY_COLORS],
                              backgroundColor: team.primaryColor || '#fbfffe' 
                            }}
                          >
                            <div className="flex items-center space-x-4">
                              <img 
                                src={actress.imageUrl || 'https://via.placeholder.com/80x100'} 
                                alt={actress.name}
                                className="w-16 h-20 object-cover rounded-lg border-2"
                                style={{ borderColor: CATEGORY_COLORS[actress.category as keyof typeof CATEGORY_COLORS] }}
                              />
                              <div className="flex-1">
                                <h3 className="font-semibold" style={{ color: team.secondaryColor || '#1b1b1e' }}>
                                  {actress.name}
                                </h3>
                                <Badge 
                                  className="text-white mt-1"
                                  style={{ 
                                    backgroundColor: CATEGORY_COLORS[actress.category as keyof typeof CATEGORY_COLORS] || '#96031a' 
                                  }}
                                >
                                  {actress.category}
                                </Badge>
                                <p className="text-sm font-medium text-[#faa916] mt-1">
                                  {formatIndianCurrency(actress.finalPrice || actress.currentPrice)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Star className="mx-auto h-16 w-16 text-[#6d676e]" />
                        <h3 className="mt-4 text-lg font-medium text-[#1b1b1e]">No actresses yet</h3>
                        <p className="mt-2 text-[#6d676e]">
                          Start bidding in the auction to build your team!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="categories">
                <CategoryStatus roster={roster} maxActresses={team.maxActresses || 0} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;
