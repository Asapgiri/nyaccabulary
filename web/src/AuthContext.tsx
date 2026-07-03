// src/auth/AuthContext.tsx
import { apiFetch } from "./api.ts";

import {
    createContext,
    useContext,
    useState,
    ReactNode,
    useEffect,
} from "react";
import { dbDrop, dbPromise } from "./db/database.ts";

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
            const db = await dbPromise;
            const existing_user = await db.get("metadata", "user");
            setUser(existing_user)

            const response = await apiFetch("/api/user", {
                credentials: "include",
            });

            if (response.ok) {
                const new_user = await response.json()
                if (new_user.Username) {
                    setUser(new_user);
                    db.put("metadata", new_user, "user")
                }
                else {
                    setUser(null);
                    db.delete("metadata", "user")
                }
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

export async function AuthLogout(context: AuthContextType) {
    console.log('logout')
    context.setUser(null);
    dbDrop();
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
}
