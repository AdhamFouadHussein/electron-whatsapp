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
import { ArrowLeft, Save, AlertCircle, Check } from "lucide-react"
import { Link } from "@/components/Link"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FormErrors {
  [key: string]: string
}

const AVAILABLE_USERS = [
  { id: 1, name: "Ahmed Hassan", phone: "+966501234567" },
  { id: 2, name: "Sarah Ali", phone: "+966502345678" },
  { id: 3, name: "Mohamed Ibrahim", phone: "+966503456789" },
  { id: 4, name: "Fatima Khan", phone: "+966504567890" },
  { id: 5, name: "Hassan Saleh", phone: "+966505678901" },
]

export default function NewCampaignPage() {
  const [formData, setFormData] = useState({
    name: "",
    messageText: "",
    selectedRecipients: [] as number[],
    minDelaySec: "5",
    maxDelaySec: "15",
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Campaign name is required"
    }

    if (!formData.messageText.trim()) {
      newErrors.messageText = "Message text is required"
    }

    if (formData.selectedRecipients.length === 0) {
      newErrors.recipients = "Please select at least one recipient"
    }

    const minDelay = Number.parseInt(formData.minDelaySec)
    const maxDelay = Number.parseInt(formData.maxDelaySec)

    if (isNaN(minDelay) || minDelay < 1) {
      newErrors.minDelaySec = "Min delay must be at least 1 second"
    }

    if (isNaN(maxDelay) || maxDelay < minDelay) {
      newErrors.maxDelaySec = "Max delay must be greater than min delay"
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
      setSuccessMessage("Campaign created successfully!")
      setFormData({
        name: "",
        messageText: "",
        selectedRecipients: [],
        minDelaySec: "5",
        maxDelaySec: "15",
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

  const toggleRecipient = (userId: number) => {
    setFormData((prev) => ({
      ...prev,
      selectedRecipients: prev.selectedRecipients.includes(userId)
        ? prev.selectedRecipients.filter((id) => id !== userId)
        : [...prev.selectedRecipients, userId],
    }))
    if (errors.recipients) {
      setErrors((prev) => ({ ...prev, recipients: "" }))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />
      <main className="ml-64 mt-20 space-y-8 p-8">
        <div className="flex items-center gap-4">
          <Link href="/campaigns">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Create Campaign</h1>
            <p className="text-muted-foreground">Launch a new bulk messaging campaign</p>
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
              {/* Campaign Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Campaign Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., December Birthday Wishes"
                  value={formData.name}
                  onChange={handleChange}
                  className={`border-border/50 ${errors.name ? "border-red-500" : ""}`}
                />
                {errors.name && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Message Text */}
              <div className="space-y-2">
                <Label htmlFor="messageText">
                  Message Text <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="messageText"
                  name="messageText"
                  placeholder="Enter the message to send..."
                  value={formData.messageText}
                  onChange={handleChange}
                  className={`border-border/50 min-h-28 ${errors.messageText ? "border-red-500" : ""}`}
                />
                {errors.messageText && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.messageText}
                  </p>
                )}
              </div>

              {/* Recipients Selection */}
              <div className="space-y-3">
                <Label>
                  Select Recipients <span className="text-destructive">*</span>
                </Label>
                <div className="space-y-2 p-4 rounded-lg bg-muted/50 border border-border/50 max-h-64 overflow-y-auto">
                  {AVAILABLE_USERS.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded hover:bg-muted/70 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedRecipients.includes(user.id)}
                        onChange={() => toggleRecipient(user.id)}
                        className="h-4 w-4"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.phone}</p>
                      </div>
                      {formData.selectedRecipients.includes(user.id) && <Check className="h-4 w-4 text-accent" />}
                    </label>
                  ))}
                </div>
                {errors.recipients && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.recipients}
                  </p>
                )}
                {formData.selectedRecipients.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {formData.selectedRecipients.length} recipient{formData.selectedRecipients.length !== 1 ? "s" : ""}{" "}
                    selected
                  </p>
                )}
              </div>

              {/* Delay Settings */}
              <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border/50">
                <Label className="font-semibold">Delivery Timing</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minDelaySec" className="text-sm">
                      Min Delay (seconds)
                    </Label>
                    <Input
                      id="minDelaySec"
                      name="minDelaySec"
                      type="number"
                      min="1"
                      value={formData.minDelaySec}
                      onChange={handleChange}
                      className={`border-border/50 ${errors.minDelaySec ? "border-red-500" : ""}`}
                    />
                    {errors.minDelaySec && (
                      <p className="text-xs text-red-600 dark:text-red-400">{errors.minDelaySec}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxDelaySec" className="text-sm">
                      Max Delay (seconds)
                    </Label>
                    <Input
                      id="maxDelaySec"
                      name="maxDelaySec"
                      type="number"
                      min="1"
                      value={formData.maxDelaySec}
                      onChange={handleChange}
                      className={`border-border/50 ${errors.maxDelaySec ? "border-red-500" : ""}`}
                    />
                    {errors.maxDelaySec && (
                      <p className="text-xs text-red-600 dark:text-red-400">{errors.maxDelaySec}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Messages will be sent with random delays between min and max to avoid rate limits
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6">
                <Button type="submit" className="gap-2" disabled={isSubmitting}>
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "Creating..." : "Create Campaign"}
                </Button>
                <Link href="/campaigns">
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
