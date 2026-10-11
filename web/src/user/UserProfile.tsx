import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api.ts";
import "./user-profile.css";

interface ProfileStat { Count: number; Mastered: number }
interface ActivityDay { Date: string; Count: number }
interface RankingEntry { Username: string; Name: string; Mastered: number; Rank: number }
interface Profile {
    Username: string;
    Name: string;
    RegDate: string;
    Words: ProfileStat;
    Kanjis: ProfileStat;
    Activity: ActivityDay[];
    Rank: number;
    Ranking: RankingEntry[];
}

function Progress({ label, stats }: { label: string; stats: ProfileStat }) {
    const percentage = stats.Count ? Math.round(stats.Mastered / stats.Count * 100) : 0;
    return <section className="profile-progress">
        <div className="d-flex justify-content-between align-items-baseline mb-2">
            <h3>{label}</h3><span>{stats.Mastered} / {stats.Count} mastered</span>
        </div>
        <div className="progress" role="progressbar" aria-label={`${label} mastery`} aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-bar" style={{ width: `${percentage}%` }} />
        </div>
        <small>{percentage}%</small>
    </section>;
}

export default function UserProfile() {
    const { username = "" } = useParams();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        setProfile(null);
        setError("");
        const url = `/api/user/${encodeURIComponent(username)}`;
        apiFetch(url).then(async response => {
            const contentType = response.headers.get("content-type") ?? "";
            const body = await response.text();
            if (!contentType.toLowerCase().includes("application/json")) {
                const preview = body.replace(/\s+/g, " ").slice(0, 180);
                console.error("Profile API returned a non-JSON response", {
                    url: response.url || url,
                    status: response.status,
                    contentType,
                    preview,
                });
                throw new Error(`Profile API returned ${contentType || "an unknown content type"} (HTTP ${response.status}). Check that the backend route is running for ${url}.`);
            }
            if (!response.ok) {
                if (response.status === 404) throw new Error("User not found.");
                console.error("Profile API request failed", { url: response.url || url, status: response.status, body: body.slice(0, 180) });
                throw new Error(`Could not load this profile (HTTP ${response.status}).`);
            }
            try {
                return JSON.parse(body);
            } catch (parseError) {
                console.error("Profile API returned invalid JSON", { url: response.url || url, status: response.status, contentType, preview: body.slice(0, 180), parseError });
                throw new Error("Profile API returned invalid JSON. See the browser console for response details.");
            }
        }).then(data => { if (active) setProfile(data); }).catch(err => { if (active) setError(err.message); });
        return () => { active = false; };
    }, [username]);

    const activity = useMemo(() => {
        const counts = new Map((profile?.Activity ?? []).map(day => [day.Date.slice(0, 10), day.Count]));
        const today = new Date();
        const start = new Date(today);
        start.setDate(today.getDate() - 364);
        start.setDate(start.getDate() - start.getDay());
        const dayCount = Math.floor((today.getTime() - start.getTime()) / 86400000) + 1;
        return Array.from({ length: dayCount }, (_, index) => {
            const date = new Date(start);
            date.setDate(start.getDate() + index);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
            const count = counts.get(key) ?? 0;
            return { key, count, label: `${key}: ${count} item updates`, level: count === 0 ? 0 : count < 3 ? 1 : count < 8 ? 2 : count < 15 ? 3 : 4 };
        });
    }, [profile]);

    if (error) return <div className="container py-5"><h1>Profile unavailable</h1><p>{error}</p></div>;
    if (!profile) return <div className="container py-5">Loading profile…</div>;

    return <div className="container py-4 user-profile">
        <header className="profile-header">
            <div className="profile-avatar" aria-hidden="true">{profile.Username.slice(0, 1).toUpperCase()}</div>
            <div><h1>{profile.Name || profile.Username}</h1><p>@{profile.Username}</p>
                {profile.RegDate && <small>Member since {new Date(profile.RegDate).toLocaleDateString()}</small>}
            </div>
            <div className="profile-rank">Rank <strong>#{profile.Rank || "—"}</strong></div>
        </header>

        <div className="profile-progress-grid">
            <Progress label="Words" stats={profile.Words} />
            <Progress label="Kanji" stats={profile.Kanjis} />
        </div>

        <section className="activity-card">
            <div className="d-flex justify-content-between align-items-baseline"><h2>Study activity</h2><small>Last year · item updates</small></div>
            <div className="activity-scroll"><div className="activity-grid" role="img" aria-label="Daily study item update activity over the last year">
                {activity.map(day => <span key={day.key} title={day.label} className={`activity-cell level-${day.level}`} />)}
            </div></div>
            <div className="activity-legend"><span>Less</span>{[0, 1, 2, 3, 4].map(level => <i key={level} className={`activity-cell level-${level}`} />)}<span>More</span></div>
        </section>

        <section className="ranking-card">
            <h2>Top learners</h2>
            <ol>{profile.Ranking.map(person => <li key={person.Username} className={person.Username === profile.Username ? "current-user" : ""}>
                <span className="rank-number">#{person.Rank}</span><Link to={`/user/${encodeURIComponent(person.Username)}`}>{person.Name || person.Username}</Link><span>{person.Mastered} mastered</span>
            </li>)}</ol>
        </section>
    </div>;
}
