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
  // Coming Soon: SMS functionality is temporarily disabled
  const stats: SMSStats = {
    total_messages: 0,
    delivered_messages: 0,
    failed_messages: 0,
    undelivered_messages: 0,
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>SMS Notification History</CardTitle>
          <Badge variant="comingSoon" className="text-xs">
            Coming Soon
          </Badge>
        </div>
        <CardDescription>
          SMS notifications are being developed and will be available soon!
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Stats Summary - Coming Soon Placeholder */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-primary/5 border border-border rounded-lg p-4 md:p-6 text-center opacity-60 transition-all">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <span className="text-xs md:text-sm font-medium">Total</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-primary">{stats.total_messages}</p>
          </div>
          <div className="bg-green-500/5 border border-border rounded-lg p-4 md:p-6 text-center opacity-60 transition-all">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
              <span className="text-xs md:text-sm font-medium">Delivered</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-green-500">{stats.delivered_messages}</p>
          </div>
          <div className="bg-red-500/5 border border-border rounded-lg p-4 md:p-6 text-center opacity-60 transition-all">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <XCircle className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
              <span className="text-xs md:text-sm font-medium">Failed</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-red-500">{stats.failed_messages}</p>
          </div>
          <div className="bg-orange-500/5 border border-border rounded-lg p-4 md:p-6 text-center opacity-60 transition-all">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
              <span className="text-xs md:text-sm font-medium">Undelivered</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-orange-500">{stats.undelivered_messages}</p>
          </div>
        </div>

        {/* Coming Soon Message */}
        <div className="flex flex-col items-center justify-center py-16 px-4 sm:px-6 bg-card border border-border rounded-lg text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-medium mb-3">SMS Notifications Coming Soon</h3>
          <p className="text-muted-foreground max-w-lg mx-auto mb-6 text-sm sm:text-base leading-relaxed">
            We're working on bringing you instant SMS notifications for new bookings. 
            You'll be able to track message delivery, view notification history, and manage your SMS preferences.
          </p>
          <Badge variant="comingSoon" className="px-3 py-1.5 text-xs">
            Coming Soon
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}