"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageCircle, Wifi, WifiOff, LogOut, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import QRCode from "react-qr-code"
import { api } from "@/lib/api"
import { toast } from "sonner"

export default function WhatsAppPage() {
  const [status, setStatus] = useState<string>("disconnected")
  const [qrCode, setQrCode] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Get initial status
    const checkStatus = async () => {
      try {
        const currentStatus = await api.whatsapp.getStatus()
        setStatus(currentStatus)
      } catch (error) {
        console.error("Failed to get status:", error)
      }
    }
    checkStatus()

    // Subscribe to status changes
    api.whatsapp.onStatusChange((newStatus) => {
      console.log("Status changed:", newStatus)
      setStatus(newStatus)
      if (newStatus === 'connected') {
        setQrCode("")
        setIsLoading(false)
        toast.success("WhatsApp connected successfully!")
      } else if (newStatus === 'disconnected') {
        setIsLoading(false)
      } else if (newStatus === 'qr_ready') {
        setIsLoading(false)
      }
    })

    // Subscribe to QR code updates
    api.whatsapp.onQRCode((qr) => {
      console.log("QR Code received")
      setQrCode(qr)
      setStatus('qr_ready')
      setIsLoading(false)
    })
  }, [])

  const handleConnect = async () => {
    try {
      setIsLoading(true)
      await api.whatsapp.connect()
    } catch (error) {
      console.error("Failed to connect:", error)
      toast.error("Failed to initiate connection")
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      setIsLoading(true)
      await api.whatsapp.disconnect()
    } catch (error) {
      console.error("Failed to disconnect:", error)
      toast.error("Failed to disconnect")
      setIsLoading(false)
    }
  }

  const isConnected = status === 'connected'
  const showQR = status === 'qr_ready' || (status === 'disconnected' && qrCode)

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
                    <span className="text-lg font-medium text-red-600 dark:text-red-400">
                      {status === 'reconnecting' ? 'Reconnecting...' : 'Disconnected'}
                    </span>
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
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <p className="font-semibold capitalize">{status}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Session</p>
                  <p className="font-semibold">Active</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="destructive" className="gap-2" onClick={handleDisconnect} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {status === 'reconnecting'
                    ? "WhatsApp is attempting to reconnect..."
                    : "WhatsApp is not connected. Scan the QR code to connect your account."}
                </AlertDescription>
              </Alert>

              {!showQR && status !== 'reconnecting' && (
                <Button size="lg" className="w-full" onClick={handleConnect} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <MessageCircle className="h-5 w-5 mr-2" />}
                  Connect WhatsApp
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* QR Code Modal/Section */}
        {showQR && !isConnected && (
          <Card className="p-8 border-border/50 backdrop-blur-sm bg-card/50">
            <div className="max-w-md mx-auto text-center">
              <h3 className="text-lg font-semibold mb-4">Scan QR Code</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Open WhatsApp on your phone and scan this QR code to connect
              </p>

              <div className="bg-white p-4 rounded-lg mb-6 aspect-square flex items-center justify-center w-64 mx-auto">
                <QRCode value={qrCode} size={200} />
              </div>

              <div className="flex gap-3 justify-center">
                <Button variant="outline" className="bg-transparent" onClick={() => setQrCode("")}>
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
