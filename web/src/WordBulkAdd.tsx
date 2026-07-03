import { useState } from "react";
import { apiFetch } from "./api";

export default function WordBulkAdd() {
    const [bulkwords, setBulkwords] = useState<string>("");
    const [progress, setProgress] = useState<{percent: number; max: number} | null>(null);

    async function add() {
        const response = await apiFetch('/api/word/bulk', {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: bulkwords,
        })

        console.log(await response.text())
    }

    return (
        <div className="container">
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
                        <div>
                            <div id="progress-bar" style={{width: "55%", background: "#666", height: "10px", display: "none"}}></div>
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
