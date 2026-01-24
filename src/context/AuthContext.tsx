import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type UserRole = 'user' | 'admin';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    notifications: {
        email: boolean;
        browser: boolean;
        reminders: boolean;
    };
}

interface AuthContextType {
    user: User | null;
    login: (email: string, pass: string) => Promise<void>;
    register: (email: string, pass: string, name: string) => Promise<void>;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('ps-auth-user');
        return saved ? JSON.parse(saved) : null;
    });

    useEffect(() => {
        if (user) {
            localStorage.setItem('ps-auth-user', JSON.stringify(user));
        } else {
            localStorage.removeItem('ps-auth-user');
        }
    }, [user]);

    const login = async (email: string, _pass: string) => {
        await new Promise(resolve => setTimeout(resolve, 800));
        // Superadmin mock
        const role: UserRole = email.includes('admin') ? 'admin' : 'user';
        setUser({
            id: '1',
            email,
            name: email.split('@')[0],
            role,
            notifications: { email: true, browser: true, reminders: false }
        });
    };

    const register = async (email: string, _pass: string, name: string) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setUser({
            id: '1',
            email,
            name,
            role: 'user',
            notifications: { email: true, browser: true, reminders: false }
        });
    };

    const logout = () => setUser(null);

    const updateUser = (updates: Partial<User>) => {
        setUser(prev => prev ? { ...prev, ...updates } : null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, updateUser, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
