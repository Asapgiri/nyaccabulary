import { Link } from "react-router-dom";
import { raw_word_update } from "./update";
import TagEditor from "./TagEditor";
import MemeGifEditor from "./MemeGifEditor";
import InlineFieldEditor from "./InlineFieldEditor";
import type { Tag } from "../db/tags";

export default function WordModal({ word, setSelectedWord, onUpdate, onDelete, onCatalogChange = (_tags: Tag[]) => {} }) {

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
        await raw_word_update(word, 'update', t_body, onUpdate, setSelectedWord)
    }

    async function saveWordField(field: "kanji" | "kana" | "meaning", value: string) {
        await update({ [field]: value });
    }

    async function saveTags(tags: string[]) {
        await raw_word_update(word, 'update', { tags }, onUpdate, setSelectedWord, null)
    }

    async function saveMemeGif(memeGif: string) {
        await raw_word_update(word, 'update', { memeGif }, onUpdate, setSelectedWord, null)
    }

    async function word_mark() {
        raw_word_update(word, 'set', null, onUpdate, setSelectedWord)
    }

    async function word_master() {
        raw_word_update(word, 'force', null, onUpdate, setSelectedWord)
    }

    async function word_unmark() {
        raw_word_update(word, 'unset', null, onUpdate, setSelectedWord)
    }

    async function word_delete() {
        raw_word_update(word, 'delete', null, onDelete, null, true)
        setSelectedWord(null)
    }

    return (
        <div className="modal fade" tabIndex="-1" id='word-modal'>
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
                <div className="modal-content">

                    <div className="modal-header study-modal-header">

                        <div className="study-title">
                            <InlineFieldEditor className="word-modal-kanji-edit" label="Word" value={word.Kanji} onSave={value => saveWordField("kanji", value)} />
                            <InlineFieldEditor className="word-modal-kana-edit" label="Hiragana / reading" value={word.Kana} onSave={value => saveWordField("kana", value)} />
                            <div className="modal-header-meaning">{word.Meaning || "No meaning yet"}</div>
                        </div>

                        <div className="study-actions">
                            {word.Status == "MASTERED" ? (<button type="button" className="icon-btn btn-mastered" onClick={word_unmark}>Unmaster</button>)
                            :                            (<button type="button" className="icon-btn btn-master" onClick={word_master}>Master</button>)}
                            {word.Status != "MASTERED" && word.Status != "LEARNING"
                                                      && (<button type="button" className="icon-btn btn-mark" onClick={word_mark}>Mark</button>)}
                            <button type="button" className="icon-btn btn-delete" onClick={word_delete} data-bs-dismiss="modal">Delete</button>
                            <Link to={`/word/${word.Id}`} onClick={() => document.querySelector<HTMLButtonElement>("#word-modal .modal-close-action")?.click()} className="icon-btn">Open word</Link>
                        </div>

                    </div>

                    <div className="modal-body">
                        <TagEditor key={word.Id} value={word.Tags ?? []} onSave={saveTags} onCatalogChange={onCatalogChange} enableRecentTagQuickAdd />
                        <InlineFieldEditor className="word-modal-meaning-edit" label="Meaning" value={word.Meaning} onSave={value => saveWordField("meaning", value)} multiline />
                        <div className="word-modal-dictionary-fields">
                            <section>
                                <h6>Kanji</h6>
                                <ul className="modal-kanji">
                                    {word.DictForm?.KEle?.map((kele, index) => (
                                        <li key={index}>
                                            {word.Kanji == kele.KEB ? <mark>{kele.KEB}</mark> : <><span>{kele.KEB}</span><button className="icon-btn" onClick={() => update({kanji: kele.KEB})}>set</button></>}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                            <section>
                                <h6>Readings</h6>
                                <ul className="modal-readings">
                                    {word.DictForm?.REle?.map((rele, index) => (
                                        <li key={index}>
                                            {word.Kana == rele.REB ? <mark>{rele.REB}</mark> : <><span>{rele.REB}</span><button className="icon-btn" onClick={() => update({kana: rele.REB})}>set</button></>}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        </div>
                        <p>
                            <strong>Kanjis:</strong>
                            <span className="modal-kanjis">
                                {word.Kanjis?.map((kanji, index) => {
                                    return (
                                    <Link key={index} to={`/kanji/${kanji.Id}`}
                                        onClick={() => document.getElementsByClassName('btn-close')[0].click()}
                                        className="icon-btn me-2 mb-2 p-1 kanji-btn">
                                        {kanji.Kanji}
                                    </Link>
                                )})}
                            </span>
                        </p>
                        <MemeGifEditor key={`${word.Id}-meme-gif`} value={word.MemeGif} onSave={saveMemeGif} label={word.Kanji} searchQuery={`${word.Kanji} ${word.Kana}`} />
                        <hr/>
                        <h6>Senses</h6>
                        <div className="modal-senses">
                            {word.DictForm?.Sense?.map((sense, senseIndex) => (
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
                    <div className="modal-footer study-modal-footer">
                        <button type="button" className="icon-btn modal-close-action" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
