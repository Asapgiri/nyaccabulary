import { useEffect } from "react"
import { Routes, Route } from "react-router-dom"

import Index from "./Index.tsx"
import Word from "./Word.tsx"
import Kanji from "./Kanji.tsx"
import Navbar from "./Navbar.tsx"
import Footer from "./Footer.tsx"
import LoginPage from "./auth/LoginPage.tsx"
import LogoutPage from "./auth/LogoutPage.tsx"
import Search from "./Search.tsx"

import { sync } from "./db/sync.ts"

function App() {
    useEffect(() => {
        sync()
    })

    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar />
            <main className="flex-fill">
                <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/word" element={<Word />} />
                    <Route path="/kanji" element={<Kanji />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/logout" element={<LogoutPage />} />
                </Routes>
            </main>
            <Footer />
        </div>
    )
}

export default App
