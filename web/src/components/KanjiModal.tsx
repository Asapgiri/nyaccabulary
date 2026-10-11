import { Link } from "react-router-dom";
import { raw_kanji_update } from "./update";
import TagEditor from "./TagEditor";
import MemeGifEditor from "./MemeGifEditor";
import InlineFieldEditor from "./InlineFieldEditor";
import type { Tag } from "../db/tags";

export default function KanjiModal({ kanji, setSelectedKanji, onUpdate, onDelete, onCatalogChange = (_tags: Tag[]) => {} }) {

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

    async function saveTags(tags: string[]) {
        await raw_kanji_update(kanji, 'update', { tags }, onUpdate, setSelectedKanji, null)
    }

    async function saveMemeGif(memeGif: string) {
        await raw_kanji_update(kanji, 'update', { memeGif }, onUpdate, setSelectedKanji, null)
    }

    async function saveKanjiField(field: "kanji", value: string) {
        await raw_kanji_update(kanji, "update", { [field]: value }, onUpdate, setSelectedKanji, null);
    }

    async function saveKanjiListField(field: "on" | "kun" | "meaning", value: string) {
        const values = value.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
        await raw_kanji_update(kanji, "update", { [field]: values }, onUpdate, setSelectedKanji, null);
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
                            <Link to={`/kanji/${kanji.Id}`} onClick={() => document.getElementsByClassName('btn-close')[0].click()} className="icon-btn">Open kanji</Link>
                            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                        </div>

                    </div>

                    <div className="modal-body">
                        <TagEditor key={kanji.Id} value={kanji.Tags ?? []} onSave={saveTags} onCatalogChange={onCatalogChange} />
                        <InlineFieldEditor className="kanji-modal-meaning-edit" label="Meaning" value={(kanji.Meaning ?? []).join("\n")} onSave={value => saveKanjiListField("meaning", value)} multiline listDisplay />
                        <div className="kanji-modal-core">
                            <InlineFieldEditor className="kanji-modal-kanji-edit" label="Kanji" value={kanji.Kanji} onSave={value => saveKanjiField("kanji", value)} />
                            <div className="kanji-modal-reading-editors">
                                <InlineFieldEditor label="On readings" value={(kanji.On ?? []).join("\n")} onSave={value => saveKanjiListField("on", value)} multiline emptyText="Not set" listDisplay />
                                <InlineFieldEditor label="Kun readings" value={(kanji.Kun ?? []).join("\n")} onSave={value => saveKanjiListField("kun", value)} multiline emptyText="Not set" listDisplay />
                            </div>
                        </div>
                        <p>
                        <strong>Words:</strong>
                        <span className="modal-words">
                        {kanji.Words.map((word, index) => (
                            <Link key={index} to={`/word/${word.Id}`}
                                onClick={() => document.getElementsByClassName('btn-close')[0].click()}
                                className="icon-btn me-2 mb-2 p-1 kanji-btn">
                                {word.Word}
                            </Link>
                        ))}
                        </span>
                        </p>
                        <MemeGifEditor key={`${kanji.Id}-meme-gif`} value={kanji.MemeGif} onSave={saveMemeGif} label={kanji.Kanji} searchQuery={kanji.Kanji} />
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
