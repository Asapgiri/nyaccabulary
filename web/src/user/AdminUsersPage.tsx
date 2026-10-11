import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api.ts";
import { useAuth } from "../AuthContext.tsx";
import "./management.css";

interface ManagedUser { Id: string; Username: string; Name: string; Email: string; Phone: string; RegDate: string; Roles: string[] }
interface AdminData { Users: ManagedUser[]; Roles: string[] }

async function parseResponse(response: Response) {
    const body = await response.text();
    if (!response.ok) throw new Error(body || `Request failed (${response.status})`);
    try { return JSON.parse(body); } catch { throw new Error("The server returned an invalid response."); }
}

export default function AdminUsersPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [roles, setRoles] = useState<string[]>([]);
    const [drafts, setDrafts] = useState<Record<string, string[]>>({});
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    async function loadUsers() {
        setLoading(true); setError("");
        try {
            const data: AdminData = await parseResponse(await apiFetch("/api/admin/users"));
            setUsers(data.Users ?? []); setRoles(data.Roles ?? []);
            setDrafts(Object.fromEntries((data.Users ?? []).map(person => [person.Id, person.Roles ?? []])));
        } catch (err) { setError(err instanceof Error ? err.message : "Could not load users."); }
        finally { setLoading(false); }
    }

    useEffect(() => { if (user?.Roles?.includes("ADMIN")) void loadUsers(); else setLoading(false); }, [user?.Id]);

    const filtered = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return users;
        return users.filter(person => [person.Username, person.Name, person.Email].some(value => value?.toLowerCase().includes(normalized)));
    }, [users, query]);

    function toggleRole(id: string, role: string) {
        setDrafts(current => ({ ...current, [id]: current[id]?.includes(role) ? current[id].filter(item => item !== role) : [...(current[id] ?? []), role] }));
    }

    async function saveRoles(person: ManagedUser) {
        setBusyId(person.Id); setError(""); setMessage("");
        try {
            const updated: ManagedUser = await parseResponse(await apiFetch(`/api/admin/users/${encodeURIComponent(person.Id)}/roles`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ Roles: drafts[person.Id] ?? [] }),
            }));
            setUsers(current => current.map(item => item.Id === updated.Id ? updated : item));
            setDrafts(current => ({ ...current, [updated.Id]: updated.Roles ?? [] }));
            setMessage(`Roles saved for ${updated.Username}.`);
        } catch (err) { setError(err instanceof Error ? err.message : "Could not save roles."); }
        finally { setBusyId(""); }
    }

    if (!user?.Roles?.includes("ADMIN")) return <main className="container py-5"><h1>Admin</h1><p>Administrator access is required.</p><Link to="/" className="btn btn-outline-dark">Return home</Link></main>;

    return <main className="container-fluid py-4 px-3 px-md-4 management-page">
        <header className="management-header"><div><p className="management-eyebrow">Administration</p><h1>User management</h1><p>Review accounts and assign access roles.</p></div><div className="management-count">{users.length}<span>accounts</span></div></header>
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {message && <div className="alert alert-success" role="status">{message}</div>}
        <section className="management-card admin-user-list">
            <div className="admin-list-tools"><label htmlFor="admin-user-search" className="visually-hidden">Search users</label><input id="admin-user-search" className="form-control" placeholder="Search username, name, or email" value={query} onChange={e => setQuery(e.target.value)} /><button className="btn btn-outline-secondary" type="button" onClick={() => void loadUsers()} disabled={loading}>Refresh</button></div>
            {loading ? <p className="py-3 mb-0">Loading accounts…</p> : filtered.length === 0 ? <p className="py-3 mb-0">No matching accounts.</p> : <div className="table-responsive">
                <table className="table align-middle admin-users-table">
                    <thead><tr><th>Account</th><th>Contact</th><th>Roles</th><th>Joined</th><th><span className="visually-hidden">Actions</span></th></tr></thead>
                    <tbody>{filtered.map(person => {
                        const selected = drafts[person.Id] ?? [];
                        const changed = selected.length !== (person.Roles ?? []).length || selected.some(role => !person.Roles?.includes(role));
                        return <tr key={person.Id}>
                            <td><strong>{person.Name || person.Username}</strong><small>@{person.Username}</small></td>
                            <td><span>{person.Email || "—"}</span><small>{person.Phone || ""}</small></td>
                            <td><div className="admin-role-list">{roles.map(role => <label key={role} className="form-check"><input className="form-check-input" type="checkbox" checked={selected.includes(role)} disabled={person.Id === user.Id && role === "ADMIN"} onChange={() => toggleRole(person.Id, role)} /><span className="form-check-label">{role}</span></label>)}</div></td>
                            <td>{person.RegDate ? new Date(person.RegDate).toLocaleDateString() : "—"}</td>
                            <td><button type="button" className="btn btn-sm btn-dark" disabled={!changed || busyId === person.Id} onClick={() => void saveRoles(person)}>{busyId === person.Id ? "Saving…" : "Save"}</button></td>
                        </tr>;
                    })}</tbody>
                </table>
            </div>}
        </section>
    </main>;
}
