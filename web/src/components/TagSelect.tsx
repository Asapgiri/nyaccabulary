import { useEffect, useRef, useState } from "react";
import { TagAPI, TagDB } from "../db/tags";
import type { Tag } from "../db/tags";

interface TagSelectProps {
    value?: string;
    onChange: (tagId: string | undefined) => void;
    onTagsChange?: (tags: Tag[]) => void;
}

export default function TagSelect({ value, onChange, onTagsChange = () => {} }: TagSelectProps) {
    const [tags, setTags] = useState<Tag[]>([]);
    const [open, setOpen] = useState(false);
    const [adding, setAdding] = useState(false);
    const [name, setName] = useState("");
    const [color, setColor] = useState("#6c757d");

    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let active = true;
        const refresh = async (event?: Event) => {
            const loaded = event ? (event as CustomEvent<Tag[]>).detail : await TagDB.getAll();
            if (!active) return;
            const safeTags = Array.isArray(loaded) ? loaded : [];
            setTags(safeTags);
            onTagsChange(safeTags);
        };
        const onTagsChanged = (event: Event) => { void refresh(event); };
        window.addEventListener("nyaccabulary:tags", onTagsChanged);
        void refresh();
        return () => { active = false; window.removeEventListener("nyaccabulary:tags", onTagsChanged); };
    }, []);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const selectedTag = tags.find(tag => tag.Id === value);

    async function createTag() {
        if (!name.trim()) return;

        const tag = await TagAPI.create({
            Name: name.trim(),
            Color: color,
        });

        const next = await TagDB.getAll();
        setTags(next);
        onTagsChange(next);

        onChange(tag.Id);

        setName("");
        setColor("#6c757d");
        setAdding(false);
    }

    return (
        <div className="dropdown tag-select" ref={ref}>
            <button
                type="button"
                className="btn btn-outline-secondary dropdown-toggle w-100 text-start tag-select-trigger"
                onClick={() => setOpen(!open)}
            >
                {selectedTag ? (
                    <span className="d-inline-flex align-items-center gap-2">
                        <span
                            style={{
                                width: "14px",
                                height: "14px",
                                backgroundColor: selectedTag.Color,
                                display: "inline-block",
                                borderRadius: "2px",
                            }}
                        />
                        {selectedTag.Name}
                    </span>
                ) : (
                    <span className="text-muted">Select tag</span>
                )}
            </button>

            {open && (
                <div
                    className="dropdown-menu show w-100 p-1 tag-select-menu"
                    style={{ maxHeight: "300px", overflowY: "auto" }}
                >
                    <button
                        type="button"
                        className="dropdown-item d-flex align-items-center gap-2"
                        onClick={() => {
                            onChange(undefined);
                            setOpen(false);
                        }}
                    >
                        <span className="text-muted">No tag</span>
                    </button>

                    {tags.map(tag => (
                        <button
                            type="button"
                            key={tag.Id}
                            className="dropdown-item d-flex align-items-center gap-2"
                            onClick={() => {
                                onChange(tag.Id);
                                setOpen(false);
                            }}
                        >
                            <span
                                style={{
                                    width: "14px",
                                    height: "14px",
                                    backgroundColor: tag.Color,
                                    display: "inline-block",
                                    borderRadius: "2px",
                                    flexShrink: 0,
                                }}
                            />
                            {tag.Name}
                        </button>
                    ))}

                    <div className="dropdown-divider" />

                    {!adding ? (
                        <button
                            type="button"
                            className="dropdown-item text-primary"
                            onClick={() => setAdding(true)}
                        >
                            + Add tag
                        </button>
                    ) : (
                        <div className="p-2">
                            <input
                                type="text"
                                className="form-control form-control-sm mb-2"
                                placeholder="Tag name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                autoFocus
                            />

                            <div className="d-flex gap-2 mb-2">
                                <input
                                    type="color"
                                    className="form-control form-control-sm p-1"
                                    style={{ width: "42px" }}
                                    value={color}
                                    onChange={e => setColor(e.target.value)}
                                />

                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={color}
                                    onChange={e => setColor(e.target.value)}
                                />
                            </div>

                            <div className="d-flex gap-2">
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm flex-grow-1"
                                    onClick={createTag}
                                    disabled={!name.trim()}
                                >
                                    Add
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => {
                                        setAdding(false);
                                        setName("");
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
