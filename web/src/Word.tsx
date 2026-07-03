import { useEffect, useMemo, useState } from "react";
import WordChip from "./components/WordChip"
import WordModal from "./components/WordModal";
import "./index.css"
import { WordDB } from "./db/words";
import { Filter, FilterApply, pdf, raw_filter } from "./Filter";
import { syncFinished } from "./db/sync";

export default function Word() {
    const [words, setWords] = useState<Word[]>([]);
    const [selectedWord, setSelectedWord] = useState<Word | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [filter, setFilter] = useState<TFilter>(raw_filter);

    useEffect(() => {
        loadWords().then(async() => await syncFinished).then(() => loadWords());
    }, []);

    async function loadWords() {
        const stats = await WordDB.getStats();
        setStats(stats);

        const words = await WordDB.getAll();
        setWords(words);
    }

    async function update(updated) {
        setWords(words => words.map(w => w.Id === updated.Id ? updated : w))
    }

    const filteredWords = useMemo(() => FilterApply(filter, words), [words, filter]);

    return (
        <div className="container-fluid py-4 px-3 px-md-4" style={{ maxWidth: "1000px" }}>

            <div className="topbar">
                <div className="page-title">Words</div>
                {stats && (
                <div id="study-progress" className="study-progress">
                    <span className="mastered">{stats.Mastered}</span> / <span className="learning">{stats.Learning}</span> / <span>{stats.Count}</span>
                </div>
                )}
                <div className="study-controls">
                    <div className="study-actions">
                        <button type="button" className="btn btn-outline-primary btn-mini" id="copy-btn">Copy</button>
                        <a href="/word/bulkadd" className="btn btn-outline-secondary btn-mini">Bulk</a>
                        <button className="btn btn-outline-success btn-mini" onClick={() => pdf(filter)}>PDF</button>
                    </div>
                </div>
            </div>

            <Filter filter={filter} setFilter={setFilter} />

            <div className="word-grid" id="word-grid">
            {filteredWords.map(word => (
                        <WordChip key={word.Id} word={word}
                            setSelectedWord={setSelectedWord}
                            onUpdate={update} />
                    ))}
            </div>

            <WordModal word={selectedWord} setSelectedWord={setSelectedWord} onUpdate={update} />

        </div>
    )
}
