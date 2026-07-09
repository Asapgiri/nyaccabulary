import { useEffect, useMemo, useState } from "react";
import WordChip from "./components/WordChip"
import KanjiModal from "./components/KanjiModal";
import "./index.css"
import "./kanji.css"
import { KanjiDB } from "./db/kanjis";
import { copy, Filter, FilterApply, pdf, raw_filter } from "./Filter";
import { syncFinished } from "./db/sync";

export default function Kanji() {
    const [kanjis, setKanjis] = useState<Kanji[]>([]);
    const [selectedKanji, setSelectedKanji] = useState<Kanji | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [filter, setFilter] = useState<TFilter>(raw_filter);

    useEffect(() => {
        loadKanjis();
        loadKanjis().then(async() => await syncFinished).then(() => loadKanjis());
    }, []);

    async function loadKanjis() {
        const stats = await KanjiDB.getStats();
        setStats(stats);

        const kanjis = await KanjiDB.getAll();
        setKanjis(kanjis);
    }

    async function update(updated) {
        setKanjis(kanjis => kanjis.map(w => w.Id === updated.Id ? updated : w))
    }

    async function ddelete(data, id) {
        setKanjis(kanjis => kanjis.filter(w => w.Id !== id))
    }

    const filtered = useMemo(() => FilterApply(filter, kanjis), [kanjis, filter]);


    return (
        <div className="container-fluid py-4 px-3 px-md-4">

            <div className="topbar">
                <div className="page-title">Kanjis</div>
                {stats && (
                <div id="study-progress" className="study-progress">
                    <span className="mastered">{stats.Mastered}</span> / <span className="learning">{stats.Learning}</span> / <span>{stats.Count}</span>
                </div>
                )}
                <div className="study-controls">
                    <div className="study-actions">
                        <button type="button" className="btn btn-outline-primary btn-mini" id="copy-btn" onClick={() => copy(filtered)}>Copy</button>
                        <button className="btn btn-outline-success btn-mini" onClick={() => pdf(filter)}>PDF</button>
                    </div>
                </div>
            </div>

            <Filter filter={filter} setFilter={setFilter} />

            <div className="word-grid" id="word-grid">
            {filtered.map(kanji => (
                <WordChip key={kanji.Id} word={kanji} wordIsKanji={true}
                    setSelectedWord={setSelectedKanji}
                    onUpdate={update} />
            ))}
            </div>

            <KanjiModal kanji={selectedKanji}  setSelectedKanji={setSelectedKanji} onUpdate={update} onDelete={ddelete} />

        </div>
    )
}
