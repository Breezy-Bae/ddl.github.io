
import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Actress, Team, CATEGORY_COLORS } from '@/types';
import { formatIndianCurrency } from '@/utils/currencyUtils';
import EditActressForm from './EditActressForm';
import { Edit, Search, Filter, SortAsc, SortDesc } from 'lucide-react';

interface ActressPoolTableProps {
  actresses: Actress[];
  teams: Team[];
}

const ActressPoolTable: React.FC<ActressPoolTableProps> = ({ actresses, teams }) => {
  const [editingActress, setEditingActress] = useState<Actress | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<'name' | 'basePrice' | 'currentPrice' | 'finalPrice'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const categories = ['Blockbuster Queens', 'Global Glam', 'Drama Diva', 'Next-Gen Stars', 'Timeless Icons', 'Gen-Z'];

  const filteredAndSortedActresses = useMemo(() => {
    let filtered = actresses.filter(actress => {
      const matchesSearch = actress.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || actress.category === categoryFilter;
      const matchesTeam = teamFilter === 'all' || 
        (teamFilter === 'available' && !actress.teamId) ||
        (teamFilter !== 'available' && actress.teamId === teamFilter);
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'available' && actress.isAvailable && !actress.teamId) ||
        (statusFilter === 'sold' && actress.teamId) ||
        (statusFilter === 'auction' && actress.isOnAuction);

      return matchesSearch && matchesCategory && matchesTeam && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'basePrice':
          aValue = a.basePrice;
          bValue = b.basePrice;
          break;
        case 'currentPrice':
          aValue = a.currentPrice;
          bValue = b.currentPrice;
          break;
        case 'finalPrice':
          aValue = a.finalPrice || 0;
          bValue = b.finalPrice || 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue as string) : (bValue as string).localeCompare(aValue);
      } else {
        return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
      }
    });

    return filtered;
  }, [actresses, searchTerm, categoryFilter, teamFilter, statusFilter, sortField, sortOrder]);

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

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };

  return (
    <>
      <div className="space-y-4 mb-6">
        {/* Search and Filters */}
        <div className="glass-effect p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search actresses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="auction">On Auction</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {filteredAndSortedActresses.length} of {actresses.length}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {categories.map(category => {
            const count = actresses.filter(a => a.category === category).length;
            const soldCount = actresses.filter(a => a.category === category && a.teamId).length;
            
            return (
              <div 
                key={category}
                className="glass-effect p-2 rounded text-center cursor-pointer hover:opacity-80"
                onClick={() => setCategoryFilter(category)}
                style={{ borderLeft: `4px solid ${CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]}` }}
              >
                <p className="text-xs font-medium truncate">{category}</p>
                <p className="text-sm">
                  <span className="text-green-600">{soldCount}</span>
                  <span className="text-gray-400">/</span>
                  <span>{count}</span>
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto premium-card rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-purple-50">
              <TableHead>Image</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-purple-100"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  Name <SortIcon field="name" />
                </div>
              </TableHead>
              <TableHead>Category</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-purple-100"
                onClick={() => handleSort('basePrice')}
              >
                <div className="flex items-center gap-2">
                  Base Price <SortIcon field="basePrice" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-purple-100"
                onClick={() => handleSort('currentPrice')}
              >
                <div className="flex items-center gap-2">
                  Current Price <SortIcon field="currentPrice" />
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Team</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-purple-100"
                onClick={() => handleSort('finalPrice')}
              >
                <div className="flex items-center gap-2">
                  Final Price <SortIcon field="finalPrice" />
                </div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedActresses.map((actress) => (
              <TableRow key={actress.id} className="hover:bg-purple-25">
                <TableCell>
                  <img 
                    src={actress.imageUrl || 'https://via.placeholder.com/60x80'} 
                    alt={actress.name}
                    className="w-12 h-16 object-cover rounded border-2"
                    style={{ borderColor: CATEGORY_COLORS[actress.category as keyof typeof CATEGORY_COLORS] }}
                  />
                </TableCell>
                <TableCell className="font-medium">{actress.name}</TableCell>
                <TableCell>
                  <Badge 
                    className="text-white"
                    style={{ 
                      backgroundColor: CATEGORY_COLORS[actress.category as keyof typeof CATEGORY_COLORS]
                    }}
                  >
                    {actress.category}
                  </Badge>
                </TableCell>
                <TableCell>{formatIndianCurrency(actress.basePrice)}</TableCell>
                <TableCell>{formatIndianCurrency(actress.currentPrice)}</TableCell>
                <TableCell>{getStatusBadge(actress)}</TableCell>
                <TableCell>
                  <span 
                    className="px-2 py-1 rounded text-sm"
                    style={{
                      backgroundColor: actress.teamId ? 
                        teams.find(t => t.id === actress.teamId)?.primaryColor || '#f3f4f6' : '#f3f4f6',
                      color: actress.teamId ? 
                        teams.find(t => t.id === actress.teamId)?.secondaryColor || '#374151' : '#374151'
                    }}
                  >
                    {getTeamName(actress.teamId)}
                  </span>
                </TableCell>
                <TableCell>
                  {actress.finalPrice ? formatIndianCurrency(actress.finalPrice) : '-'}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingActress(actress)}
                    className="hover:bg-purple-50"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
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
