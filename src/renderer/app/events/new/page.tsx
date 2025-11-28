"use client"

import type React from "react"
import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, AlertCircle } from "lucide-react"
import { Link } from "@/components/Link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserSearchInput } from "@/components/user-search-input"

interface FormErrors {
  [key: string]: string
}

export default function NewEventPage() {
  const [formData, setFormData] = useState({
    userId: "",
    eventType: "birthday",
    title: "",
    description: "",
    eventDate: "",
    eventTime: "09:00",
    location: "",
    reminderEnabled: true,
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.userId.trim()) {
      newErrors.userId = "User is required"
    }

    if (!formData.title.trim()) {
      newErrors.title = "Event title is required"
    }

    if (!formData.eventDate.trim()) {
      newErrors.eventDate = "Event date is required"
    } else if (new Date(formData.eventDate) < new Date()) {
      newErrors.eventDate = "Event date must be in the future"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSuccessMessage("Event created successfully!")
      setFormData({
        userId: "",
        eventType: "birthday",
        title: "",
        description: "",
        eventDate: "",
        eventTime: "09:00",
        location: "",
        reminderEnabled: true,
      })
      setTimeout(() => setSuccessMessage(""), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />
      <main className=" mt-20 space-y-8 p-8">
        <div className="flex items-center gap-4">
          <Link href="/events">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Create New Event</h1>
            <p className="text-muted-foreground">Add a new event to track and set reminders</p>
          </div>
        </div>

        {successMessage && (
          <Alert className="bg-green-500/20 border-green-500/30">
            <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-700 dark:text-green-400">{successMessage}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 max-w-2xl">
            <Card className="p-8 border-border/50 backdrop-blur-sm bg-card/50 space-y-6">
              <UserSearchInput
                value={formData.userId}
                onChange={(value) => handleSelectChange("userId", value)}
                error={errors.userId}
              />

              <div className="space-y-2">
                <Label htmlFor="eventType">
                  Event Type <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.eventType} onValueChange={(value) => handleSelectChange("eventType", value)}>
                  <SelectTrigger className="border-border/50">
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
                <Label htmlFor="title">
                  Event Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter event title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`border-border/50 ${errors.title ? "border-red-500" : ""}`}
                />
                {errors.title && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.title}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventDate">
                    Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="eventDate"
                    name="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={handleChange}
                    className={`border-border/50 ${errors.eventDate ? "border-red-500" : ""}`}
                  />
                  {errors.eventDate && (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.eventDate}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventTime">Time</Label>
                  <Input
                    id="eventTime"
                    name="eventTime"
                    type="time"
                    value={formData.eventTime}
                    onChange={handleChange}
                    className="border-border/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="Enter location"
                  value={formData.location}
                  onChange={handleChange}
                  className="border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Add event details..."
                  value={formData.description}
                  onChange={handleChange}
                  className="border-border/50 min-h-24"
                />
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border/50">
                <input
                  type="checkbox"
                  id="reminderEnabled"
                  checked={formData.reminderEnabled}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reminderEnabled: e.target.checked }))}
                  className="h-4 w-4"
                />
                <Label htmlFor="reminderEnabled" className="cursor-pointer mb-0">
                  Enable reminder for this event
                </Label>
              </div>

              <div className="flex gap-3 pt-6">
                <Button type="submit" className="gap-2" disabled={isSubmitting}>
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "Saving..." : "Save Event"}
                </Button>
                <Link href="/events">
                  <Button variant="outline">Cancel</Button>
                </Link>
              </div>
            </Card>
          </div>
        </form>
      </main>
    </div>
  )
}
