import { useEffect, useState } from "react";
import WordChip from "./components/WordChip"
import WordModal from "./components/WordModal";
import "./index.css"
import { WordDB } from "./db/words";
import Filter from "./Filter";

export default function Word() {
    const [words, setWords] = useState<Word[]>([]);
    const [selectedWord, setSelectedWord] = useState<Word | null>(null);

    useEffect(() => {
        loadWords();
    }, []);

    async function loadWords() {
        const words = await WordDB.getAll();

        words.sort((a, b) => new Date(a.Date) - new Date(b.Date));

        setWords(words);
    }

    return (
        <div className="container-fluid py-4 px-3 px-md-4" style={{ maxWidth: "1000px" }}>

            <div className="topbar">
                <div className="page-title">Words</div>
                <div id="study-progress" className="study-progress"></div>
            </div>

            <Filter />

            <div className="word-grid" id="word-grid">
            {words.map(word => (
                <WordChip key={word.Id} word={word} setSelectedWord={setSelectedWord} />
            ))}
            </div>

            <WordModal word={selectedWord} />

        </div>
    )
}
