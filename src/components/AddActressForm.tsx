
import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface AddActressFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddActressForm: React.FC<AddActressFormProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    basePrice: '100000',
    imageUrl: ''
  });
  const [loading, setLoading] = useState(false);

  const categories = [
    'Marquee',
    'Blockbuster Queens',
    'Global Glam',
    'Drama Diva',
    'Next-Gen Stars',
    'Timeless Icons',
    'Gen-Z'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const basePrice = parseInt(formData.basePrice);

      await addDoc(collection(db, 'actresses'), {
        name: formData.name,
        category: formData.category,
        basePrice,
        currentPrice: basePrice,
        imageUrl: formData.imageUrl || 'https://via.placeholder.com/150x200',
        isAvailable: true,
        isOnAuction: false,
        createdAt: serverTimestamp()
      });

      toast({
        title: "Actress added successfully",
        description: `${formData.name} has been added to the ${formData.category} category`,
      });

      onClose();
      setFormData({
        name: '',
        category: '',
        basePrice: '100000',
        imageUrl: ''
      });
    } catch (error: any) {
      console.error('Error adding actress:', error);
      toast({
        title: "Failed to add actress",
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
          <DialogTitle>Add New Actress</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="actressName">Actress Name</Label>
            <Input
              id="actressName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Enter actress name"
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
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
              placeholder="100000"
            />
          </div>

          <div>
            <Label htmlFor="imageUrl">Image URL (Optional)</Label>
            <Input
              id="imageUrl"
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.name || !formData.category || !formData.basePrice}
            >
              {loading ? 'Adding...' : 'Add Actress'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddActressForm;
