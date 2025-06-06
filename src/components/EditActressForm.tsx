
import React, { useState } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
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

  const categories: Array<'Marquee' | 'Blockbuster Queens' | 'Global Glam' | 'Drama Diva' | 'Next-Gen Stars' | 'Timeless Icons' | 'Gen-Z'> = [
    'Marquee', 'Blockbuster Queens', 'Global Glam', 'Drama Diva', 
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

          <DialogFooter className="flex justify-between">
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

export default EditActressForm;
