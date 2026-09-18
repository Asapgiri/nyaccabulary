import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { WordDB } from "./db/words";
import { copy, Filter, FilterApply, pdf, cards, raw_filter } from "./Filter";
import { raw_word_update } from "./components/update";

export default function WordShow() {
    const { id } = useParams<{ id: string }>();
    const [word, setWord] = useState<Word | null>(null);
    const [allWords, setAllWords] = useState<Word | null>(null);
    const [filter, setFilter] = useState<TFilter>(raw_filter);
    const navigate = useNavigate();

    useEffect(() => {
        if (!id) return;

        async function loadWord() {
            let loadedWord
            let words

            if ("random" === id) {
                words = await WordDB.getAll();
                loadedWord = words[Math.floor(Math.random() * words.length)];
            }
            else {
                loadedWord = await WordDB.get(id);
            }

            setWord(loadedWord);
            setAllWords(words)
        }

        loadWord();
    }, [id]);

    async function word_random() {
        const words = FilterApply(filter, allWords);
        setWord(words[Math.floor(Math.random() * words.length)]);
    }

    async function update(t_body) {
        if (!word) return;
        raw_word_update(word, "update", t_body, setWord, null);
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

    if (!word) {
        return (
            <div className="container-fluid py-4 px-3 px-md-4">
                Loading...
            </div>
        );
    }

    return (
        <div className="container-fluid py-4 px-3 px-md-4">

            <Filter filter={filter} setFilter={setFilter} compact={true} />

            <div className="topbar">
                <div className="page-title">
                    {word.Status === "MASTERED" && (
                        <span className="badge bg-success ms-2">
                            Mastered
                        </span>
                    )}

                    {word.Status === "LEARNING" && (
                        <span className="badge bg-warning text-dark ms-2">
                            Learning
                        </span>
                    )}

                    {word.Status !== "MASTERED" &&
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

            <div className="study-title">
                <div className="study-kanji">{word.Kanji}</div>
                <div className="study-kana">{word.Kana}</div>
            </div>

            <hr />

            <section>
                <h6>Meaning</h6>
                <p>{word.Meaning}</p>
            </section>

            <hr />

            <section>
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

            <section>
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

            <section>
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

            <button className="icon-btn btn-next mb-2" onClick={word_random}>
                Next
            </button>

            <section>
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
