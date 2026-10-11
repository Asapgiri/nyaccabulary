import { useEffect, useMemo, useState } from "react";
import WordChip from "./components/WordChip"
import KanjiModal from "./components/KanjiModal";
import "./index.css"
import "./kanji.css"
import { KanjiDB } from "./db/kanjis";
import { copy, Filter, FilterApply, pdf, cards, raw_filter } from "./Filter";
import { syncFinished } from "./db/sync";
import { TagDB } from "./db/tags";
import type { Tag } from "./db/tags";
import { raw_kanji_update } from "./components/update";

export default function Kanji() {
    const [kanjis, setKanjis] = useState<Kanji[]>([]);
    const [selectedKanji, setSelectedKanji] = useState<Kanji | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [tags, setTags] = useState<Tag[]>([]);
    const [filter, setFilter] = useState<TFilter>(raw_filter);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
    const [bulkTagIds, setBulkTagIds] = useState<string[]>([]);
    const [tagSelectionMode, setTagSelectionMode] = useState(false);
    const [bulkBusy, setBulkBusy] = useState(false);
    const [bulkError, setBulkError] = useState("");

    useEffect(() => {
        loadKanjis().then(async() => await syncFinished).then(() => loadKanjis());
    }, []);

    async function loadKanjis() {
        const [stats, kanjis, tags] = await Promise.all([KanjiDB.getStats(), KanjiDB.getAll(), TagDB.getAll()]);
        setStats(stats);
        setKanjis(kanjis);
        setTags(tags);
    }

    async function update(updated) {
        setKanjis(kanjis => kanjis.map(w => w.Id === updated.Id ? updated : w))
    }

    async function ddelete(data, id) {
        setKanjis(kanjis => kanjis.filter(w => w.Id !== id))
        setSelectedIds(ids => { const next = new Set(ids); next.delete(id); return next; });
    }

    const filtered = useMemo(() => FilterApply(filter, kanjis), [kanjis, filter]);

    function toggleSelection(id: string) {
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
        for (const kanji of kanjis.filter(item => selectedIds.has(item.Id))) {
            const current = kanji.Tags ?? [];
            if (current.length === bulkTagIds.length && current.every(tag => bulkTagIds.includes(tag))) continue;
            try {
                await raw_kanji_update(kanji, "update", { tags: bulkTagIds }, update, null);
            } catch {
                failed++;
            }
        }
        setBulkBusy(false);
        if (failed) setBulkError(`Could not update tags on ${failed} kanji${failed === 1 ? "" : "s"}.`);
        else {
            setSelectedIds(new Set());
            setBulkTagIds([]);
            setTagSelectionMode(false);
        }
    }


    return (
        <div className="container-fluid py-4 px-3 px-md-4">

            <div className="topbar">
                <div className="page-title">Kanjis</div>
                {stats && (
                <div id="study-progress" className="study-progress">
                    <span className="mastered">{stats.Mastered}</span> / <span className="learning">{stats.Learning}</span> / <span>{stats.Count}</span>
                </div>
                )}
                <div className="study-controls">
                    <div className="study-actions">
                        <button type="button" className="btn btn-outline-primary btn-mini" id="copy-btn" onClick={() => copy(filtered)}>Copy</button>
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

            {tagSelectionMode && <section className="bulk-tag-panel" aria-label="Set tags on selected kanji">
                <div className="bulk-tag-heading">
                    <strong>{selectedIds.size} selected</strong>
                    <div className="bulk-tag-selection-actions">
                        <button type="button" className="btn btn-sm btn-outline-secondary btn-mini" onClick={() => setSelectedIds(ids => new Set([...ids, ...filtered.map(item => item.Id)]))}>Select visible ({filtered.length})</button>
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
            {filtered.map(kanji => (
                <WordChip key={kanji.Id} word={kanji} filter={filter} wordIsKanji={true}
                    tags={tags}
                    selectable={tagSelectionMode}
                    selected={selectedIds.has(kanji.Id)}
                    onToggleSelection={toggleSelection}
                    setSelectedWord={setSelectedKanji}
                    onUpdate={update} />
            ))}
            </div>

            <KanjiModal kanji={selectedKanji}  setSelectedKanji={setSelectedKanji} onUpdate={update} onDelete={ddelete} onCatalogChange={setTags} />

        </div>
    )
}
