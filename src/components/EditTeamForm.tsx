
import React, { useState } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Team } from '@/types';
import { formatIndianCurrency, parseIndianCurrency } from '@/utils/currencyUtils';

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
    isActive: team.isActive,
    primaryColor: team.primaryColor || '#ffffff',
    secondaryColor: team.secondaryColor || '#000000'
  });
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const budget = parseIndianCurrency(formData.budget);
      const maxActresses = parseInt(formData.maxActresses);

      await updateDoc(doc(db, 'teams', team.id), {
        name: formData.name,
        budget,
        maxActresses,
        isActive: formData.isActive,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor
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
          <DialogDescription>
            Update team information and settings.
          </DialogDescription>
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
            <Label htmlFor="budget">Budget</Label>
            <Input
              id="budget"
              type="text"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              {formatIndianCurrency(parseIndianCurrency(formData.budget))}
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
              max="20"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isActive" className="cursor-pointer">Team Active</Label>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primaryColor">Team Primary Color</Label>
              <div className="flex gap-2 items-center mt-1">
                <Input
                  id="primaryColor"
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-12 h-12 p-1 rounded cursor-pointer"
                />
                <Input 
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  placeholder="#RRGGBB"
                  className="flex-grow"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Background color for team elements</p>
            </div>

            <div>
              <Label htmlFor="secondaryColor">Team Text Color</Label>
              <div className="flex gap-2 items-center mt-1">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="w-12 h-12 p-1 rounded cursor-pointer"
                />
                <Input 
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  placeholder="#RRGGBB"
                  className="flex-grow"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Text color for team elements</p>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-md border mt-2">
            <div className="text-center font-semibold" style={{
              backgroundColor: formData.primaryColor,
              color: formData.secondaryColor,
              padding: '12px',
              borderRadius: '4px'
            }}>
              {formData.name} - Color Preview
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive">Delete Team</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Team</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {team.name}? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={loading}>
                    {loading ? 'Deleting...' : 'Delete Team'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Team'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTeamForm;
