import { ListChecks } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { isHomeCookMode } from "@/lib/shared/modeConfig";
import TodoPanel from "@/components/tasks/TodoPanel";

const TodoList = () => {
  const { role } = useAuth();
  const { storeMode } = useOrg();
  const isHomeCook = isHomeCookMode(storeMode);
  const isHeadChefOrOwner = role === "head_chef" || role === "owner" || isHomeCook;

  if (!isHeadChefOrOwner) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh] text-center">
          <div>
            <ListChecks className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground font-medium">Todo List is for Head Chefs only</p>
            <p className="text-sm text-muted-foreground mt-1">Use your Prep Lists to manage daily tasks</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <TodoPanel />
      </div>
    </AppLayout>
  );
};

export default TodoList;
