import { useEffect, useState } from "react";
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

    async function addTag() {
        if (!name.trim()) return;
        setError("");
        try {
            const tag = await TagAPI.create({ Name: name.trim(), Color: color });
            const next = await TagDB.getAll();
            setTags(next);
            onCatalogChange?.(next);
            setSelected(current => [...new Set([...current, tag.Id])]);
            setName("");
        } catch {
            setError("Could not create the tag. Please try again.");
        }
    }

    async function save() {
        setSaving(true);
        setError("");
        try {
            await onSave(selected);
        } catch {
            setError("Could not save these tags. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className="tag-editor" aria-label="Word tags">
            <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div>
                    <h6 className="mb-0">Tags</h6>
                    <small className="text-muted">Choose any number of tags</small>
                </div>
                <button type="button" className="btn btn-sm btn-primary" onClick={save} disabled={saving || loading}>
                    {saving ? "Saving…" : "Save tags"}
                </button>
            </div>

            {loading ? <div className="text-muted small py-2">Loading tags…</div> : (
                <div className="tag-editor-list">
                    {tags.length === 0 && <div className="text-muted small mb-2">No tags yet. Create one below.</div>}
                    {tags.map(tag => (
                        <label className="tag-option" key={tag.Id}>
                            <input
                                className="form-check-input mt-0"
                                type="checkbox"
                                checked={selected.includes(tag.Id)}
                                onChange={event => setSelected(current => event.target.checked
                                    ? [...new Set([...current, tag.Id])]
                                    : current.filter(id => id !== tag.Id))}
                            />
                            <span className="tag-color-dot" style={{ backgroundColor: tag.Color }} />
                            <span className="text-truncate">{tag.Name}</span>
                        </label>
                    ))}
                </div>
            )}

            <div className="tag-editor-create mt-2">
                <input className="form-control form-control-sm" value={name} onChange={event => setName(event.target.value)} placeholder="New tag name" aria-label="New tag name" />
                <input className="form-control form-control-color form-control-sm" type="color" value={color} onChange={event => setColor(event.target.value)} aria-label="New tag color" />
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={addTag} disabled={!name.trim()}>Add</button>
            </div>
            {error && <div className="small text-danger mt-2" role="alert">{error}</div>}
        </section>
    );
}
