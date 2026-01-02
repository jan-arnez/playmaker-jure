"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Scroll } from "lucide-react";

interface EditContentRulesDialogProps {
  facility: {
    id: string;
    description?: string;
    rules?: string;
  };
  onClose: () => void;
  onSuccess: (data: { description?: string; rules?: string }) => Promise<void>;
}

export function EditContentRulesDialog({ facility, onClose, onSuccess }: EditContentRulesDialogProps) {
  const [formData, setFormData] = useState({
    description: facility.description || "",
    rules: facility.rules || "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSuccess({
        description: formData.description.trim() || undefined,
        rules: formData.rules.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error("Error updating content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Description & Rules</DialogTitle>
          <DialogDescription>
            Update facility description and rules
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="description" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description
              </TabsTrigger>
              <TabsTrigger value="rules" className="flex items-center gap-2">
                <Scroll className="h-4 w-4" />
                Rules
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="space-y-2 mt-4">
              <Label htmlFor="description">Facility Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your facility, its features, amenities, and what makes it special..."
                rows={10}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                Provide a detailed description of your facility to help customers understand what you offer.
              </p>
            </TabsContent>
            
            <TabsContent value="rules" className="space-y-2 mt-4">
              <Label htmlFor="rules">Facility Rules</Label>
              <Textarea
                id="rules"
                value={formData.rules}
                onChange={(e) => setFormData(prev => ({ ...prev, rules: e.target.value }))}
                placeholder="List the rules and policies for using this facility..."
                rows={10}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                Specify rules, policies, and guidelines that customers should follow when using your facility.
              </p>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

