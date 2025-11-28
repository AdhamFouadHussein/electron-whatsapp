const API_BASE_URL = 'https://geek-business.site/api';

export interface User {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
}

export interface Subscription {
    id?: number;
    status?: string;
    plan?: {
        name: string;
        max_devices: number;
        max_phone_numbers: number;
    };
    plan_name?: string;
    max_devices?: number;
    max_phone_numbers?: number;
    starts_at?: string;
    ends_at?: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        user: User;
        token: string;
    };
}

export interface LicenseCheckResponse {
    success: boolean;
    data: {
        is_licensed: boolean;
        is_active: boolean;
        trial_ends_at: string | null;
        has_active_trial: boolean;
        subscription?: Subscription;
        user?: User;
    };
}

export interface VerifyLicenseResponse {
    success: boolean;
    message?: string;
    data: {
        is_licensed: boolean;
        is_active: boolean;
        user?: User;
        subscription?: Subscription;
        trial_ends_at?: string;
    };
}

export class AuthAPI {
    static async register(data: {
        name: string;
        email: string;
        password: string;
        password_confirmation: string;
    }): Promise<AuthResponse> {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Registration failed');
        }

        return response.json();
    }

    static async login(email: string, password: string): Promise<AuthResponse> {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Invalid credentials');
        }

        return response.json();
    }

    static async checkLicense(token: string): Promise<LicenseCheckResponse> {
        const response = await fetch(`${API_BASE_URL}/license/check`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to check license');
        }

        return response.json();
    }

    static async verifyLicenseByEmail(email: string): Promise<VerifyLicenseResponse> {
        const response = await fetch(`${API_BASE_URL}/license/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        // Handle both success and user not found cases
        if (response.status === 404 || !data.success) {
            return {
                success: false,
                message: data.message || 'User not found',
                data: {
                    is_licensed: false,
                    is_active: false,
                },
            };
        }

        return data;
    }

    static async logout(token: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Logout failed');
        }
    }
}

// Storage helpers
export const AuthStorage = {
    setAuth(user: User, token: string) {
        localStorage.setItem('auth_user', JSON.stringify(user));
        localStorage.setItem('auth_token', token);
    },

    setLicense(license: LicenseCheckResponse['data']) {
        localStorage.setItem('license_info', JSON.stringify({
            ...license,
            verifiedAt: new Date().toISOString(),
        }));
    },

    getAuth() {
        const user = localStorage.getItem('auth_user');
        const token = localStorage.getItem('auth_token');

        if (user && token) {
            return { user: JSON.parse(user), token };
        }
        return null;
    },

    getLicense() {
        const license = localStorage.getItem('license_info');
        return license ? JSON.parse(license) : null;
    },

    clearAuth() {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('license_info');
    },

    shouldReVerify(): boolean {
        const license = this.getLicense();
        if (!license || !license.verifiedAt) return true;

        const verifiedAt = new Date(license.verifiedAt);
        const now = new Date();
        const hoursSinceVerification = (now.getTime() - verifiedAt.getTime()) / (1000 * 60 * 60);

        // Re-verify every 24 hours
        return hoursSinceVerification >= 24;
    },

    getCurrentUser(): User | null {
        const auth = this.getAuth();
        return auth ? auth.user : null;
    },

    getToken(): string | null {
        const auth = this.getAuth();
        return auth ? auth.token : null;
    },
};
