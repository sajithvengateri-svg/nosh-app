import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Instagram, Facebook, MessageCircle, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

interface ChannelSummary {
  channel: string;
  total: number;
  count: number;
}

const CHANNELS = [
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "facebook", label: "Facebook", icon: Facebook },
  { value: "tiktok", label: "TikTok", icon: Share2 },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { value: "other", label: "Other", icon: Share2 },
];

const CHANNEL_COLORS: Record<string, string> = {
  instagram: "bg-pink-500",
  facebook: "bg-blue-600",
  tiktok: "bg-foreground",
  whatsapp: "bg-green-500",
  other: "bg-muted-foreground",
};

const SocialOrdersWidget = () => {
  const { currentOrg } = useOrg();
  const [channelSummary, setChannelSummary] = useState<ChannelSummary[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newChannel, setNewChannel] = useState("instagram");
  const [newAmount, setNewAmount] = useState("");
  const [newNote, setNewNote] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const fetchToday = async () => {
    if (!currentOrg?.id) return;
    const { data } = await supabase
      .from("social_orders")
      .select("channel, amount")
      .eq("org_id", currentOrg.id)
      .eq("order_date", today);

    if (data) {
      const map: Record<string, { total: number; count: number }> = {};
      data.forEach(r => {
        if (!map[r.channel]) map[r.channel] = { total: 0, count: 0 };
        map[r.channel].total += Number(r.amount);
        map[r.channel].count += 1;
      });
      setChannelSummary(
        Object.entries(map).map(([channel, v]) => ({ channel, ...v }))
      );
    }
  };

  useEffect(() => { fetchToday(); }, [currentOrg?.id]);

  const handleAdd = async () => {
    if (!currentOrg?.id || !newAmount) return;
    const { error } = await supabase.from("social_orders").insert({
      org_id: currentOrg.id,
      channel: newChannel,
      amount: parseFloat(newAmount),
      note: newNote || null,
      order_date: today,
    });
    if (error) { toast.error("Failed to add order"); return; }
    toast.success("Order logged");
    setNewAmount("");
    setNewNote("");
    setShowAdd(false);
    fetchToday();
  };

  const grandTotal = channelSummary.reduce((s, c) => s + c.total, 0);
  const grandCount = channelSummary.reduce((s, c) => s + c.count, 0);
  const maxTotal = Math.max(...channelSummary.map(c => c.total), 1);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-pink-500" />
            <span className="text-sm font-medium text-foreground">Social Orders Today</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {showAdd && (
          <div className="space-y-2 mb-3 p-3 rounded-lg bg-muted/50">
            <Select value={newChannel} onValueChange={setNewChannel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CHANNELS.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Amount" value={newAmount} onChange={e => setNewAmount(e.target.value)} />
            <Input placeholder="Note (optional)" value={newNote} onChange={e => setNewNote(e.target.value)} />
            <Button size="sm" className="w-full" onClick={handleAdd}>Add Order</Button>
          </div>
        )}

        {channelSummary.length > 0 ? (
          <div className="space-y-2">
            {channelSummary.map(c => {
              const ch = CHANNELS.find(x => x.value === c.channel);
              return (
                <div key={c.channel} className="flex items-center gap-2">
                  <span className="text-xs w-16 text-muted-foreground truncate">{ch?.label || c.channel}</span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${CHANNEL_COLORS[c.channel] || "bg-primary"}`}
                      style={{ width: `${(c.total / maxTotal) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-14 text-right">${c.total.toFixed(0)}</span>
                  <span className="text-xs text-muted-foreground w-8">({c.count})</span>
                </div>
              );
            })}
            <div className="pt-2 border-t text-xs text-muted-foreground text-center">
              Total: ${grandTotal.toFixed(0)} from {grandCount} orders
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">No orders today. Tap + to log one.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default SocialOrdersWidget;
