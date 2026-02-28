import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CCPTimelineEditor } from './CCPTimelineEditor';
import { useRecipeCCPs } from '@/hooks/useRecipeCCPs';
import { Loader2 } from 'lucide-react';

interface CCPDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeId: string;
  recipeName: string;
  hasEditPermission: boolean;
}

export const CCPDialog = ({
  open,
  onOpenChange,
  recipeId,
  recipeName,
  hasEditPermission,
}: CCPDialogProps) => {
  const { ccps, loading, addCCP, updateCCP, deleteCCP } = useRecipeCCPs(recipeId);
  const [haccpMode, setHaccpMode] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>Critical Control Points - {recipeName}</DialogTitle>
            <div className="flex items-center gap-2">
              <Switch
                id="haccp-mode"
                checked={haccpMode}
                onCheckedChange={setHaccpMode}
              />
              <Label htmlFor="haccp-mode" className="text-sm cursor-pointer">
                Full HACCP
              </Label>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <CCPTimelineEditor
            ccps={ccps}
            onAdd={addCCP}
            onUpdate={updateCCP}
            onDelete={deleteCCP}
            haccpMode={haccpMode}
            readOnly={!hasEditPermission}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
