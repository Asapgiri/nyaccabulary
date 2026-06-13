function buildSenseCards(senses) {
    const container = document.createDocumentFragment();

    for (const sense of senses) {
        const card = document.createElement("div");
        card.className = "card mb-2";

        const body = document.createElement("div");
        body.className = "card-body p-2";

        // ---------------- POS ----------------
        if (sense.Pos && sense.Pos.length > 0) {
            const div = document.createElement("div");
            div.className = "mb-1";

            div.innerHTML = `<strong>Part of Speech:</strong> `;

            for (const pos of sense.Pos) {
                const span = document.createElement("span");
                span.className = "badge bg-secondary";
                span.textContent = pos;
                div.appendChild(span);
            }

            body.appendChild(div);
        }

        // ---------------- FIELD ----------------
        if (sense.Field && sense.Field.length > 0) {
            const div = document.createElement("div");
            div.className = "mb-1";

            div.innerHTML = `<strong>Fields:</strong> `;

            for (const field of sense.Field) {
                const span = document.createElement("span");
                span.className = "badge bg-info text-dark";
                span.textContent = field;
                div.appendChild(span);
            }

            body.appendChild(div);
        }

        // ---------------- GLOSS ----------------
        if (sense.Gloss && sense.Gloss.length > 0) {
            const div = document.createElement("div");
            div.className = "mb-1";

            const strong = document.createElement("strong");
            strong.textContent = "Glosses:";
            div.appendChild(strong);

            const ul = document.createElement("ul");
            ul.className = "mb-0";

            for (const g of sense.Gloss) {
                const li = document.createElement("li");
                li.textContent = g.Value;
                ul.appendChild(li);
            }

            div.appendChild(ul);
            body.appendChild(div);
        }

        // ---------------- EXAMPLES ----------------
        if (sense.Example && sense.Example.length > 0) {
            const div = document.createElement("div");

            const strong = document.createElement("strong");
            strong.textContent = "Examples:";
            div.appendChild(strong);

            for (const ex of sense.Example) {
                const exBlock = document.createElement("div");
                exBlock.className = "example-block";

                const exText = document.createElement("div");
                const exStrong = document.createElement("strong");
                exStrong.textContent = ex.ExText;
                exText.appendChild(exStrong);

                exBlock.appendChild(exText);

                if (ex.ExSent && ex.ExSent.length > 0) {
                    for (const sent of ex.ExSent) {
                        const d = document.createElement("div");
                        d.textContent = sent.Value;
                        exBlock.appendChild(d);
                    }
                }

                div.appendChild(exBlock);
            }

            body.appendChild(div);
        }

        card.appendChild(body);
        container.appendChild(card);
    }

    return container;
}
function build_word_modal(clone, word, fn_mastered, fn_master, fn_mark, fn_delete) {
    modal = clone.querySelector(".modal")

    title = modal.querySelector(".study-kanji")
    small_text = modal.querySelector(".study-kana")

    action_mastered = modal.querySelector(".btn-mastered")
    action_master = modal.querySelector(".btn-master")
    action_mark = modal.querySelector(".btn-mark")
    action_delete = modal.querySelector(".btn-delete")

    meaning = modal.querySelector(".modal-meaning")
    kanjis = modal.querySelector(".modal-kanjis")
    kanji = modal.querySelector(".modal-kanji")
    readings = modal.querySelector(".modal-readings")
    senses = modal.querySelector(".modal-senses")

    action_mastered.addEventListener("click", fn_mastered);
    action_master.addEventListener("click", fn_master);
    action_mark.addEventListener("click", fn_mark);
    action_delete.addEventListener("click", fn_delete);

    modal.id = `word-${word.Id}`;
    title.textContent = word.Kanji
    small_text.textContent = word.Kana

    meaning.textContent = word.Meaning

    if ("MASTERED" == word.Status) {
        action_master.remove()
        action_mark.remove()
    }
    else {
        action_mastered.remove()
    }

    for (let i = 0; i < word.Kanjis.length; i++) {
        a = document.createElement("a");
        a.textContent = word.Kanjis[i]
        a.href = `/kanji/${word.Kanjis[i]}`
        kanjis.appendChild(a)
        if (i < word.Kanjis.length - 1) {
            kanjis.innerHTML += ", "
        }
    }

    if (word.DictForm.KEle) {
        for (let i = 0; i < word.DictForm.KEle.length; i++) {
            li = document.createElement("li");
            li.textContent = word.DictForm.KEle[i].KEB
            kanji.appendChild(li)
        }
    }

    if (word.DictForm.REle) {
        for (let i = 0; i < word.DictForm.REle.length; i++) {
            li = document.createElement("li");
            li.textContent = word.DictForm.REle[i].REB
            readings.appendChild(li)
        }
    }

    if (word.DictForm.Sense) {
        senses.appendChild(buildSenseCards(word.DictForm.Sense))
    }
}
