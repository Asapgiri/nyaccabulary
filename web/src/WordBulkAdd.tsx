import { useState } from "react";
import { apiFetch } from "./api";

export default function WordBulkAdd() {
    const [bulkwords, setBulkwords] = useState<string>("");
    const [progress, setProgress] = useState<{percent: number; max: number} | null>(null);
    const [notices, setNotices] = useState<{Added: string[], Exists: string[], Failed: string[]} | null>(null);

    async function add() {
        const response = await apiFetch("/api/word/bulk", {
            method: "POST",
            body: bulkwords,
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
    }

    return (
        <div className="container">

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

                <div className="card shadow-sm border-0">
                    <div className="card-body">

                        <h1 className="h3 mb-3">Add Words</h1>
                        <p className="text-muted mb-4">
                        Enter one or more words. You can paste multiple words, one per line.<br/>
                        kanjis[(,|、)furigana][(,|、)meaning][(+|＋)]<br/>
                        kanjis[,meaning][＋]<br/>
                        </p>

                        {progress && (
                        <div className="progress">
                            <div className="progress-bar" style={{ width: `${100 * progress.percent / progress.max}%`, }} >
                                {progress.percent}/{progress.max}
                            </div>
                        </div>
                        )}

                        <div className="mb-4">
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
                            <button onClick={add} type="submit" className="btn btn-primary btn-lg">
                                Submit Words
                            </button>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    )
}
