"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash2, MoreVertical, Copy, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { api } from "../../lib/api"
import { useNavigation } from "../../context/NavigationContext"
import { toast } from "sonner"

interface EventType {
  id: number
  name: string
  color: string
  icon: string
}

export default function TemplatesPage() {
  const { setCurrentPage } = useNavigation()
  const [searchTerm, setSearchTerm] = useState("")
  const [templates, setTemplates] = useState<any[]>([])
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [templatesData, typesData] = await Promise.all([
        api.getMessageTemplates(),
        api.getEventTypes()
      ])
      setTemplates(templatesData)
      setEventTypes(typesData)
    } catch (error) {
      console.error("Failed to load data:", error)
      toast.error("Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      try {
        await api.deleteMessageTemplate(id)
        toast.success("Template deleted successfully")
        loadData()
      } catch (error) {
        console.error("Failed to delete template:", error)
        toast.error("Failed to delete template")
      }
    }
  }

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.event_type.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getTypeColor = (typeName: string) => {
    const type = eventTypes.find(t => t.name === typeName)
    return type?.color || "from-gray-500 to-slate-500"
  }

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
            <Button className="gap-2" onClick={() => setCurrentPage('templates/new')}>
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
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center p-12 border rounded-lg bg-muted/10">
            <p className="text-muted-foreground">No templates found. Create one to get started.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="p-6 border-border/50 backdrop-blur-sm bg-card/50 hover:shadow-lg hover:shadow-accent/10 transition-all duration-300 flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-lg bg-gradient-to-br ${getTypeColor(template.event_type)} p-2`}
                    >
                      <span className="text-white font-bold text-sm capitalize">
                        {template.event_type.substring(0, 1)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-xs text-muted-foreground capitalize">
                        {template.event_type} •{" "}
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
                      <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => setCurrentPage(`templates/duplicate/${template.id}`)}>
                        <Copy className="h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => setCurrentPage(`templates/edit/${template.id}`)}>
                        <Edit className="h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 cursor-pointer text-red-600" onClick={() => handleDelete(template.id)}>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Template Badge */}
                <div className="mb-4">
                  {template.is_default && (
                    <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">Default Template</Badge>
                  )}
                </div>

                {/* Template Text */}
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50 mb-4 flex-1">
                  <p className="text-sm text-foreground line-clamp-3">{template.template_text}</p>
                </div>

                {/* Variables */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground">Variables:</span>
                  {template.variables && template.variables.map((variable: string) => (
                    <Badge key={variable} variant="outline" className="text-xs">
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </>
    </div>
  )
}
