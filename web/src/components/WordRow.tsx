export default function WordRow({ word, setSelectedWord }) {
    return (
        <div className={`searchable row planner-row ${word.Status.toLowerCase()}`}>
            <button className={`col-3 col-md-3 col-sm-3 word-chip ${word.Status.toLowerCase()}`}
                    data-bs-toggle="modal"
                    data-bs-target={`#word-modal`}
                    onClick={() => setSelectedWord(word)}>
                {word.Kanji}
            </button>

            <div className="col-3 col-md-3 col-sm-3 kana">{word.Kana}</div>
            <div className="col-4 col-md-3 col-sm-4 meaning">{word.Meaning}</div>

            <div className="col-md-2 d-none d-md-block">
                <div className="mini-bar">
                    <div className="bad"></div>
                    <div className="good"></div>
                </div>
            </div>

            <div className="col-2 col-md-1 col-sm-2 actions">
                <button className="icon-btn icon-btn-master" type="button" title="Mark mastered">＋</button>
                <button className="icon-btn icon-btn-delete" type="button" title="Delete">×</button>
            </div>

        </div>
    );
}
