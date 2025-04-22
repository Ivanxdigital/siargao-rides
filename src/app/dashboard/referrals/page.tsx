"use client";

import { useEffect, useState } from "react";
import { getUserReferrals } from "@/lib/service";
import { generateReferralLink } from "@/lib/referral";
import { Referral } from "@/lib/types";
import { Copy, Gift, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function ReferralDashboardPage() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    getUserReferrals(user.id)
      .then(setReferrals)
      .finally(() => setLoading(false));
  }, [user?.id]);

  const referralLink = user ? generateReferralLink(user.id) : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Gift className="w-6 h-6 text-primary" />
        Referral Dashboard
      </h1>
      <div className="mb-8 p-4 bg-muted/30 border border-border rounded-lg flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1">
          <div className="text-sm text-muted-foreground mb-1">Your referral link</div>
          <div className="font-mono text-xs break-all bg-background border border-input rounded px-2 py-1 select-all">
            {referralLink}
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={handleCopy} className="flex items-center gap-2">
          <Copy className="w-4 h-4" />
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
      <h2 className="text-lg font-semibold mb-4">Your Referrals</h2>
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin w-4 h-4" /> Loading...</div>
      ) : referrals.length === 0 ? (
        <div className="text-muted-foreground">You have not referred anyone yet.</div>
      ) : (
        <div className="space-y-4">
          {referrals.map((ref) => (
            <div key={ref.id} className="p-4 bg-background border border-border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-medium text-sm">Shop ID: <span className="font-mono text-xs">{ref.shop_id}</span></div>
                <div className="text-xs text-muted-foreground">Status: <span className="capitalize font-semibold text-primary">{ref.status}</span></div>
                <div className="text-xs text-muted-foreground">Payout: <span className="font-semibold">₱{ref.payout_amount}</span></div>
              </div>
              {ref.status === "paid" ? (
                <span className="inline-flex items-center gap-1 text-green-600 font-semibold text-xs"><CheckCircle className="w-4 h-4" /> Paid</span>
              ) : ref.status === "completed" ? (
                <span className="inline-flex items-center gap-1 text-yellow-600 font-semibold text-xs"><Gift className="w-4 h-4" /> Eligible</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-gray-400 font-semibold text-xs"><Loader2 className="w-4 h-4 animate-spin" /> Pending</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 