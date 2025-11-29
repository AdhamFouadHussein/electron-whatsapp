"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Download, MoreVertical, Loader2, RefreshCw } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { api } from "@/lib/api"
import { format } from "date-fns"
import { toast } from "sonner"

interface MessageLog {
  id: number
  user_id: number
  user_name: string
  phone: string
  message_type: string
  message_text: string
  status: 'sent' | 'failed' | 'pending'
  sent_at: string
  error_message?: string
}

const statusColors = {
  sent: "bg-green-500/20 text-green-700 dark:text-green-400",
  failed: "bg-red-500/20 text-red-700 dark:text-red-400",
  pending: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
}

export default function LogsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [logs, setLogs] = useState<MessageLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchLogs = async () => {
    try {
      setIsLoading(true)
      const data = await api.getMessageLogs()
      setLogs(data)
    } catch (error) {
      console.error("Failed to fetch logs:", error)
      toast.error("Failed to load message logs")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const filteredLogs = logs.filter(
    (log) =>
      (log.user_name && log.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.message_text && log.message_text.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.phone && log.phone.includes(searchTerm))
  )

  const handleResend = async (log: MessageLog) => {
    if (!confirm("Are you sure you want to resend this message?")) return

    try {
      await api.whatsapp.sendMessage(log.phone, log.message_text)
      toast.success("Message resent successfully")
      fetchLogs() // Refresh logs to see new entry
    } catch (error: any) {
      console.error("Failed to resend message:", error)
      toast.error(error.message || "Failed to resend message")
    }
  }

  const handleExport = () => {
    if (logs.length === 0) {
      toast.error("No logs to export")
      return
    }

    const headers = ["ID", "Recipient", "Phone", "Type", "Message", "Status", "Sent At", "Error"]
    const csvContent = [
      headers.join(","),
      ...logs.map(log => [
        log.id,
        `"${log.user_name || ""}"`,
        `"${log.phone || ""}"`,
        log.message_type,
        `"${(log.message_text || "").replace(/"/g, '""')}"`,
        log.status,
        log.sent_at,
        `"${(log.error_message || "").replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `message_logs_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-8">
      <>
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Message Logs</h1>
            <p className="text-muted-foreground">View message delivery history</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 bg-transparent" onClick={fetchLogs}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search logs by name, message or phone..."
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
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <div className="flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      No logs found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium">{log.user_name || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">{log.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-sm capitalize">
                        <Badge variant="outline">{log.message_type}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate" title={log.message_text}>
                        {log.message_text}
                        {log.error_message && (
                          <div className="text-xs text-red-500 mt-1 truncate" title={log.error_message}>
                            Error: {log.error_message}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={statusColors[log.status] || statusColors.pending}>
                          {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {log.sent_at ? format(new Date(log.sent_at), "PP p") : "-"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleResend(log)}>
                              <RefreshCw className="h-4 w-4" />
                              Resend
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </>
    </div>
  )
}
