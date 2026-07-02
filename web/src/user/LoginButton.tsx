export default function LoginButton({ mobile }: { mobile: boolean }) {
    return (
        <div className={mobile ? "" : "d-none d-md-block"}>
            <a href="/login" className="btn btn-outline-light">
                Login
            </a>
        </div>
    )
}
