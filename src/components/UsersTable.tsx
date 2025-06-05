
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, Team } from '@/types';
import EditUserForm from './EditUserForm';
import { Edit } from 'lucide-react';

interface UsersTableProps {
  users: User[];
  teams: Team[];
}

const UsersTable: React.FC<UsersTableProps> = ({ users, teams }) => {
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const getTeamName = (teamId: string | undefined) => {
    if (!teamId) return 'N/A';
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Unknown Team';
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.uid}>
                <TableCell className="font-medium">{user.displayName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>{getTeamName(user.teamId)}</TableCell>
                <TableCell>
                  {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingUser(user)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingUser && (
        <EditUserForm
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          user={editingUser}
          teams={teams}
        />
      )}
    </>
  );
};

export default UsersTable;
