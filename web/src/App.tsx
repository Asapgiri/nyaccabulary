import { Routes, Route } from "react-router-dom"

import Navbar from "./Navbar.tsx"
import Footer from "./Footer.tsx"
import LoginPage from "./auth/LoginPage.tsx"
import { useAuth } from "./AuthContext"

function App() {
    const { user } = useAuth();

    console.log(user)

    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar />
            <main className="flex-fill">
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                </Routes>
            </main>
            <Footer />
        </div>
    )
}

export default App
