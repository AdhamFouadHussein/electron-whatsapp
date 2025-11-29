"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigation } from "@/context/NavigationContext"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash2, MoreVertical, Play, Pause, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

const statusColors = {
  draft: "bg-gray-500/20 text-gray-700 dark:text-gray-400",
  running: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  paused: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  completed: "bg-green-500/20 text-green-700 dark:text-green-400",
}

export default function CampaignsPage() {
  const { setCurrentPage } = useNavigation()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)

  const fetchCampaigns = async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const data = await api.getCampaigns()
      setCampaigns(data)
    } catch (error) {
      console.error("Failed to fetch campaigns:", error)
      if (showLoading) {
        toast({
          title: "Error",
          description: "Failed to fetch campaigns",
          variant: "destructive",
        })
      }
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns(true)
    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current)
    }
  }, [])

  // Poll for updates if any campaign is running
  useEffect(() => {
    const hasRunningCampaigns = campaigns.some(c => c.status === 'running')

    if (hasRunningCampaigns) {
      if (!pollingInterval.current) {
        pollingInterval.current = setInterval(() => fetchCampaigns(false), 3000)
      }
    } else {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
        pollingInterval.current = null
      }
    }
  }, [campaigns])

  const handleStart = async (id: number) => {
    setProcessingId(id)
    try {
      await api.startCampaign(id)
      toast({ title: "Success", description: "Campaign started" })
      await fetchCampaigns(false)
    } catch (error) {
      toast({ title: "Error", description: "Failed to start campaign", variant: "destructive" })
    } finally {
      setProcessingId(null)
    }
  }

  const handlePause = async (id: number) => {
    setProcessingId(id)
    try {
      await api.pauseCampaign(id)
      toast({ title: "Success", description: "Campaign paused" })
      await fetchCampaigns(false)
    } catch (error) {
      toast({ title: "Error", description: "Failed to pause campaign", variant: "destructive" })
    } finally {
      setProcessingId(null)
    }
  }

  const handleResume = async (id: number) => {
    setProcessingId(id)
    try {
      await api.resumeCampaign(id)
      toast({ title: "Success", description: "Campaign resumed" })
      await fetchCampaigns(false)
    } catch (error) {
      toast({ title: "Error", description: "Failed to resume campaign", variant: "destructive" })
    } finally {
      setProcessingId(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return
    setProcessingId(id)
    try {
      await api.deleteCampaign(id)
      toast({ title: "Success", description: "Campaign deleted" })
      await fetchCampaigns(false)
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete campaign", variant: "destructive" })
    } finally {
      setProcessingId(null)
    }
  }

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
            <Button className="gap-2" onClick={() => setCurrentPage("campaigns/new")}>
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
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading campaigns...</div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No campaigns found</div>
          ) : (
            filteredCampaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="p-6 border-border/50 backdrop-blur-sm bg-card/50 hover:shadow-lg hover:shadow-accent/10 transition-all duration-300 cursor-pointer"
                onClick={() => setCurrentPage(`campaigns/details/${campaign.id}`)}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-semibold">{campaign.name}</h3>
                      <Badge className={statusColors[campaign.status as keyof typeof statusColors] || "bg-gray-500/20"}>
                        {campaign.status ? campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1) : "Unknown"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Created {campaign.created_at_epoch_ms ? new Date(campaign.created_at_epoch_ms).toLocaleDateString() : 'Unknown'}</p>
                  </div>

                  <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {campaign.status === "draft" && (
                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStart(campaign.id);
                        }}
                        disabled={processingId === campaign.id}
                      >
                        {processingId === campaign.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                        Start
                      </Button>
                    )}
                    {campaign.status === "running" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePause(campaign.id);
                        }}
                        disabled={processingId === campaign.id}
                      >
                        {processingId === campaign.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Pause className="h-4 w-4" />
                        )}
                        Pause
                      </Button>
                    )}
                    {campaign.status === "paused" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResume(campaign.id);
                        }}
                        disabled={processingId === campaign.id}
                      >
                        {processingId === campaign.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                        Resume
                      </Button>
                    )}
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {campaign.status === 'draft' && (
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer"
                              onClick={() => toast({ title: "Info", description: "Edit functionality coming soon" })}
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer text-red-600"
                            onClick={() => handleDelete(campaign.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                {campaign.status !== 'draft' && (
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {/* Assuming backend returns these counts, otherwise we might need to calculate or fetch them */}
                        {/* For now, let's assume the backend returns total_recipients, sent_count, failed_count */}
                        {(campaign.sent_count || 0) + (campaign.failed_count || 0)}/{campaign.total_recipients || 0}
                      </span>
                    </div>
                    <Progress
                      value={campaign.total_recipients ? (((campaign.sent_count || 0) + (campaign.failed_count || 0)) / campaign.total_recipients) * 100 : 0}
                      className="h-2"
                    />
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Recipients</p>
                    <p className="font-semibold">{campaign.total_recipients || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sent</p>
                    <p className="font-semibold text-green-600 dark:text-green-400">{campaign.sent_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Failed</p>
                    <p className="font-semibold text-red-600 dark:text-red-400">{campaign.failed_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="font-semibold text-yellow-600 dark:text-yellow-400">
                      {(campaign.total_recipients || 0) - ((campaign.sent_count || 0) + (campaign.failed_count || 0))}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </>
    </div>
  )
}
