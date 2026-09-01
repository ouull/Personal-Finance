"use client";

import { Search, Bell } from "lucide-react";
import { NotificationCenter } from "./NotificationCenter";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (pathname.startsWith("/auth")) return null;
  const avatarInitials = session?.user?.name
    ? session.user.name.substring(0, 2).toUpperCase()
    : "U";

  return (
    <header className="flex items-center justify-end mb-10 w-full">
      {" "}
      {/* Right Icons */}
      <div className="flex items-center gap-4 ml-4">
        <NotificationCenter />

        <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm border border-slate-300 overflow-hidden shrink-0">
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{avatarInitials}</span>
          )}
        </div>
      </div>
    </header>
  );
}
