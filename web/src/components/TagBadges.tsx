import type { Tag } from "../db/tags";

export default function TagBadges({ ids = [], tags = [] }: { ids?: string[]; tags?: Tag[] }) {
    const safeIds = Array.isArray(ids) ? ids : [];
    const safeTags = Array.isArray(tags) ? tags : [];
    const selected = safeIds
        .map(id => safeTags.find(tag => tag.Id === id))
        .filter((tag): tag is Tag => Boolean(tag));

    if (selected.length === 0) return null;

    return (
        <span className="tag-badges">
            {selected.map(tag => (
                <span className="tag-badge" key={tag.Id} title={tag.Name}>
                    <span className="tag-color-dot" style={{ backgroundColor: tag.Color }} />
                    <span>{tag.Name}</span>
                </span>
            ))}
        </span>
    );
}
