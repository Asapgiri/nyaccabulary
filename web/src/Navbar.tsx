import UserMenu from "./user/UserMenu.tsx"
import LoginButton from "./user/LoginButton.tsx"
import { useLocation } from "react-router-dom"

import { useAuth } from "./AuthContext"

const Config = {
    SiteTitle: "Nyaccab"
}

export default function Navbar() {
    const { user } = useAuth();
    const currentPath = useLocation().pathname

    return (
        <nav className="bg-black border-bottom border-secondary shadow-sm">

            <div className="container-fluid">

                <div className="d-flex flex-wrap align-items-center gap-2 py-2">

                    <a href="/"
                       className="navbar-brand text-white mb-0 d-none d-md-block">
                        {Config.SiteTitle}
                    </a>

                    <form action="/search" method="GET" className="flex-grow-1">

                        <div className="input-group">

                            <span className="input-group-text bg-body border-end-0">
                                <input className="form-check-input"
                                       type="checkbox"
                                       name="exactmatch"
                                       id="exactmatch" />
                            </span>

                            <input
                                    name="query"
                                    className="form-control border-start-0"
                                    placeholder="Search words, kanji, readings..."
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

                        <a href="/"
                           className={"btn btn-sm " + (currentPath === "/" ? "btn-light" : "btn-outline-light")}>
                            Home
                        </a>

                        <a href="/word"
                           className={"btn btn-sm " + (currentPath === "/word" ? "btn-light" : "btn-outline-light")}>
                            Word
                        </a>

                        <a href="/kanji"
                           className={"btn btn-sm " + (currentPath === "/kanji" ? "btn-light" : "btn-outline-light")}>
                            Kanji
                        </a>

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
