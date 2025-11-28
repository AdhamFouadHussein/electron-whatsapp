"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Calendar, MoreVertical, Edit, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const events = [
  {
    id: 1,
    user: "Ahmed Hassan",
    title: "Birthday",
    type: "birthday",
    date: "2024-12-10",
    location: "-",
    reminder: true,
  },
  {
    id: 2,
    user: "Sarah Ali",
    title: "Team Meeting",
    type: "meeting",
    date: "2024-12-08",
    location: "Conference Room A",
    reminder: true,
  },
  {
    id: 3,
    user: "Mohamed Ibrahim",
    title: "Flight to Dubai",
    type: "flight",
    date: "2024-12-15",
    location: "Riyadh Airport",
    reminder: true,
  },
  {
    id: 4,
    user: "Fatima Khan",
    title: "Embassy Appointment",
    type: "embassy",
    date: "2024-12-12",
    location: "US Embassy",
    reminder: false,
  },
  {
    id: 5,
    user: "Hassan Saleh",
    title: "Project Deadline",
    type: "custom",
    date: "2024-12-20",
    location: "-",
    reminder: true,
  },
]

const eventTypeColors = {
  birthday: "from-pink-500 to-rose-500",
  meeting: "from-blue-500 to-cyan-500",
  flight: "from-orange-500 to-red-500",
  embassy: "from-purple-500 to-indigo-500",
  custom: "from-gray-500 to-slate-500",
}

const eventTypeBadges = {
  birthday: "Birthday",
  meeting: "Meeting",
  flight: "Flight",
  embassy: "Embassy",
  custom: "Custom",
}

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredEvents = events.filter(
    (event) =>
      event.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.title.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-8">
      <>
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Events</h1>
            <p className="text-muted-foreground">Manage upcoming events and reminders</p>
          </div>
          <span>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
          </span>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            Filter
          </Button>
        </div>

        {/* Events Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
          {filteredEvents.map((event) => (
            <Card
              key={event.id}
              className="p-6 border-border/50 backdrop-blur-sm bg-card/50 hover:shadow-lg hover:shadow-accent/10 transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className={`rounded-lg bg-gradient-to-br ${eventTypeColors[event.type as keyof typeof eventTypeColors]} p-3 flex-shrink-0`}
                  >
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold">{event.title}</h3>
                      <Badge variant="outline">{eventTypeBadges[event.type as keyof typeof eventTypeBadges]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{event.user}</p>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-medium">{new Date(event.date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Location</p>
                        <p className="font-medium">{event.location}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Reminder</p>
                        <Badge variant={event.reminder ? "default" : "secondary"} className="mt-1">
                          {event.reminder ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

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
            </Card>
          ))}
        </div>
      </>
    </div>
  )
}
