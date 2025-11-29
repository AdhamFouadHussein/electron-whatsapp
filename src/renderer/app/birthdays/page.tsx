"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Cake, Send, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"

interface Birthday {
  id: number
  name: string
  date_of_birth: string
  birthday_md: string
  days_until: number
  phone: string
}

export default function BirthdaysPage() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sendingId, setSendingId] = useState<number | null>(null)

  useEffect(() => {
    loadBirthdays()
  }, [])

  const loadBirthdays = async () => {
    try {
      setIsLoading(true)
      // Fetch birthdays for the next 30 days
      const data = await api.getUpcomingBirthdays(30)
      setBirthdays(data)
    } catch (error) {
      console.error("Failed to load birthdays:", error)
      toast.error("Failed to load upcoming birthdays")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendWish = async (userId: number, name: string) => {
    try {
      setSendingId(userId)
      await api.whatsapp.sendBirthdayWish(userId)
      toast.success(`Birthday wish sent to ${name}!`)
    } catch (error: any) {
      console.error("Failed to send birthday wish:", error)
      toast.error(error.message || "Failed to send birthday wish")
    } finally {
      setSendingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(date)
  }

  return (
    <div className="space-y-8">
      <>
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold">Birthdays</h1>
          <p className="text-muted-foreground">Send automated birthday wishes (Next 30 days)</p>
        </div>

        {/* Upcoming Birthdays */}
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : birthdays.length === 0 ? (
          <div className="text-center p-12 border rounded-lg bg-muted/10">
            <p className="text-muted-foreground">No upcoming birthdays found in the next 30 days.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {birthdays.map((birthday) => (
              <Card
                key={birthday.id}
                className="p-6 border-border/50 backdrop-blur-sm bg-card/50 hover:shadow-lg hover:shadow-accent/10 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 p-3">
                      <Cake className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{birthday.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(birthday.date_of_birth)} • {birthday.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge variant={birthday.days_until === 0 ? "default" : "outline"} className="mb-2 block">
                        {birthday.days_until === 0 ? "Today!" : `${birthday.days_until} days away`}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => handleSendWish(birthday.id, birthday.name)}
                      disabled={sendingId === birthday.id}
                    >
                      {sendingId === birthday.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Send Wish
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </>
    </div>
  )
}
