import { raw_word_update, raw_kanji_update } from "./update";

export default function WordChip({ word, setSelectedWord, onUpdate, onDelete, wordIsKanji, filter }) {
    async function remove_new() {
        if (wordIsKanji) {
            raw_kanji_update(word, 'new', null, onUpdate, setSelectedWord)
        }
        else {
            raw_word_update(word, 'new', null, onUpdate, setSelectedWord)
        }
    }

    return (
        <span className="searchable chip">
            <button className={`word-chip ${word.Status.toLowerCase()}`}
                    data-bs-toggle="modal"
                    data-bs-target={`#word-modal`}
                    style={{ fontSize: `${filter.wordSize}px` }}
                    onClick={() => {setSelectedWord(word); if ("NEW" == word.Status) remove_new();}}>
                <div>{word.Kanji}</div>
                {word.DictForm.Misc?.JLPT > 0 ? (
                    <div className={`jlpt-badge jlpt-n${word.DictForm.Misc?.JLPT}`}></div>
                ) : wordIsKanji && (
                    <div className={`jlpt-badge jlpt-n5`}></div>
                )}
            </button>
        </span>
    );
}
