"use client"

import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Calendar,
  Bell,
  MessageSquare,
  FileText,
  Send,
  LogOut,
  MessageCircle,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigation } from "../context/NavigationContext"

const navigation = [
  { name: "Dashboard", href: "dashboard", icon: LayoutDashboard },
  { name: "Users", href: "users", icon: Users },
  { name: "Events", href: "events", icon: Calendar },
  { name: "Reminders", href: "reminders", icon: Bell },
  { name: "Birthdays", href: "birthdays", icon: MessageCircle },
  { name: "Templates", href: "templates", icon: FileText },
  { name: "Campaigns", href: "campaigns", icon: Send },
  { name: "Message Logs", href: "logs", icon: MessageSquare },
  { name: "WhatsApp", href: "whatsapp", icon: MessageCircle },
  { name: "Settings", href: "settings", icon: Settings },
]

interface SidebarProps {
  currentPage: string;
  onLogout?: () => void;
}

export function Sidebar({ currentPage, onLogout }: SidebarProps) {
  const { setCurrentPage } = useNavigation();
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
          <MessageCircle className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Reminder Pro</h1>
          <p className="text-xs text-sidebar-foreground/60">Campaign Manager</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-2">
          {navigation.map((item) => {
            const isActive = currentPage === item.href
            return (
              <button
                key={item.href}
                onClick={() => setCurrentPage(item.href)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/10",
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 bg-transparent"
          onClick={() => onLogout?.()}
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  )
}
