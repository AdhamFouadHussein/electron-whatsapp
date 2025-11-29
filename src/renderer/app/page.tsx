"use client"

import { useEffect, useState, ForwardRefExoticComponent, RefAttributes } from "react"
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
  Legend,
} from "recharts"
import { Users, Calendar, Bell, MessageSquare, LucideProps } from "lucide-react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { formatDistanceToNow } from 'date-fns';

interface StatCardProps {
  icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
  label: string;
  value: string | number;
  change?: string;
  color: string;
}

interface UpcomingEvent {
  id: number;
  user: string;
  event: string;
  date: string;
  status: string;
}

function StatCard({ icon: Icon, label, value, change, color }: StatCardProps) {
  return (
    <Card className="p-6 transition-all duration-300 hover:shadow-lg hover:shadow-accent/20 border-border/50 backdrop-blur-sm bg-card/50">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          {change && <p className="mt-1 text-xs text-green-600/80 font-medium">{change} vs last week</p>}
        </div>
        <div className={`rounded-lg bg-gradient-to-br ${color} p-3`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </Card>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, upcomingEvents: 0, pendingReminders: 0, messagesToday: 0 });
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, messagesData, statusData, eventsData] = await Promise.all([
          api.getDashboardStats(),
          api.getMessagesChartData(),
          api.getTodaysMessageStatus(),
          api.getUpcomingEventsList(4)
        ]);
        setStats(statsData);
        setChartData(messagesData);
        setPieData(statusData);
        setUpcomingEvents(eventsData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    };
    fetchData();
  }, []);

  const statData = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "from-blue-500 to-cyan-500" },
    { label: "Upcoming Events", value: stats.upcomingEvents, icon: Calendar, color: "from-purple-500 to-pink-500" },
    { label: "Pending Reminders", value: stats.pendingReminders, icon: Bell, color: "from-orange-500 to-red-500" },
    { label: "Messages Today", value: stats.messagesToday, icon: MessageSquare, color: "from-green-500 to-teal-500" },
  ];

  const COLORS = ["#10b981", "#ef4444", "#f59e0b"];

  return (
    <div className="space-y-8">
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
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: `1px solid var(--border)`,
                  borderRadius: "8px",
                  color: "var(--foreground)",
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--primary)"
                strokeWidth={3}
                dot={{ fill: "var(--primary)", r: 4 }}
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
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: `1px solid var(--border)`,
                  borderRadius: "8px",
                  color: "var(--foreground)",
                }}
                itemStyle={{ color: "var(--foreground)" }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className="text-foreground">{value}</span>}
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
                <span className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(event.date), { addSuffix: true })}</span>
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
    </div>
  )
}
