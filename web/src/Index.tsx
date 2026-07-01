import { useEffect, useState } from "react";
import WordRow from "./components/WordRow"
import WordModal from "./components/WordModal";
import "./index.css"
import { WordDB } from "./db/words";
import Filter from "./Filter";

export default function Index() {
    const [words, setWords] = useState<Word[]>([]);
    const [selectedWord, setSelectedWord] = useState<Word | null>(null);

    useEffect(() => {
        loadWords();
    }, []);

    async function loadWords() {
        const words = await WordDB.getAll();

        words.sort((a, b) => new Date(b.Date) - new Date(a.Date));

        setWords(words);
    }

    return (
        <div className="container-fluid py-4 px-3 px-md-4" style={{ maxWidth: "1000px" }}>

            <div className="topbar">
                <div className="page-title">Words</div>
                <div id="study-progress" className="study-progress"></div>
            </div>

            <Filter />

            <div className="add-form">
                <div className="row g-2">
                    <div className="col-md-3">
                        <input id="form[kanji]" name="form[kanji]" className="form-control clean-input" placeholder="Word (with kanjis)" lang="ja"/>
                    </div>
                    <div className="col-md-3">
                        <input id="form[kana]" name="form[kana]" className="form-control clean-input" placeholder="Kana" lang="ja"/>
                    </div>
                    <div className="col-md-4">
                        <input id="form[meaning]" name="form[meaning]" className="form-control clean-input" placeholder="Meaning"/>
                    </div>
                    <div className="col-md-2">
                        <button className="btn btn-dark w-100">Add</button>
                    </div>
                </div>
            </div>

            <div className="row planner-header">
                <div className="col-3 col-md-3 col-sm-3">WORD</div>
                <div className="col-3 col-md-3 col-sm-3">KANA</div>
                <div className="col-4 col-md-3 col-sm-4">MEANING</div>
                <div className="col-md-2 d-none d-md-block">PROGRESS</div>
                <div className="col-2 col-md-1 col-sm-2" style={{textAlign: "right"}}>ACTIONS</div>
            </div>

            <div id="planner-box">
            {words.map(word => (
                <WordRow key={word.Id} word={word} setSelectedWord={setSelectedWord} />
            ))}
            </div>

            <WordModal word={selectedWord} />

        </div>
    )
}
