"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageCircle, Wifi, WifiOff, RotateCcw, LogOut, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function WhatsAppPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [showQR, setShowQR] = useState(false)

  return (
    <div className="space-y-8">
      <>
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold">WhatsApp Manager</h1>
          <p className="text-muted-foreground">Connect and manage your WhatsApp business account</p>
        </div>

        {/* Status Card */}
        <Card className="p-8 border-border/50 backdrop-blur-sm bg-gradient-to-br from-card/50 to-card/30">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Connection Status</h2>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <Wifi className="h-5 w-5 text-green-500" />
                    <span className="text-lg font-medium text-green-600 dark:text-green-400">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-5 w-5 text-red-500" />
                    <span className="text-lg font-medium text-red-600 dark:text-red-400">Disconnected</span>
                  </>
                )}
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>

          {isConnected ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Account Name</p>
                  <p className="font-semibold">Business Account</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Phone Number</p>
                  <p className="font-semibold">+966 50 XXX XXXX</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Connected Since</p>
                  <p className="font-semibold">Dec 5, 2024</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Messages Sent</p>
                  <p className="font-semibold">12,847</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="gap-2 bg-transparent">
                  <RotateCcw className="h-4 w-4" />
                  Reconnect
                </Button>
                <Button variant="destructive" className="gap-2" onClick={() => setIsConnected(false)}>
                  <LogOut className="h-4 w-4" />
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  WhatsApp is not connected. Scan the QR code to connect your account.
                </AlertDescription>
              </Alert>

              <Button size="lg" className="w-full" onClick={() => setShowQR(true)}>
                <MessageCircle className="h-5 w-5 mr-2" />
                Connect WhatsApp
              </Button>
            </div>
          )}
        </Card>

        {/* QR Code Modal */}
        {showQR && (
          <Card className="p-8 border-border/50 backdrop-blur-sm bg-card/50">
            <div className="max-w-md mx-auto text-center">
              <h3 className="text-lg font-semibold mb-4">Scan QR Code</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Open WhatsApp on your phone and scan this QR code to connect
              </p>

              {/* Placeholder QR */}
              <div className="bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 p-8 rounded-lg mb-6 aspect-square flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-muted-foreground">QR</div>
                  <p className="text-xs text-muted-foreground mt-2">Scan with WhatsApp</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  onClick={() => {
                    setShowQR(false)
                    setIsConnected(true)
                  }}
                >
                  Connected
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowQR(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Info Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6 border-border/50 backdrop-blur-sm bg-card/50">
            <h3 className="text-lg font-semibold mb-4">How to Connect</h3>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="font-semibold text-foreground">1.</span>
                <span>Click "Connect WhatsApp" button</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground">2.</span>
                <span>Open WhatsApp on your phone</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground">3.</span>
                <span>Go to Settings → Linked Devices</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground">4.</span>
                <span>Scan the QR code with your phone</span>
              </li>
            </ol>
          </Card>

          <Card className="p-6 border-border/50 backdrop-blur-sm bg-card/50">
            <h3 className="text-lg font-semibold mb-4">Requirements</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                <span>Active WhatsApp account</span>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                <span>Phone with WhatsApp installed</span>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                <span>Active internet connection</span>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                <span>Device with camera for scanning</span>
              </li>
            </ul>
          </Card>
        </div>
      </>
    </div>
  )
}
