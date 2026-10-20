import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import WordChip from "./components/WordChip"
import WordModal from "./components/WordModal";
import "./index.css"
import { WordDB } from "./db/words";
import { copy, Filter, FilterApply, pdf, cards, raw_filter } from "./Filter";
import { syncFinished } from "./db/sync";
import { TagDB } from "./db/tags";
import type { Tag } from "./db/tags";
import { raw_word_update } from "./components/update";

export default function Word() {
    const [words, setWords] = useState<Word[]>([]);
    const [selectedWord, setSelectedWord] = useState<Word | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [tags, setTags] = useState<Tag[]>([]);
    const [filter, setFilter] = useState<TFilter>(raw_filter);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
    const [bulkTagIds, setBulkTagIds] = useState<string[]>([]);
    const [bulkBusy, setBulkBusy] = useState(false);
    const [bulkError, setBulkError] = useState("");
    const [tagSelectionMode, setTagSelectionMode] = useState(false);

    useEffect(() => {
        console.log('sync')
        loadWords().then(async() => await syncFinished).then(() => loadWords());
    }, []);

    async function loadWords() {
        const [stats, words, tags] = await Promise.all([WordDB.getStats(), WordDB.getAll(), TagDB.getAll()]);
        setStats(stats);
        setWords(words);
        setTags(tags);
    }

    async function update(updated) {
        setWords(words => words.map(w => w.Id === updated.Id ? updated : w))
    }

    async function ddelete(data, id) {
        setWords(words => words.filter(w => w.Id !== id))
        setSelectedIds(ids => { const next = new Set(ids); next.delete(id); return next; });
    }

    const filteredWords = useMemo(() => FilterApply(filter, words), [words, filter]);

    function toggleWordSelection(id: string) {
        setSelectedIds(ids => {
            const next = new Set(ids);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }

    function toggleBulkTag(id: string) {
        setBulkTagIds(ids => ids.includes(id) ? ids.filter(tag => tag !== id) : [...ids, id]);
    }

    async function saveTagSelection() {
        if (!selectedIds.size) return;
        setBulkBusy(true);
        setBulkError("");
        let failed = 0;
        for (const word of words.filter(item => selectedIds.has(item.Id))) {
            const current = word.Tags ?? [];
            const next = bulkTagIds;
            if (current.length === next.length && current.every(tag => next.includes(tag))) continue;
            try {
                await raw_word_update(word, "update", { tags: next }, update, null);
            } catch {
                failed++;
            }
        }
        setBulkBusy(false);
        if (failed) setBulkError(`Could not update tags on ${failed} word${failed === 1 ? "" : "s"}.`);
        else {
            setSelectedIds(new Set());
            setBulkTagIds([]);
            setTagSelectionMode(false);
        }
    }

    return (
        <div className="container-fluid py-4 px-3 px-md-4">

            <div className="topbar">
                <div className="page-title">Words</div>
                {stats && (
                <div id="study-progress" className="study-progress">
                    <span className="mastered">{stats.Mastered}</span> / <span className="learning">{stats.Learning}</span> / <span>{stats.Count}</span>
                </div>
                )}
                <div className="study-controls">
                    <div className="study-actions">
                        <button type="button" className="btn btn-outline-primary btn-mini" id="copy-btn" onClick={() => copy(filteredWords, true)}>Copy</button>
                        <Link to="/word/random" className="btn btn-warning btn-mini random-word-link">Random draw</Link>
                        <Link to="/word/bulkadd" className="btn btn-outline-secondary btn-mini">Bulk</Link>
                        <button className="btn btn-outline-success btn-mini" onClick={() => pdf(filter)}>PDF</button>
                        <button className="btn btn-outline-success btn-mini" onClick={() => cards(filter)}>Cards</button>
                    </div>
                </div>
            </div>

            <Filter filter={filter} setFilter={setFilter} tagAction={
                <button type="button" className={`btn btn-sm btn-mini ${tagSelectionMode ? "btn-dark" : "btn-outline-secondary"}`} onClick={() => {
                    setTagSelectionMode(mode => !mode);
                    setSelectedIds(new Set());
                    setBulkTagIds([]);
                    setBulkError("");
                }}>{tagSelectionMode ? "Cancel tag selection" : "Set tags"}</button>
            } />

            {tagSelectionMode && <section className="bulk-tag-panel" aria-label="Set tags on selected words">
                <div className="bulk-tag-heading">
                    <strong>{selectedIds.size} selected</strong>
                    <div className="bulk-tag-selection-actions">
                        <button type="button" className="btn btn-sm btn-outline-secondary btn-mini" onClick={() => setSelectedIds(ids => new Set([...ids, ...filteredWords.map(word => word.Id)]))}>Select visible ({filteredWords.length})</button>
                        <button type="button" className="btn btn-sm btn-outline-secondary btn-mini" onClick={() => setSelectedIds(new Set())} disabled={!selectedIds.size}>Clear selection</button>
                    </div>
                </div>
                <div className="bulk-tag-options" aria-label="Tags to set">
                    {tags.length === 0 && <span className="small text-muted">No tags are available yet.</span>}
                    {tags.map(tag => <label key={tag.Id} className={`bulk-tag-option ${bulkTagIds.includes(tag.Id) ? "selected" : ""}`}>
                        <input type="checkbox" checked={bulkTagIds.includes(tag.Id)} onChange={() => toggleBulkTag(tag.Id)} />
                        <span className="tag-color-dot" style={{ backgroundColor: tag.Color }} />{tag.Name}
                    </label>)}
                </div>
                <div className="bulk-tag-actions">
                    <button type="button" className="btn btn-sm btn-dark btn-mini" onClick={() => void saveTagSelection()} disabled={bulkBusy || !selectedIds.size}>{bulkBusy ? "Saving…" : "Save tags"}</button>
                    {bulkError && <span className="small text-danger" role="alert">{bulkError}</span>}
                </div>
            </section>}

            <div className="word-grid" id="word-grid">
            {filteredWords.map(word => (
                <WordChip key={word.Id} word={word} filter={filter}
                    tags={tags}
                    selectable={tagSelectionMode}
                    selected={selectedIds.has(word.Id)}
                    onToggleSelection={toggleWordSelection}
                    setSelectedWord={setSelectedWord}
                    onUpdate={update} />
                ))}
            </div>

            <WordModal word={selectedWord} setSelectedWord={setSelectedWord} onUpdate={update} onDelete={ddelete} onCatalogChange={setTags}/>

        </div>
    )
}
