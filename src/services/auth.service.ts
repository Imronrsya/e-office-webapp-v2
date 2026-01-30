import { api } from '@/lib/api';

// Profile types for Mahasiswa and Pegawai
export interface ProgramStudiInfo {
    id: string;
    name: string;
    code: string;
}

export interface DepartemenInfo {
    id: string;
    name: string;
    code: string;
}

export interface MahasiswaProfile {
    nim: string;
    departemenId: string;
    programStudiId: string;
    departemen?: DepartemenInfo;
    programStudi?: ProgramStudiInfo;
}

export interface PegawaiProfile {
    nip: string;
    jabatan: string;
    departemenId: string;
    programStudiId: string;
    departemen?: DepartemenInfo;
    programStudi?: ProgramStudiInfo;
}

export type UserProfile = MahasiswaProfile | PegawaiProfile | null;

export interface User {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    image: string | null;
    createdAt?: string;
    updatedAt?: string;
    department?: string;
    programStudi?: string;
    role?: string;
    roles?: string[];
    profile?: UserProfile;
    departemen?: DepartemenInfo | null;
}

export interface Session {
    id: string;
    userId: string;
    expiresAt: string;
    token: string;
    ipAddress?: string;
    userAgent?: string;
}

export interface AuthResponse {
    user: User;
    session: Session;
}

export interface MeResponse {
    id: string;
    name: string;
    email: string;
    role: string;        // primary role
    roles: string[];     // semua role jika multi-role
    profile?: UserProfile;
    departemen?: DepartemenInfo | null;
    programStudi?: ProgramStudiInfo | null;
}

export const authService = {
    /**
     * Sign in with email and password
     * Backend: /api/auth/sign-in/email (Better Auth)
     */
    async signIn(email: string, password: string): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/api/auth/sign-in/email', {
            email,
            password,
        });
        return response.data;
    },

    /**
     * Sign out current session
     * Backend: /api/auth/sign-out (Better Auth)
     */
    async signOut(): Promise<{ success: boolean }> {
        const response = await api.post<{ success: boolean }>('/api/auth/sign-out');
        return response.data;
    },

    /**
     * Get current session
     * Backend: /api/auth/get-session (Better Auth)
     */
    async getSession(): Promise<AuthResponse | null> {
        try {
            const response = await api.get<AuthResponse>('/api/auth/get-session');
            return response.data;
        } catch (error) {
            return null;
        }
    },

    /**
     * Get current user info including role
     * Backend: /me (authGuard protected)
     * WAJIB dipanggil setelah login untuk mendapatkan role
     */
    async getMe(): Promise<MeResponse | null> {
        try {
            const response = await api.get<MeResponse>('/me/');
            return response.data;
        } catch (error) {
            console.error('Failed to get user info:', error);
            return null;
        }
    },
};
