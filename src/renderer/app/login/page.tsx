"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageCircle, Eye, EyeOff, Loader2, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { AuthAPI, AuthStorage } from "@/lib/auth-api"

interface LoginPageProps {
    onLoginSuccess?: (user: any, token: string, isLicensed: boolean) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
    const [activeTab, setActiveTab] = useState("login")

    // Login state
    const [loginEmail, setLoginEmail] = useState("")
    const [loginPassword, setLoginPassword] = useState("")
    const [showLoginPassword, setShowLoginPassword] = useState(false)
    const [isLoggingIn, setIsLoggingIn] = useState(false)

    // Register state
    const [registerName, setRegisterName] = useState("")
    const [registerEmail, setRegisterEmail] = useState("")
    const [registerPassword, setRegisterPassword] = useState("")
    const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("")
    const [showRegisterPassword, setShowRegisterPassword] = useState(false)
    const [isRegistering, setIsRegistering] = useState(false)

    // Verify license state
    const [verifyEmail, setVerifyEmail] = useState("")
    const [isVerifying, setIsVerifying] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoggingIn(true)

        try {
            const response = await AuthAPI.login(loginEmail, loginPassword)

            if (response.success) {
                const { user, token } = response.data

                // Store auth
                AuthStorage.setAuth(user, token)

                // Check license
                const licenseResponse = await AuthAPI.checkLicense(token)
                const isLicensed = licenseResponse.data.is_licensed

                // Store license info
                AuthStorage.setLicense(licenseResponse.data)

                if (isLicensed) {
                    if (licenseResponse.data.has_active_trial) {
                        toast.success(`Welcome back! Your trial expires on ${new Date(licenseResponse.data.trial_ends_at!).toLocaleDateString()}`)
                    } else if (licenseResponse.data.subscription) {
                        toast.success(`Welcome back! ${licenseResponse.data.subscription.plan?.name || 'Subscription'} plan active`)
                    }
                } else {
                    toast.warning("Login successful, but you don't have an active subscription or trial")
                }

                // Call success callback
                onLoginSuccess?.(user, token, isLicensed)
            }
        } catch (error: any) {
            console.error('Login error:', error)
            toast.error(error.message || "Login failed. Please check your credentials.")
        } finally {
            setIsLoggingIn(false)
        }
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()

        if (registerPassword !== registerPasswordConfirm) {
            toast.error("Passwords do not match")
            return
        }

        if (registerPassword.length < 8) {
            toast.error("Password must be at least 8 characters")
            return
        }

        setIsRegistering(true)

        try {
            const response = await AuthAPI.register({
                name: registerName,
                email: registerEmail,
                password: registerPassword,
                password_confirmation: registerPasswordConfirm,
            })

            if (response.success) {
                const { user, token } = response.data

                // Store auth
                AuthStorage.setAuth(user, token)

                // Check license (new users get trial)
                const licenseResponse = await AuthAPI.checkLicense(token)
                const isLicensed = licenseResponse.data.is_licensed

                // Store license info
                AuthStorage.setLicense(licenseResponse.data)

                if (licenseResponse.data.has_active_trial) {
                    toast.success(`Registration successful! Trial active until ${new Date(licenseResponse.data.trial_ends_at!).toLocaleDateString()}`)
                } else {
                    toast.success("Registration successful!")
                }

                // Call success callback
                onLoginSuccess?.(user, token, isLicensed)
            }
        } catch (error: any) {
            console.error('Registration error:', error)
            toast.error(error.message || "Registration failed. Please try again.")
        } finally {
            setIsRegistering(false)
        }
    }

    const handleVerifyLicense = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsVerifying(true)

        try {
            const response = await AuthAPI.verifyLicenseByEmail(verifyEmail)

            if (response.success && response.data.is_licensed) {
                // Store license info
                AuthStorage.setLicense(response.data as any)

                const planInfo = response.data.subscription?.plan_name || response.data.subscription?.plan?.name
                const trialInfo = response.data.trial_ends_at
                    ? `Trial until ${new Date(response.data.trial_ends_at).toLocaleDateString()}`
                    : planInfo

                toast.success(`License verified! ${trialInfo || 'Access granted'}`, {
                    description: "You can now use the application",
                    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
                })

                // Allow access
                onLoginSuccess?.(response.data.user || { email: verifyEmail }, '', true)
            } else {
                toast.error("No active license or trial found", {
                    description: "Please register or purchase a subscription",
                    icon: <XCircle className="h-5 w-5 text-red-500" />,
                })
            }
        } catch (error: any) {
            console.error('Verification error:', error)
            toast.error(error.message || "License verification failed")
        } finally {
            setIsVerifying(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
            <Card className="w-full max-w-md border-border bg-card/80 backdrop-blur-xl p-8 shadow-2xl">
                {/* Logo & Title */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg">
                        <MessageCircle className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">Reminder Pro</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Campaign Manager</p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="login">Login</TabsTrigger>
                        <TabsTrigger value="register">Register</TabsTrigger>
                        <TabsTrigger value="verify">Verify</TabsTrigger>
                    </TabsList>

                    {/* Login Tab */}
                    <TabsContent value="login">
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="login-email">Email</Label>
                                <Input
                                    id="login-email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    className="h-11 border-border bg-background/50"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="login-password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="login-password"
                                        type={showLoginPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        className="h-11 border-border bg-background/50 pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="h-11 w-full bg-gradient-to-r from-primary to-accent font-semibold text-primary-foreground shadow-lg hover:shadow-xl"
                                disabled={isLoggingIn}
                            >
                                {isLoggingIn ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Logging in...
                                    </>
                                ) : (
                                    "Login"
                                )}
                            </Button>
                        </form>
                    </TabsContent>

                    {/* Register Tab */}
                    <TabsContent value="register">
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="register-name">Full Name</Label>
                                <Input
                                    id="register-name"
                                    type="text"
                                    placeholder="John Doe"
                                    value={registerName}
                                    onChange={(e) => setRegisterName(e.target.value)}
                                    className="h-11 border-border bg-background/50"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="register-email">Email</Label>
                                <Input
                                    id="register-email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={registerEmail}
                                    onChange={(e) => setRegisterEmail(e.target.value)}
                                    className="h-11 border-border bg-background/50"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="register-password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="register-password"
                                        type={showRegisterPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={registerPassword}
                                        onChange={(e) => setRegisterPassword(e.target.value)}
                                        className="h-11 border-border bg-background/50 pr-10"
                                        required
                                        minLength={8}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="register-password-confirm">Confirm Password</Label>
                                <Input
                                    id="register-password-confirm"
                                    type="password"
                                    placeholder="••••••••"
                                    value={registerPasswordConfirm}
                                    onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                                    className="h-11 border-border bg-background/50"
                                    required
                                    minLength={8}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="h-11 w-full bg-gradient-to-r from-primary to-accent font-semibold text-primary-foreground shadow-lg hover:shadow-xl"
                                disabled={isRegistering}
                            >
                                {isRegistering ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    "Create Account"
                                )}
                            </Button>
                        </form>
                    </TabsContent>

                    {/* Verify License Tab */}
                    <TabsContent value="verify">
                        <form onSubmit={handleVerifyLicense} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="verify-email">Email Address</Label>
                                <Input
                                    id="verify-email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={verifyEmail}
                                    onChange={(e) => setVerifyEmail(e.target.value)}
                                    className="h-11 border-border bg-background/50"
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Enter your registered email to verify your license or trial
                                </p>
                            </div>

                            <Button
                                type="submit"
                                className="h-11 w-full bg-gradient-to-r from-primary to-accent font-semibold text-primary-foreground shadow-lg hover:shadow-xl"
                                disabled={isVerifying}
                            >
                                {isVerifying ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    "Verify License"
                                )}
                            </Button>

                            <div className="mt-4 rounded-lg border border-border bg-muted/50 p-4">
                                <p className="text-xs text-muted-foreground">
                                    <strong>Quick Access:</strong> If you have an active subscription or trial,
                                    simply enter your email to verify and start using the app.
                                </p>
                            </div>
                        </form>
                    </TabsContent>
                </Tabs>

                {/* Footer */}
                <div className="mt-6 text-center text-xs text-muted-foreground">
                    <p>© 2025 Reminder Pro. All rights reserved.</p>
                </div>
            </Card>
        </div>
    )
}
