import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api.ts";
import { useAuth } from "../AuthContext.tsx";
import "./management.css";

interface Settings { Name: string; Email: string; Phone: string; EmailVisible: boolean; PhoneVisible: boolean }

async function responseError(response: Response) {
    const body = await response.text();
    if (!response.ok) throw new Error(body || `Request failed (${response.status})`);
    try { return JSON.parse(body); } catch { throw new Error("The server returned an invalid response."); }
}

export default function SettingsPage() {
    const { user, setUser } = useAuth();
    const [settings, setSettings] = useState<Settings>({ Name: "", Email: "", Phone: "", EmailVisible: false, PhoneVisible: false });
    const [password, setPassword] = useState({ CurrentPassword: "", NewPassword: "", ConfirmPassword: "" });
    const [busy, setBusy] = useState(false);
    const [saved, setSaved] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (!user) return;
        setSettings({ Name: user.Name ?? "", Email: user.Email ?? "", Phone: user.Phone ?? "", EmailVisible: user.EmailVisible ?? false, PhoneVisible: user.PhoneVisible ?? false });
    }, [user]);

    async function saveSettings(event: FormEvent) {
        event.preventDefault(); setBusy(true); setError(""); setSaved("");
        try {
            const response = await apiFetch("/api/user/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
            const updated = await responseError(response);
            setUser(updated);
            setSaved("Your profile settings have been saved.");
        } catch (err) { setError(err instanceof Error ? err.message : "Could not save settings."); }
        finally { setBusy(false); }
    }

    async function changePassword(event: FormEvent) {
        event.preventDefault(); setBusy(true); setError(""); setSaved("");
        try {
            const response = await apiFetch("/api/user/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(password) });
            await responseError(response);
            setPassword({ CurrentPassword: "", NewPassword: "", ConfirmPassword: "" });
            setSaved("Your password has been changed.");
        } catch (err) { setError(err instanceof Error ? err.message : "Could not change password."); }
        finally { setBusy(false); }
    }

    if (!user) return <main className="container py-5"><h1>Settings</h1><p>Sign in to manage your account.</p><Link to="/login" className="btn btn-dark">Sign in</Link></main>;

    return <main className="container py-4 management-page">
        <header className="management-header"><div><p className="management-eyebrow">Account</p><h1>Settings</h1><p>Update your profile details and password.</p></div></header>
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {saved && <div className="alert alert-success" role="status">{saved}</div>}
        <div className="management-grid">
            <form className="management-card" onSubmit={saveSettings}>
                <h2>Profile details</h2>
                <label className="form-label" htmlFor="settings-username">Username</label>
                <input id="settings-username" className="form-control mb-3" value={user.Username} readOnly />
                <label className="form-label" htmlFor="settings-name">Display name</label>
                <input id="settings-name" className="form-control mb-3" maxLength={100} value={settings.Name} onChange={e => setSettings(s => ({ ...s, Name: e.target.value }))} />
                <label className="form-label" htmlFor="settings-email">Email</label>
                <input id="settings-email" type="email" className="form-control mb-3" value={settings.Email} onChange={e => setSettings(s => ({ ...s, Email: e.target.value }))} />
                <div className="form-check mb-3"><input id="settings-email-visible" className="form-check-input" type="checkbox" checked={settings.EmailVisible} onChange={e => setSettings(s => ({ ...s, EmailVisible: e.target.checked }))} /><label className="form-check-label" htmlFor="settings-email-visible">Show email on my public profile</label></div>
                <label className="form-label" htmlFor="settings-phone">Phone</label>
                <input id="settings-phone" type="tel" className="form-control mb-3" value={settings.Phone} onChange={e => setSettings(s => ({ ...s, Phone: e.target.value }))} />
                <div className="form-check mb-4"><input id="settings-phone-visible" className="form-check-input" type="checkbox" checked={settings.PhoneVisible} onChange={e => setSettings(s => ({ ...s, PhoneVisible: e.target.checked }))} /><label className="form-check-label" htmlFor="settings-phone-visible">Show phone on my public profile</label></div>
                <button className="btn btn-dark" disabled={busy}>Save profile</button>
            </form>

            <form className="management-card" onSubmit={changePassword}>
                <h2>Change password</h2>
                <label className="form-label" htmlFor="current-password">Current password</label>
                <input id="current-password" type="password" autoComplete="current-password" required className="form-control mb-3" value={password.CurrentPassword} onChange={e => setPassword(s => ({ ...s, CurrentPassword: e.target.value }))} />
                <label className="form-label" htmlFor="new-password">New password</label>
                <input id="new-password" type="password" autoComplete="new-password" required className="form-control mb-3" value={password.NewPassword} onChange={e => setPassword(s => ({ ...s, NewPassword: e.target.value }))} />
                <label className="form-label" htmlFor="confirm-password">Confirm new password</label>
                <input id="confirm-password" type="password" autoComplete="new-password" required className="form-control mb-4" value={password.ConfirmPassword} onChange={e => setPassword(s => ({ ...s, ConfirmPassword: e.target.value }))} />
                <button className="btn btn-outline-dark" disabled={busy}>Update password</button>
            </form>
        </div>
    </main>;
}
