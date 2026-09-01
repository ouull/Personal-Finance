"use client";

import { useState, useEffect } from "react";
import { Bell, Check, BellRing } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/features/notifications/actions";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "./ui/badge";

interface Notification {
  id: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
  type: string;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      const res = await getNotifications();
      if (res.success) {
        setNotifications((res.data || []) as any);
      }
    };
    fetchNotifications();
    // Could set up polling or webhooks here
  }, []);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
      ),
    );
  };

  const handleMarkAll = async () => {
    await markAllNotificationsAsRead();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })),
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full hover:bg-slate-100"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </Button>
        }
      />
      <PopoverContent
        align="end"
        className="w-80 p-0 rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-800">Notifications</h3>
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100"
              >
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAll}
              className="h-8 text-xs text-slate-500 hover:text-indigo-600"
            >
              <Check className="w-3 h-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <BellRing className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 border-b border-slate-100 last:border-0 transition-colors ${
                    !n.readAt ? "bg-indigo-50/30" : "bg-white opacity-70"
                  }`}
                  onClick={() => !n.readAt && handleMarkAsRead(n.id)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4
                        className={`text-sm ${!n.readAt ? "font-semibold text-slate-800" : "font-medium text-slate-600"}`}
                      >
                        {n.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-2">
                        {formatDistanceToNow(new Date(n.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {!n.readAt && (
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1 flex-shrink-0"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
