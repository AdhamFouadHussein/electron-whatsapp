"use client"

import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Users, Calendar, Bell, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"

const statData = [
  { label: "Total Users", value: "2,847", change: "+12%", icon: Users, color: "from-blue-500 to-cyan-500" },
  { label: "Upcoming Events", value: "48", change: "+5%", icon: Calendar, color: "from-purple-500 to-pink-500" },
  { label: "Pending Reminders", value: "156", change: "-8%", icon: Bell, color: "from-orange-500 to-red-500" },
  { label: "Messages Today", value: "8.2K", change: "+22%", icon: MessageSquare, color: "from-green-500 to-teal-500" },
]

const chartData = [
  { name: "Mon", value: 400 },
  { name: "Tue", value: 520 },
  { name: "Wed", value: 480 },
  { name: "Thu", value: 620 },
  { name: "Fri", value: 890 },
  { name: "Sat", value: 720 },
  { name: "Sun", value: 550 },
]

const upcomingEvents = [
  { id: 1, user: "Ahmed Hassan", event: "Birthday", date: "Today", status: "pending" },
  { id: 2, user: "Sarah Ali", event: "Meeting", date: "Tomorrow", status: "pending" },
  { id: 3, user: "Mohamed Ibrahim", event: "Flight", date: "2 days", status: "scheduled" },
  { id: 4, user: "Fatima Khan", event: "Embassy", date: "3 days", status: "scheduled" },
]

const pieData = [
  { name: "Sent", value: 65 },
  { name: "Failed", value: 15 },
  { name: "Pending", value: 20 },
]

const COLORS = ["#10b981", "#ef4444", "#f59e0b"]

function StatCard({ icon: Icon, label, value, change, color }) {
  return (
    <Card className="p-6 transition-all duration-300 hover:shadow-lg hover:shadow-accent/20 border-border/50 backdrop-blur-sm bg-card/50">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          <p className="mt-1 text-xs text-green-600/80 font-medium">{change} vs last week</p>
        </div>
        <div className={`rounded-lg bg-gradient-to-br ${color} p-3`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </Card>
  )
}

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />
      <main className="ml-64 mt-20 space-y-8 p-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground">Here's what's happening with your reminders today</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statData.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <Card className="col-span-1 lg:col-span-2 p-6 border-border/50 backdrop-blur-sm bg-card/50">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">Messages Sent (7 Days)</h3>
              <p className="text-sm text-muted-foreground">Daily message volume trend</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" />
                <XAxis stroke="hsl(var(--color-muted-foreground))" />
                <YAxis stroke="hsl(var(--color-muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--color-card))",
                    border: `1px solid hsl(var(--color-border))`,
                    borderRadius: "8px",
                    color: "hsl(var(--color-foreground))",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--color-accent))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--color-accent))", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6 border-border/50 backdrop-blur-sm bg-card/50">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">Message Status</h3>
              <p className="text-sm text-muted-foreground">Today's overview</p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--color-card))",
                    border: `1px solid hsl(var(--color-border))`,
                    borderRadius: "8px",
                    color: "hsl(var(--color-foreground))",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card className="p-6 border-border/50 backdrop-blur-sm bg-card/50">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Upcoming Events</h3>
              <p className="text-sm text-muted-foreground">Next reminders to send</p>
            </div>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>

          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between rounded-lg border border-border/50 p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent to-primary" />
                  <div>
                    <p className="font-medium">{event.user}</p>
                    <p className="text-sm text-muted-foreground">{event.event}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{event.date}</span>
                  <div
                    className={`rounded-full px-3 py-1 text-xs font-medium ${event.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                        : "bg-green-500/20 text-green-700 dark:text-green-400"
                      }`}
                  >
                    {event.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  )
}
