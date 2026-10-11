import { FormEvent, useState } from "react";
import { useAuth } from "../AuthContext.tsx";
import { apiFetch } from "../api.ts";
import { Link } from "react-router-dom";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { setUser } = useAuth();

    async function login(e: FormEvent) {
        e.preventDefault();

        setError("");

        const response = await apiFetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username,
                password,
            }),
        });

        if (response.ok) {
            const user = await response.json();
            setUser(user);
            window.location.href = "/";
            return;
        }

        const text = await response.text();
        setError(text || "Invalid username or password.");
    }

    return (
        <div className="container py-5 d-flex justify-content-center auth-layout">
            <div
                className="p-4 bg-white rounded shadow-sm border w-100 auth-card"
                style={{ maxWidth: 400 }}
            >
                {error && (
                    <div className="alert alert-danger text-center fw-bold mb-4">
                        {error}
                    </div>
                )}

                <div className="auth-kicker">NYAA / VOCAB LAB</div>
                <h1 className="auth-title">Welcome back</h1>
                <p className="auth-caption">Sign in and pick up where your study session left off.</p>

                <form onSubmit={login}>
                    <div className="mb-2">
                        <input
                            className="form-control"
                            type="text"
                            placeholder="Username or Email"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-2">
                        <input
                            className="form-control"
                            type="password"
                            placeholder="Password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-2">
                        <button
                            className="btn btn-dark w-100"
                            type="submit"
                        >
                            Login
                        </button>
                    </div>
                </form>

                <div className="d-flex justify-content-between mt-3 small">
                    <Link to="/pwr_r" className="text-decoration-none">
                        Forgotten password
                    </Link>

                    <Link to="/register" className="text-decoration-none">
                        Register
                    </Link>
                </div>
            </div>
        </div>
    );
}
