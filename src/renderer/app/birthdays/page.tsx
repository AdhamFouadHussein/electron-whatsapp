"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Cake, Send } from "lucide-react"

const upcomingBirthdays = [
  { id: 1, name: "Ahmed Hassan", date: "December 8", daysUntil: 2, sent: false },
  { id: 2, name: "Sarah Ali", date: "December 10", daysUntil: 4, sent: false },
  { id: 3, name: "Mohamed Ibrahim", date: "December 12", daysUntil: 6, sent: false },
  { id: 4, name: "Fatima Khan", date: "December 15", daysUntil: 9, sent: false },
  { id: 5, name: "Hassan Saleh", date: "December 18", daysUntil: 12, sent: false },
]

export default function BirthdaysPage() {
  return (
    <div className="space-y-8">
      <>
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold">Birthdays</h1>
          <p className="text-muted-foreground">Send automated birthday wishes</p>
        </div>

        {/* Upcoming Birthdays */}
        <div className="space-y-4">
          {upcomingBirthdays.map((birthday) => (
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
                    <p className="text-sm text-muted-foreground">{birthday.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge variant="outline" className="mb-2 block">
                      {birthday.daysUntil} days away
                    </Badge>
                    <p className="text-xs text-muted-foreground">{birthday.sent ? "Wish sent" : "Not sent yet"}</p>
                  </div>
                  {!birthday.sent && (
                    <Button size="sm" className="gap-2">
                      <Send className="h-4 w-4" />
                      Send Wish
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </>
    </div>
  )
}
