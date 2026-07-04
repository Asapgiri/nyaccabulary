import { FormEvent, useState } from "react";
import { useAuth } from "../AuthContext.tsx";
import { apiFetch } from "../api.ts";

interface Register {
    username:   string
    email:      string
    phone:      string
    name:       string
    passworda:  string
    passwordb:  string
}

export default function LoginPage() {
    const [regrequest, setRegrequest] = useState<Register>(({
        username:   "",
        email:      "",
        phone:      "",
        name:       "",
        passworda:  "",
        passwordb:  "",
    }));
    const [error, setError] = useState("");
    const { setUser } = useAuth();

    async function register(e: FormEvent) {
        e.preventDefault();

        setError("");

        const response = await apiFetch("/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(regrequest),
        });

        if (response.ok) {
            const resp = await response.json();
            console.log(resp)

            if ("SUCCESS" == resp.Status) {
                setUser(resp.User)
                window.location.href = "/";
            }
            else {
                setError(resp.Error)
            }

            return;
        }

        const text = await response.text();
        setError(text || "Failed to communicate with server!");
    }

    return (
        <div className="container py-5 d-flex justify-content-center">
            <div
                className="p-4 bg-white rounded shadow-sm border w-100"
                style={{ maxWidth: 500 }}
            >
                {error && (
                    <div className="alert alert-danger text-center fw-bold mb-4">
                        {error}
                    </div>
                )}

                <h4 className="mb-4 text-center">Login</h4>

                <form onSubmit={register}>
                    <div id="form">
                        <div className="form-group">
                            <input value={regrequest.username}  onChange={e => setRegrequest(r => ({...r, username: e.target.value}))}  type="text" id="form_userUsername" name="form[userUsername]" required="required" placeholder="Username *" className="form-control mb-2"/>
                            <input value={regrequest.name}      onChange={e => setRegrequest(r => ({...r, name: e.target.value}))}      type="text" id="form_userName" name="form[userName]" placeholder="Name" className="form-control mb-2"/>
                            <input value={regrequest.email}     onChange={e => setRegrequest(r => ({...r, email: e.target.value}))}     type="text" id="form_userEmail" name="form[userEmail]" placeholder="Email" className="form-control mb-2"/>
                            <input value={regrequest.phone}     onChange={e => setRegrequest(r => ({...r, phone: e.target.value}))}     type="text" id="form_userPhone" name="form[userPhone]" placeholder="Phone" className="form-control mb-2"/>
                        </div>
                        <div className="form-group">
                            <input value={regrequest.passworda} onChange={e => setRegrequest(r => ({...r, passworda: e.target.value}))} type="password" id="form_userPassA" name="form[userPassA]" required="required" placeholder="Password *" autoComplete="current-password" className="form-control mb-2"/>
                            <input value={regrequest.passwordb} onChange={e => setRegrequest(r => ({...r, passwordb: e.target.value}))} type="password" id="form_userPassB" name="form[userPassB]" required="required" placeholder="Password Again *" autoComplete="current-password" className="form-control mb-2"/>
                        </div>
                        <div className="form-group">
                            <button type="submit" id="form_Bejelentkezés" name="form[Register]" className="form-control mb-2 btn-primary btn">Register</button>
                        </div>
                    </div>
                </form>

                <br/>

                <div className="text-center mt-3 small text-muted">
                    You Already have an account?
                    <a href="/login" className="ms-1 text-decoration-none">Login</a>
                </div>

            </div>
        </div>
    );
}
