"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Clock, MoreVertical, Edit, Trash2, Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const reminders = [
  {
    id: 1,
    event: "Birthday - Ahmed Hassan",
    time: "2024-12-10 09:00 AM",
    status: "pending",
    message: "Happy Birthday Ahmed! 🎉",
  },
  {
    id: 2,
    event: "Team Meeting - Sarah Ali",
    time: "2024-12-08 02:00 PM",
    status: "scheduled",
    message: "Reminder: Team meeting in 30 mins",
  },
  {
    id: 3,
    event: "Flight - Mohamed Ibrahim",
    time: "2024-12-15 06:00 AM",
    status: "pending",
    message: "Your flight departs at 8:00 AM",
  },
  {
    id: 4,
    event: "Embassy - Fatima Khan",
    time: "2024-12-12 10:00 AM",
    status: "sent",
    message: "Embassy appointment reminder",
  },
  {
    id: 5,
    event: "Deadline - Hassan Saleh",
    time: "2024-12-20 05:00 PM",
    status: "pending",
    message: "Project deadline today",
  },
]

const statusColors = {
  pending: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  scheduled: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  sent: "bg-green-500/20 text-green-700 dark:text-green-400",
  failed: "bg-red-500/20 text-red-700 dark:text-red-400",
}

export default function RemindersPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredReminders = reminders.filter(
    (reminder) =>
      reminder.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reminder.message.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-8">
      <>
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Reminders</h1>
            <p className="text-muted-foreground">Schedule and manage message reminders</p>
          </div>
          <span>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Reminder
            </Button>
          </span>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reminders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            Filter
          </Button>
        </div>

        {/* Reminders List */}
        <div className="space-y-3">
          {filteredReminders.map((reminder) => (
            <Card
              key={reminder.id}
              className="p-6 border-border/50 backdrop-blur-sm bg-card/50 hover:shadow-lg hover:shadow-accent/10 transition-all duration-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="rounded-lg bg-accent/20 p-3 flex-shrink-0">
                    <Clock className="h-6 w-6 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold">{reminder.event}</h3>
                      <Badge className={statusColors[reminder.status as keyof typeof statusColors]}>
                        {reminder.status.charAt(0).toUpperCase() + reminder.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{reminder.time}</p>
                    <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                      <p className="text-sm">{reminder.message}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  {reminder.status === "pending" && (
                    <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                      <Send className="h-4 w-4" />
                      Send Now
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2 cursor-pointer">
                        <Edit className="h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 cursor-pointer text-red-600">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </>
    </div>
  )
}
