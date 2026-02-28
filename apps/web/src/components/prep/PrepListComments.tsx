import { useState } from "react";
import { MessageSquare, Send, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { usePrepListComments, PrepListComment } from "@/hooks/usePrepListComments";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

interface PrepListCommentsProps {
  prepListId: string;
  taskId?: string;
  compact?: boolean;
}

export function PrepListComments({ prepListId, taskId, compact = false }: PrepListCommentsProps) {
  const { user, role } = useAuth();
  const { comments, addComment, deleteComment } = usePrepListComments(prepListId);
  const [newComment, setNewComment] = useState("");
  const [isQualityIssue, setIsQualityIssue] = useState(false);

  const filteredComments = taskId
    ? comments.filter((c) => c.task_id === taskId)
    : comments;

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    const prefix = isQualityIssue ? "⚠️ Quality Issue: " : "";
    await addComment(prefix + newComment, taskId);
    setNewComment("");
    setIsQualityIssue(false);
  };

  const canDeleteComment = (comment: PrepListComment) => {
    return comment.user_id === user?.id || role === "head_chef";
  };

  if (compact && filteredComments.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", compact && "mt-2")}>
      {/* Comments List */}
      {filteredComments.length > 0 && (
        <div className="space-y-2">
          {filteredComments.map((comment) => (
            <div
              key={comment.id}
              className={cn(
                "flex items-start gap-2 p-2 rounded-lg",
                comment.content.startsWith("⚠️")
                  ? "bg-warning/10 border border-warning/20"
                  : "bg-muted/50"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{comment.user_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm mt-0.5">{comment.content}</p>
              </div>
              {canDeleteComment(comment) && (
                <button
                  onClick={() => deleteComment(comment.id)}
                  className="p-1 rounded hover:bg-destructive/10 flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Comment */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsQualityIssue(!isQualityIssue)}
          className={cn(
            "p-2 rounded-lg transition-colors flex-shrink-0",
            isQualityIssue
              ? "bg-warning text-warning-foreground"
              : "bg-muted hover:bg-muted/80"
          )}
          title="Flag as quality issue"
        >
          <AlertTriangle className="w-4 h-4" />
        </button>
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={isQualityIssue ? "Describe the quality issue..." : "Add a comment..."}
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <Button size="icon" variant="ghost" onClick={handleSubmit} disabled={!newComment.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
