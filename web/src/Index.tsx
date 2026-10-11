import { useEffect, useMemo, useState } from "react";
import WordRow from "./components/WordRow"
import WordModal from "./components/WordModal";
import "./index.css"
import { WordDB } from "./db/words";
import { Filter, FilterApply, raw_filter } from "./Filter";
import { syncFinished } from "./db/sync";
import { apiFetch } from "./api";
import { TagDB } from "./db/tags";
import type { Tag } from "./db/tags";
import TagSelect from "./components/TagSelect";

export default function Index() {
    const [words, setWords] = useState<Word[]>([]);
    const [selectedWord, setSelectedWord] = useState<Word | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [tags, setTags] = useState<Tag[]>([]);
    const [filter, setFilter] = useState<TFilter>(raw_filter);
    const [addKanji, setAddKanji] = useState<string>("")
    const [addKana, setAddKana] = useState<string>("")
    const [addMeaning, setAddMeaning] = useState<string>("")
    const [addTagId, setAddTagId] = useState<string | undefined>()

    async function new_word() {
        const sbody = {
            kanji: addKanji,
            kana: addKana,
            meaning: addMeaning,
            tags: addTagId ? [addTagId] : [],
        }

        const response = await apiFetch(`/api/word`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(sbody)
        })

        const data = await response.json()
        console.log(data)
        setWords(words => [data, ...words])
        await WordDB.put(data)

        setAddKanji("")
        setAddKana("")
        setAddMeaning("")
        setAddTagId(undefined)
    }

    useEffect(() => {
        loadWords().then(async() => await syncFinished).then(() => loadWords());
    }, []);

    async function loadWords() {
        const [stats, words, tags] = await Promise.all([WordDB.getStats(), WordDB.getAll(), TagDB.getAll()]);
        setStats(stats);
        setWords(words);
        setTags(tags);
    }

    async function update(updated) {
        setWords(words => words.map(w => w.Id === updated.Id ? updated : w))
    }

    async function ddelete(data, id) {
        setWords(words => words.filter(w => w.Id !== id))
    }

    const filteredWords = useMemo(() => FilterApply(filter, words), [words, filter]);

    return (
        <div className="container-fluid py-4 px-3 px-md-4">

            <div className="topbar">
                <div className="page-title">Words</div>
                {stats && (
                <div id="study-progress" className="study-progress">
                    <span className="mastered">{stats.Mastered}</span> / <span className="learning">{stats.Learning}</span> / <span>{stats.Count}</span>
                </div>
                )}
            </div>

            <Filter filter={filter} setFilter={setFilter} />

            <div className="add-form">
                <div className="row g-2">
                    <div className="col-md-2">
                        <input value={addKanji} onChange={e => setAddKanji(e.target.value)} id="form[kanji]" name="form[kanji]" className="form-control clean-input" placeholder="Word (with kanjis)" lang="ja"/>
                    </div>
                    <div className="col-md-2">
                        <input value={addKana} onChange={e => setAddKana(e.target.value)} id="form[kana]" name="form[kana]" className="form-control clean-input" placeholder="Kana" lang="ja"/>
                    </div>
                    <div className="col-md-4">
                        <input value={addMeaning} onChange={e => setAddMeaning(e.target.value)} id="form[meaning]" name="form[meaning]" className="form-control clean-input" placeholder="Meaning"/>
                    </div>
                    <div className="col-md-2">
                        <TagSelect value={addTagId} onChange={setAddTagId} onTagsChange={setTags} />
                    </div>
                    <div className="col-md-2">
                        <button className="btn btn-dark w-100" onClick={new_word}>Add</button>
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
            {filteredWords.map(word => (
                <WordRow key={word.Id} word={word} filter={filter}
                    tags={tags}
                    setSelectedWord={setSelectedWord}
                    onUpdate={update}
                    onDelete={ddelete} />
            ))}
            </div>

            <WordModal word={selectedWord} setSelectedWord={setSelectedWord} onUpdate={update} onDelete={ddelete} onCatalogChange={setTags} />

        </div>
    )
}
