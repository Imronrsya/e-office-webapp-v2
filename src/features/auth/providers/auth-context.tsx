"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authService, type User, type AuthResponse } from "@/services/auth.service";
import { getRoleByEmail } from "@/lib/role-mapper";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<AuthResponse>;
    logout: () => Promise<void>;
    checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Check session on mount
    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        try {
            setLoading(true);
            const session = await authService.getSession();
            if (session?.user) {
                // Coba panggil /me untuk mendapatkan role dari backend
                let meData;
                try {
                    meData = await authService.getMe();
                } catch (meError: any) {
                    if ((meError as any).code === 'ACCOUNT_INACTIVE') {
                        // Akun nonaktif - sign out dan clear state
                        try { await authService.signOut(); } catch (_) {}
                        localStorage.removeItem('user-role');
                        setUser(null);
                        return;
                    }
                    meData = null;
                }

                // Gunakan role dari API, atau fallback ke email mapping
                const role = meData?.role || getRoleByEmail(session.user.email);
                setUser({
                    ...session.user,
                    role,
                    roles: meData?.roles || [role],
                    profile: meData?.profile,
                    departemen: meData?.departemen,
                    programStudi: meData?.programStudi?.name,
                });
                localStorage.setItem('user-role', role);
            } else {
                localStorage.removeItem('user-role');
                setUser(null);
            }
        } catch (error) {
            console.error("Session check failed:", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            setLoading(true);
            const response = await authService.signIn(email, password);

            // Coba panggil /me setelah login untuk mendapatkan role
            // Akan throw error jika akun nonaktif
            let meData;
            try {
                meData = await authService.getMe();
            } catch (meError: any) {
                if ((meError as any).code === 'ACCOUNT_INACTIVE') {
                    // Sign out session yang baru dibuat
                    try { await authService.signOut(); } catch (_) {}
                    localStorage.removeItem('user-role');
                    setUser(null);
                    throw meError;
                }
                // For other errors, continue with fallback
                meData = null;
            }

            // Gunakan role dari API, atau fallback ke email mapping
            const role = meData?.role || getRoleByEmail(email);

            const userWithRole: User = {
                ...response.user,
                role,
                roles: meData?.roles || [role],
                profile: meData?.profile,
                departemen: meData?.departemen,
                programStudi: meData?.programStudi?.name,
            };

            localStorage.setItem('user-role', role);
            setUser(userWithRole);
            router.push("/dashboard");
            return { ...response, user: userWithRole };
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await authService.signOut();
            localStorage.removeItem('user-role');
            setUser(null);
            router.push("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, checkSession }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuthContext must be used within an AuthProvider");
    }
    return context;
}
