import { useAuth } from "../AuthContext"

export default function UserMenu() {
    const { user } = useAuth();

    return (
        <div className="dropdown d-none d-md-block">
            <button
                    className="btn btn-outline-light dropdown-toggle"
                    data-bs-toggle="dropdown">

                {user.Username}

            </button>

            <ul className="dropdown-menu dropdown-menu-end">

                <li>
                    <a className="dropdown-item"
                       href={`/user/${user.Username}`}>
                        Profile
                    </a>
                </li>

                <li><hr className="dropdown-divider"/></li>

                <li>
                    <a className="dropdown-item"
                       href="/logout">
                        Logout
                    </a>
                </li>

            </ul>
        </div>
    )
}
