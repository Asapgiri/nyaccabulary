export default function Footer() {
    return (
        <footer
            className="mt-auto py-3"
            style={{ borderTop: "1px solid #e5e5e5" }}
        >
            <div
                className="container-fluid px-3 px-md-4"
                style={{ maxWidth: "1000px" }}
            >
                <div
                    className="d-flex justify-content-between align-items-center"
                    style={{
                        fontSize: "14px",
                        color: "#555",
                    }}
                >
                    <div>© Words</div>

                    <div>
                        <a
                            href="https://github.com/asapgiri/nyaccabulary"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                textDecoration: "none",
                                color: "#111",
                                fontWeight: 500,
                            }}
                        >
                            github.com/asapgiri/nyaccabulary
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
