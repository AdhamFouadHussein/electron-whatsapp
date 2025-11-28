"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { api } from "@/lib/api"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Calendar, Edit, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { UserSearchInput } from "@/components/user-search-input"

interface Event {
  id: number
  user_id: number
  user_name?: string // Joined from backend
  event_type: string
  title: string
  description?: string
  event_date: string
  location?: string
  reminder_enabled: boolean | number
}

interface User {
  id: number
  name: string
  phone: string
}

const eventTypeColors: Record<string, string> = {
  birthday: "from-pink-500 to-rose-500",
  meeting: "from-blue-500 to-cyan-500",
  flight: "from-orange-500 to-red-500",
  embassy: "from-purple-500 to-indigo-500",
  custom: "from-gray-500 to-slate-500",
}

const eventTypeBadges: Record<string, string> = {
  birthday: "Birthday",
  meeting: "Meeting",
  flight: "Flight",
  embassy: "Embassy",
  custom: "Custom",
}

function EventForm({
  event,
  users,
  onSave,
  onClose,
}: {
  event: Partial<Event> | null
  users: User[]
  onSave: (event: Partial<Event>) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState<Partial<Event>>({
    user_id: 0,
    event_type: "birthday",
    title: "",
    description: "",
    event_date: "",
    location: "",
    reminder_enabled: true,
    ...event,
  })

  useEffect(() => {
    const initialData = { ...event }
    if (initialData.event_date) {
      // Format for datetime-local input if needed, or just date
      // The backend expects 'YYYY-MM-DD HH:mm:ss' or similar
      // Let's assume we use a date input for now, or datetime-local
      try {
        initialData.event_date = format(new Date(initialData.event_date), "yyyy-MM-dd'T'HH:mm")
      } catch (e) {
        // Fallback or empty if invalid
        initialData.event_date = ""
      }
    }
    setFormData({
      user_id: 0,
      event_type: "birthday",
      title: "",
      description: "",
      event_date: "",
      location: "",
      reminder_enabled: true,
      ...initialData,
    })
  }, [event])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Convert date back to what backend might expect if needed, or just pass as is
    // The backend likely handles ISO strings or standard SQL format
    onSave(formData)
  }

  return (
    <Dialog open={!!event} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event?.id ? "Edit Event" : "Add New Event"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <UserSearchInput
            users={users}
            value={formData.user_id?.toString() || ""}
            onChange={(value) => setFormData((prev) => ({ ...prev, user_id: parseInt(value) || 0 }))}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_type">Event Type</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value) => handleSelectChange("event_type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="birthday">Birthday</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="flight">Flight</SelectItem>
                  <SelectItem value="embassy">Embassy</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event_date">Date & Time</Label>
              <Input
                id="event_date"
                name="event_date"
                type="datetime-local"
                value={formData.event_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Event title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              value={formData.location || ""}
              onChange={handleChange}
              placeholder="Location (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              placeholder="Event details..."
              className="min-h-[100px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="reminder_enabled"
              checked={!!formData.reminder_enabled}
              onChange={(e) => setFormData((prev) => ({ ...prev, reminder_enabled: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="reminder_enabled" className="cursor-pointer">
              Enable reminder for this event
            </Label>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Save Event</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [editingEvent, setEditingEvent] = useState<Partial<Event> | null>(null)

  const fetchData = async () => {
    try {
      const [fetchedEvents, fetchedUsers] = await Promise.all([
        api.getEvents(),
        api.getUsers()
      ])
      setEvents(fetchedEvents)
      setUsers(fetchedUsers)
    } catch (error) {
      console.error("Failed to fetch data:", error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await api.deleteEvent(id)
        setEvents(events.filter((e) => e.id !== id))
      } catch (error) {
        console.error("Failed to delete event:", error)
      }
    }
  }

  const handleSaveEvent = async (event: Partial<Event>) => {
    try {
      // Ensure date is in correct format for MySQL if needed, or just pass string
      // The datetime-local input gives 'YYYY-MM-DDTHH:mm', which is close to MySQL 'YYYY-MM-DD HH:mm:ss'
      // We might need to replace 'T' with ' '
      const eventToSave = {
        ...event,
        event_date: event.event_date?.replace('T', ' '),
        // Ensure optional fields are null if empty
        description: event.description || null,
        location: event.location || null,
      }

      if (event.id) {
        await api.updateEvent(event.id, eventToSave)
      } else {
        await api.createEvent(eventToSave)
      }
      setEditingEvent(null)
      fetchData()
    } catch (error) {
      console.error("Failed to save event:", error)
      alert("Failed to save event. Please check the console for details.")
    }
  }

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.user_name && event.user_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-8">
      <Sidebar currentPage="events" />
      <Header />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold">Events</h1>
          <p className="text-muted-foreground">Manage upcoming events and reminders</p>
        </div>
        <span>
          <Button className="gap-2" onClick={() => setEditingEvent({})}>
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
            placeholder="Search events by title or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
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
                  className={`rounded-lg bg-gradient-to-br ${eventTypeColors[event.event_type] || eventTypeColors.custom} p-3 flex-shrink-0`}
                >
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold">{event.title}</h3>
                    <Badge variant="outline">
                      {eventTypeBadges[event.event_type] || event.event_type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{event.user_name || "Unknown User"}</p>
                  <div className="flex flex-wrap gap-4 mt-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-medium">
                        {event.event_date ? format(new Date(event.event_date), "PPP p") : "N/A"}
                      </p>
                    </div>
                    {event.location && (
                      <div>
                        <p className="text-muted-foreground">Location</p>
                        <p className="font-medium">{event.location}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Reminder</p>
                      <Badge variant={event.reminder_enabled ? "default" : "secondary"} className="mt-1">
                        {event.reminder_enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setEditingEvent(event)} title="Edit Event">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDelete(event.id)}
                  title="Delete Event"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {filteredEvents.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No events found. Create one to get started!
          </div>
        )}
      </div>

      {/* Add/Edit Event Dialog */}
      {editingEvent && (
        <EventForm
          event={editingEvent}
          users={users}
          onSave={handleSaveEvent}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </div>
  )
}
