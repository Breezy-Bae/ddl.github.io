import React, { useState, useEffect, useRef } from 'react';
import { doc, setDoc, updateDoc, serverTimestamp, runTransaction, collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuctionStatus } from '@/hooks/useAuctionStatus';
import { Actress, BidHistory, Team, CATEGORY_COLORS, User } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Play, Pause, Square, Timer, Gavel, Settings, Download, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import AuctionCallouts from './AuctionCallouts';
import { useAuth } from '@/hooks/useAuth';
import { formatIndianCurrency } from '@/utils/currencyUtils';
import { exportBidHistory } from '@/utils/exportUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface AuctionControlProps {
  actresses: Actress[];
}

const AuctionControl: React.FC<AuctionControlProps> = ({ actresses }) => {
  const { auctionState } = useAuctionStatus();
  const { user } = useAuth();
  const [selectedActress, setSelectedActress] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [customDuration, setCustomDuration] = useState(30); // 30 seconds default
  const [showSettings, setShowSettings] = useState(false);
  const [bidHistory, setBidHistory] = useState<BidHistory[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeams, setActiveTeams] = useState<Array<{ id: string; name: string; ownerName: string }>>([]);
  const [pausedStatus, setPausedStatus] = useState({
    isPaused: false,
    pausedBy: '',
    pausedAt: 0
  });
  
  const timerRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribeTeams = onSnapshot(
      query(collection(db, 'teams'), where('isActive', '==', true)),
      (snapshot) => {
        const teamsData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Team));
        setTeams(teamsData);
        
        const activeTeamsList = teamsData
          .filter(team => team.ownerId)
          .map(team => ({
            id: team.id,
            name: team.name,
            ownerName: team.ownerName || 'Unknown Owner'
          }));
        
        setActiveTeams(activeTeamsList);
      }
    );

    return () => {
      unsubscribeTeams();
    };
  }, []);

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
          setBidHistory(bids);
        }
      );
      return unsubscribe;
    }
  }, [auctionState?.currentItem]);

  useEffect(() => {
    // Clean up interval when component unmounts
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (auctionState?.isActive && auctionState?.startTime && auctionState?.auctionDuration) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Set up new timer
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const startTime = auctionState.startTime?.toMillis() || now;
        const elapsed = Math.floor((now - startTime) / 1000);
        const duration = auctionState.auctionDuration || customDuration;
        const remaining = Math.max(0, duration - elapsed);
        
        setTimeLeft(remaining);
        timerRef.current = remaining;
        
        if (remaining === 0) {
          handleEndAuction();
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }, 1000);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else if (!auctionState?.isActive && auctionState?.pausedAt) {
      // When paused, keep displaying the paused time
      setTimeLeft(auctionState.pausedAt);
      setPausedStatus({
        isPaused: true, 
        pausedBy: auctionState.pausedBy || 'Admin', 
        pausedAt: auctionState.pausedAt
      });
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [auctionState, customDuration]);

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
        timeRemaining: customDuration,
        auctionDuration: customDuration,
        startTime: serverTimestamp(),
        lastBidTime: null,
        bidCount: 0,
        pausedAt: null,
        pausedBy: null,
        activeTeams: activeTeams
      });

      // Mark actress as on auction
      await updateDoc(doc(db, 'actresses', actress.id), {
        isOnAuction: true,
        currentPrice: actress.basePrice
      });

      toast({
        title: "Auction started",
        description: `Auction for ${actress.name} has started for ${customDuration} seconds`,
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
      const currentTime = timerRef.current || timeLeft;
      await updateDoc(doc(db, 'auction', 'current'), {
        isActive: false,
        pausedAt: currentTime,
        pausedBy: user?.displayName || 'Admin'
      });

      toast({
        title: "Auction paused",
        description: `The auction has been paused by ${user?.displayName || 'Admin'}`,
      });
    } catch (error) {
      console.error('Error pausing auction:', error);
    }
  };

  const resumeAuction = async () => {
    try {
      const now = new Date();
      const newDuration = timerRef.current || timeLeft;
      
      await updateDoc(doc(db, 'auction', 'current'), {
        isActive: true,
        pausedAt: null,
        pausedBy: null,
        startTime: serverTimestamp(),
        auctionDuration: newDuration
      });

      toast({
        title: "Auction resumed",
        description: "The auction has been resumed",
      });
    } catch (error) {
      console.error('Error resuming auction:', error);
    }
  };

  const extendAuctionTime = async (additionalSeconds: number) => {
    try {
      await updateDoc(doc(db, 'auction', 'current'), {
        auctionDuration: (auctionState?.auctionDuration || 0) + additionalSeconds
      });

      toast({
        title: "Time extended",
        description: `Added ${additionalSeconds} seconds to the auction`,
      });
    } catch (error) {
      console.error('Error extending auction time:', error);
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
          timeRemaining: 0,
          auctionDuration: 0,
          bidCount: 0,
          pausedAt: null,
          pausedBy: null
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

  const handleCancelBid = async (bid: BidHistory) => {
    try {
      // Get previous bid from history
      const previousBids = bidHistory.filter(b => b.id !== bid.id);
      const previousBid = previousBids[0]; // The next most recent bid
      
      await runTransaction(db, async (transaction) => {
        const auctionRef = doc(db, 'auction', 'current');
        
        if (previousBid) {
          // Revert to previous bid
          transaction.update(auctionRef, {
            highestBid: previousBid.amount,
            highestBidder: previousBid.userId,
            highestBidderTeam: previousBid.teamId,
            highestBidderName: previousBid.bidderName,
            bidCount: (auctionState?.bidCount || 0) - 1
          });
        } else {
          // If no previous bid, revert to base price
          transaction.update(auctionRef, {
            highestBid: auctionState?.currentItem?.basePrice || 0,
            highestBidder: null,
            highestBidderTeam: null,
            highestBidderName: null,
            bidCount: 0
          });
        }
      });
      
      toast({
        title: "Bid cancelled",
        description: `Cancelled bid of ₹${bid.amount.toLocaleString()} by ${bid.bidderName}`,
      });
    } catch (error) {
      console.error('Error cancelling bid:', error);
      toast({
        title: "Failed to cancel bid",
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
      {/* Auction Callouts */}
      {auctionState?.currentItem && (
        <AuctionCallouts
          currentBid={auctionState.highestBid || 0}
          bidderName={auctionState.highestBidderName}
          actressName={auctionState.currentItem.name}
          timeLeft={timeLeft}
          isActive={auctionState.isActive || false}
          bidCount={auctionState.bidCount || 0}
          pausedBy={auctionState.pausedBy}
        />
      )}

      {/* Export buttons */}
      <div className="flex justify-end space-x-2">
        <Button 
          variant="outline" 
          onClick={() => exportBidHistory(bidHistory)}
          className="flex items-center gap-1"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export Bids
        </Button>
      </div>

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
              <div className="flex gap-6 flex-col md:flex-row">
                {/* Actress Image */}
                <div className="flex-shrink-0">
                  <img
                    src={auctionState.currentItem.imageUrl || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=600&fit=crop'}
                    alt={auctionState.currentItem.name}
                    className="w-32 h-48 object-cover rounded-lg border-4"
                    style={{
                      borderColor: CATEGORY_COLORS[auctionState.currentItem.category as keyof typeof CATEGORY_COLORS] || '#purple-200'
                    }}
                  />
                </div>
                
                {/* Auction Details */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4 flex-col md:flex-row gap-2">
                    <div>
                      <h3 className="text-2xl font-bold">{auctionState.currentItem.name}</h3>
                      <Badge 
                        className="mt-1 text-lg px-3 py-1 text-white"
                        style={{ 
                          backgroundColor: CATEGORY_COLORS[auctionState.currentItem.category as keyof typeof CATEGORY_COLORS] || '#gray' 
                        }}
                      >
                        {auctionState.currentItem.category}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-2">
                        Base Price: {formatIndianCurrency(auctionState.currentItem.basePrice)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`flex items-center gap-2 font-bold text-2xl ${timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>
                        <Timer className="h-6 w-6" />
                        {formatTime(timeLeft)}
                      </div>
                      <Badge variant={auctionState.isActive ? "default" : "secondary"} className="mt-2">
                        {auctionState.isActive ? "Active" : "Paused"}
                      </Badge>
                      
                      {!auctionState.isActive && auctionState.pausedBy && (
                        <p className="text-sm text-amber-600 mt-1">
                          Paused by {auctionState.pausedBy}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border-2 border-yellow-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Current Highest Bid</p>
                        <p className="text-3xl font-bold text-green-600">{formatIndianCurrency(auctionState.highestBid || 0)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Leading Bidder</p>
                        <p className="text-xl font-bold text-purple-600">
                          {auctionState.highestBidderName || 'No bids yet'}
                        </p>
                        {auctionState.highestBidderTeam && teams.find(t => t.id === auctionState.highestBidderTeam) && (
                          <p className="text-sm font-medium">
                            Team: {teams.find(t => t.id === auctionState.highestBidderTeam)?.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
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
                <Button onClick={() => extendAuctionTime(10)} variant="outline" className="flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  +10s
                </Button>
                <Button onClick={() => extendAuctionTime(30)} variant="outline" className="flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  +30s
                </Button>
              </div>

              {/* Active Teams */}
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Active Participating Teams</h4>
                <div className="flex flex-wrap gap-2">
                  {auctionState.activeTeams && auctionState.activeTeams.length > 0 ? (
                    auctionState.activeTeams.map((team) => {
                      const fullTeamData = teams.find(t => t.id === team.id);
                      return (
                        <div 
                          key={team.id}
                          className="px-3 py-1 rounded-full text-sm"
                          style={{
                            backgroundColor: fullTeamData?.primaryColor || '#f3f4f6',
                            color: fullTeamData?.secondaryColor || '#000000'
                          }}
                        >
                          {team.name} ({team.ownerName})
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500">No teams are currently participating</p>
                  )}
                </div>
              </div>

              {/* Recent Bids */}
              {bidHistory.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">Bid History</h4>
                  </div>
                  <div className="bg-white rounded-md border overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bidder</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bidHistory.slice(0, 7).map((bid, index) => {
                          const teamData = teams.find(t => t.id === bid.teamId);
                          return (
                            <tr key={bid.id} className={index === 0 ? "bg-green-50" : ""}>
                              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                                {bid.bidderName}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm">
                                <div 
                                  className="px-2 py-1 rounded"
                                  style={{
                                    backgroundColor: teamData?.primaryColor || 'transparent',
                                    color: teamData?.secondaryColor || 'inherit'
                                  }}
                                >
                                  {bid.teamName}
                                </div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm">
                                {formatIndianCurrency(bid.amount)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800">
                                      <AlertTriangle className="h-4 w-4" />
                                      Cancel
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Cancel Bid</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to cancel the bid of {formatIndianCurrency(bid.amount)} by {bid.bidderName}? 
                                        This will revert the auction to the previous highest bid.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>No, Keep Bid</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleCancelBid(bid)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Yes, Cancel Bid
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
          <CardTitle className="flex items-center justify-between">
            <span>Start New Auction</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {showSettings && (
              <div className="bg-gray-50 p-4 rounded-lg border">
                <Label htmlFor="duration" className="text-sm font-medium">Auction Duration (seconds)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="duration"
                    type="number"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(parseInt(e.target.value) || 30)}
                    min="10"
                    max="300"
                    className="flex-1"
                  />
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => setCustomDuration(30)}>30s</Button>
                    <Button variant="outline" size="sm" onClick={() => setCustomDuration(60)}>1m</Button>
                    <Button variant="outline" size="sm" onClick={() => setCustomDuration(120)}>2m</Button>
                    <Button variant="outline" size="sm" onClick={() => setCustomDuration(180)}>3m</Button>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Select Actress to Auction</label>
              <Select value={selectedActress} onValueChange={setSelectedActress}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose an actress" />
                </SelectTrigger>
                <SelectContent>
                  {actresses.map((actress) => (
                    <SelectItem key={actress.id} value={actress.id}>
                      <div className="flex items-center gap-3">
                        <img
                          src={actress.imageUrl || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=60&h=60&fit=crop'}
                          alt={actress.name}
                          className="w-8 h-8 object-cover rounded"
                        />
                        <div className="flex items-center justify-between w-full">
                          <span>{actress.name}</span>
                          <Badge 
                            variant="outline" 
                            className="ml-2 text-white"
                            style={{ 
                              backgroundColor: CATEGORY_COLORS[actress.category as keyof typeof CATEGORY_COLORS] || '#gray' 
                            }}
                          >
                            {actress.category}
                          </Badge>
                        </div>
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
              Start Auction ({customDuration}s)
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
                  <div className="flex gap-3">
                    <img
                      src={actress.imageUrl || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=100&h=120&fit=crop'}
                      alt={actress.name}
                      className="w-16 h-20 object-cover rounded border"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{actress.name}</h3>
                        <Badge 
                          className="text-white"
                          style={{
                            backgroundColor: CATEGORY_COLORS[actress.category as keyof typeof CATEGORY_COLORS] || '#gray'
                          }}
                        >
                          {actress.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Base Price: {formatIndianCurrency(actress.basePrice)}
                      </p>
                      {actress.isOnAuction && (
                        <Badge variant="destructive" className="mt-2">
                          Currently on Auction
                        </Badge>
                      )}
                    </div>
                  </div>
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
