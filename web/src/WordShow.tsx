import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { WordDB } from "./db/words";
import { copy, Filter, FilterApply, pdf, cards, raw_filter } from "./Filter";
import { raw_word_update } from "./components/update";
import TagEditor from "./components/TagEditor";

export default function WordShow() {
    const { id } = useParams<{ id: string }>();
    const [word, setWord] = useState<Word | null>(null);
    const [allWords, setAllWords] = useState<Word[]>([]);
    const [filter, setFilter] = useState<TFilter>(raw_filter);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const navigate = useNavigate();
    const randomMode = id === "random";

    useEffect(() => {
        if (!id) return;

        async function loadWord() {
            setLoading(true);
            setLoadError("");
            try {
                if ("random" === id) {
                    const words = await WordDB.getAll();
                    setAllWords(words);
                    setWord(words.length ? words[Math.floor(Math.random() * words.length)] : null);
                } else {
                    setWord(await WordDB.get(id));
                }
            } catch {
                setLoadError("Could not load this word. Try syncing your vocabulary and opening it again.");
            } finally {
                setLoading(false);
            }
        }

        loadWord();
    }, [id]);

    async function word_random() {
        const words = FilterApply(filter, allWords);
        if (!words.length) {
            setLoadError("No words match these filters. Clear or change the filters to draw again.");
            return;
        }
        setLoadError("");
        const choices = words.length > 1 ? words.filter(candidate => candidate.Id !== word?.Id) : words;
        setWord(choices[Math.floor(Math.random() * choices.length)]);
    }

    async function update(t_body) {
        if (!word) return;
        raw_word_update(word, "update", t_body, setWord, null);
    }

    async function saveTags(tags: string[]) {
        if (!word) return;
        await raw_word_update(word, "update", { tags }, setWord, null, null);
    }

    async function word_mark() {
        if (!word) return;
        raw_word_update(word, "set", null, setWord, null);
    }

    async function word_master() {
        if (!word) return;
        raw_word_update(word, "force", null, setWord, null);
    }

    async function word_unmark() {
        if (!word) return;
        raw_word_update(word, "unset", null, setWord, null);
    }

    async function word_delete() {
        if (!word) return;
        raw_word_update(word, "delete", null, () => {}, null, true);
        // FIXME: Update kanji links locally on delete...
        navigate("/word")
    }

    if (loading) {
        return (
            <div className="container-fluid py-4 px-3 px-md-4">
                <div className="loading-panel">Opening your word…</div>
            </div>
        );
    }

    if (!word) return <div className="container-fluid py-4 px-3 px-md-4"><div className="empty-panel"><span className="empty-kicker">WORD DRAW</span><h1>{loadError ? "We hit a snag" : "No words to draw yet"}</h1><p>{loadError || "Add or sync some words first, then come back for a random pick."}</p><button className="btn btn-dark" onClick={() => navigate("/word")}>Browse words</button></div></div>;

    return (
        <div className="container-fluid py-4 px-3 px-md-4">

            <Filter filter={filter} setFilter={setFilter} compact={true} />

            <div className={`topbar ${randomMode ? "random-topbar" : ""}`}>
                <div className="page-title">
                    {randomMode && <span className="eyebrow">A LITTLE DAILY DISCOVERY</span>}
                    {!randomMode && word.Status === "MASTERED" && (
                        <span className="badge bg-success ms-2">
                            Mastered
                        </span>
                    )}

                    {!randomMode && word.Status === "LEARNING" && (
                        <span className="badge bg-warning text-dark ms-2">
                            Learning
                        </span>
                    )}

                    {!randomMode && word.Status !== "MASTERED" &&
                        word.Status !== "LEARNING" && (
                            <span className="badge bg-secondary ms-2">
                                Unmarked
                            </span>
                        )}
                </div>

                <div className="study-actions">
                    {word.Status === "MASTERED" ? (
                        <button className="icon-btn btn-mastered" onClick={word_unmark}>
                            Unmaster
                        </button>
                    ) : (
                        <button className="icon-btn btn-master" onClick={word_master}>
                            Master
                        </button>
                    )}

                    {word.Status !== "MASTERED" && word.Status !== "LEARNING" && (
                        <button className="icon-btn btn-mark" onClick={word_mark}>
                            Mark
                        </button>
                    )}

                    <button className="icon-btn btn-delete" onClick={word_delete}>
                        Delete
                    </button>
                </div>
            </div>

            <section className={`word-detail-hero ${randomMode ? "random-word-stage" : ""}`}>
                <div className="word-detail-hero-meta"><span>{randomMode ? "YOUR RANDOM WORD" : "WORD CARD"}</span><span className={`status-marker ${word.Status.toLowerCase()}`}>{word.Status || "UNMARKED"}</span></div>
                <div className="study-title word-show-title">
                    <div className="study-kanji">{word.Kanji}</div>
                    <div className="study-kana">{word.Kana}</div>
                </div>
                <div className="word-detail-meaning"><span>MEANING</span><p>{word.Meaning}</p></div>
                {randomMode && <div className="random-stage-actions"><button className="btn btn-dark random-next" onClick={word_random}><span className="random-next-icon">↻</span><span><small>DRAW ANOTHER</small><strong>Next random word</strong></span><span className="random-next-arrow">→</span></button><Link to="/word" className="random-browse">Browse all words <span>↗</span></Link></div>}
            </section>

            {loadError && <div className="alert alert-warning mt-3" role="status">{loadError}</div>}

            <TagEditor key={word.Id} value={word.Tags ?? []} onSave={saveTags} />

            <hr />

            <section className="detail-content-section">
                <h6>Kanjis</h6>

                {word.Kanjis?.map((kanji, index) => (
                    <Link
                        key={index}
                        to={`/kanji/${kanji.Id}`}
                        className="icon-btn me-2 mb-2 p-1 kanji-btn"
                    >
                        {kanji.Kanji}
                    </Link>
                ))}
            </section>

            <hr />

            <section className="detail-content-section">
                <h6>Kanji</h6>

                <ul className="modal-kanji">
                    {word.DictForm?.KEle?.map((kele, index) => (
                        <li key={index}>
                            {word.Kanji === kele.KEB ? (
                                <mark>{kele.KEB}</mark>
                            ) : (
                                <>
                                    {kele.KEB}{" "}
                                    <button
                                        className="icon-btn"
                                        onClick={() => update({ kanji: kele.KEB })}
                                    >
                                        set
                                    </button>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            </section>

            <section className="detail-content-section">
                <h6>Readings</h6>

                <ul className="modal-readings">
                    {word.DictForm?.REle?.map((rele, index) => (
                        <li key={index}>
                            {word.Kana === rele.REB ? (
                                <mark>{rele.REB}</mark>
                            ) : (
                                <>
                                    {rele.REB}{" "}
                                    <button
                                        className="icon-btn"
                                        onClick={() => update({ kana: rele.REB })}
                                    >
                                        set
                                    </button>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            </section>

            <section className="detail-content-section">
                <h6>Senses</h6>

                {word.DictForm?.Sense?.map((sense, index) => (
                    <div key={index} className="card mb-2">
                        <div className="card-body">

                            {sense.Pos?.length > 0 && (
                                <div className="mb-2">
                                    <strong>Part of Speech:</strong>{" "}
                                    {sense.Pos.map(pos => (
                                        <span key={pos} className="badge bg-secondary me-1">
                                            {pos}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {sense.Field?.length > 0 && (
                                <div className="mb-2">
                                    <strong>Fields:</strong>{" "}
                                    {sense.Field.map(field => (
                                        <span key={field} className="badge bg-info text-dark me-1">
                                            {field}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {sense.Gloss?.length > 0 && (
                                <div>
                                    <strong>Glosses:</strong>{" "}
                                    <span className="badge bg-secondary">
                                        {sense.Gloss[0]?.Lang}
                                    </span>

                                    <ul className="mb-0">
                                        {sense.Gloss.map(gloss => (
                                            <li key={gloss.Value}>
                                                {word.Meaning === gloss.Value ? (
                                                    <mark>{gloss.Value}</mark>
                                                ) : (
                                                    <>
                                                        {gloss.Value}{" "}
                                                        <button
                                                            className="icon-btn"
                                                            onClick={() =>
                                                                update({ meaning: gloss.Value })
                                                            }
                                                        >
                                                            set
                                                        </button>
                                                    </>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                        </div>
                    </div>
                ))}
            </section>

        </div>
    );
}
