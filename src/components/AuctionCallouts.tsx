
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, Volume2, Clock } from 'lucide-react';

interface AuctionCalloutsProps {
  currentBid: number;
  bidderName: string | null;
  actressName: string;
  timeLeft: number;
  isActive: boolean;
  bidCount: number;
}

const AuctionCallouts: React.FC<AuctionCalloutsProps> = ({
  currentBid,
  bidderName,
  actressName,
  timeLeft,
  isActive,
  bidCount
}) => {
  const [callout, setCallout] = useState('');
  const [isCountdown, setIsCountdown] = useState(false);
  const [countdownPhase, setCountdownPhase] = useState('');
  const [dramaticCountdown, setDramaticCountdown] = useState('');

  const bidCallouts = [
    "What a bid! The excitement is building!",
    "The stakes are rising! Who will step up next?",
    "Incredible! The bidding war is heating up!",
    "Fantastic bid! The tension is palpable!",
    "Outstanding! The auction is getting intense!",
    "Magnificent bid! The competition is fierce!",
    "Spectacular! The price is climbing fast!",
    "Amazing! The energy in the room is electric!",
    "Brilliant move! The auction just got spicy!",
    "Sensational! That's how you make a statement!",
    "Phenomenal! The crowd is going wild!",
    "Explosive bid! The temperature is rising!"
  ];

  const countdownCallouts = [
    "Going once... do I hear any more bids?",
    "Going twice... this is your last chance!",
    "Final call... any more takers?",
    "Time is running out... anyone?",
    "Last opportunity... speak now or forever hold your peace!",
    "Closing soon... final bids please!",
    "The hammer is about to fall... last chance!",
    "Any final bids? Don't let this slip away!"
  ];

  const highBidCallouts = [
    "What a massive bid! The crowd goes wild!",
    "Incredible! That's a game-changing amount!",
    "Spectacular bid! The auction just got serious!",
    "Phenomenal! That's a statement bid right there!",
    "Unbelievable! The stakes just went through the roof!",
    "Mind-blowing! That's how champions bid!"
  ];

  const dramaticCountdownSequence = [
    "1... do I see any movement?",
    "1.5... anyone ready to strike?",
    "2... the tension is unbearable!",
    "2.5... final moments slipping away...",
    "3... and we're done!"
  ];

  useEffect(() => {
    if (!isActive) return;

    if (timeLeft <= 15 && timeLeft > 0) {
      setIsCountdown(true);
      
      if (timeLeft <= 5) {
        // Dramatic countdown phase
        const countdownIndex = Math.min(4, Math.floor((5 - timeLeft) * 1.2));
        setDramaticCountdown(dramaticCountdownSequence[countdownIndex] || "Final seconds!");
        setCallout("The hammer is falling!");
      } else if (timeLeft <= 10) {
        setCallout(countdownCallouts[Math.floor(Math.random() * countdownCallouts.length)]);
        setCountdownPhase("GOING TWICE");
      } else {
        setCallout(countdownCallouts[Math.floor(Math.random() * countdownCallouts.length)]);
        setCountdownPhase("GOING ONCE");
      }
    } else {
      setIsCountdown(false);
      setCountdownPhase('');
      setDramaticCountdown('');
      
      if (bidderName && currentBid > 0) {
        if (currentBid >= 5000000) { // 50 lakh+
          setCallout(highBidCallouts[Math.floor(Math.random() * highBidCallouts.length)]);
        } else {
          setCallout(bidCallouts[Math.floor(Math.random() * bidCallouts.length)]);
        }
      } else {
        setCallout(`Who will open the bidding for the gorgeous ${actressName}? Let's start the action!`);
      }
    }
  }, [currentBid, bidderName, timeLeft, isActive, actressName, bidCount]);

  if (!isActive) return null;

  return (
    <Card className={`${isCountdown ? 'bg-gradient-to-r from-red-600 to-orange-600' : 'bg-gradient-to-r from-purple-600 to-pink-600'} text-white border-0 shadow-2xl`}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {isCountdown ? (
              <Clock className={`h-6 w-6 ${timeLeft <= 5 ? 'animate-spin' : 'animate-pulse'}`} />
            ) : (
              <Mic className="h-5 w-5" />
            )}
            <Badge variant="secondary" className={`${isCountdown ? 'bg-red-100 text-red-800' : 'bg-white text-purple-600'} font-bold px-3 py-1`}>
              {isCountdown ? countdownPhase || "COUNTDOWN" : "LIVE AUCTION"}
            </Badge>
          </div>
          
          <div className="flex-1 text-center">
            <p className={`font-bold ${isCountdown ? 'text-2xl animate-pulse' : 'text-xl'} mb-2`}>
              {callout}
            </p>
            
            {dramaticCountdown && (
              <div className="text-3xl font-bold animate-bounce text-yellow-300">
                {dramaticCountdown}
              </div>
            )}
            
            {bidCount > 0 && !isCountdown && (
              <p className="text-sm opacity-90 mt-1">
                🔥 {bidCount} bids so far! The competition is fierce! 🔥
              </p>
            )}
          </div>
          
          <div className="text-right">
            <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-yellow-300 animate-pulse' : ''}`}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
            {timeLeft <= 5 && timeLeft > 0 && (
              <div className="text-4xl font-bold animate-bounce text-yellow-300">
                {timeLeft}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuctionCallouts;
