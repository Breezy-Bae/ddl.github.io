
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CATEGORY_COLORS, CATEGORY_LIMITS, Actress } from '@/types';
import { Crown, Star, Trophy, Sparkles, Clock, Zap } from 'lucide-react';

interface CategoryStatusProps {
  roster: Actress[];
  maxActresses: number;
}

const CategoryStatus: React.FC<CategoryStatusProps> = ({ roster, maxActresses }) => {
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
    return CATEGORY_LIMITS[category as keyof typeof CATEGORY_LIMITS] || maxActresses;
  };

  return (
    <Card className="premium-card">
      <CardHeader>
        <CardTitle className="text-purple-800 flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Category Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map(({ name, icon: Icon }) => {
            const current = getCategoryCount(name);
            const limit = getCategoryLimit(name);
            const remaining = Math.max(0, limit - current);
            
            return (
              <div 
                key={name} 
                className="glass-effect p-3 rounded-lg border"
                style={{ borderColor: CATEGORY_COLORS[name as keyof typeof CATEGORY_COLORS] }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4" style={{ color: CATEGORY_COLORS[name as keyof typeof CATEGORY_COLORS] }} />
                  <span className="text-xs font-medium truncate">{name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <Badge 
                    variant="outline"
                    className="text-white text-xs"
                    style={{ 
                      backgroundColor: CATEGORY_COLORS[name as keyof typeof CATEGORY_COLORS],
                      borderColor: CATEGORY_COLORS[name as keyof typeof CATEGORY_COLORS]
                    }}
                  >
                    {current}/{limit}
                  </Badge>
                  <span className="text-xs text-gray-600">
                    {remaining} left
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 p-3 glass-effect rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium text-purple-800">Total Squad:</span>
            <Badge variant="outline" className="bg-purple-100 text-purple-800">
              {roster.length}/{maxActresses}
            </Badge>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600">Available Slots:</span>
            <span className="font-medium text-green-600">
              {maxActresses - roster.length}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryStatus;
