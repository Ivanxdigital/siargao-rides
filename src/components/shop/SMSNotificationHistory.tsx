"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
// Using custom table styling since table component is not available
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface SMSHistory {
  id: string;
  rental_id: string;
  phone_number: string;
  message_content: string;
  twilio_message_sid: string | null;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'undelivered';
  error_message: string | null;
  error_code: string | null;
  sent_at: string;
  delivered_at: string | null;
  created_at: string;
}

interface SMSStats {
  total_messages: number;
  delivered_messages: number;
  failed_messages: number;
  undelivered_messages: number;
}

interface SMSNotificationHistoryProps {
  shopId: string;
}

export function SMSNotificationHistory({ shopId }: SMSNotificationHistoryProps) {
  const [history, setHistory] = useState<SMSHistory[]>([]);
  const [stats, setStats] = useState<SMSStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchSMSHistory();
  }, [shopId]);

  const fetchSMSHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch SMS history
      const { data: historyData, error: historyError } = await supabase
        .from('sms_notification_history')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (historyError) {
        throw historyError;
      }

      setHistory(historyData || []);

      // Calculate stats
      if (historyData) {
        const stats: SMSStats = {
          total_messages: historyData.length,
          delivered_messages: historyData.filter(sms => sms.status === 'delivered').length,
          failed_messages: historyData.filter(sms => sms.status === 'failed').length,
          undelivered_messages: historyData.filter(sms => sms.status === 'undelivered').length,
        };
        setStats(stats);
      }
    } catch (err) {
      console.error('Error fetching SMS history:', err);
      setError('Failed to load SMS history');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'sent':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'undelivered':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      delivered: "default",
      sent: "secondary",
      pending: "outline",
      failed: "destructive",
      undelivered: "destructive"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SMS Notification History</CardTitle>
          <CardDescription>Loading SMS history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SMS Notification History</CardTitle>
          <CardDescription>Error loading SMS history</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>SMS Notification History</CardTitle>
        <CardDescription>
          Track SMS notifications sent to your registered phone number
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Stats Summary */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-background border rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Total</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.total_messages}</p>
            </div>
            <div className="bg-background border rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">Delivered</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.delivered_messages}</p>
            </div>
            <div className="bg-background border rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium">Failed</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.failed_messages}</p>
            </div>
            <div className="bg-background border rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-medium">Undelivered</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.undelivered_messages}</p>
            </div>
          </div>
        )}

        {/* History Table */}
        {history.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No SMS notifications sent yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium text-sm">Date</th>
                  <th className="text-left p-2 font-medium text-sm">Booking</th>
                  <th className="text-left p-2 font-medium text-sm">Status</th>
                  <th className="text-left p-2 font-medium text-sm">Phone</th>
                  <th className="text-left p-2 font-medium text-sm">Message</th>
                  <th className="text-left p-2 font-medium text-sm">Error</th>
                </tr>
              </thead>
              <tbody>
                {history.map((sms) => (
                  <tr key={sms.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 whitespace-nowrap text-sm">
                      {format(new Date(sms.sent_at), 'MMM dd, h:mm a')}
                    </td>
                    <td className="p-2">
                      <a
                        href={`/dashboard/bookings/${sms.rental_id}`}
                        className="text-primary hover:underline text-sm"
                      >
                        View
                      </a>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(sms.status)}
                        {getStatusBadge(sms.status)}
                      </div>
                    </td>
                    <td className="p-2 text-sm">
                      {sms.phone_number}
                    </td>
                    <td className="p-2 max-w-xs">
                      <p className="text-sm truncate" title={sms.message_content}>
                        {sms.message_content}
                      </p>
                    </td>
                    <td className="p-2">
                      {sms.error_message && (
                        <span className="text-xs text-destructive" title={sms.error_message}>
                          {sms.error_code || 'Error'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}