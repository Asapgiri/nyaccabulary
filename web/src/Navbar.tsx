import UserMenu from "./user/UserMenu.tsx"
import LoginButton from "./user/LoginButton.tsx"
import { useLocation } from "react-router-dom"
import { useSearchParams, Link } from "react-router-dom";

import { useAuth } from "./AuthContext"
import { useState } from "react";
import { useEffect } from "react";

export default function Navbar() {
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const currentPath = useLocation().pathname
    const [searchType, setSearchType] = useState(currentPath === "/kanjisearch" ? "kanji" : "words");
    const [exactMatch, setExactMatch] = useState(searchParams.has("exactmatch"));
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem("nyaa-theme") === "dark");

    useEffect(() => {
        document.documentElement.dataset.theme = darkMode ? "dark" : "light";
        localStorage.setItem("nyaa-theme", darkMode ? "dark" : "light");
        document.querySelector('meta[name="theme-color"]')?.setAttribute("content", darkMode ? "#000000" : "#f4f2ec");
    }, [darkMode]);

    const query = searchParams.get("query")
    const jlpt = searchParams.get("jlpt")

    return (
        <nav className="site-nav bg-black border-bottom border-secondary shadow-sm">

            <div className="container-fluid">

                <div className="d-flex flex-wrap align-items-center gap-2 py-2">

                    <Link to="/" className="navbar-brand text-white mb-0 d-none d-md-block">
                       <img className="brand-mark-icon" src="/favicon.svg" alt="" aria-hidden="true" /><span className="brand-copy"><strong>Nyaa</strong><small>VOCAB LAB</small></span>
                    </Link>

                    <form action={searchType === "kanji" ? "/kanjisearch" : "/search"} method="GET" className="flex-grow-1">
                        <div className="input-group">

                        <button type="button" className="search-type-button"
                            aria-label={`Search type: ${searchType}. Switch to ${searchType === "words" ? "kanji" : "words"}`}
                            title={`Switch to ${searchType === "words" ? "Kanji" : "Words"} search`}
                            onClick={() => setSearchType(type => type === "words" ? "kanji" : "words")}>
                            {searchType === "words" ? "Words" : "Kanji"}
                        </button>

                        {searchType === "words" ? (
                        <>
                            {exactMatch && <input type="hidden" name="exactmatch" value="on" />}
                            <button
                                className={`btn search-exact-toggle ${exactMatch ? "is-active" : ""}`}
                                type="button"
                                aria-pressed={exactMatch}
                                title="Toggle exact word matching"
                                onClick={() => setExactMatch((active) => !active)}
                            >
                                Exact
                            </button>
                        </>
                        ) : (
                        <select id="jlptField" name="jlpt" className="form-select jlpt-search-select"
                            defaultValue={jlpt}>
                            <option value="">N?</option>
                            <option value="N5">N5</option>
                            <option value="N4">N4</option>
                            <option value="N3">N3</option>
                            <option value="N2">N2</option>
                            <option value="N1">N1</option>
                        </select>
                        )}

                        <input name="query" className="form-control border-start-0" placeholder={
                            searchType === "kanji"
                                ? "Search kanji..."
                                : "Search words, kanji, readings..."
                        }
                        defaultValue={query}
                        />

                        <button className="btn btn-light px-4" type="submit">
                            Search
                        </button>

                        </div>
                    </form>

                    {user ? (
                        <UserMenu />
                    ) : (
                        <LoginButton />
                    )}

                </div>

                <div className="border-top border-secondary">

                    <div className="d-flex flex-wrap align-items-center py-2 gap-1">

                        <Link to="/" className={"btn btn-sm " + (currentPath === "/" ? "btn-light nav-current" : "btn-outline-light")}>
                            Home
                        </Link>

                        <Link to="/word" className={"btn btn-sm nav-study-link " + (currentPath === "/word" ? "btn-light nav-current" : "btn-outline-light")}>
                            Word
                        </Link>

                        <Link to="/kanji"
                           className={"btn btn-sm nav-study-link " + (currentPath === "/kanji" ? "btn-light nav-current" : "btn-outline-light")}>
                            Kanji
                        </Link>

                        <Link to="/word/random" className={"btn btn-sm nav-random " + (currentPath === "/word/random" ? "btn-warning" : "btn-outline-light")}>
                            Random
                        </Link>

                        <Link to="/how-it-works" className={"btn btn-sm " + (currentPath === "/how-it-works" ? "btn-light nav-current" : "btn-outline-light")}>
                            Guide
                        </Link>

                        <button className="btn btn-sm btn-outline-light theme-toggle ms-auto" type="button"
                            aria-pressed={darkMode} onClick={() => setDarkMode((enabled) => !enabled)}>
                            <span aria-hidden="true">{darkMode ? "☀" : "☾"}</span>
                            <span className="theme-toggle-label">{darkMode ? "Light" : "Dark"}</span>
                        </button>

                        {user ? (
                            <UserMenu mobile />
                        ) : (
                            <LoginButton mobile />
                        )}

                    </div>

                </div>

            </div>

        </nav>
    )
}
