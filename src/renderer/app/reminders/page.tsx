"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { api } from "@/lib/api"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Clock, Edit, Trash2, Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UserSearchInput } from "@/components/user-search-input"

interface Reminder {
  id: number
  user_id: number
  user_name?: string
  reminder_date: string
  message: string
  status: string
}

interface User {
  id: number
  name: string
  phone: string
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  scheduled: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  sent: "bg-green-500/20 text-green-700 dark:text-green-400",
  failed: "bg-red-500/20 text-red-700 dark:text-red-400",
}

function ReminderForm({
  reminder,
  users,
  onSave,
  onClose,
}: {
  reminder: Partial<Reminder> | null
  users: User[]
  onSave: (reminder: Partial<Reminder>) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState<Partial<Reminder>>({
    user_id: 0,
    reminder_date: "",
    message: "",
    status: "pending",
    ...reminder,
  })

  useEffect(() => {
    const initialData = { ...reminder }
    if (initialData.reminder_date) {
      try {
        initialData.reminder_date = format(new Date(initialData.reminder_date), "yyyy-MM-dd'T'HH:mm")
      } catch (e) {
        initialData.reminder_date = ""
      }
    }
    setFormData({
      user_id: 0,
      reminder_date: "",
      message: "",
      status: "pending",
      ...initialData,
    })
  }, [reminder])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Dialog open={!!reminder} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{reminder?.id ? "Edit Reminder" : "Add New Reminder"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <UserSearchInput
            users={users}
            value={formData.user_id?.toString() || ""}
            onChange={(value) => setFormData((prev) => ({ ...prev, user_id: parseInt(value) || 0 }))}
            required
          />

          <div className="space-y-2">
            <Label htmlFor="reminder_date">Date & Time</Label>
            <Input
              id="reminder_date"
              name="reminder_date"
              type="datetime-local"
              value={formData.reminder_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Reminder message..."
              className="min-h-[100px]"
              required
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Save Reminder</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [editingReminder, setEditingReminder] = useState<Partial<Reminder> | null>(null)

  const fetchData = async () => {
    try {
      const [fetchedReminders, fetchedUsers] = await Promise.all([
        api.getReminders(),
        api.getUsers()
      ])
      setReminders(fetchedReminders)
      setUsers(fetchedUsers)
    } catch (error) {
      console.error("Failed to fetch data:", error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this reminder?")) {
      try {
        await api.deleteReminder(id)
        setReminders(reminders.filter((r) => r.id !== id))
      } catch (error) {
        console.error("Failed to delete reminder:", error)
      }
    }
  }

  const handleSaveReminder = async (reminder: Partial<Reminder>) => {
    try {
      const reminderToSave = {
        ...reminder,
        reminder_time: reminder.reminder_date?.replace('T', ' '),
        custom_message: reminder.message,
        user_id: reminder.user_id,
      }

      if (reminder.id) {
        await api.updateReminder(reminder.id, reminderToSave)
      } else {
        await api.createReminder(reminderToSave)
      }
      setEditingReminder(null)
      fetchData()
    } catch (error) {
      console.error("Failed to save reminder:", error)
      alert("Failed to save reminder. Please check the console for details.")
    }
  }

  const filteredReminders = reminders.filter(
    (reminder) =>
      (reminder.message && reminder.message.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (reminder.user_name && reminder.user_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-background">
      <Sidebar currentPage="reminders" />
      <Header />
      <main className=" mt-20 space-y-8 p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Reminders</h1>
            <p className="text-muted-foreground">Schedule and manage message reminders</p>
          </div>
          <Button className="gap-2" onClick={() => setEditingReminder({})}>
            <Plus className="h-4 w-4" />
            Add Reminder
          </Button>
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
                      <h3 className="text-lg font-semibold">{reminder.user_name || "Unknown User"}</h3>
                      <Badge className={statusColors[reminder.status] || statusColors.pending}>
                        {reminder.status ? reminder.status.charAt(0).toUpperCase() + reminder.status.slice(1) : "Pending"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {reminder.reminder_date ? format(new Date(reminder.reminder_date), "PPP p") : "N/A"}
                    </p>
                    <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                      <p className="text-sm">{reminder.message}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0 items-center">
                  {reminder.status === "pending" && (
                    <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                      <Send className="h-4 w-4" />
                      Send Now
                    </Button>
                  )}
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditingReminder(reminder)} title="Edit Reminder">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(reminder.id)}
                      title="Delete Reminder"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {filteredReminders.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No reminders found. Create one to get started!
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Reminder Dialog */}
      {editingReminder && (
        <ReminderForm
          reminder={editingReminder}
          users={users}
          onSave={handleSaveReminder}
          onClose={() => setEditingReminder(null)}
        />
      )}
    </div>
  )
}

