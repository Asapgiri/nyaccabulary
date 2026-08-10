import { useEffect, useState } from "react";
import { apiFetch } from "./api";
import { sync } from "./db/sync";
import KanjiModal from "./components/KanjiModal";

import './assets/search.css'
import { useAuth } from "./AuthContext";

export default function Search() {
    const query = window.location.search
    const { user } = useAuth();
    const [skanjis, setSKanjis] = useState<SKanji[] | null>(null);
    const [loading, setLoading] = useState<bool>(true);
    const [selectedKanji, setSelectedKanji] = useState<Kanji | null>(null);

    async function add(entseq) {
        const response = await apiFetch(`/api/kanji/add/${entseq}`, {method: "POST"})
        const result = await response.json()
        setSKanjis(sw => sw.map(s => s.Result.Literal == entseq ? {...s, Kanji: result } : s))
        sync();
    }

    async function search() {
        const response = await apiFetch(`/api/kanjisearch?${query.substring(1)}`)
        const result = (await response.json()).Results
        setSKanjis(result)
        setLoading(false) // loading finished
    }

    async function update(updated) {
        setSKanjis(sw => sw.map(w => w.Kanji.Id == updated.Id ? ({...w, Kanji: updated }) : w))
    }

    useEffect(() => {
        search();
    }, [query])

    console.log(skanjis)

    return (
        <div className="container-fluid py-4 px-3 px-md-4">

            <div className="text-muted mb-2">
                results: {skanjis && skanjis.length}
            </div>

            {loading && (
                <div className="text-center py-5">

                    <div className="paw-loader">
                        <span>🐾</span>
                        <span>🐾</span>
                        <span>🐾</span>
                    </div>

                    <h4>Looking through the dictionary…</h4>

                    <p className="text-muted mb-3">
                        NyanTan is sniffing out the perfect kanjis!
                    </p>

                </div>
            )}

            {!loading && !skanjis && (
                <div className="text-center py-5">
                    <div style={{ fontSize: "5rem" }}>📚</div>

                    <h3 className="mt-3">Nothing found</h3>

                    <p className="text-muted">
                        No dictionary entries matched your search.
                    </p>
                </div>
            )}

            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
                {skanjis && skanjis.map(({ Result, Kanji }) => (
                    <div className="col word-card" key={Result.Literal}>
                        <div
                            id={`div-${Result.Literal}`}
                            className={[
                                "card",
                                "h-100",
                                "shadow-sm",
                                Kanji?.Status === "MASTERED" && "border-success",
                                Kanji?.Status === "LEARNING" && "border-warning",
                                Kanji?.Status === "NEW" && "border-primary",
                            ]
                                .filter(Boolean)
                                .join(" ")}
                        >
                            <div className="card-body d-flex flex-column">

                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div style={{ cursor: Kanji.Id ? "pointer" : "default" }}
                                         role={Kanji.Id ? "button" : undefined}
                                         tabIndex={Kanji.Id ? 0 : undefined}
                                         onKeyDown={(e) => { if (Kanji.Id && e.key === "Enter") setSelectedKanji(Kanji); }}
                                         {...(Kanji.Id && {
                                            "data-bs-toggle": "modal",
                                            "data-bs-target": "#word-modal",
                                            onClick: () => setSelectedKanji(Kanji),
                                         })}>
                                        <div className="fw-bold fs-5">
                                            {Result.Literal}
                                        </div>

                                        <div className="text-muted small">
                                            {Result.ReadingMeaning?.RMGroups?.flatMap(r => r.Readings?.filter(x => x.Type === "ja_on" || x.Type === "ja_kun").map(x => x.Value)).join("・")}
                                        </div>
                                        <div className="small text-muted">
                                            {Result.ReadingMeaning?.RMGroups?.flatMap(r => r.Meanings?.filter(x => !x.Lang).map(x => x.Value)).slice(0, 4).join(" · ")}
                                        </div>
                                    </div>

                                    {Kanji?.Id ? (
                                        <span className="badge bg-success">
                                            Added
                                        </span>
                                    ) : user && (
                                        <button
                                            className="btn btn-sm btn-outline-primary"
                                            title="Add to deck"
                                            onClick={() => add(Result.Literal)}
                                        >
                                            Add
                                        </button>
                                    )}
                                </div>

                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <KanjiModal kanji={selectedKanji} setSelectedKanji={setSelectedKanji} onUpdate={update} />

        </div>
    )
}
