import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Users, Trash2, UserPlus, KeyRound, RefreshCw, Database,
  Loader2, ScrollText, Bomb,
} from "lucide-react";
import { QUIET_LAB_ORG_ID } from "@/lib/quietLab";

const ADMIN_EMAIL = "admin@chefos.app";

interface LogEntry {
  time: string;
  message: string;
  type: "success" | "error" | "info";
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  created_at: string;
  confirmed: boolean;
}

const AdminSystem = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [deleteEmail, setDeleteEmail] = useState("");

  const addLog = useCallback((message: string, type: LogEntry["type"] = "info") => {
    setLog((prev) => [
      { time: new Date().toLocaleTimeString(), message, type },
      ...prev,
    ]);
  }, []);

  const invoke = async (action: string, extra: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke("admin-delete-user", {
      body: { action, ...extra },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  };

  /* ─── Actions ─── */

  const listUsers = async () => {
    setLoading("list");
    try {
      const data = await invoke("list_users");
      setUsers(data.users ?? []);
      addLog(`Loaded ${data.users?.length ?? 0} users`, "success");
    } catch (e: any) {
      addLog(`List users failed: ${e.message}`, "error");
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  };

  const deleteUserById = async (user: UserRow) => {
    setLoading(`del-${user.id}`);
    try {
      await invoke("delete_user", { userId: user.id, email: user.email });
      addLog(`Deleted ${user.email}`, "success");
      toast.success(`Deleted ${user.email}`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (e: any) {
      addLog(`Failed to delete ${user.email}: ${e.message}`, "error");
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  };

  const wipeNonAdminUsers = async () => {
    setLoading("wipe");
    try {
      const data = await invoke("list_users");
      const targets = (data.users ?? []).filter(
        (u: UserRow) => u.email !== ADMIN_EMAIL
      );
      let deleted = 0;
      for (const u of targets) {
        try {
          await invoke("delete_user", { userId: u.id, email: u.email });
          deleted++;
          addLog(`Deleted ${u.email}`, "success");
        } catch (e: any) {
          addLog(`Failed to delete ${u.email}: ${e.message}`, "error");
        }
      }
      addLog(`Wipe complete — ${deleted}/${targets.length} users removed`, "success");
      toast.success(`Wiped ${deleted} users`);
      await listUsers();
    } catch (e: any) {
      addLog(`Wipe failed: ${e.message}`, "error");
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  };

  const deleteSpecificUser = async () => {
    if (!deleteEmail.trim()) return;
    setLoading("delete");
    try {
      await invoke("delete_user", { email: deleteEmail.trim() });
      addLog(`Deleted user ${deleteEmail}`, "success");
      toast.success(`Deleted ${deleteEmail}`);
      setDeleteEmail("");
      await listUsers();
    } catch (e: any) {
      addLog(`Delete failed: ${e.message}`, "error");
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  };

  const createTestHomeCook = async () => {
    setLoading("homecook");
    try {
      await invoke("create_admin", {
        email: `testcook+${Date.now()}@chefos.app`,
        password: "Cook1234!",
        full_name: "Test Home Cook",
      });
      addLog("Created test home cook account", "success");
      toast.success("Test home cook created");
      await listUsers();
    } catch (e: any) {
      addLog(`Create home cook failed: ${e.message}`, "error");
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  };

  const resetAdminPassword = async () => {
    setLoading("reset");
    try {
      await invoke("update_password", { email: ADMIN_EMAIL, password: "Admin123!" });
      addLog("Admin password reset to Admin123!", "success");
      toast.success("Admin password reset");
    } catch (e: any) {
      addLog(`Reset failed: ${e.message}`, "error");
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  };

  const nukeOrgData = async () => {
    setLoading("nuke");
    try {
      const usersData = await invoke("list_users");
      const adminUser = (usersData.users ?? []).find((u: UserRow) => u.email === ADMIN_EMAIL);
      
      let protectedOrgIds = [QUIET_LAB_ORG_ID];
      if (adminUser) {
        const { data: adminOrgs } = await supabase
          .from("organizations")
          .select("id")
          .eq("owner_id", adminUser.id);
        if (adminOrgs?.length) {
          protectedOrgIds = [...protectedOrgIds, ...adminOrgs.map(o => o.id)];
        }
      }
      addLog(`Protecting ${protectedOrgIds.length} org(s) from nuke`, "info");

      // Get all orgs NOT protected
      const { data: allOrgs } = await supabase
        .from("organizations")
        .select("id")
        .not("id", "in", `(${protectedOrgIds.join(",")})`);

      if (allOrgs && allOrgs.length > 0) {
        const orgIds = allOrgs.map(o => o.id);
        const { data: nuked, error: nukeErr } = await supabase.rpc("admin_nuke_orgs", {
          p_org_ids: orgIds,
        });
        if (nukeErr) {
          addLog(`Nuke RPC error: ${nukeErr.message}`, "error");
        } else {
          addLog(`Nuked ${nuked} rows across all org-scoped tables`, "success");
        }
      } else {
        addLog("No unprotected orgs to nuke", "info");
      }

      toast.success("Org data nuked");
    } catch (e: any) {
      addLog(`Nuke failed: ${e.message}`, "error");
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  };

  const wipeAllTestData = async () => {
    setLoading("wipe-all");
    try {
      addLog("Starting full test data wipe…", "info");
      
      // Step 1: Wipe non-admin users
      const data = await invoke("list_users");
      const targets = (data.users ?? []).filter(
        (u: UserRow) => u.email !== ADMIN_EMAIL
      );
      let deleted = 0;
      for (const u of targets) {
        try {
          await invoke("delete_user", { userId: u.id, email: u.email });
          deleted++;
          addLog(`Deleted ${u.email}`, "success");
        } catch (e: any) {
          addLog(`Failed to delete ${u.email}: ${e.message}`, "error");
        }
      }
      addLog(`Users wiped: ${deleted}/${targets.length}`, "success");

      // Step 2: Nuke orphaned org data
      addLog("Nuking remaining org data…", "info");
      const adminUser = (data.users ?? []).find((u: UserRow) => u.email === ADMIN_EMAIL);
      let protectedOrgIds = [QUIET_LAB_ORG_ID];
      if (adminUser) {
        const { data: adminOrgs } = await supabase
          .from("organizations")
          .select("id")
          .eq("owner_id", adminUser.id);
        if (adminOrgs?.length) {
          protectedOrgIds = [...protectedOrgIds, ...adminOrgs.map(o => o.id)];
        }
      }

      const { data: remainingOrgs } = await supabase
        .from("organizations")
        .select("id")
        .not("id", "in", `(${protectedOrgIds.join(",")})`);

      if (remainingOrgs && remainingOrgs.length > 0) {
        const { data: nuked, error: nukeErr } = await supabase.rpc("admin_nuke_orgs", {
          p_org_ids: remainingOrgs.map(o => o.id),
        });
        if (nukeErr) addLog(`Nuke error: ${nukeErr.message}`, "error");
        else addLog(`Nuked ${nuked} remaining rows`, "success");
      }

      addLog("✅ Full wipe complete", "success");
      toast.success("All test data wiped — redirecting to dashboard…");
      setTimeout(() => navigate("/admin"), 1500);
    } catch (e: any) {
      addLog(`Wipe all failed: ${e.message}`, "error");
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  };

  const isLoading = (key: string) => loading === key;
  const Spin = () => <Loader2 className="w-4 h-4 animate-spin" />;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">System Tools</h1>
        <p className="text-muted-foreground text-sm">
          Account management and data cleanup — all actions are destructive, use with care.
        </p>
      </div>

      {/* ─── Account Management ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5" /> Account Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={listUsers} disabled={!!loading} variant="outline" size="sm">
              {isLoading("list") ? <Spin /> : <RefreshCw className="w-4 h-4" />}
              List All Users
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={!!loading}>
                  <Trash2 className="w-4 h-4" /> Wipe Non-Admin Users
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Wipe all non-admin users?</AlertDialogTitle>
                   <AlertDialogDescription>
                     This will permanently delete every user except {ADMIN_EMAIL}. The admin account and its organization will be preserved. This cannot be undone.
                   </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={wipeNonAdminUsers}>
                    Yes, wipe all
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button onClick={createTestHomeCook} disabled={!!loading} variant="outline" size="sm">
              {isLoading("homecook") ? <Spin /> : <UserPlus className="w-4 h-4" />}
              Create Test Home Cook
            </Button>

            <Button onClick={resetAdminPassword} disabled={!!loading} variant="outline" size="sm">
              {isLoading("reset") ? <Spin /> : <KeyRound className="w-4 h-4" />}
              Reset Admin Password
            </Button>
          </div>

          {/* Delete specific */}
          <div className="flex gap-2 max-w-md">
            <Input
              placeholder="user@example.com"
              value={deleteEmail}
              onChange={(e) => setDeleteEmail(e.target.value)}
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={!deleteEmail.trim() || !!loading}>
                  {isLoading("delete") ? <Spin /> : <Trash2 className="w-4 h-4" />}
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {deleteEmail}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes the user and all their data. Cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteSpecificUser}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Users table */}
          {users.length > 0 && (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Confirmed</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-mono text-xs">{u.email}</TableCell>
                      <TableCell>{u.name || "—"}</TableCell>
                      <TableCell className="text-xs">
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{u.confirmed ? "✅" : "❌"}</TableCell>
                      <TableCell>
                        {u.email !== ADMIN_EMAIL && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={!!loading} className="h-7 w-7">
                                {loading === `del-${u.id}` ? <Spin /> : <Trash2 className="w-3.5 h-3.5 text-destructive" />}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete {u.email}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This permanently deletes the user and all their data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteUserById(u)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Data Cleanup ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="w-5 h-5" /> Data Cleanup
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={!!loading}>
                {isLoading("nuke") ? <Spin /> : <Trash2 className="w-4 h-4" />}
                Nuke All Org Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Nuke all organization data?</AlertDialogTitle>
               <AlertDialogDescription>
                  This clears ALL org-scoped data across every table — but preserves {ADMIN_EMAIL}'s organization and Quiet Lab. Cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={nukeOrgData}>Nuke it</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={!!loading}>
                {isLoading("wipe-all") ? <Spin /> : <Bomb className="w-4 h-4" />}
                ☢️ Wipe All Test Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Wipe ALL test data?</AlertDialogTitle>
               <AlertDialogDescription>
                  This is the nuclear option. It will:<br />
                  1. Delete every user except {ADMIN_EMAIL}<br />
                  2. Delete all org data except admin's org and Quiet Lab<br />
                  3. Redirect you to the dashboard.<br /><br />
                  <strong>This cannot be undone.</strong>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={wipeAllTestData}>
                  Yes, wipe everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* ─── Activity Log ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ScrollText className="w-5 h-5" /> Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {log.length === 0 ? (
            <p className="text-sm text-muted-foreground">No actions yet.</p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-1 font-mono text-xs">
              {log.map((entry, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${
                    entry.type === "error"
                      ? "text-destructive"
                      : entry.type === "success"
                      ? "text-green-600 dark:text-green-400"
                      : "text-muted-foreground"
                  }`}
                >
                  <span className="shrink-0">[{entry.time}]</span>
                  <span>{entry.message}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSystem;
