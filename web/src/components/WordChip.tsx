import { raw_word_update, raw_kanji_update } from "./update";
import type { Tag } from "../db/tags";

export default function WordChip({ word, setSelectedWord, onUpdate, onDelete = () => {}, wordIsKanji = false, filter, tags = [] as Tag[], selectable = false, selected = false, onToggleSelection = () => {} }) {
    const tagBorderColor = !wordIsKanji
        ? (word.Tags ?? []).map(id => tags.find(tag => tag.Id === id)?.Color).find(Boolean)
        : undefined;
    async function remove_new() {
        if (wordIsKanji) {
            raw_kanji_update(word, 'new', null, onUpdate, setSelectedWord)
        }
        else {
            raw_word_update(word, 'new', null, onUpdate, setSelectedWord)
        }
    }

    return (
        <span className={`searchable chip ${wordIsKanji ? "kanji-chip-container" : ""} ${selected ? "is-selected" : ""}`}>
            <button className={`word-chip ${word.Status.toLowerCase()} ${wordIsKanji ? "kanji-chip" : ""}`}
                    data-bs-toggle={selectable ? undefined : "modal"}
                    data-bs-target={selectable ? undefined : "#word-modal"}
                    aria-pressed={selectable ? selected : undefined}
                    title={selectable ? `${selected ? "Deselect" : "Select"} ${word.Kanji}` : undefined}
                    style={{ fontSize: `${filter.wordSize}px`, ...(tagBorderColor ? { borderColor: tagBorderColor } : {}) }}
                    onClick={() => {
                        if (selectable) { onToggleSelection(word.Id); return; }
                        setSelectedWord(word); if ("NEW" == word.Status) remove_new();
                    }}>
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
