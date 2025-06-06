import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { User, Team, Actress, CATEGORY_COLORS } from '@/types';
import CreateUserForm from './CreateUserForm';
import CreateTeamForm from './CreateTeamForm';
import AddActressForm from './AddActressForm';
import UsersTable from './UsersTable';
import ActressPoolTable from './ActressPoolTable';
import AuctionControl from './AuctionControl';
import { Users, UserPlus, Trophy, Star, Gavel, LogOut, Edit, FileSpreadsheet } from 'lucide-react';
import { formatIndianCurrency } from '@/utils/currencyUtils';
import EditTeamForm from './EditTeamForm';
import { exportTeamLineups } from '@/utils/exportUtils';
import { toast } from '@/hooks/use-toast';
import TeamDetailsModal from './TeamDetailsModal';

const AdminDashboard: React.FC = () => {
  const { logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [actresses, setActresses] = useState<Actress[]>([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showAddActress, setShowAddActress] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(
      query(collection(db, 'users'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ 
          uid: doc.id, 
          ...doc.data() 
        } as User));
        setUsers(usersData);
      }
    );

    const unsubscribeTeams = onSnapshot(
      query(collection(db, 'teams'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const teamsData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Team));
        setTeams(teamsData);
      }
    );

    const unsubscribeActresses = onSnapshot(
      query(collection(db, 'actresses'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const actressesData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Actress));
        setActresses(actressesData);
      }
    );

    return () => {
      unsubscribeUsers();
      unsubscribeTeams();
      unsubscribeActresses();
    };
  }, []);

  const availableActresses = actresses.filter(a => a.isAvailable && !a.teamId);
  const soldActresses = actresses.filter(a => a.teamId);

  const handleExportLineups = () => {
    const result = exportTeamLineups(teams, actresses);
    
    if (result) {
      toast({
        title: "Export successful",
        description: "Team lineups have been exported to Excel"
      });
    } else {
      toast({
        title: "Export failed",
        description: "Failed to export team lineups",
        variant: "destructive"
      });
    }
  };

  const getTeamRoster = (teamId: string) => {
    return actresses.filter(actress => actress.teamId === teamId);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="royal-header shadow-lg border-b border-purple-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-purple-100 font-medium">Diva Draft League Management</p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={handleExportLineups}
                variant="outline"
                className="flex items-center gap-2 glass-effect text-white border-white hover:bg-white hover:text-purple-900"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export Teams
              </Button>
              <Button 
                onClick={logout}
                variant="outline"
                className="flex items-center gap-2 glass-effect text-white border-white hover:bg-white hover:text-purple-900"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="premium-card p-6 rounded-xl">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="premium-card p-6 rounded-xl">
            <div className="flex items-center">
              <Trophy className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Teams</p>
                <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
              </div>
            </div>
          </div>

          <div className="premium-card p-6 rounded-xl">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-pink-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Actresses</p>
                <p className="text-2xl font-bold text-gray-900">{availableActresses.length}</p>
              </div>
            </div>
          </div>

          <div className="premium-card p-6 rounded-xl">
            <div className="flex items-center">
              <Gavel className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sold Actresses</p>
                <p className="text-2xl font-bold text-gray-900">{soldActresses.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="auction" className="w-full">
          <TabsList className="grid w-full grid-cols-5 glass-effect">
            <TabsTrigger value="auction" className="text-purple-800">Auction Control</TabsTrigger>
            <TabsTrigger value="users" className="text-purple-800">Users</TabsTrigger>
            <TabsTrigger value="teams" className="text-purple-800">Teams</TabsTrigger>
            <TabsTrigger value="actresses" className="text-purple-800">Actress Pool</TabsTrigger>
            <TabsTrigger value="reports" className="text-purple-800">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="auction">
            <AuctionControl actresses={availableActresses} />
          </TabsContent>

          <TabsContent value="users">
            <div className="premium-card rounded-xl">
              <div className="p-6 border-b border-purple-100">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-purple-800">User Management</h2>
                  <Button 
                    onClick={() => setShowCreateUser(true)}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add User
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <UsersTable users={users} teams={teams} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="teams">
            <div className="premium-card rounded-xl">
              <div className="p-6 border-b border-purple-100">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-purple-800">Team Management</h2>
                  <Button 
                    onClick={() => setShowCreateTeam(true)}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                  >
                    <Trophy className="h-4 w-4" />
                    Create Team
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {teams.map((team) => (
                    <div 
                      key={team.id} 
                      className="premium-card rounded-lg border-2 cursor-pointer hover:shadow-lg transition-all duration-200"
                      style={{
                        backgroundColor: team.primaryColor || 'white',
                        color: team.secondaryColor || 'black',
                        borderColor: team.primaryColor || '#e5e7eb'
                      }}
                      onClick={() => setSelectedTeam(team)}
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-bold text-lg">{team.name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant={team.isActive ? "default" : "secondary"}>
                              {team.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTeam(team);
                              }}
                              className="opacity-75 hover:opacity-100"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-3 text-sm bg-white bg-opacity-90 p-4 rounded-lg">
                          <div className="flex justify-between">
                            <span>Owner:</span>
                            <span className="font-medium">{team.ownerName || 'Unassigned'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Budget:</span>
                            <span className="font-medium">{formatIndianCurrency(team.budget || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Remaining:</span>
                            <span className="font-medium text-green-600">{formatIndianCurrency(team.remainingPurse || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Actresses:</span>
                            <span className="font-medium">{(team.currentActresses || 0)}/{(team.maxActresses || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="actresses">
            <div className="premium-card rounded-xl">
              <div className="p-6 border-b border-purple-100">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-purple-800">Actress Pool Management</h2>
                  <Button 
                    onClick={() => setShowAddActress(true)}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                  >
                    <Star className="h-4 w-4" />
                    Add Actress
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <ActressPoolTable actresses={actresses} teams={teams} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="premium-card rounded-xl">
              <div className="p-6 border-b border-purple-100">
                <h2 className="text-xl font-bold text-purple-800">Reports & Analytics</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-6 text-purple-800">Team Budget Analysis</h3>
                    <div className="space-y-4">
                      {teams.map((team) => {
                        const budget = team.budget || 0;
                        const remainingPurse = team.remainingPurse || 0;
                        const usedBudget = budget - remainingPurse;
                        const usagePercentage = budget > 0 ? (usedBudget / budget * 100) : 0;
                        
                        return (
                          <div 
                            key={team.id} 
                            className="premium-card rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4"
                            style={{
                              backgroundColor: team.primaryColor || 'white',
                              color: team.secondaryColor || 'black',
                              borderLeftColor: team.primaryColor || '#e5e7eb'
                            }}
                            onClick={() => setSelectedTeam(team)}
                          >
                            <div className="flex justify-between items-center mb-3">
                              <span className="font-bold text-lg">{team.name}</span>
                              <span className="text-sm bg-white bg-opacity-90 px-3 py-1 rounded-full text-gray-800 font-medium">
                                {usagePercentage.toFixed(1)}% used
                              </span>
                            </div>
                            <div className="flex justify-between text-sm bg-white bg-opacity-90 p-3 rounded-lg mb-3">
                              <span>Budget: {formatIndianCurrency(budget)}</span>
                              <span>Remaining: {formatIndianCurrency(remainingPurse)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div 
                                className="h-3 rounded-full transition-all duration-500" 
                                style={{ 
                                  width: `${usagePercentage}%`,
                                  backgroundColor: team.primaryColor === 'white' ? '#8b5cf6' : team.secondaryColor || '#8b5cf6'
                                }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-6 text-purple-800">Category Distribution</h3>
                    <div className="space-y-3">
                      {['Blockbuster Queens', 'Global Glam', 'Drama Diva', 'Next-Gen Stars', 'Timeless Icons', 'Gen-Z'].map((category) => {
                        const categoryActresses = actresses.filter(a => a.category === category);
                        const soldCount = categoryActresses.filter(a => a.teamId).length;
                        return (
                          <div key={category} className="flex justify-between items-center py-3 border-b border-purple-100 glass-effect px-4 rounded-lg">
                            <Badge 
                              className="text-white px-3 py-2 font-medium"
                              style={{ 
                                backgroundColor: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || 'gray' 
                              }}
                            >
                              {category}
                            </Badge>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-600 font-medium">
                                {soldCount}/{categoryActresses.length} sold
                              </span>
                              <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
                                {categoryActresses.length} total
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {showCreateUser && (
        <CreateUserForm
          isOpen={showCreateUser}
          onClose={() => setShowCreateUser(false)}
          teams={teams}
        />
      )}
      {showCreateTeam && (
        <CreateTeamForm
          isOpen={showCreateTeam}
          onClose={() => setShowCreateTeam(false)}
        />
      )}
      {showAddActress && (
        <AddActressForm
          isOpen={showAddActress}
          onClose={() => setShowAddActress(false)}
        />
      )}
      {editingTeam && (
        <EditTeamForm
          isOpen={!!editingTeam}
          onClose={() => setEditingTeam(null)}
          team={editingTeam}
        />
      )}
      {selectedTeam && (
        <TeamDetailsModal
          isOpen={!!selectedTeam}
          onClose={() => setSelectedTeam(null)}
          team={selectedTeam}
          roster={getTeamRoster(selectedTeam.id)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
