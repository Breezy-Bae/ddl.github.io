
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Team } from '@/types';
import { toast } from '@/hooks/use-toast';

interface CreateUserFormProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({ isOpen, onClose, teams }) => {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    role: '',
    teamId: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Create user document
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        displayName: formData.displayName,
        email: formData.email,
        role: formData.role,
        teamId: formData.role === 'owner' ? formData.teamId : null,
        createdAt: serverTimestamp()
      });

      // If assigning to team, update team with owner info
      if (formData.role === 'owner' && formData.teamId) {
        await updateDoc(doc(db, 'teams', formData.teamId), {
          ownerId: userCredential.user.uid,
          ownerName: formData.displayName
        });
      }

      toast({
        title: "User created successfully",
        description: `${formData.displayName} has been added as ${formData.role}`,
      });

      onClose();
      setFormData({
        displayName: '',
        email: '',
        password: '',
        role: '',
        teamId: ''
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Failed to create user",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const availableTeams = teams.filter(team => !team.ownerId && team.isActive);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              required
              placeholder="Enter full name"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="Enter email address"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="Enter password"
              minLength={6}
            />
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value, teamId: '' })}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="owner">Team Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.role === 'owner' && (
            <div>
              <Label htmlFor="team">Assign Team</Label>
              <Select value={formData.teamId} onValueChange={(value) => setFormData({ ...formData, teamId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableTeams.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">No available teams. Create a team first.</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.displayName || !formData.email || !formData.password || !formData.role || (formData.role === 'owner' && !formData.teamId)}
            >
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserForm;
