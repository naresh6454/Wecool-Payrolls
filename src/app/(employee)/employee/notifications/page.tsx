"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  PAYROLL_PROCESSED: "bg-green-100 text-green-600",
  LEAVE_APPROVED: "bg-green-100 text-green-600",
  LEAVE_REJECTED: "bg-red-100 text-red-500",
  OT_APPROVED: "bg-green-100 text-green-600",
  OT_REJECTED: "bg-red-100 text-red-500",
  LEAVE_REQUEST: "bg-orange-100 text-orange-600",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = () =>
    fetch("/api/employee/notifications")
      .then(r => r.json())
      .then(d => { setNotifications(d); setLoading(false); });

  useEffect(() => { fetchNotifs(); }, []);

  const markAllRead = async () => {
    const res = await fetch("/api/employee/notifications/read-all", { method: "POST" });
    if (res.ok) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success("All marked as read");
    }
  };

  const markRead = async (id: string) => {
    await fetch(`/api/employee/notifications/${id}/read`, { method: "POST" });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
    </div>
  );

  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread notifications`}
        actions={
          unread > 0 ? (
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-2 px-4 py-2 border border-stone-200 text-stone-600 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-all"
            >
              <CheckCheck className="w-4 h-4" /> Mark All Read
            </button>
          ) : null
        }
      />

      <Card>
        <CardHeader title="All Notifications" />
        {notifications.length === 0 ? (
          <div className="px-6 py-16 text-center text-stone-400">
            <Bell className="w-10 h-10 mx-auto mb-3 text-stone-300" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-50">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-4 sm:px-6 py-3 sm:py-4 cursor-pointer transition-all hover:bg-stone-50 ${!n.isRead ? "bg-orange-50/30" : ""}`}
                onClick={() => !n.isRead && markRead(n.id)}
              >
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.isRead ? "bg-stone-200" : "bg-orange-500"}`} />
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${TYPE_COLORS[n.type] || "bg-stone-100 text-stone-500"}`}>
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${n.isRead ? "text-stone-700" : "text-stone-900"}`}>{n.title}</p>
                  <p className="text-sm text-stone-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-stone-400 mt-1">{format(new Date(n.createdAt), "MMM d, yyyy, h:mm a")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
