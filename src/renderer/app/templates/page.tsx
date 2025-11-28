"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash2, MoreVertical, Copy } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const templates = [
  {
    id: 1,
    name: "Birthday Wish",
    eventType: "birthday",
    language: "ar",
    text: "عيد ميلاد سعيد {{name}}! 🎉🎂 أتمنى لك يوماً رائعاً مليئاً بالفرح والسعادة!",
    isDefault: true,
    variables: ["name"],
  },
  {
    id: 2,
    name: "Meeting Reminder",
    eventType: "meeting",
    language: "en",
    text: "Hi {{name}}! Reminder: {{title}} on {{date}} at {{location}}",
    isDefault: true,
    variables: ["name", "title", "date", "location"],
  },
  {
    id: 3,
    name: "Flight Departure",
    eventType: "flight",
    language: "en",
    text: "Hi {{name}}, your flight {{title}} departs {{date}}. Please arrive 2 hours early.",
    isDefault: true,
    variables: ["name", "title", "date"],
  },
  {
    id: 4,
    name: "Embassy Appointment",
    eventType: "embassy",
    language: "ar",
    text: "مرحباً {{name}}، موعدك في السفارة في {{location}} مقرر في {{date}}",
    isDefault: false,
    variables: ["name", "location", "date"],
  },
]

const eventTypeColors = {
  birthday: "from-pink-500 to-rose-500",
  meeting: "from-blue-500 to-cyan-500",
  flight: "from-orange-500 to-red-500",
  embassy: "from-purple-500 to-indigo-500",
}

const eventTypeLabels = {
  birthday: "Birthday",
  meeting: "Meeting",
  flight: "Flight",
  embassy: "Embassy",
}

export default function TemplatesPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.eventType.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-8">
      <>
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Templates</h1>
            <p className="text-muted-foreground">Create and manage message templates</p>
          </div>
          <span>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          </span>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            Filter
          </Button>
        </div>

        {/* Templates Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="p-6 border-border/50 backdrop-blur-sm bg-card/50 hover:shadow-lg hover:shadow-accent/10 transition-all duration-300 flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-lg bg-gradient-to-br ${eventTypeColors[template.eventType as keyof typeof eventTypeColors]} p-2`}
                  >
                    <span className="text-white font-bold text-sm">
                      {eventTypeLabels[template.eventType as keyof typeof eventTypeLabels].substring(0, 1)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{template.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {eventTypeLabels[template.eventType as keyof typeof eventTypeLabels]} •{" "}
                      {template.language.toUpperCase()}
                    </p>
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
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
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

              {/* Template Badge */}
              <div className="mb-4">
                {template.isDefault && (
                  <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">Default Template</Badge>
                )}
              </div>

              {/* Template Text */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border/50 mb-4 flex-1">
                <p className="text-sm text-foreground line-clamp-3">{template.text}</p>
              </div>

              {/* Variables */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground">Variables:</span>
                {template.variables.map((variable) => (
                  <Badge key={variable} variant="outline" className="text-xs">
                    {`{{${variable}}}`}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </>
    </div>
  )
}
