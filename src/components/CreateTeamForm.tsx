import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { formatIndianCurrency } from '@/utils/currencyUtils';

interface CreateTeamFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateTeamForm: React.FC<CreateTeamFormProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    budget: '1000000',
    maxActresses: '14'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const budget = parseInt(formData.budget);
      const maxActresses = parseInt(formData.maxActresses);

      await addDoc(collection(db, 'teams'), {
        name: formData.name,
        budget,
        remainingPurse: budget,
        budgetUsed: 0,
        maxActresses,
        currentActresses: 0,
        ownerId: null,
        ownerName: null,
        createdAt: serverTimestamp(),
        isActive: true
      });

      toast({
        title: "Team created successfully",
        description: `${formData.name} has been created with ${formatIndianCurrency(budget)} budget`,
      });

      onClose();
      setFormData({
        name: '',
        budget: '1000000',
        maxActresses: '14'
      });
    } catch (error: any) {
      console.error('Error creating team:', error);
      toast({
        title: "Failed to create team",
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
          <DialogTitle>Create New Team</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="teamName">Team Name</Label>
            <Input
              id="teamName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Enter team name"
            />
          </div>

          <div>
            <Label htmlFor="budget">Starting Budget (₹)</Label>
            <Input
              id="budget"
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              required
              min="100000"
              placeholder="1000000"
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
              placeholder="14"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.name || !formData.budget || !formData.maxActresses}
            >
              {loading ? 'Creating...' : 'Create Team'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTeamForm;
