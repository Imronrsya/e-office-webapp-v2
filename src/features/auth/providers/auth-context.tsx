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
    updateUser: (fields: Partial<User>) => void;
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

                const role = meData?.role || getRoleByEmail(session.user.email);
                const roles = (meData?.roles && meData.roles.length > 0) ? meData.roles : [role];

                setUser({
                    ...session.user,
                    image: meData?.image || session.user.image,
                    role,
                    roles: roles,
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

            const role = meData?.role || getRoleByEmail(email);
            const roles = (meData?.roles && meData.roles.length > 0) ? meData.roles : [role];

            const userWithRole: User = {
                ...response.user,
                image: meData?.image || response.user.image,
                role,
                roles: roles,
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

    const updateUser = (fields: Partial<User>) => {
        setUser((prev) => prev ? { ...prev, ...fields } : prev);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, checkSession, updateUser }}>
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
