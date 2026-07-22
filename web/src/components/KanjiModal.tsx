import { raw_kanji_update } from "./update";

export default function KanjiModal({ kanji, setSelectedKanji, onUpdate, onDelete }) {

    if (!kanji) {
        return (
        <div className="modal fade" tabIndex="-1" id='word-modal'>
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
                <div className="modal-content">
                </div>
            </div>
        </div>
        )
    }

    async function kanji_mark() {
        raw_kanji_update(kanji, 'set', null, onUpdate, setSelectedKanji)
    }

    async function kanji_master() {
        raw_kanji_update(kanji, 'force', null, onUpdate, setSelectedKanji)
    }

    async function kanji_unmark() {
        raw_kanji_update(kanji, 'unset', null, onUpdate, setSelectedKanji)
    }

    async function kanji_delete() {
        raw_kanji_update(kanji, 'delete', null, onDelete, null, true)
        setSelectedKanji(null)
    }

    return (
        <div className="modal fade show" tabIndex="-1" id="word-modal" aria-modal="true" role="dialog">
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
                <div className="modal-content">

                    <div className="modal-header study-modal-header align-items-start">

                        <div className="study-title">
                            <div className="study-kanji">{kanji.Kanji}</div>
                            <div className="study-kana">{`On: ${kanji.On ? kanji.On.join(", ") : "-"} | Kun: ${kanji.Kun ? kanji.Kun.join(", ") : "-"}`}</div>
                            <div className="study-grade">
                                {kanji.DictForm.Misc?.JLPT > 0      && (<span className="badge bg-success">N{kanji.DictForm.Misc.JLPT}</span>)}
                                {kanji.DictForm.Misc?.Grade != ""   && (<span className="badge bg-info ms-2">G{kanji.DictForm.Misc.Grade}</span>)}
                                {kanji.DictForm.Misc?.Freq > 0      && (<span className="badge bg-secondary ms-2">F{kanji.DictForm.Misc.Freq}</span>)}
                            </div>
                        </div>

                        <div className="study-actions">
                            {kanji.Status == "MASTERED" ? (<button type="button" className="icon-btn btn-mastered" onClick={kanji_unmark}>Unmaster</button>)
                            :                            (<button type="button" className="icon-btn btn-master" onClick={kanji_master}>Master</button>)}
                            {kanji.Status != "MASTERED" && kanji.Status != "LEARNING"
                                                      && (<button type="button" className="icon-btn btn-mark" onClick={kanji_mark}>Mark</button>)}
                            <button type="button" className="icon-btn btn-delete" onClick={kanji_delete} data-bs-dismiss="modal">Delete</button>
                            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                        </div>

                    </div>

                    <div className="modal-body">
                        <div className="kanji-hero">{kanji.Kanji}</div>
                        <div className="kanji-readings">{`On: ${kanji.On ? kanji.On.join(", ") : "-"} | Kun: ${kanji.Kun ? kanji.Kun.join(", ") : "-"}`}</div>

                        <hr/>

                        <p><strong>Meaning:</strong> <span className="modal-meaning">{kanji.Meaning ? kanji.Meaning.join(", ") : "-"}</span></p>
                        <hr/>

                        <p>
                        <strong>Words:</strong>
                        <span className="modal-words">
                        {kanji.Words.map((word, index) => (
                            <a key={index} href={`/word/${word}`} className="icon-btn me-2 mb-2 p-1 kanji-btn">{word}</a>
                        ))}
                        </span>
                        </p>
                        <hr/>

                        <h6>Readings &amp; Meanings</h6>
                        <div className="modal-readings">
                            {kanji.DictForm.ReadingMeaning?.RMGroups?.map((group, gi) => (
                                <div key={gi}>
                                {group.Readings && (
                                    <div className="mb-2">
                                        <strong>Readings:</strong>
                                        <br/>
                                        {group.Readings.map(r => (
                                            <span key={r.Value} className="badge bg-secondary">{`${r.Value} (${r.Type})`}</span>
                                        ))}
                                    </div>
                                )}
                                {group.Meanings && (
                                    <div className="mb-2">
                                        <strong>Meanings:</strong>
                                        <ul className="mb-1">
                                            {group.Meanings.map((m, i) => (
                                                <li key={i}>{m.Value}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
