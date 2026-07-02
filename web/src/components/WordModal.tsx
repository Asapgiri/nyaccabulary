import { raw_word_update } from "./update";

export default function WordModal({ word, setSelectedWord, onUpdate, onDelete }) {

    if (!word) {
        return (
        <div className="modal fade" tabIndex="-1" id='word-modal'>
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
                <div className="modal-content">
                </div>
            </div>
        </div>
        )
    }

    async function update(t_body) {
        raw_word_update(word, 'update', t_body, onUpdate, setSelectedWord)
    }

    return (
        <div className="modal fade" tabIndex="-1" id='word-modal'>
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
                <div className="modal-content">

                    <div className="modal-header study-modal-header">

                        <div className="study-title">
                            <div className="study-kanji">{word.Kanji}</div>
                            <div className="study-kana">{word.Kana}</div>
                        </div>

                        <div className="study-actions">
                            <button type="button" className="icon-btn btn-master">Master</button>
                            <button type="button" className="icon-btn btn-mark">Mark</button>
                            <button type="button" className="icon-btn btn-delete">Delete</button>
                            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                        </div>

                    </div>

                    <div className="modal-body">
                        <p><strong>Meaning:</strong> <span className="modal-meaning">{word.Meaning}</span></p>
                        <hr/>

                        <p>
                            <strong>Kanjis:</strong>
                            <span className="modal-kanjis">
                                {word.Kanjis.map(kanji => (
                                    <a key={kanji} href={`/kanji/${kanji}`} className="icon-btn me-2 mb-2 p-1 kanji-btn">
                                        {kanji}
                                    </a>
                                ))}
                            </span>
                        </p>
                        <hr/>

                        <h6>Kanji</h6>
                        <ul className="modal-kanji">
                            {word.DictForm.KEle?.map(kele => (
                                <li key={kele.KEB}>
                                    {word.Kanji == kele.KEB ? (
                                        <mark>{kele.KEB} </mark>
                                    ) : (
                                        <>
                                        <span>{kele.KEB} </span>
                                        <button className="icon-btn" onClick={() => update({kanji: kele.KEB})}>set</button>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>

                        <h6>Readings</h6>
                        <ul className="modal-readings">
                            {word.DictForm.REle?.map(rele => (
                                <li key={rele.REB}>
                                    {word.Kana == rele.REB ? (
                                        <mark>{rele.REB} </mark>
                                    ) : (
                                        <>
                                        <span>{rele.REB} </span>
                                        <button className="icon-btn" onClick={() => update({kana: rele.REB})}>set</button>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>

                        <h6>Senses</h6>
                        <div className="modal-senses">
                            {word.DictForm.Sense?.map((sense, senseIndex) => (
                            <div key={senseIndex} className="card mb-2">
                                <div className="card-body mb-2">

                                    {sense.Pos?.length > 0 && (
                                    <div className="mb-1">
                                        <strong>Part of Speech:</strong>
                                        {sense.Pos?.map(pos => (
                                            <span key={pos} className="badge bg-secondary">
                                                {pos}
                                            </span>
                                        ))}
                                    </div>
                                    )}

                                    {sense.Field?.length > 0 && (
                                    <div className="mb-1">
                                        <strong>Fields:</strong>
                                        {sense.Field?.map(field => (
                                            <span key={field} className="badge bg-info text-dark">
                                                {field}
                                            </span>
                                        ))}
                                    </div>
                                    )}

                                    {sense.Gloss?.length > 0 && (
                                    <div className="mb-1">
                                        <strong>Glosses:</strong>
                                        <span className="badge bg-secondary">
                                            {sense.Gloss[0]?.Lang}
                                        </span>
                                        <ul className="mb-0">
                                            {sense.Gloss?.map(gloss => (
                                            <li key={gloss.Value}>
                                                {word.Meaning == gloss.Value ? (
                                                    <mark>{gloss.Value} </mark>
                                                ) : (
                                                    <>
                                                    <span>{gloss.Value} </span>
                                                    <button className="icon-btn" onClick={() => update({meaning: gloss.Value})}>set</button>
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
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
