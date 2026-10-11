import { useEffect, useState } from "react";
import { apiFetch } from "../api";

interface MemeGifEditorProps {
    value?: string;
    onSave: (url: string) => Promise<void> | void;
    label: string;
    searchQuery: string;
}

interface GiphyResult {
    embed_url?: string;
}

export default function MemeGifEditor({ value = "", onSave, label, searchQuery }: MemeGifEditorProps) {
    const [giphyApiKey, setGiphyApiKey] = useState<string | null>(null);
    const [currentGif, setCurrentGif] = useState(value);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => setCurrentGif(value), [value]);

    useEffect(() => {
        let active = true;
        apiFetch("/api/config")
            .then(response => {
                if (!response.ok) throw new Error("Could not load public config");
                return response.json();
            })
            .then((settings: { giphyApiKey?: string }) => {
                if (active) setGiphyApiKey(settings.giphyApiKey ?? "");
            })
            .catch(() => { if (active) setGiphyApiKey(""); });
        return () => { active = false; };
    }, []);

    async function loadNewGif(apiKey = giphyApiKey) {
        if (!apiKey) {
            setError("Add a GIPHY API key to .config.json to load GIFs.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({
                api_key: apiKey,
                q: searchQuery.trim().slice(0, 50),
                limit: "10",
                rating: "pg",
                lang: "ja",
            });
            const response = await fetch(`https://api.giphy.com/v1/gifs/search?${params}`);
            if (!response.ok) throw new Error("GIPHY search failed");
            const result: { data?: GiphyResult[] } = await response.json();
            const candidates = (result.data ?? []).filter(gif => gif.embed_url);
            if (!candidates.length) throw new Error("No matching GIFs found");
            const nextGif = candidates[Math.floor(Math.random() * candidates.length)].embed_url!;
            await onSave(nextGif);
            setCurrentGif(nextGif);
        } catch {
            setError("Could not load and save a GIF. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (giphyApiKey && !value) void loadNewGif(giphyApiKey);
        // Only auto-pick when this modal opens without a saved GIF.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [giphyApiKey, value]);

    const isGiphyEmbed = /^https:\/\/giphy\.com\/embed\//i.test(currentGif);

    return (
        <section className="meme-gif-editor" aria-label={`${label} meme GIF`}>
            <div className="meme-gif-editor-head">
                <div>
                    <h6>Meme GIF</h6>
                    <small>GIPHY picks a random result for this entry</small>
                </div>
                <button type="button" className="btn btn-sm btn-dark btn-mini" onClick={() => void loadNewGif()} disabled={loading || giphyApiKey === null}>
                    {loading ? "Loading…" : "New GIF"}
                </button>
            </div>
            {currentGif && (
                <div className="meme-gif-preview">
                    {isGiphyEmbed ? (
                        <iframe src={currentGif} title={`${label} meme GIF from GIPHY`} allowFullScreen loading="lazy" />
                    ) : (
                        <img src={currentGif} alt={`${label} meme GIF`} loading="lazy" />
                    )}
                    {isGiphyEmbed && <a className="giphy-attribution" href="https://giphy.com" target="_blank" rel="noreferrer">Powered by GIPHY</a>}
                </div>
            )}
            {!currentGif && loading && <div className="small text-muted">Finding a GIF…</div>}
            {!currentGif && giphyApiKey === "" && <div className="small text-muted">Add `Giphy.ApiKey` to .config.json to enable automatic GIFs.</div>}
            {error && <span className="small text-danger" role="alert">{error}</span>}
        </section>
    );
}
