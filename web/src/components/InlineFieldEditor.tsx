import { useEffect, useState } from "react";

interface InlineFieldEditorProps {
    label: string;
    value: string;
    onSave: (value: string) => Promise<void>;
    multiline?: boolean;
    className?: string;
    emptyText?: string;
    listDisplay?: boolean;
}

export default function InlineFieldEditor({ label, value, onSave, multiline = false, className = "", emptyText = "Not set", listDisplay = false }: InlineFieldEditorProps) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const inputId = `edit-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

    useEffect(() => setDraft(value), [value]);

    async function save() {
        const next = draft.trim();
        if (!next) {
            setError(`${label} cannot be empty.`);
            return;
        }
        setSaving(true);
        setError("");
        try {
            await onSave(next);
            setEditing(false);
        } catch {
            setError(`Could not save ${label.toLowerCase()}. Please try again.`);
        } finally {
            setSaving(false);
        }
    }

    if (!editing) {
        return (
            <div className={`inline-field-display ${className}`}>
                {listDisplay && value.trim() ? (
                    <span className="inline-field-value-list">
                        {value.split(/\r?\n/).map(item => item.trim()).filter(Boolean).map((item, index) => <span className="inline-field-value-item" key={`${index}-${item}`}>{item}</span>)}
                    </span>
                ) : <span>{value || emptyText}</span>}
                <button type="button" className="btn btn-sm btn-outline-secondary btn-mini" onClick={() => { setDraft(value); setError(""); setEditing(true); }}>Edit</button>
            </div>
        );
    }

    return (
        <div className={`inline-field-editor ${className}`}>
            <label className="form-label" htmlFor={inputId}>{label}</label>
            {multiline ? (
                <textarea id={inputId} className="form-control" rows={3} value={draft} onChange={event => setDraft(event.target.value)} />
            ) : (
                <input id={inputId} className="form-control" value={draft} onChange={event => setDraft(event.target.value)} />
            )}
            <div className="inline-field-actions">
                <button type="button" className="btn btn-sm btn-dark btn-mini" onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
                <button type="button" className="btn btn-sm btn-outline-secondary btn-mini" onClick={() => { setDraft(value); setError(""); setEditing(false); }} disabled={saving}>Cancel</button>
                {error && <span className="small text-danger" role="alert">{error}</span>}
            </div>
        </div>
    );
}
