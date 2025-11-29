"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Moon, Sun, Globe, Database, Lock, Bell, Save, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { useTheme } from "next-themes"
import { api } from "@/lib/api"
import { toast } from "sonner"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [dbConfig, setDbConfig] = useState({
    host: "localhost",
    port: "3306",
    user: "root",
    password: "",
    database: "whatsapp_reminder_app"
  })
  const [language, setLanguage] = useState("en")

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const config = await api.settings.getDatabaseConfig()
        if (config) {
          setDbConfig({
            host: config.host || "localhost",
            port: config.port?.toString() || "3306",
            user: config.user || "root",
            password: config.password || "",
            database: config.database || "whatsapp_reminder_app"
          })
        }

        const lang = await api.settings.getLanguage()
        if (lang) setLanguage(lang)
      } catch (error) {
        console.error("Failed to load settings:", error)
      }
    }
    loadSettings()
  }, [])

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    api.settings.setTheme(newTheme)
  }

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang)
    api.settings.setLanguage(newLang)
  }

  const handleDbConfigChange = (key: string, value: string) => {
    setDbConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    try {
      const success = await api.settings.testDatabaseConnection({
        ...dbConfig,
        port: parseInt(dbConfig.port)
      })
      if (success) {
        toast.success("Database connection successful")
      } else {
        toast.error("Database connection failed")
      }
    } catch (error) {
      console.error("Test connection error:", error)
      toast.error("Database connection failed")
    } finally {
      setIsTesting(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await api.settings.setDatabaseConfig({
        ...dbConfig,
        port: parseInt(dbConfig.port)
      })
      toast.success("Settings saved successfully")
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <>
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your application settings and preferences</p>
        </div>

        <div className="grid gap-6 max-w-2xl">
          {/* Theme Settings */}
          <Card className="p-6 border-border/50 backdrop-blur-sm bg-card/50 space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent/20 p-2">
                {theme === "dark" ? <Moon className="h-5 w-5 text-accent" /> : <Sun className="h-5 w-5 text-accent" />}
              </div>
              <h2 className="text-xl font-semibold">Theme</h2>
            </div>

            <div className="space-y-3">
              <Label>Color Theme</Label>
              <Select value={theme || "dark"} onValueChange={handleThemeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System Default</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Choose your preferred color scheme</p>
            </div>
          </Card>

          {/* Language Settings */}
          <Card className="p-6 border-border/50 backdrop-blur-sm bg-card/50 space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent/20 p-2">
                <Globe className="h-5 w-5 text-accent" />
              </div>
              <h2 className="text-xl font-semibold">Language & Region</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Language</Label>
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Select your preferred language</p>
              </div>

              <div className="space-y-3">
                <Label>Timezone</Label>
                <Select defaultValue="asia/riyadh">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asia/riyadh">Asia/Riyadh (GST)</SelectItem>
                    <SelectItem value="utc">UTC</SelectItem>
                    <SelectItem value="europe/london">Europe/London (GMT)</SelectItem>
                    <SelectItem value="america/newyork">America/New_York (EST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Notification Settings */}
          <Card className="p-6 border-border/50 backdrop-blur-sm bg-card/50 space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent/20 p-2">
                <Bell className="h-5 w-5 text-accent" />
              </div>
              <h2 className="text-xl font-semibold">Notifications</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                <div>
                  <p className="font-medium">Campaign Started</p>
                  <p className="text-xs text-muted-foreground">Get notified when campaigns start</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                <div>
                  <p className="font-medium">Reminder Sent</p>
                  <p className="text-xs text-muted-foreground">Get notified when reminders are sent</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                <div>
                  <p className="font-medium">Failed Messages</p>
                  <p className="text-xs text-muted-foreground">Alert on failed message deliveries</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
            </div>
          </Card>

          {/* Database Settings */}
          <Card className="p-6 border-border/50 backdrop-blur-sm bg-card/50 space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent/20 p-2">
                <Database className="h-5 w-5 text-accent" />
              </div>
              <h2 className="text-xl font-semibold">Database</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="db-host">Host</Label>
                <Input
                  id="db-host"
                  value={dbConfig.host}
                  onChange={(e) => handleDbConfigChange("host", e.target.value)}
                  className="border-border/50"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="db-port">Port</Label>
                <Input
                  id="db-port"
                  value={dbConfig.port}
                  onChange={(e) => handleDbConfigChange("port", e.target.value)}
                  className="border-border/50"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="db-user">User</Label>
                <Input
                  id="db-user"
                  value={dbConfig.user}
                  onChange={(e) => handleDbConfigChange("user", e.target.value)}
                  className="border-border/50"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="db-password">Password</Label>
                <Input
                  id="db-password"
                  type="password"
                  value={dbConfig.password}
                  onChange={(e) => handleDbConfigChange("password", e.target.value)}
                  className="border-border/50"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="db-name">Database Name</Label>
                <Input
                  id="db-name"
                  value={dbConfig.database}
                  onChange={(e) => handleDbConfigChange("database", e.target.value)}
                  className="border-border/50"
                />
              </div>

              <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={isTesting}>
                {isTesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Test Connection
              </Button>
            </div>
          </Card>

          {/* Security Settings */}
          <Card className="p-6 border-border/50 backdrop-blur-sm bg-card/50 space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent/20 p-2">
                <Lock className="h-5 w-5 text-accent" />
              </div>
              <h2 className="text-xl font-semibold">Security</h2>
            </div>

            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                Two-Factor Authentication
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                Active Sessions
              </Button>
            </div>
          </Card>

          {/* Save Button */}
          <Button size="lg" className="gap-2 w-full" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </>
    </div>
  )
}
