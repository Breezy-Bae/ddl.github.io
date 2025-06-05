
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, Volume2 } from 'lucide-react';

interface AuctionCalloutsProps {
  currentBid: number;
  bidderName: string | null;
  actressName: string;
  timeLeft: number;
  isActive: boolean;
}

const AuctionCallouts: React.FC<AuctionCalloutsProps> = ({
  currentBid,
  bidderName,
  actressName,
  timeLeft,
  isActive
}) => {
  const [callout, setCallout] = useState('');
  const [isCountdown, setIsCountdown] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState('');

  const bidCallouts = [
    "What a bid! The excitement is building!",
    "The stakes are rising! Who will step up next?",
    "Incredible! The bidding war is heating up!",
    "Fantastic bid! The tension is palpable!",
    "Outstanding! The auction is getting intense!",
    "Magnificent bid! The competition is fierce!",
    "Spectacular! The price is climbing fast!",
    "Amazing! The energy in the room is electric!"
  ];

  const countdownCallouts = [
    "Going once... do I hear any more bids?",
    "Going twice... this is your last chance!",
    "Final call... any more takers?",
    "Time is running out... anyone?",
    "Last opportunity... speak now or forever hold your peace!",
    "Closing soon... final bids please!"
  ];

  const highBidCallouts = [
    "What a massive bid! The crowd goes wild!",
    "Incredible! That's a game-changing amount!",
    "Spectacular bid! The auction just got serious!",
    "Phenomenal! That's a statement bid right there!"
  ];

  useEffect(() => {
    if (!isActive) return;

    if (timeLeft <= 10 && timeLeft > 0) {
      setIsCountdown(true);
      const messages = ["Going once", "Going twice", "Final call", "Last chance"];
      const index = Math.max(0, Math.min(messages.length - 1, Math.floor((10 - timeLeft) / 2.5)));
      setCallout(messages[index] + "...");
      
      if (timeLeft <= 3) {
        setCountdownNumber(Math.ceil(timeLeft).toString());
      }
    } else {
      setIsCountdown(false);
      setCountdownNumber('');
      
      if (bidderName && currentBid > 0) {
        if (currentBid >= 5000000) { // 50 lakh+
          setCallout(highBidCallouts[Math.floor(Math.random() * highBidCallouts.length)]);
        } else {
          setCallout(bidCallouts[Math.floor(Math.random() * bidCallouts.length)]);
        }
      } else {
        setCallout(`Who will open the bidding for the gorgeous ${actressName}?`);
      }
    }
  }, [currentBid, bidderName, timeLeft, isActive, actressName]);

  if (!isActive) return null;

  return (
    <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isCountdown ? (
              <Volume2 className="h-5 w-5 animate-pulse" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
            <Badge variant="secondary" className="bg-white text-purple-600">
              {isCountdown ? "COUNTDOWN" : "LIVE"}
            </Badge>
          </div>
          
          <div className="flex-1 text-center">
            <p className={`font-bold ${isCountdown ? 'text-xl animate-pulse' : 'text-lg'}`}>
              {callout}
            </p>
            {countdownNumber && (
              <div className="text-4xl font-bold animate-bounce mt-2">
                {countdownNumber}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuctionCallouts;
