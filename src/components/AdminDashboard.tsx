import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { User, Team, Actress } from '@/types';
import CreateUserForm from './CreateUserForm';
import CreateTeamForm from './CreateTeamForm';
import AddActressForm from './AddActressForm';
import UsersTable from './UsersTable';
import ActressPoolTable from './ActressPoolTable';
import AuctionControl from './AuctionControl';
import { Users, UserPlus, Trophy, Star, Gavel, LogOut, Edit } from 'lucide-react';
import { formatIndianCurrency } from '@/utils/currencyUtils';
import EditTeamForm from './EditTeamForm';

const AdminDashboard: React.FC = () => {
  const { logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [actresses, setActresses] = useState<Actress[]>([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showAddActress, setShowAddActress] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-purple-800">Admin Dashboard</h1>
              <p className="text-gray-600">Diva Draft League Management</p>
            </div>
            <Button 
              onClick={logout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Teams</p>
                  <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-pink-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Available Actresses</p>
                  <p className="text-2xl font-bold text-gray-900">{availableActresses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Gavel className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sold Actresses</p>
                  <p className="text-2xl font-bold text-gray-900">{soldActresses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="auction" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="auction">Auction Control</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="actresses">Actress Pool</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="auction">
            <AuctionControl actresses={availableActresses} />
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>User Management</CardTitle>
                  <Button 
                    onClick={() => setShowCreateUser(true)}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <UsersTable users={users} teams={teams} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Team Management</CardTitle>
                  <Button 
                    onClick={() => setShowCreateTeam(true)}
                    className="flex items-center gap-2"
                  >
                    <Trophy className="h-4 w-4" />
                    Create Team
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teams.map((team) => (
                    <Card key={team.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg">{team.name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant={team.isActive ? "default" : "secondary"}>
                              {team.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingTeam(team)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Owner:</span>
                            <span className="font-medium">{team.ownerName || 'Unassigned'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Budget:</span>
                            <span>{formatIndianCurrency(team.budget || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Remaining:</span>
                            <span>{formatIndianCurrency(team.remainingPurse || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Actresses:</span>
                            <span>{(team.currentActresses || 0)}/{(team.maxActresses || 0)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actresses">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Actress Pool Management</CardTitle>
                  <Button 
                    onClick={() => setShowAddActress(true)}
                    className="flex items-center gap-2"
                  >
                    <Star className="h-4 w-4" />
                    Add Actress
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ActressPoolTable actresses={actresses} teams={teams} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Reports & Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Team Budget Analysis</h3>
                    <div className="space-y-3">
                      {teams.map((team) => {
                        const budget = team.budget || 0;
                        const remainingPurse = team.remainingPurse || 0;
                        const usedBudget = budget - remainingPurse;
                        const usagePercentage = budget > 0 ? (usedBudget / budget * 100) : 0;
                        
                        return (
                          <div key={team.id} className="border rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">{team.name}</span>
                              <span className="text-sm text-gray-500">
                                {usagePercentage.toFixed(1)}% used
                              </span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                              <span>Budget: {formatIndianCurrency(budget)}</span>
                              <span>Remaining: {formatIndianCurrency(remainingPurse)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${usagePercentage}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Category Distribution</h3>
                    <div className="space-y-2">
                      {['Marquee', 'Blockbuster Queens', 'Global Glam', 'Drama Diva', 'Next-Gen Stars', 'Timeless Icons', 'Gen-Z'].map((category) => {
                        const categoryActresses = actresses.filter(a => a.category === category);
                        const soldCount = categoryActresses.filter(a => a.teamId).length;
                        return (
                          <div key={category} className="flex justify-between items-center py-2 border-b">
                            <span className="font-medium">{category}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">
                                {soldCount}/{categoryActresses.length} sold
                              </span>
                              <Badge variant="outline">
                                {categoryActresses.length} total
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
    </div>
  );
};

export default AdminDashboard;
