"use client";

import { useEffect, useState } from "react";
import { getReferralStats, updateReferralStatus } from "@/lib/service";
import { Referral } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { Loader2, CheckCircle, Gift, Filter, Search, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminReferralPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [marking, setMarking] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchReferrals();
    fetchStats();
  }, []);

  const fetchReferrals = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("referrals").select("*").order("created_at", { ascending: false });
    if (!error && data) setReferrals(data);
    setLoading(false);
  };

  const fetchStats = async () => {
    const stats = await getReferralStats();
    setStats(stats);
  };

  const handleMarkPaid = async (id: string) => {
    setMarking(id);
    await updateReferralStatus(id, { status: "paid", paid_at: new Date().toISOString() });
    await fetchReferrals();
    setMarking(null);
    await fetchStats();
  };

  const filtered = filter === "all" ? referrals : referrals.filter(r => r.status === filter);

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BadgeCheck className="w-6 h-6 text-primary" />
        Admin Referral Management
      </h1>
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex gap-2">
          <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>All</Button>
          <Button size="sm" variant={filter === "pending" ? "default" : "outline"} onClick={() => setFilter("pending")}>Pending</Button>
          <Button size="sm" variant={filter === "completed" ? "default" : "outline"} onClick={() => setFilter("completed")}>Completed</Button>
          <Button size="sm" variant={filter === "paid" ? "default" : "outline"} onClick={() => setFilter("paid")}>Paid</Button>
        </div>
        {stats && (
          <div className="ml-auto flex gap-4 text-xs text-muted-foreground">
            <span>Total: <b>{stats.total}</b></span>
            <span>Pending: <b>{stats.pending}</b></span>
            <span>Completed: <b>{stats.completed}</b></span>
            <span>Paid: <b>{stats.paid}</b></span>
            <span>Total Payout: <b>₱{stats.totalAmount}</b></span>
          </div>
        )}
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin w-4 h-4" /> Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-muted-foreground">No referrals found for this filter.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((ref) => (
            <div key={ref.id} className="p-4 bg-background border border-border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-medium text-sm">Shop ID: <span className="font-mono text-xs">{ref.shop_id}</span></div>
                <div className="text-xs text-muted-foreground">Referrer: <span className="font-mono text-xs">{ref.referrer_id}</span></div>
                <div className="text-xs text-muted-foreground">Status: <span className="capitalize font-semibold text-primary">{ref.status}</span></div>
                <div className="text-xs text-muted-foreground">Payout: <span className="font-semibold">₱{ref.payout_amount}</span></div>
                {ref.paid_at && <div className="text-xs text-green-600">Paid at: {new Date(ref.paid_at).toLocaleString()}</div>}
              </div>
              {ref.status === "completed" && (
                <Button size="sm" disabled={marking === ref.id} onClick={() => handleMarkPaid(ref.id)}>
                  {marking === ref.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />} Mark as Paid
                </Button>
              )}
              {ref.status === "paid" && (
                <span className="inline-flex items-center gap-1 text-green-600 font-semibold text-xs"><CheckCircle className="w-4 h-4" /> Paid</span>
              )}
              {ref.status === "pending" && (
                <span className="inline-flex items-center gap-1 text-gray-400 font-semibold text-xs"><Gift className="w-4 h-4" /> Pending</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 