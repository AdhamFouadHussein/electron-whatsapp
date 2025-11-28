import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/sidebar';
import { Header } from './components/header';
import { ThemeProvider } from './components/theme-provider';
import { Toaster } from './components/ui/sonner';
import { AuthStorage, AuthAPI, User } from './lib/auth-api';
import { toast } from 'sonner';
import { NavigationProvider, useNavigation } from './context/NavigationContext';

// Import pages
import Dashboard from './app/page';
import UsersPage from './app/users/page';
import EventsPage from './app/events/page';
import RemindersPage from './app/reminders/page';
import BirthdaysPage from './app/birthdays/page';
import TemplatesPage from './app/templates/page';
import CampaignsPage from './app/campaigns/page';
import LogsPage from './app/logs/page';
import WhatsAppPage from './app/whatsapp/page';
import SettingsPage from './app/settings/page';
import LoginPage from './app/login/page';

const AppContent: React.FC = () => {
    const { currentPage, setCurrentPage } = useNavigation();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    // Check for existing authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const auth = AuthStorage.getAuth();

                if (auth?.token && auth?.user) {
                    // We have stored credentials, verify they're still valid
                    try {
                        const licenseResponse = await AuthAPI.checkLicense(auth.token);

                        if (licenseResponse.data.is_licensed && licenseResponse.data.is_active) {
                            // Token is valid and user has active license
                            setCurrentUser(auth.user);
                            setIsAuthenticated(true);
                            setCurrentPage('dashboard');

                            // Update license info in storage
                            AuthStorage.setLicense(licenseResponse.data);
                        } else {
                            // License expired or inactive
                            AuthStorage.clearAuth();
                            toast.error('Your subscription or trial has expired. Please login again.');
                        }
                    } catch (error) {
                        // Token validation failed, clear auth
                        console.error('Token validation failed:', error);
                        AuthStorage.clearAuth();
                    }
                } else {
                    // No stored credentials, show login
                    setCurrentPage('login');
                }
            } catch (error) {
                console.error('Auth check error:', error);
            } finally {
                setIsCheckingAuth(false);
            }
        };

        checkAuth();
    }, [setCurrentPage]);

    const handleLogin = () => {
        setIsAuthenticated(true);
        setCurrentPage('dashboard');
    };

    const handleLoginSuccess = (user: User, token: string, isLicensed: boolean) => {
        if (isLicensed) {
            setCurrentUser(user);
            setIsAuthenticated(true);
            setCurrentPage('dashboard');
        } else {
            alert('You need an active subscription or trial to use this application. Please visit geek-business.site to subscribe.');
        }
    };

    const handleLogout = async () => {
        const auth = AuthStorage.getAuth();

        if (auth?.token) {
            try {
                await AuthAPI.logout(auth.token);
            } catch (error) {
                console.error('Logout API error:', error);
            }
        }

        AuthStorage.clearAuth();
        setCurrentUser(null);
        setIsAuthenticated(false);
        setCurrentPage('login');
        toast.success('Logged out successfully');
    };

    const renderPage = () => {
        if (!isAuthenticated || currentPage === 'login') {
            return <LoginPage onLoginSuccess={handleLoginSuccess} />;
        } switch (currentPage) {
            case 'dashboard':
                return <Dashboard />;
            case 'users':
                return <UsersPage />;
            case 'events':
                return <EventsPage />;
            case 'reminders':
                return <RemindersPage />;
            case 'birthdays':
                return <BirthdaysPage />;
            case 'templates':
                return <TemplatesPage />;
            case 'campaigns':
                return <CampaignsPage />;
            case 'logs':
                return <LogsPage />;
            case 'whatsapp':
                return <WhatsAppPage />;
            case 'settings':
                return <SettingsPage />;
            default:
                return <Dashboard />;
        }
    };

    // Show loading while checking authentication
    if (isCheckingAuth) {
        return (
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                <div className="h-screen w-screen flex items-center justify-center bg-background">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading...</p>
                    </div>
                </div>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            {!isAuthenticated || currentPage === 'login' ? (
                <div className="h-screen w-screen overflow-hidden bg-background">
                    {renderPage()}
                </div>
            ) : (
                <div className="flex h-screen w-screen overflow-hidden bg-background">
                    <Sidebar
                        currentPage={currentPage}
                        onLogout={handleLogout}
                    />
                    <div className="flex-1 flex flex-col overflow-hidden" style={{ marginLeft: '16rem' }}>
                        <Header />
                        <main className="flex-1 overflow-y-auto p-24">
                            {renderPage()}
                        </main>
                    </div>
                </div>
            )}
            <Toaster />
        </ThemeProvider>
    );
};

const App: React.FC = () => (
    <NavigationProvider>
        <AppContent />
    </NavigationProvider>
);

export default App;
