import { useEffect, useState } from "react";
import { dbPromise } from "./db/database";
import { TagDB } from "./db/tags";
import type { Tag } from "./db/tags";

import "./index.css"
import "./tags.css"

export const raw_filter = {
    status: [],
    tags: [],
    sort: {
        field: "date",
        order: -1,
    }
}

export const API_BASE = import.meta.env.VITE_API_BASE;
export function pdf(filter) {
    const url = `${API_BASE ? API_BASE : ""}/api${window.location.pathname}/pdf/${JSON.stringify(filter)}`;
    window.open(url, "_blank", "noopener,noreferrer");
}
export function cards(filter) {
    const url = `${API_BASE ? API_BASE : ""}/api${window.location.pathname}/pdf/cards/${JSON.stringify(filter)}`;
    window.open(url, "_blank", "noopener,noreferrer");
}

export function copy(words: any, full: boolean) {
    let text: string = ""
    words.forEach(w => {
        text += full ? `${w.Kanji},${w.Kana},${w.Meaning}\n` : `${w.Kanji}\n`;
    })
    navigator.clipboard.writeText(text);
}

export function FilterApply(filter, words) {
    const result = words.filter(w => {
        if (filter.search && !JSON.stringify(w).toLowerCase().includes(filter.search.toLowerCase())) {
            return false
        }

        const flen = filter.status.includes(w.Status)
        const ulen = ['MASTERED', 'LEARNING', 'NEW'].includes(w.Status)

        const jlpt = !filter.jlpt
                        || filter.jlpt == ""
                        || !w.DictForm.Misc
                        || w.DictForm.Misc.JLPT == filter.jlpt
                        || (!w.DictForm.Misc.JLPT && 5 == filter.jlpt)

        const tagMatch = !filter.tags?.length
                        || filter.tags.some(tag => (w.Tags ?? []).includes(tag))

        return jlpt && tagMatch && (0 == filter.status.length || flen || (filter.status.includes('UNKNOWN') && !ulen))
    });

    result.sort((a, b) => {
        switch (filter.sort.field) {
            case "date":
                return new Date(a.Date).getTime() - new Date(b.Date).getTime();

            case "word":
                return a.Kanji.localeCompare(b.Kanji, "ja");

            case "mastery": {
                const am = a.Knows + a.DontKnows === 0
                    ? 0
                    : a.Knows / (a.Knows + a.DontKnows);

                const bm = b.Knows + b.DontKnows === 0
                    ? 0
                    : b.Knows / (b.Knows + b.DontKnows);

                return am - bm;
            }

            case "last_updated":
                return new Date(a.LastUpdated).getTime() - new Date(b.LastUpdated).getTime();

            default:
                return 0;
        }
    });

    if (filter.sort.order === -1) {
        result.reverse();
    }

    return result;
}

export function Filter({ filter, setFilter, compact = false, extraField = null, tagAction = null }) {
    const [tags, setTags] = useState<Tag[]>([]);
    const [showWordSize, setShowWordSize] = useState(false);

    useEffect(() => {
        init_db();
        TagDB.getAll().then(loaded => setTags(Array.isArray(loaded) ? loaded : []));
        const onTagsChanged = (event: Event) => {
            setTags((event as CustomEvent<Tag[]>).detail);
        };
        window.addEventListener("nyaccabulary:tags", onTagsChanged);
        return () => window.removeEventListener("nyaccabulary:tags", onTagsChanged);
    }, []);

    async function init_db() {
        const db = await dbPromise;

        const tx = db.transaction(["metadata"], "readonly");
        const metaStore = tx.objectStore("metadata");

        const freq = await metaStore.get("filter")
        if (freq) {
            setFilter(freq)
        }
    }

    async function update_db(f) {
        const db = await dbPromise;

        const tx = db.transaction(["metadata"], "readwrite");
        const metaStore = tx.objectStore("metadata");
        metaStore.put({status: f.status, tags: f.tags ?? [], sort: f.sort, jlpt: f.jlpt, wordSize: f.wordSize}, "filter")
    }

    function update(f) {
        update_db(f)
        return f
    }

    function updateStatus(status: string, checked: boolean) {
        setFilter(f => update({
            ...f,
            status: checked && !f.status.includes(status)
                ? [...f.status, status]
                : f.status.includes(status)
                    ? f.status.filter(s => s !== status)
                    : f.status
        }))
    }

    function updateSort(new_val: string) {
        setFilter(f => update({
            ...f,
            sort: {
                ...f.sort,
                field: new_val,
            },
        }))
    }

    function updateJLPT(new_val: string) {
        setFilter(f => update({
            ...f,
            jlpt: new_val,
        }))
    }

    function updateTags(tagId: string, checked: boolean) {
        setFilter(f => update({
            ...f,
            tags: checked
                ? [...new Set([...(f.tags ?? []), tagId])]
                : (f.tags ?? []).filter(id => id !== tagId),
        }))
    }

    function updateWordSize(new_val: number) {
        setFilter(f => update({
            ...f,
            wordSize: new_val,
        }))
    }

    function updateSortOrder(new_order: 1 | -1) {
        setFilter(f => update({...f, sort: {...f.sort, order: new_order}}))
    }

    function search(value) {
        setFilter(f => ({...f, search: value}))
    }

    function filterReset() {
        setFilter(update(raw_filter))
    }

    return (
        <>
            <div id="filterBar" className="d-flex flex-wrap align-items-center gap-2 p-2 border">

                <div className="btn-group" role="group" aria-label="Status Filters">

                    <input type="checkbox" className="btn-check" id="status-mastered" checked={filter.status.includes("MASTERED")} onChange={(e) => updateStatus("MASTERED", e.target.checked)} />
                    <label className="btn btn-outline-success btn-mini" htmlFor="status-mastered">
                        Mastered
                    </label>

                    <input type="checkbox" className="btn-check" id="status-learning" checked={filter.status.includes("LEARNING")} onChange={(e) => updateStatus("LEARNING", e.target.checked)} />
                    <label className="btn btn-outline-warning btn-mini" htmlFor="status-learning">
                        Learning
                    </label>

                    <input type="checkbox" className="btn-check" id="status-unknown" checked={filter.status.includes("UNKNOWN") || filter.status.includes("")} onChange={(e) => {updateStatus("UNKNOWN", e.target.checked); updateStatus("", e.target.checked);}} />
                    <label className="btn btn-outline-secondary btn-mini" htmlFor="status-unknown">
                        Unknown
                    </label>

                    <input type="checkbox" className="btn-check" id="status-new" checked={filter.status.includes("NEW")} onChange={(e) => updateStatus("NEW", e.target.checked)} />
                    <label className="btn btn-outline-info btn-mini" htmlFor="status-new">
                        New
                    </label>

                </div>

                <select id="sortField" className="form-select form-select-sm" style={{width: "auto"}} value={filter.sort.field}
                        onChange={(e) => updateSort(e.target.value) }>
                    <option value="date">Date Added</option>
                    <option value="word">Word</option>
                    <option value="mastery">Mastery</option>
                    <option value="last_updated">Last Updated</option>
                </select>

                <div className="btn-group">
                    <button id="sortAsc" className={`btn ${1 === filter.sort.order ? "btn-secondary" : "btn-outline-secondary"} btn-mini`} onClick={() => updateSortOrder(1)}>
                        ↑
                    </button>

                    <button id="sortDesc" className={`btn ${-1 === filter.sort.order ? "btn-secondary" : "btn-outline-secondary"} btn-mini`} onClick={() => updateSortOrder(-1)}>
                        ↓
                    </button>
                </div>

                <select id="jlptField" className="form-select form-select-sm" style={{width: "auto"}} value={filter.jlpt ? filter.jlpt : ""}
                        onChange={(e) => updateJLPT(e.target.value) }>
                    <option value="">N?</option>
                    <option value="5">N5</option>
                    <option value="4">N4</option>
                    <option value="3">N3</option>
                    <option value="2">N2</option>
                    <option value="1">N1</option>
                </select>

                <button id="resetFilter" className="btn btn-outline-secondary btn-mini" onClick={filterReset}>
                    Reset
                </button>

                {extraField}

            </div>

            {tags.length > 0 && (
                <div className="tag-filter" aria-label="Filter by tags">
                    <span className="tag-filter-label">Tags</span>
                    {tags.map(tag => (
                        <label className={`tag-filter-option ${(filter.tags ?? []).includes(tag.Id) ? "selected" : ""}`} key={tag.Id}>
                            <input type="checkbox" checked={(filter.tags ?? []).includes(tag.Id)} onChange={event => updateTags(tag.Id, event.target.checked)} />
                            <span className="tag-color-dot" style={{ backgroundColor: tag.Color }} />
                            <span>{tag.Name}</span>
                        </label>
                    ))}
                    {tagAction}
                    {(filter.tags ?? []).length > 0 && (
                        <button className="btn btn-sm btn-link tag-filter-clear" onClick={() => setFilter(f => update({ ...f, tags: [] }))}>Clear</button>
                    )}
                </div>
            )}

            {!compact && (
                <>
                    <input id="wordSearch" className="form-control form-control-sm" placeholder="Search..." value={filter.search ? filter.search : ""} onInput={e => search(e.target.value)}/>

                    <div className="word-size-control">
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-mini word-size-toggle"
                            aria-expanded={showWordSize}
                            aria-controls="wordSizePanel"
                            onClick={() => setShowWordSize(visible => !visible)}
                        >
                            Text size <span>{filter.wordSize ?? 16}px</span><span aria-hidden="true">{showWordSize ? "−" : "+"}</span>
                        </button>
                        {showWordSize && (
                            <div className="word-size-panel" id="wordSizePanel">
                                <input className="form-range" id="wordSize" aria-label="Word text size" type="range" min="12" max="56" step="1" value={filter.wordSize ?? 16} onChange={e => updateWordSize(Number(e.target.value))} />
                            </div>
                        )}
                    </div>
                </>
            )}
        </>
    )
}
