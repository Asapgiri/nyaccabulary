import { useEffect, useRef, useState } from "react";
import { TagAPI, TagDB } from "../db/tags";
import type { Tag } from "../db/tags";
import "../tags.css";

interface TagEditorProps {
    value?: string[];
    onSave: (tagIds: string[]) => Promise<void> | void;
    onCatalogChange?: (tags: Tag[]) => void;
}

export default function TagEditor({ value, onSave, onCatalogChange }: TagEditorProps) {
    const initialValue = Array.isArray(value) ? value : [];
    const [tags, setTags] = useState<Tag[]>([]);
    const [selected, setSelected] = useState<string[]>(initialValue);
    const [name, setName] = useState("");
    const [color, setColor] = useState("#7057d9");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const saveQueue = useRef<Promise<void>>(Promise.resolve());
    const saveVersion = useRef(0);

    const valueKey = initialValue.join("|");
    useEffect(() => setSelected(initialValue), [valueKey]);

    useEffect(() => {
        let active = true;
        const refresh = async (event?: Event) => {
            const loaded = event ? (event as CustomEvent<Tag[]>).detail : await TagDB.getAll();
            if (!active) return;
            const safeTags = Array.isArray(loaded) ? loaded : [];
            setTags(safeTags);
            onCatalogChange?.(safeTags);
            setLoading(false);
        };
        const onTagsChanged = (event: Event) => { void refresh(event); };
        window.addEventListener("nyaccabulary:tags", onTagsChanged);
        void refresh();
        return () => { active = false; window.removeEventListener("nyaccabulary:tags", onTagsChanged); };
    }, []);

    function selectTags(next: string[]) {
        setSelected(next);
        setError("");
        const version = ++saveVersion.current;
        setSaving(true);
        saveQueue.current = saveQueue.current
            .catch(() => undefined)
            .then(() => onSave(next))
            .then(() => undefined)
            .catch(() => {
                if (version === saveVersion.current) setError("Could not save these tags. Please try again.");
            })
            .finally(() => {
                if (version === saveVersion.current) setSaving(false);
            });
    }

    async function addTag() {
        if (!name.trim()) return;
        setError("");
        try {
            const tag = await TagAPI.create({ Name: name.trim(), Color: color });
            const next = await TagDB.getAll();
            setTags(next);
            onCatalogChange?.(next);
            selectTags([...new Set([...selected, tag.Id])]);
            setName("");
        } catch {
            setError("Could not create the tag. Please try again.");
        }
    }

    return (
        <section className="tag-editor tag-editor-compact" aria-label="Word tags">
            <strong className="tag-editor-label">Tags</strong>
            <div className="tag-editor-selected">
                {selected.map(id => {
                    const tag = tags.find(item => item.Id === id);
                    return tag ? (
                        <button className="tag-editor-chip" key={tag.Id} type="button" onClick={() => selectTags(selected.filter(item => item !== tag.Id))} aria-label={`Remove ${tag.Name} tag`}>
                            <span className="tag-color-dot" style={{ backgroundColor: tag.Color }} />{tag.Name}<span aria-hidden="true">×</span>
                        </button>
                    ) : null;
                })}
                {selected.length === 0 && <span className="tag-editor-empty">No tags</span>}
            </div>
            <details className="tag-editor-dropdown">
                <summary aria-label="Add or manage tags" aria-disabled={loading}>{loading ? "…" : "+ Tag"}</summary>
                {!loading && <div className="tag-editor-menu">
                    <div className="tag-editor-list">
                        {tags.filter(tag => !selected.includes(tag.Id)).map(tag => (
                            <button className="tag-option" key={tag.Id} type="button" onClick={() => selectTags([...selected, tag.Id])}>
                                <span className="tag-color-dot" style={{ backgroundColor: tag.Color }} />
                                <span className="text-truncate">{tag.Name}</span>
                            </button>
                        ))}
                        {tags.length === 0 && <div className="text-muted small">No tags yet. Create one below.</div>}
                    </div>
                    <div className="tag-editor-create">
                        <input className="form-control form-control-sm" value={name} onChange={event => setName(event.target.value)} placeholder="New tag name" aria-label="New tag name" />
                        <input className="form-control form-control-color form-control-sm" type="color" value={color} onChange={event => setColor(event.target.value)} aria-label="New tag color" />
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={addTag} disabled={!name.trim()}>Add</button>
                    </div>
                </div>}
            </details>
            {saving && <small role="status" className="tag-editor-status">Saving…</small>}
            {error && <div className="small text-danger mt-2" role="alert">{error}</div>}
        </section>
    );
}
