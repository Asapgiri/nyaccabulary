export default function WordChip({ word, setSelectedWord }) {
    return (
        <span className="searchable chip">
            <button className={`word-chip ${word.Status.toLowerCase()}`}
                    data-bs-toggle="modal"
                    data-bs-target={`#word-modal`}
                    onClick={() => setSelectedWord(word)}>
                {word.Kanji}
            </button>

        </span>
    );
}
