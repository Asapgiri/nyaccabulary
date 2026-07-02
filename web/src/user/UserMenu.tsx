import { useAuth } from "../AuthContext"

export default function UserMenu({ mobile }: { mobile: boolean }) {
    const { user } = useAuth();

    return (
        <div className={`dropdown ${mobile ? "ms-auto" : "d-none"} d-md-block`}>
            <button className="btn btn-outline-light dropdown-toggle" data-bs-toggle="dropdown">
                {user.Username}
            </button>

            <ul className="dropdown-menu dropdown-menu-end">

                <li>
                    <a className="dropdown-item" href={`/user/${user.Username}`}>
                        Profile
                    </a>
                </li>

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
