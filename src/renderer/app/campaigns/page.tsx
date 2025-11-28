"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash2, MoreVertical, Play, Pause } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const campaigns = [
  {
    id: 1,
    name: "December Birthday Wishes",
    status: "running",
    recipients: 245,
    sent: 187,
    failed: 12,
    pending: 46,
    createdAt: "2024-12-01",
    startedAt: "2024-12-05",
  },
  {
    id: 2,
    name: "Year-End Sale Promotion",
    status: "paused",
    recipients: 1200,
    sent: 856,
    failed: 34,
    pending: 310,
    createdAt: "2024-11-28",
    startedAt: "2024-12-01",
  },
  {
    id: 3,
    name: "New Year Greetings",
    status: "draft",
    recipients: 500,
    sent: 0,
    failed: 0,
    pending: 500,
    createdAt: "2024-12-03",
    startedAt: null,
  },
  {
    id: 4,
    name: "Event Reminders - December",
    status: "completed",
    recipients: 890,
    sent: 890,
    failed: 0,
    pending: 0,
    createdAt: "2024-11-15",
    startedAt: "2024-11-20",
  },
]

const statusColors = {
  draft: "bg-gray-500/20 text-gray-700 dark:text-gray-400",
  running: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  paused: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  completed: "bg-green-500/20 text-green-700 dark:text-green-400",
}

export default function CampaignsPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-8">
      <>
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Campaigns</h1>
            <p className="text-muted-foreground">Manage bulk messaging campaigns</p>
          </div>
          <span>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Campaign
            </Button>
          </span>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            Filter
          </Button>
        </div>

        {/* Campaigns List */}
        <div className="space-y-4">
          {filteredCampaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className="p-6 border-border/50 backdrop-blur-sm bg-card/50 hover:shadow-lg hover:shadow-accent/10 transition-all duration-300"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-semibold">{campaign.name}</h3>
                    <Badge className={statusColors[campaign.status as keyof typeof statusColors]}>
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Created {campaign.createdAt}</p>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  {campaign.status === "draft" && (
                    <Button size="sm" className="gap-2">
                      <Play className="h-4 w-4" />
                      Start
                    </Button>
                  )}
                  {campaign.status === "running" && (
                    <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                      <Pause className="h-4 w-4" />
                      Pause
                    </Button>
                  )}
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
              </div>

              {/* Progress */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {campaign.sent + campaign.failed}/{campaign.recipients}
                  </span>
                </div>
                <Progress value={((campaign.sent + campaign.failed) / campaign.recipients) * 100} className="h-2" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Recipients</p>
                  <p className="font-semibold">{campaign.recipients}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sent</p>
                  <p className="font-semibold text-green-600 dark:text-green-400">{campaign.sent}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Failed</p>
                  <p className="font-semibold text-red-600 dark:text-red-400">{campaign.failed}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="font-semibold text-yellow-600 dark:text-yellow-400">{campaign.pending}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </>
    </div>
  )
}
