import { useEffect, useState } from "react";
import { apiFetch } from "./api";
import { sync } from "./db/sync";
import WordModal from "./components/WordModal";

import './assets/search.css'
import { useAuth } from "./AuthContext";

export default function Search() {
    const query = window.location.search
    const { user } = useAuth();
    const [swords, setSwords] = useState<SWord[] | null>(null);
    const [loading, setLoading] = useState<bool>(true);
    const [selectedWord, setSelectedWord] = useState<Word | null>(null);

    async function add(entseq) {
        const response = await apiFetch(`/api/word/${entseq}`, {method: "POST"})
        const result = await response.json()
        setSwords(sw => sw.map(s => s.Result.EntSeq == entseq ? {...s, Word: result } : s))
        sync();
    }

    async function search() {
        const response = await apiFetch(`/api/search?${query.substring(1)}`)
        const result = (await response.json()).Results
        setSwords(result)
        setLoading(false) // loading finished
    }

    async function update(updated) {
        setSwords(sw => sw.map(w => w.Word.Id == updated.Id ? ({...w, Word: updated }) : w))
    }

    useEffect(() => {
        search();
    }, [query])

    return (
        <div className="container-fluid py-4 px-3 px-md-4">

            {loading && (
                <div className="text-center py-5">

                    <div className="paw-loader">
                        <span>🐾</span>
                        <span>🐾</span>
                        <span>🐾</span>
                    </div>

                    <h4>Looking through the dictionary…</h4>

                    <p className="text-muted mb-3">
                        NyanTan is sniffing out the perfect words!
                    </p>

                </div>
            )}

            {!loading && !swords && (
                <div className="text-center py-5">
                    <div style={{ fontSize: "5rem" }}>📚</div>

                    <h3 className="mt-3">Nothing found</h3>

                    <p className="text-muted">
                        No dictionary entries matched your search.
                    </p>
                </div>
            )}

            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
                {swords && swords.map(({ Result, Word }) => (
                    <div className="col word-card" key={Result.EntSeq}>
                        <div
                            id={`div-${Result.EntSeq}`}
                            className={[
                                "card",
                                "h-100",
                                "shadow-sm",
                                Word?.Status === "MASTERED" && "border-success",
                                Word?.Status === "LEARNING" && "border-warning",
                                Word?.Status === "NEW" && "border-primary",
                            ]
                                .filter(Boolean)
                                .join(" ")}
                        >
                            <div className="card-body d-flex flex-column">

                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div style={{ cursor: Word.Id ? "pointer" : "default" }}
                                         role={Word.Id ? "button" : undefined}
                                         tabIndex={Word.Id ? 0 : undefined}
                                         onKeyDown={(e) => { if (Word.Id && e.key === "Enter") setSelectedWord(Word); }}
                                         {...(Word.Id && {
                                            "data-bs-toggle": "modal",
                                            "data-bs-target": "#word-modal",
                                            onClick: () => setSelectedWord(Word),
                                         })}>
                                        <div className="fw-bold fs-5">
                                            {Result.KEle?.map(k => k.KEB).join(", ")}
                                        </div>

                                        <div className="text-muted small">
                                            {Result.REle?.map(r => r.REB).join(", ")}
                                        </div>
                                    </div>

                                    {Word?.Id ? (
                                        <span className="badge bg-success">
                                            Added
                                        </span>
                                    ) : user && (
                                        <button
                                            className="btn btn-sm btn-outline-primary"
                                            title="Add to deck"
                                            onClick={() => add(Result.EntSeq)}
                                        >
                                            Add
                                        </button>
                                    )}
                                </div>

                                <hr className="my-2" />

                                <div className="flex-grow-1 overflow-auto">
                                    {Result.Sense?.map((sense, index) => (
                                        <div key={index} className="mb-3">

                                            {sense.Pos?.length > 0 && (
                                                <div className="mb-1">
                                                    {sense.Pos.map(pos => (
                                                        <span
                                                            key={pos}
                                                            className="badge bg-secondary me-1"
                                                        >
                                                            {pos}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {sense.Gloss?.length > 0 && (
                                                <ul className="mb-1 small">
                                                    {sense.Gloss.map((gloss, i) => (
                                                        <li key={i}>
                                                            {gloss.Value}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}

                                            {sense.Example?.length > 0 && (
                                                <div className="small text-muted mb-2">
                                                    {sense.Example.map((example, i) => (
                                                        <div
                                                            key={i}
                                                            className="example-block"
                                                        >
                                                            <div>
                                                                <strong>{example.ExText}</strong>
                                                            </div>

                                                            {example.ExSent?.map((sent, j) => (
                                                                <div key={j}>
                                                                    {sent.Value}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                        </div>
                                    ))}
                                </div>

                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <WordModal word={selectedWord} setSelectedWord={setSelectedWord} onUpdate={update} />

        </div>
    )
}
