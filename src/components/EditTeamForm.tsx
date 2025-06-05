
import React, { useState } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Team } from '@/types';
import { formatIndianCurrency } from '@/utils/currencyUtils';

interface EditTeamFormProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
}

const EditTeamForm: React.FC<EditTeamFormProps> = ({ isOpen, onClose, team }) => {
  const [formData, setFormData] = useState({
    name: team.name,
    budget: team.budget.toString(),
    maxActresses: team.maxActresses.toString(),
    isActive: team.isActive
  });
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const budget = parseInt(formData.budget);
      const maxActresses = parseInt(formData.maxActresses);
      const budgetDifference = budget - team.budget;
      
      await updateDoc(doc(db, 'teams', team.id), {
        name: formData.name,
        budget,
        remainingPurse: team.remainingPurse + budgetDifference,
        maxActresses,
        isActive: formData.isActive
      });

      toast({
        title: "Team updated successfully",
        description: `${formData.name} has been updated`,
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Failed to update team",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'teams', team.id));
      toast({
        title: "Team deleted successfully",
        description: `${team.name} has been removed`,
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Failed to delete team",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <Label htmlFor="teamName">Team Name</Label>
            <Input
              id="teamName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="budget">Budget (₹)</Label>
            <Input
              id="budget"
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              required
              min="100000"
            />
            <p className="text-sm text-gray-500 mt-1">
              {formatIndianCurrency(parseInt(formData.budget) || 0)}
            </p>
          </div>

          <div>
            <Label htmlFor="maxActresses">Maximum Actresses</Label>
            <Input
              id="maxActresses"
              type="number"
              value={formData.maxActresses}
              onChange={(e) => setFormData({ ...formData, maxActresses: e.target.value })}
              required
              min="1"
              max="50"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label htmlFor="isActive">Active Team</Label>
          </div>

          <DialogFooter className="flex justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive">Delete</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Team</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {team.name}? This will also affect any actresses assigned to this team.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={loading}>
                    {loading ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTeamForm;
