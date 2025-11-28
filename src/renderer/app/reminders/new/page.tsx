"use client"

import type React from "react"
import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, AlertCircle, Clock } from "lucide-react"
import { Link } from "@/components/Link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { UserSearchInput } from "@/components/user-search-input"

interface FormErrors {
  [key: string]: string
}

export default function NewReminderPage() {
  const [formData, setFormData] = useState({
    userId: "",
    reminderTime: "09:00",
    reminderDate: "",
    message: "",
    status: "pending",
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.userId.trim()) {
      newErrors.userId = "User is required"
    }

    if (!formData.reminderDate.trim()) {
      newErrors.reminderDate = "Reminder date is required"
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required"
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
      setSuccessMessage("Reminder created successfully!")
      setFormData({
        userId: "",
        reminderTime: "09:00",
        reminderDate: "",
        message: "",
        status: "pending",
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
          <Link href="/reminders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Create Reminder</h1>
            <p className="text-muted-foreground">Schedule a new message reminder</p>
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

              {/* Reminder Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reminderDate">
                    Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="reminderDate"
                    name="reminderDate"
                    type="date"
                    value={formData.reminderDate}
                    onChange={handleChange}
                    className={`border-border/50 ${errors.reminderDate ? "border-red-500" : ""}`}
                  />
                  {errors.reminderDate && (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.reminderDate}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reminderTime">Time</Label>
                  <Input
                    id="reminderTime"
                    name="reminderTime"
                    type="time"
                    value={formData.reminderTime}
                    onChange={handleChange}
                    className="border-border/50"
                  />
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">
                  Message <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Enter the reminder message..."
                  value={formData.message}
                  onChange={handleChange}
                  className={`border-border/50 min-h-24 ${errors.message ? "border-red-500" : ""}`}
                />
                {errors.message && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.message}
                  </p>
                )}
              </div>

              {/* Status Info */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border/50 flex items-start gap-3">
                <Clock className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Initial Status</p>
                  <Badge className="mt-2 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">Pending</Badge>
                  <p className="text-xs text-muted-foreground mt-2">This reminder will be sent at the scheduled time</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6">
                <Button type="submit" className="gap-2" disabled={isSubmitting}>
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "Saving..." : "Save Reminder"}
                </Button>
                <Link href="/reminders">
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
