
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Actress, Team, CATEGORY_COLORS } from '@/types';
import { formatIndianCurrency } from '@/utils/currencyUtils';
import EditActressForm from './EditActressForm';
import { Edit, Trash2 } from 'lucide-react';

interface ActressPoolTableProps {
  actresses: Actress[];
  teams: Team[];
}

const ActressPoolTable: React.FC<ActressPoolTableProps> = ({ actresses, teams }) => {
  const [editingActress, setEditingActress] = useState<Actress | null>(null);

  const getTeamName = (teamId: string | undefined) => {
    if (!teamId) return 'Available';
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Unknown Team';
  };

  const getStatusBadge = (actress: Actress) => {
    if (actress.isOnAuction) {
      return <Badge variant="destructive">On Auction</Badge>;
    }
    if (actress.teamId) {
      return <Badge variant="default">Sold</Badge>;
    }
    if (actress.isAvailable) {
      return <Badge variant="secondary">Available</Badge>;
    }
    return <Badge variant="outline">Inactive</Badge>;
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Base Price</TableHead>
              <TableHead>Current Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Final Price</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actresses.map((actress) => (
              <TableRow key={actress.id}>
                <TableCell>
                  <img 
                    src={actress.imageUrl || 'https://via.placeholder.com/60x80'} 
                    alt={actress.name}
                    className="w-12 h-16 object-cover rounded"
                  />
                </TableCell>
                <TableCell className="font-medium">{actress.name}</TableCell>
                <TableCell>
                  <Badge 
                    style={{ 
                      backgroundColor: CATEGORY_COLORS[actress.category] || '#gray',
                      color: 'white'
                    }}
                  >
                    {actress.category}
                  </Badge>
                </TableCell>
                <TableCell>{formatIndianCurrency(actress.basePrice)}</TableCell>
                <TableCell>{formatIndianCurrency(actress.currentPrice)}</TableCell>
                <TableCell>{getStatusBadge(actress)}</TableCell>
                <TableCell>{getTeamName(actress.teamId)}</TableCell>
                <TableCell>
                  {actress.finalPrice ? formatIndianCurrency(actress.finalPrice) : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingActress(actress)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingActress && (
        <EditActressForm
          isOpen={!!editingActress}
          onClose={() => setEditingActress(null)}
          actress={editingActress}
        />
      )}
    </>
  );
};

export default ActressPoolTable;
