import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./how-it-works.css";

const steps = [
    { number: "01", title: "Find something to learn", text: "Search for a word or kanji from the bar at the top. Open a result to check its readings and meanings before adding it to your collection.", links: [{ to: "/search", label: "Search words" }, { to: "/kanjisearch", label: "Search kanji" }] },
    { number: "02", title: "Build your collection", text: "Add entries one at a time from search or type a word on Home. To paste a list, open the Words menu and choose Bulk Add. Adding a word also connects its kanji to your kanji collection.", links: [{ to: "/", label: "Go to Home" }, { to: "/word/bulkadd", label: "Bulk add words" }] },
    { number: "03", title: "Organize with tags", text: "Create tags in Settings, then assign them from a word or kanji modal. Use the tag filters on the study lists to focus on one group at a time.", links: [{ to: "/settings", label: "Manage tags" }, { to: "/word", label: "Browse words" }] },
    { number: "04", title: "Study at your pace", text: "Open any entry to review it, edit its details, and update its learning status. Use Random Draw when you want the site to choose a word for you.", links: [{ to: "/word", label: "Study words" }, { to: "/kanji", label: "Study kanji" }, { to: "/word/random", label: "Random draw" }] },
    { number: "05", title: "Watch your progress", text: "The list counters show mastered, learning, and total entries. Your profile adds a progress overview, activity history, and learner ranking. Sign in to sync your collection across sessions.", links: [] },
];

export default function HowItWorks() {
    const { user } = useAuth();
    return <div className="container-fluid py-4 px-3 px-md-4 how-page">
        <header className="how-hero">
            <span className="eyebrow">FIELD GUIDE / NYAACABULARY</span>
            <h1>How it works</h1>
            <p>A small guide to building a Japanese study collection and making it your own.</p>
            <div className="how-hero-actions"><Link className="icon-btn" to="/search">Find a word</Link><Link className="icon-btn" to="/kanjisearch">Find a kanji</Link></div>
        </header>
        <div className="how-step-grid">
            {steps.map(step => <section className="how-step" key={step.number}>
                <span className="how-step-number">{step.number}</span>
                <div><h2>{step.title}</h2><p>{step.text}</p>
                    <div className="how-step-links">{[...step.links, ...(step.number === "05" ? [{ to: user ? `/user/${encodeURIComponent(user.Username)}` : "/login", label: user ? "Your profile" : "Sign in" }] : [])].map(link => <Link key={link.to} to={link.to}>{link.label}<span aria-hidden="true"> ↗</span></Link>)}</div>
                </div>
            </section>)}
        </div>
    </div>;
}
