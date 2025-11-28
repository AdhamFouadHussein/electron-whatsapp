"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Download, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const messageLogs = [
  {
    id: 1,
    recipient: "Ahmed Hassan",
    type: "birthday",
    status: "sent",
    message: "Happy Birthday Ahmed!",
    sentAt: "2024-12-05 09:15 AM",
  },
  {
    id: 2,
    recipient: "Sarah Ali",
    type: "reminder",
    status: "sent",
    message: "Team meeting in 30 mins",
    sentAt: "2024-12-05 08:45 AM",
  },
  {
    id: 3,
    recipient: "Mohamed Ibrahim",
    type: "reminder",
    status: "failed",
    message: "Flight reminder",
    sentAt: "2024-12-04 06:00 AM",
  },
  {
    id: 4,
    recipient: "Fatima Khan",
    type: "campaign",
    status: "sent",
    message: "Year-end promo",
    sentAt: "2024-12-03 02:30 PM",
  },
]

const statusColors = {
  sent: "bg-green-500/20 text-green-700 dark:text-green-400",
  failed: "bg-red-500/20 text-red-700 dark:text-red-400",
  pending: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
}

export default function LogsPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredLogs = messageLogs.filter(
    (log) =>
      log.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-8">
      <>
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Message Logs</h1>
            <p className="text-muted-foreground">View message delivery history</p>
          </div>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Logs Table */}
        <Card className="border-border/50 backdrop-blur-sm bg-card/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border/50 bg-muted/30">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Recipient</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Message</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Sent At</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{log.recipient}</td>
                    <td className="px-6 py-4 text-sm capitalize">{log.type}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">{log.message}</td>
                    <td className="px-6 py-4">
                      <Badge className={statusColors[log.status as keyof typeof statusColors]}>
                        {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{log.sentAt}</td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2 cursor-pointer">View Details</DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 cursor-pointer">Resend</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </>
    </div>
  )
}
