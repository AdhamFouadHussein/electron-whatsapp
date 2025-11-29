"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, AlertCircle, Plus, X, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { api } from "../../../lib/api"
import { useNavigation } from "../../../context/NavigationContext"
import { toast } from "sonner"

interface FormErrors {
  [key: string]: string
}

interface NewTemplatePageProps {
  editId?: number
  duplicateId?: number
}

export default function NewTemplatePage({ editId, duplicateId }: NewTemplatePageProps) {
  const { setCurrentPage } = useNavigation()
  const [formData, setFormData] = useState({
    id: undefined as number | undefined,
    name: "",
    event_type: "birthday",
    language: "en",
    template_text: "",
    variables: [] as string[],
    is_default: false,
  })

  const [newVariable, setNewVariable] = useState("")
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(!!(editId || duplicateId))

  useEffect(() => {
    const loadTemplate = async () => {
      const idToLoad = editId || duplicateId
      if (!idToLoad) return

      try {
        setIsLoading(true)
        const template = await api.getMessageTemplate(idToLoad)
        if (template) {
          setFormData({
            id: editId ? template.id : undefined, // Only set ID if editing
            name: duplicateId ? `${template.name} (Copy)` : template.name,
            event_type: template.event_type,
            language: template.language,
            template_text: template.template_text,
            variables: template.variables || [],
            is_default: duplicateId ? false : template.is_default, // Reset default for duplicates
          })
        }
      } catch (error) {
        console.error("Failed to load template:", error)
        toast.error("Failed to load template details")
      } finally {
        setIsLoading(false)
      }
    }

    loadTemplate()
  }, [editId, duplicateId])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Template name is required"
    }

    if (!formData.template_text.trim()) {
      newErrors.template_text = "Template text is required"
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
      await api.saveMessageTemplate(formData)
      toast.success(editId ? "Template updated successfully!" : "Template created successfully!")
      setTimeout(() => setCurrentPage('templates'), 1000)
    } catch (error) {
      console.error("Failed to save template:", error)
      toast.error("Failed to save template")
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

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const pageTitle = editId ? "Edit Template" : duplicateId ? "Duplicate Template" : "Create Template"
  const pageDescription = editId ? "Update existing message template" : "Create a new message template for events"

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setCurrentPage('templates')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{pageTitle}</h1>
          <p className="text-muted-foreground">{pageDescription}</p>
        </div>
      </div>

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
                <Label htmlFor="event_type">Event Type</Label>
                <Select value={formData.event_type} onValueChange={(value) => handleSelectChange("event_type", value)}>
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
              <Label htmlFor="template_text">
                Template Text <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="template_text"
                name="template_text"
                placeholder="Enter your message template. Use {{variableName}} for variables."
                value={formData.template_text}
                onChange={handleChange}
                className={`border-border/50 min-h-32 ${errors.template_text ? "border-red-500" : ""}`}
              />
              {errors.template_text && (
                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.template_text}
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
                id="is_default"
                checked={formData.is_default}
                onChange={(e) => setFormData((prev) => ({ ...prev, is_default: e.target.checked }))}
                className="h-4 w-4"
              />
              <Label htmlFor="is_default" className="cursor-pointer mb-0">
                Set as default template for this event type
              </Label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6">
              <Button type="submit" className="gap-2" disabled={isSubmitting}>
                <Save className="h-4 w-4" />
                {isSubmitting ? "Saving..." : "Save Template"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setCurrentPage('templates')}>Cancel</Button>
            </div>
          </Card>
        </div>
      </form>
    </div>
  )
}
