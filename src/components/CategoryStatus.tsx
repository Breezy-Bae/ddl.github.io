
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
    <Card className="bg-[#fbfffe] border-[#6d676e] shadow-lg">
      <CardHeader>
        <CardTitle className="text-[#96031a] flex items-center gap-2">
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
                className="bg-gradient-to-br from-[#fbfffe] to-[#6d676e]/10 p-3 rounded-lg border-2 shadow-md hover:shadow-lg transition-all duration-200"
                style={{ borderColor: CATEGORY_COLORS[name as keyof typeof CATEGORY_COLORS] }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4" style={{ color: CATEGORY_COLORS[name as keyof typeof CATEGORY_COLORS] }} />
                  <span className="text-xs font-medium truncate text-[#1b1b1e]">{name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <Badge 
                    variant="outline"
                    className="text-white text-xs font-bold"
                    style={{ 
                      backgroundColor: CATEGORY_COLORS[name as keyof typeof CATEGORY_COLORS],
                      borderColor: CATEGORY_COLORS[name as keyof typeof CATEGORY_COLORS]
                    }}
                  >
                    {current}/{limit}
                  </Badge>
                  <span className="text-xs text-[#6d676e] font-medium">
                    {remaining} left
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 p-3 bg-gradient-to-r from-[#96031a]/10 to-[#faa916]/10 rounded-lg border border-[#6d676e]">
          <div className="flex justify-between items-center">
            <span className="font-medium text-[#1b1b1e]">Total Squad:</span>
            <Badge variant="outline" className="bg-[#96031a] text-[#fbfffe] border-[#96031a]">
              {roster.length}/{maxActresses}
            </Badge>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-[#6d676e]">Available Slots:</span>
            <span className="font-medium text-[#faa916]">
              {maxActresses - roster.length}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryStatus;
