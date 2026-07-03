import { useAuth, AuthLogout } from "../AuthContext.tsx";
import { apiFetch } from "../api.ts";

export default function LogoutPage() {
    const context = useAuth();

    async function logout() {
        await apiFetch("/api/logout", {
            method: "POST",
            credentials: "include",
        });
        AuthLogout(context);
        window.location.href = "/login";
    }

    logout();
    return null
}
