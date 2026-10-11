import UserMenu from "./user/UserMenu.tsx"
import LoginButton from "./user/LoginButton.tsx"
import { useLocation } from "react-router-dom"
import { useSearchParams, Link } from "react-router-dom";

import { useAuth } from "./AuthContext"
import { useState } from "react";

export default function Navbar() {
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const currentPath = useLocation().pathname
    const [searchType, setSearchType] = useState(currentPath === "/kanjisearch" ? "kanji" : "words");
    const [exactMatch, setExactMatch] = useState(searchParams.has("exactmatch"));

    const query = searchParams.get("query")
    const jlpt = searchParams.get("jlpt")

    return (
        <nav className="site-nav bg-black border-bottom border-secondary shadow-sm">

            <div className="container-fluid">

                <div className="d-flex flex-wrap align-items-center gap-2 py-2">

                    <Link to="/" className="navbar-brand text-white mb-0 d-none d-md-block">
                       <span className="brand-mark" aria-hidden="true">N</span><span className="brand-copy"><strong>Nyaa</strong><small>VOCAB LAB</small></span>
                    </Link>

                    <form action={searchType === "kanji" ? "/kanjisearch" : "/search"} method="GET" className="flex-grow-1">
                        <div className="input-group">

                        <select className="form-select flex-grow-0" style={{ width: "110px" }}
                            value={searchType} onChange={(e) => setSearchType(e.target.value)}>
                            <option value="words">Words</option>
                            <option value="kanji">Kanji</option>
                        </select>

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

                        <Link to="/" className={"btn btn-sm " + (currentPath === "/" ? "btn-light" : "btn-outline-light")}>
                            Home
                        </Link>

                        <Link to="/word" className={"btn btn-sm " + (currentPath === "/word" ? "btn-light" : "btn-outline-light")}>
                            Word
                        </Link>

                        <Link to="/kanji"
                           className={"btn btn-sm " + (currentPath === "/kanji" ? "btn-light" : "btn-outline-light")}>
                            Kanji
                        </Link>

                        <Link to="/word/random" className={"btn btn-sm nav-random " + (currentPath === "/word/random" ? "btn-warning" : "btn-outline-light")}>
                            <span aria-hidden="true">✳</span> Random draw
                        </Link>

                        <div className="dropdown ms-auto d-md-none">

                        {user ? (
                            <UserMenu mobile />
                        ) : (
                            <LoginButton mobile />
                        )}

                        </div>

                    </div>

                </div>

            </div>

        </nav>
    )
}
