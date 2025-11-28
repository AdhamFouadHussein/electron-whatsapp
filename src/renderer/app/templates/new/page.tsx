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
import { ArrowLeft, Save, AlertCircle, Plus, X } from "lucide-react"
import { Link } from "@/components/Link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface FormErrors {
  [key: string]: string
}

export default function NewTemplatePage() {
  const [formData, setFormData] = useState({
    name: "",
    eventType: "birthday",
    language: "en",
    templateText: "",
    variables: [] as string[],
    isDefault: false,
  })

  const [newVariable, setNewVariable] = useState("")
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Template name is required"
    }

    if (!formData.templateText.trim()) {
      newErrors.templateText = "Template text is required"
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
      setSuccessMessage("Template created successfully!")
      setFormData({
        name: "",
        eventType: "birthday",
        language: "en",
        templateText: "",
        variables: [],
        isDefault: false,
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

  const addVariable = () => {
    if (newVariable.trim() && !formData.variables.includes(newVariable)) {
      setFormData((prev) => ({
        ...prev,
        variables: [...prev.variables, newVariable],
      }))
      setNewVariable("")
    }
  }

  const removeVariable = (variable: string) => {
    setFormData((prev) => ({
      ...prev,
      variables: prev.variables.filter((v) => v !== variable),
    }))
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />
      <main className="ml-55 mt-20 space-y-8 p-8">
        <div className="flex items-center gap-4">
          <Link href="/templates">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Create Template</h1>
            <p className="text-muted-foreground">Create a new message template for events</p>
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
              {/* Template Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Template Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Birthday Wish"
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

              {/* Event Type & Language */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventType">Event Type</Label>
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
                  <Label htmlFor="language">Language</Label>
                  <Select value={formData.language} onValueChange={(value) => handleSelectChange("language", value)}>
                    <SelectTrigger className="border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Template Text */}
              <div className="space-y-2">
                <Label htmlFor="templateText">
                  Template Text <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="templateText"
                  name="templateText"
                  placeholder="Enter your message template. Use {{variableName}} for variables."
                  value={formData.templateText}
                  onChange={handleChange}
                  className={`border-border/50 min-h-32 ${errors.templateText ? "border-red-500" : ""}`}
                />
                {errors.templateText && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.templateText}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Use {"{{name}}, {{date}}, {{location}}"} for placeholders
                </p>
              </div>

              {/* Variables */}
              <div className="space-y-3">
                <Label>Template Variables</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add variable (e.g., name, date)"
                    value={newVariable}
                    onChange={(e) => setNewVariable(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addVariable())}
                    className="border-border/50"
                  />
                  <Button type="button" variant="outline" onClick={addVariable} className="gap-2 bg-transparent">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
                {formData.variables.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.variables.map((variable) => (
                      <Badge key={variable} variant="outline" className="gap-1">
                        {`{{${variable}}}`}
                        <button
                          type="button"
                          onClick={() => removeVariable(variable)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Default Template */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border/50">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isDefault: e.target.checked }))}
                  className="h-4 w-4"
                />
                <Label htmlFor="isDefault" className="cursor-pointer mb-0">
                  Set as default template for this event type
                </Label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6">
                <Button type="submit" className="gap-2" disabled={isSubmitting}>
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "Saving..." : "Save Template"}
                </Button>
                <Link href="/templates">
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
