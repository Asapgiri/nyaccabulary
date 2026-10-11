import { useState } from "react";
import { apiFetch } from "./api";
import TagSelect from "./components/TagSelect";
import { sync } from "./db/sync";

export default function WordBulkAdd() {
    const [bulkwords, setBulkwords] = useState<string>("");
    const [progress, setProgress] = useState<{percent: number; max: number} | null>(null);
    const [notices, setNotices] = useState<{Added: string[], Exists: string[], Failed: string[]} | null>(null);
    const [tagId, setTagId] = useState<string | undefined>();

    async function add() {
        const response = await apiFetch("/api/word/bulk", {
            method: "POST",
            body: JSON.stringify({
                tag: tagId,
                words: bulkwords,
            }),
        });

        setBulkwords("")

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();

        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();

            buffer += decoder.decode(value, { stream: true });

            if (done) break;

            const lines = buffer.split("\n");
            buffer = lines.pop()!;

            for (const line of lines) {
                if (!line.trim()) continue;

                const msg = JSON.parse(line);

                setProgress({
                    percent: msg.index,
                    max: msg.count,
                });
            }
        }

        setNotices(JSON.parse(buffer))
        setProgress(null)
        await sync()
    }

    return (
        <div className="container py-4 bulk-add-page">

            {notices && (
                <div>
                {notices.Added && (
                    <div className="alert alert-success alert-dismissible fade show m-2" role="alert">
                        Added: '{notices.Added.join(", ")}'
                        <button onClick={() => setNotices(n => ({...n, Added: null }))} type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                )}
                {notices.Exists && (
                    <div className="alert alert-info alert-dismissible fade show m-2" role="alert">
                        Already exists: '{notices.Exists.join(", ")}'
                        <button onClick={() => setNotices(n => ({...n, Exists: null }))} type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                )}
                {notices.Failed && (
                    <div className="alert alert-warning alert-dismissible fade show m-2" role="alert">
                        Failed to add: '{notices.Failed.join(", ")}'
                        <button onClick={() => setNotices(n => ({...n, Failed: null }))} type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                )}
                </div>
            )}

            <div className="row justify-content-center">

                <div className="card shadow-sm border-0 bulk-add-card">
                    <div className="card-body">

                        <p className="management-eyebrow">VOCABULARY TOOLS</p>
                        <h1 className="h3 mb-3">Bulk add words</h1>
                        <section className="bulk-format-guide mb-4" aria-labelledby="bulk-format-title">
                            <div className="bulk-format-heading">
                                <span className="bulk-format-icon" aria-hidden="true">↓</span>
                                <div>
                                    <h2 id="bulk-format-title">Paste your vocabulary</h2>
                                    <p>Enter one word per line, or paste text from a Shirabe Jisho CSV export.</p>
                                </div>
                            </div>

                            <div className="bulk-format-fields" aria-label="Line format fields">
                                <span className="bulk-field bulk-field-word">Word / kanji</span>
                                <span className="bulk-format-separator">,</span>
                                <span className="bulk-field bulk-field-reading">Reading <small>optional</small></span>
                                <span className="bulk-format-separator">,</span>
                                <span className="bulk-field bulk-field-meaning">Meaning <small>optional</small></span>
                                <span className="bulk-format-separator">+</span>
                                <span className="bulk-field bulk-field-known">Known <small>optional</small></span>
                            </div>

                            <p className="bulk-format-note">Commas can be Japanese commas (、) too. Add <code>+</code> at the end to mark a word as known; leave it off for a new word.</p>
                            <div className="bulk-format-examples">
                                <div><code>猫,ねこ,cat</code><span>word + reading + meaning</span></div>
                                <div><code>猫,cat＋</code><span>word + meaning, marked known</span></div>
                                <div><code>学校</code><span>word only; details can be looked up</span></div>
                            </div>
                        </section>

                        {progress && (
                        <div className="progress">
                            <div className="progress-bar" style={{ width: `${100 * progress.percent / progress.max}%`, }} >
                                {progress.percent}/{progress.max}
                            </div>
                        </div>
                        )}

                        <div className="mb-4">
                            <div className="mb-4">
                                <label className="form-label fw-semibold">
                                    Tag
                                </label>

                                <TagSelect
                                    value={tagId}
                                    onChange={setTagId}
                                />
                            </div>

                            <label htmlFor="words" className="form-label fw-semibold">
                                Words
                            </label>

                            <textarea
                                value={bulkwords}
                                onChange={(e) => setBulkwords(e.target.value)}
                                id="words"
                                name="form[words]"
                                className="form-control"
                                rows="15"
                                placeholder="本[,ほん][,book][＋]&#10;猫&#10;学校&#10;..."
                                required
                                ></textarea>

                            <div className="form-text">
                                One word per line.
                            </div>
                        </div>

                        <div className="d-grid">
                            <button onClick={add} type="submit" className="btn btn-dark btn-lg">
                                Submit Words
                            </button>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    )
}
