import { useState } from "react";
import { format } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import type { RemedialNote, MenuItem } from "@/lib/shared/types/menu.types";

interface RemedialNotesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notes: RemedialNote[];
  menuItems: MenuItem[];
  authorName: string;
  onSave: (notes: RemedialNote[]) => void;
}

export default function RemedialNotesSheet({
  open, onOpenChange, notes, menuItems, authorName, onSave,
}: RemedialNotesSheetProps) {
  const [newText, setNewText] = useState("");
  const [linkedItemId, setLinkedItemId] = useState<string>("__none__");

  const handleAdd = () => {
    if (!newText.trim()) return;
    const linkedItem = linkedItemId !== "__none__" ? menuItems.find((i) => i.id === linkedItemId) : undefined;
    const newNote: RemedialNote = {
      id: crypto.randomUUID(),
      text: newText.trim(),
      author: authorName,
      date: new Date().toISOString(),
      item_id: linkedItem?.id,
      item_name: linkedItem?.name,
    };
    onSave([...notes, newNote]);
    setNewText("");
    setLinkedItemId("__none__");
    toast.success("Note added");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[440px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Corrective Action Notes
            <Badge variant="secondary">{notes.length}</Badge>
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col h-[calc(100vh-100px)] pt-4">
          <ScrollArea className="flex-1 -mx-2 px-2">
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No notes yet. Add a corrective action note below.
              </p>
            ) : (
              <div className="space-y-3">
                {[...notes].reverse().map((note) => (
                  <div key={note.id} className="p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{note.author}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(note.date), "dd MMM yyyy, HH:mm")}
                      </span>
                    </div>
                    <p className="text-sm">{note.text}</p>
                    {note.item_name && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        Re: {note.item_name}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="border-t pt-4 mt-4 space-y-3">
            <Select value={linkedItemId} onValueChange={setLinkedItemId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Link to a dish (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">General note</SelectItem>
                {menuItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Describe corrective action needed..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="min-h-[80px]"
            />
            <Button onClick={handleAdd} disabled={!newText.trim()} className="w-full">
              <Send className="w-4 h-4 mr-2" /> Add Note
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
