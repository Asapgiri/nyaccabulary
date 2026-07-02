export default function KanjiModal({ kanji }) {

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

    return (
        <div className="modal fade show" tabIndex="-1" id="word-modal" aria-modal="true" role="dialog">
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
                <div className="modal-content">

                    <div className="modal-header study-modal-header">

                        <div className="study-title">
                            <div className="study-kanji">{kanji.Kanji}</div>
                            <div className="study-kana">{`On: ${kanji.On ? kanji.On.join(", ") : "-"} | Kun: ${kanji.Kun ? kanji.Kun.join(", ") : "-"}`}</div>
                        </div>

                        <div className="study-actions">

                            <button type="button" className="icon-btn btn-master">Master
                            </button><button type="button" className="icon-btn btn-mark">Mark

                            </button><button type="button" className="icon-btn btn-delete">Delete</button>

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
                        {kanji.Words.map(word => (
                            <a key={word} href={`/word/${word}`} className="icon-btn me-2 mb-2 p-1 kanji-btn">{word}</a>
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
