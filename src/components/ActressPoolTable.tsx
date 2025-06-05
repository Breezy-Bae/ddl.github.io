
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Actress, Team, CATEGORY_COLORS } from '@/types';

interface ActressPoolTableProps {
  actresses: Actress[];
  teams: Team[];
}

const ActressPoolTable: React.FC<ActressPoolTableProps> = ({ actresses, teams }) => {
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
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Base Price</TableHead>
            <TableHead>Current Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Final Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {actresses.map((actress) => (
            <TableRow key={actress.id}>
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
              <TableCell>₹{actress.basePrice.toLocaleString()}</TableCell>
              <TableCell>₹{actress.currentPrice.toLocaleString()}</TableCell>
              <TableCell>{getStatusBadge(actress)}</TableCell>
              <TableCell>{getTeamName(actress.teamId)}</TableCell>
              <TableCell>
                {actress.finalPrice ? `₹${actress.finalPrice.toLocaleString()}` : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ActressPoolTable;
