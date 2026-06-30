// src/auth/AuthContext.tsx

import {
    createContext,
    useContext,
    useState,
    ReactNode,
    useEffect,
} from "react";

export interface User {
    Id:              string
    RegDate:         string
    EditDate:        string
    Username:        string
    Name:            string
    Email:           string
    Phone:           string
    EmailVisible:    boolean
    PhoneVisible:    boolean
    Roles:           string[]
}

interface AuthContextType {
    user: User | null;
    setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        async function loadUser() {
            const response = await fetch("/api/user", {
                credentials: "include",
            });

            if (response.ok) {
                setUser(await response.json());
            }
        }

        loadUser();
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
}
