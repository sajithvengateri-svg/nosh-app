import React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlignStartVertical, AlignCenterVertical, AlignEndVertical, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal, Columns3, Rows3, Trash2, Copy } from "lucide-react";

type Alignment = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
type Distribution = 'horizontal' | 'vertical';

interface AlignmentToolbarProps {
  selectedCount: number;
  onAlign: (alignment: Alignment) => void;
  onDistribute: (direction: Distribution) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const AlignmentToolbar: React.FC<AlignmentToolbarProps> = ({
  selectedCount,
  onAlign,
  onDistribute,
  onDuplicate,
  onDelete,
}) => {
  if (selectedCount < 2) return null;

  const actions: Array<{
    icon: React.ElementType;
    label: string;
    action: () => void;
    separator?: boolean;
  }> = [
    { icon: AlignStartVertical, label: 'Align Left', action: () => onAlign('left') },
    { icon: AlignCenterVertical, label: 'Align Center', action: () => onAlign('center') },
    { icon: AlignEndVertical, label: 'Align Right', action: () => onAlign('right') },
    { icon: AlignStartHorizontal, label: 'Align Top', action: () => onAlign('top'), separator: true },
    { icon: AlignCenterHorizontal, label: 'Align Middle', action: () => onAlign('middle') },
    { icon: AlignEndHorizontal, label: 'Align Bottom', action: () => onAlign('bottom') },
    { icon: Columns3, label: 'Distribute Horizontally', action: () => onDistribute('horizontal'), separator: true },
    { icon: Rows3, label: 'Distribute Vertically', action: () => onDistribute('vertical') },
    { icon: Copy, label: 'Duplicate', action: onDuplicate, separator: true },
    { icon: Trash2, label: 'Delete All', action: onDelete },
  ];

  return (
    <div className="flex items-center gap-0.5 bg-background border rounded-lg px-1 py-1 shadow-sm">
      <span className="text-xs text-muted-foreground px-2 font-medium">{selectedCount} selected</span>
      <div className="w-px h-5 bg-border mx-1" />
      {actions.map((action, i) => (
        <React.Fragment key={action.label}>
          {action.separator && <div className="w-px h-5 bg-border mx-0.5" />}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 ${action.label === 'Delete All' ? 'text-destructive hover:text-destructive' : ''}`}
                onClick={action.action}
              >
                <action.icon className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">{action.label}</TooltipContent>
          </Tooltip>
        </React.Fragment>
      ))}
    </div>
  );
};

export default AlignmentToolbar;
