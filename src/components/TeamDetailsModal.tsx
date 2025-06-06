
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Team, Actress, CATEGORY_COLORS, CATEGORY_LIMITS } from '@/types';
import { formatIndianCurrency } from '@/utils/currencyUtils';
import { Trophy, Users, DollarSign, Star, Crown, Sparkles, Clock, Zap } from 'lucide-react';

interface TeamDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
  roster: Actress[];
}

const TeamDetailsModal: React.FC<TeamDetailsModalProps> = ({ isOpen, onClose, team, roster }) => {
  const categories = [
    { name: 'Blockbuster Queens', icon: Crown },
    { name: 'Global Glam', icon: Star },
    { name: 'Drama Diva', icon: Trophy },
    { name: 'Next-Gen Stars', icon: Sparkles },
    { name: 'Timeless Icons', icon: Clock },
    { name: 'Gen-Z', icon: Zap },
  ];

  const getCategoryCount = (category: string) => {
    return roster.filter(actress => actress.category === category).length;
  };

  const getCategoryLimit = (category: string) => {
    return CATEGORY_LIMITS[category as keyof typeof CATEGORY_LIMITS] || team.maxActresses || 0;
  };

  const totalSpent = (team.budget || 0) - (team.remainingPurse || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto premium-card">
        <DialogHeader>
          <DialogTitle 
            className="text-xl font-bold p-3 rounded-lg text-white"
            style={{
              backgroundColor: team.primaryColor || '#667eea',
              color: team.secondaryColor || 'white'
            }}
          >
            {team.name} - Detailed Report
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Team Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="glass-effect">
              <CardContent className="p-4 text-center">
                <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Total Budget</p>
                <p className="text-lg font-bold">{formatIndianCurrency(team.budget || 0)}</p>
              </CardContent>
            </Card>
            
            <Card className="glass-effect">
              <CardContent className="p-4 text-center">
                <DollarSign className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Amount Spent</p>
                <p className="text-lg font-bold">{formatIndianCurrency(totalSpent)}</p>
              </CardContent>
            </Card>
            
            <Card className="glass-effect">
              <CardContent className="p-4 text-center">
                <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Remaining</p>
                <p className="text-lg font-bold">{formatIndianCurrency(team.remainingPurse || 0)}</p>
              </CardContent>
            </Card>
            
            <Card className="glass-effect">
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Squad Size</p>
                <p className="text-lg font-bold">{roster.length}/{team.maxActresses}</p>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          <Card className="premium-card">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-purple-800 flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Category Breakdown
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map(({ name, icon: Icon }) => {
                  const current = getCategoryCount(name);
                  const limit = getCategoryLimit(name);
                  const remaining = Math.max(0, limit - current);
                  
                  return (
                    <div 
                      key={name}
                      className="p-4 rounded-lg border-2"
                      style={{ 
                        borderColor: CATEGORY_COLORS[name as keyof typeof CATEGORY_COLORS],
                        backgroundColor: `${CATEGORY_COLORS[name as keyof typeof CATEGORY_COLORS]}10`
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Icon 
                          className="h-5 w-5" 
                          style={{ color: CATEGORY_COLORS[name as keyof typeof CATEGORY_COLORS] }}
                        />
                        <span className="font-medium text-sm">{name}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Current:</span>
                          <Badge 
                            className="text-white"
                            style={{ backgroundColor: CATEGORY_COLORS[name as keyof typeof CATEGORY_COLORS] }}
                          >
                            {current}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Limit:</span>
                          <span className="font-medium">{limit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Can Add:</span>
                          <span className="font-medium text-green-600">{remaining}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Current Roster */}
          <Card className="premium-card">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-purple-800 flex items-center gap-2">
                <Star className="h-5 w-5" />
                Current Roster
              </h3>
              {roster.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roster.map((actress) => (
                    <div 
                      key={actress.id} 
                      className="p-4 rounded-lg border glass-effect"
                      style={{ borderColor: CATEGORY_COLORS[actress.category as keyof typeof CATEGORY_COLORS] }}
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={actress.imageUrl || 'https://via.placeholder.com/60x80'} 
                          alt={actress.name}
                          className="w-12 h-16 object-cover rounded border-2"
                          style={{ borderColor: CATEGORY_COLORS[actress.category as keyof typeof CATEGORY_COLORS] }}
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{actress.name}</h4>
                          <Badge 
                            className="text-white text-xs mt-1"
                            style={{ backgroundColor: CATEGORY_COLORS[actress.category as keyof typeof CATEGORY_COLORS] }}
                          >
                            {actress.category}
                          </Badge>
                          <p className="text-sm font-medium text-green-600 mt-1">
                            {formatIndianCurrency(actress.finalPrice || actress.currentPrice)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No actresses in the roster yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamDetailsModal;
