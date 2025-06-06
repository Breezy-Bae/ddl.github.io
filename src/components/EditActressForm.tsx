import React, { useState, useEffect } from 'react';
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Actress } from '@/types';
import { formatIndianCurrency } from '@/utils/currencyUtils';

interface EditActressFormProps {
  isOpen: boolean;
  onClose: () => void;
  actress: Actress;
}

const EditActressForm: React.FC<EditActressFormProps> = ({ isOpen, onClose, actress }) => {
  const [formData, setFormData] = useState({
    name: actress.name,
    category: actress.category,
    basePrice: actress.basePrice.toString(),
    imageUrl: actress.imageUrl || ''
  });
  const [loading, setLoading] = useState(false);
  const [removingFromTeam, setRemovingFromTeam] = useState(false);

  const categories: Array<'Blockbuster Queens' | 'Global Glam' | 'Drama Diva' | 'Next-Gen Stars' | 'Timeless Icons' | 'Gen-Z'> = [
    'Blockbuster Queens', 'Global Glam', 'Drama Diva', 
    'Next-Gen Stars', 'Timeless Icons', 'Gen-Z'
  ];

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const basePrice = parseInt(formData.basePrice);
      await updateDoc(doc(db, 'actresses', actress.id), {
        name: formData.name,
        category: formData.category,
        basePrice,
        currentPrice: basePrice,
        imageUrl: formData.imageUrl || 'https://via.placeholder.com/150x200'
      });

      toast({
        title: "Actress updated successfully",
        description: `${formData.name} has been updated`,
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Failed to update actress",
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
      await deleteDoc(doc(db, 'actresses', actress.id));
      toast({
        title: "Actress deleted successfully",
        description: `${actress.name} has been removed`,
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Failed to delete actress",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromTeam = async () => {
    setRemovingFromTeam(true);
    try {
      await runTransaction(db, async (transaction) => {
        // Get the team document
        let teamRef = null;
        if (actress.teamId) {
          teamRef = doc(db, 'teams', actress.teamId);
          const teamDoc = await transaction.get(teamRef);
          
          if (teamDoc.exists()) {
            const teamData = teamDoc.data() as any;
            
            // Update team's remaining purse and actress count
            transaction.update(teamRef, {
              remainingPurse: (teamData.remainingPurse || 0) + (actress.purchasePrice || 0),
              currentActresses: Math.max(0, (teamData.currentActresses || 1) - 1)
            });
          }
        }
        
        // Update actress to be available for auction again
        const actressRef = doc(db, 'actresses', actress.id);
        transaction.update(actressRef, {
          isAvailable: true,
          isOnAuction: false,
          teamId: null,
          soldToTeam: null,
          finalPrice: null,
          purchasePrice: null,
          soldAt: null
        });
      });
      
      toast({
        title: "Actress returned to pool",
        description: `${actress.name} has been removed from team and is available for auction again. Team's budget has been refunded.`,
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Failed to remove actress from team",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRemovingFromTeam(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Actress</DialogTitle>
          <DialogDescription>
            Update actress information including name, category, price, and image.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <Label htmlFor="actressName">Actress Name</Label>
            <Input
              id="actressName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value: typeof formData.category) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="basePrice">Base Price (₹)</Label>
            <Input
              id="basePrice"
              type="number"
              value={formData.basePrice}
              onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
              required
              min="10000"
            />
            <p className="text-sm text-gray-500 mt-1">
              {formatIndianCurrency(parseInt(formData.basePrice) || 0)}
            </p>
          </div>

          <div>
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            />
          </div>

          <DialogFooter className="flex justify-between flex-wrap gap-2">
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive">Delete</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Actress</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {actress.name}? This action cannot be undone.
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

              {actress.teamId && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
                      Return to Pool
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Return Actress to Pool</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to return {actress.name} to the auction pool? 
                        This will refund {formatIndianCurrency(actress.purchasePrice || 0)} to the team's budget.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRemoveFromTeam} disabled={removingFromTeam}>
                        {removingFromTeam ? 'Processing...' : 'Return to Pool'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            <div className="flex gap-2 ml-auto">
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

export default EditActressForm;
