import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { KanjiDB } from "./db/kanjis";
import { raw_kanji_update } from "./components/update";

export default function KanjiShow() {
    const { id } = useParams<{ id: string }>();
    const [kanji, setKanji] = useState<Kanji | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!id) return;

        async function loadKanji() {
            const loadedKanji = await KanjiDB.get(id);
            setKanji(loadedKanji);
        }

        loadKanji();
    }, [id]);

    async function kanji_mark() {
        if (!kanji) return;

        raw_kanji_update(
            kanji,
            "set",
            null,
            setKanji,
            null
        );
    }

    async function kanji_master() {
        if (!kanji) return;

        raw_kanji_update(
            kanji,
            "force",
            null,
            setKanji,
            null
        );
    }

    async function kanji_unmark() {
        if (!kanji) return;

        raw_kanji_update(
            kanji,
            "unset",
            null,
            setKanji,
            null
        );
    }

    async function kanji_delete() {
        if (!kanji) return;

        raw_kanji_update(
            kanji,
            "delete",
            null,
            () => {},
            null,
            true
        );
        // FIXME: Update word links locally on delete...

        navigate("/kanji")
    }

    if (!kanji) {
        return (
            <div className="container-fluid py-4 px-3 px-md-4">
                Loading...
            </div>
        );
    }

    return (
        <div className="container-fluid py-4 px-3 px-md-4">

            <div className="topbar">
                <div className="page-title">
                    {kanji.Kanji}

                    {kanji.Status === "MASTERED" && (
                        <span className="badge bg-success ms-2">
                            Mastered
                        </span>
                    )}

                    {kanji.Status === "LEARNING" && (
                        <span className="badge bg-warning text-dark ms-2">
                            Learning
                        </span>
                    )}

                    {kanji.Status !== "MASTERED" &&
                        kanji.Status !== "LEARNING" && (
                            <span className="badge bg-secondary ms-2">
                                Unmarked
                            </span>
                        )}
                </div>

                <div className="study-actions">
                    {kanji.Status === "MASTERED" ? (
                        <button
                            type="button"
                            className="icon-btn btn-mastered"
                            onClick={kanji_unmark}
                        >
                            Unmaster
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="icon-btn btn-master"
                            onClick={kanji_master}
                        >
                            Master
                        </button>
                    )}

                    {kanji.Status !== "MASTERED" &&
                        kanji.Status !== "LEARNING" && (
                            <button
                                type="button"
                                className="icon-btn btn-mark"
                                onClick={kanji_mark}
                            >
                                Mark
                            </button>
                        )}

                    <button
                        type="button"
                        className="icon-btn btn-delete"
                        onClick={kanji_delete}
                    >
                        Delete
                    </button>
                </div>
            </div>

            <div className="study-title">
                <div className="study-kanji">
                    {kanji.Kanji}
                </div>

                <div className="study-kana">
                    On: {kanji.On?.join(", ") || "-"}
                    {" | "}
                    Kun: {kanji.Kun?.join(", ") || "-"}
                </div>

                <div className="study-grade">
                    {kanji.DictForm.Misc?.JLPT > 0 && (
                        <span className="badge bg-success">
                            N{kanji.DictForm.Misc.JLPT}
                        </span>
                    )}

                    {kanji.DictForm.Misc?.Grade !== "" && (
                        <span className="badge bg-info ms-2">
                            G{kanji.DictForm.Misc.Grade}
                        </span>
                    )}

                    {kanji.DictForm.Misc?.Freq > 0 && (
                        <span className="badge bg-secondary ms-2">
                            F{kanji.DictForm.Misc.Freq}
                        </span>
                    )}
                </div>
            </div>

            <hr />

            <div className="kanji-hero">
                {kanji.Kanji}
            </div>

            <div className="kanji-readings">
                On: {kanji.On?.join(", ") || "-"}
                {" | "}
                Kun: {kanji.Kun?.join(", ") || "-"}
            </div>

            <hr />

            <section>
                <h6>Meaning</h6>

                <p className="modal-meaning">
                    {kanji.Meaning?.join(", ") || "-"}
                </p>
            </section>

            <hr />

            <section>
                <h6>Words</h6>

                <div className="modal-words">
                    {kanji.Words?.map((word, index) => (
                        <Link
                            key={index}
                            to={`/word/${word.Id}`}
                            className="icon-btn me-2 mb-2 p-1 kanji-btn"
                        >
                            {word.Word}
                        </Link>
                    ))}
                </div>
            </section>

            <hr />

            <section>
                <h6>Readings &amp; Meanings</h6>

                <div className="modal-readings">
                    {kanji.DictForm.ReadingMeaning?.RMGroups?.map(
                        (group, gi) => (
                            <div key={gi}>

                                {group.Readings && (
                                    <div className="mb-3">
                                        <strong>Readings:</strong>
                                        <br />

                                        {group.Readings.map(r => (
                                            <span
                                                key={r.Value}
                                                className="badge bg-secondary me-1"
                                            >
                                                {r.Value} ({r.Type})
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {group.Meanings && (
                                    <div className="mb-3">
                                        <strong>Meanings:</strong>

                                        <ul className="mb-1">
                                            {group.Meanings.map((m, i) => (
                                                <li key={i}>
                                                    {m.Value}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                            </div>
                        )
                    )}
                </div>
            </section>

        </div>
    );
}
