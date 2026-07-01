import { useEffect, useState } from "react";
import WordChip from "./components/WordChip"
import KanjiModal from "./components/KanjiModal";
import "./index.css"
import "./kanji.css"
import { KanjiDB } from "./db/kanjis";
import Filter from "./Filter";

export default function Kanji() {
    const [kanjis, setKanjis] = useState<Kanji[]>([]);
    const [selectedKanji, setSelectedKanji] = useState<Kanji | null>(null);

    useEffect(() => {
        loadKanjis();
    }, []);

    async function loadKanjis() {
        const kanjis = await KanjiDB.getAll();

        kanjis.sort((a, b) => new Date(a.Date) - new Date(b.Date));

        setKanjis(kanjis);
    }

    return (
        <div className="container-fluid py-4 px-3 px-md-4" style={{ maxWidth: "1000px" }}>

            <div className="topbar">
                <div className="page-title">Kanjis</div>
                <div id="study-progress" className="study-progress"></div>
            </div>

            <Filter />

            <div className="word-grid" id="word-grid">
            {kanjis.map(kanji => (
                <WordChip key={kanji.Id} word={kanji} setSelectedWord={setSelectedKanji} />
            ))}
            </div>

            <KanjiModal kanji={selectedKanji} />

        </div>
    )
}
