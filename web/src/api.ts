export const API_BASE = import.meta.env.VITE_API_BASE;

export async function apiFetch(path: string, init?: RequestInit) {
    return fetch(`${API_BASE ? API_BASE : ""}${path}`, {
        credentials: "include",
        ...init,
    });
}
