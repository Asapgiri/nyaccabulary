import { useAuth } from "../AuthContext"
import { Link } from "react-router-dom"

export default function UserMenu({ mobile }: { mobile: boolean }) {
    const { user } = useAuth();

    return (
        <div className={`dropdown ${mobile ? "ms-auto" : "d-none"} d-md-block`}>
            <button className="btn btn-outline-light dropdown-toggle" data-bs-toggle="dropdown">
                {user.Username}
            </button>

            <ul className="dropdown-menu dropdown-menu-end">

                <li>
                    <Link className="dropdown-item" to={`/user/${user.Username}`}>
                        Profile
                    </Link>
                </li>

                <li>
                    <Link className="dropdown-item" to="/settings">Settings</Link>
                </li>

                {user.Roles?.includes("ADMIN") && <li><Link className="dropdown-item" to="/admin/users">Admin · Users</Link></li>}

                <li><hr className="dropdown-divider"/></li>

                <li>
                    <a className="dropdown-item" href="/logout">
                        Logout
                    </a>
                </li>

            </ul>
        </div>
    )
}
