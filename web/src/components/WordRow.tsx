import { raw_word_update } from "./update";

export default function WordRow({ word, setSelectedWord, onUpdate, onDelete }) {

    async function row_mark() {
        raw_word_update(word, 'set', null, onUpdate, setSelectedWord)
    }

    async function row_delete() {
        raw_word_update(word, 'delete', null, onDelete, null, true)
    }

    async function remove_new() {
        raw_word_update(word, 'new', null, onUpdate, setSelectedWord)
    }

    const total = word.DontKnows + word.Knows

    return (
        <div className={`searchable row planner-row ${word.Status.toLowerCase()}`}>
            <button className={`col-3 col-md-3 col-sm-3 word-chip ${word.Status.toLowerCase()}`}
                    data-bs-toggle="modal"
                    data-bs-target={`#word-modal`}
                    onClick={() => {setSelectedWord(word); if ("NEW" == word.Status) remove_new();}}>
                {word.Kanji}
            </button>

            <div className="col-3 col-md-3 col-sm-3 kana">{word.Kana}</div>
            <div className="col-4 col-md-3 col-sm-4 meaning">{word.Meaning}</div>

            <div className="col-md-2 d-none d-md-block">
                <div className="mini-bar">
                    <div className="bad" style={{width: `${(word.DontKnows / total) * 100}%`}}></div>
                    <div className="good" style={{width: `${(word.Knows / total) * 100}%`}}></div>
                </div>
            </div>

            <div className="col-2 col-md-1 col-sm-2 actions">
                <button className="icon-btn icon-btn-master" type="button" title="Mark mastered" onClick={row_mark}>＋</button>
                <button className="icon-btn icon-btn-delete" type="button" title="Delete" onClick={row_delete}>×</button>
            </div>

        </div>
    );
}
