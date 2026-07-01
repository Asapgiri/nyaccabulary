function createLiButton(set, lival, update) {
    span = document.createElement(set == lival ? "mark" : "span");
    span.innerText = lival + " "
    const li = document.createElement("li");
    li.appendChild(span)
    if (set != lival) {
        button = document.createElement("button")
        button.classList.add("icon-btn")
        button.textContent = "set"
        button.addEventListener("click", event => {
            word = event.srcElement.parentElement.children[0].textContent
            modal = event.srcElement.closest(".modal")
            id = modal.id.split('-')[1]
            update(event, word)
        })
        li.appendChild(button)
    }
    return li
}

function buildSenseCards(word, fn_update) {
    const container = document.createDocumentFragment();
    const senses = word.DictForm.Sense

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
            strong.textContent = "Glosses: ";
            div.appendChild(strong);

            if (sense.Gloss) {
                const span = document.createElement("span");
                span.className = "badge bg-secondary";
                span.textContent = sense.Gloss[0].Lang;
                div.appendChild(span);
            }

            const ul = document.createElement("ul");
            ul.className = "mb-0";

            for (const g of sense.Gloss) {
                const li = createLiButton(word.Meaning, g.Value, (event, data) => fn_update(event, {meaning: data}))
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

function build_word_modal(clone, word, fn_mastered, fn_master, fn_mark, fn_delete, fn_update) {
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
        a.className = "icon-btn me-2 mb-2 p-1 kanji-btn"
        kanjis.appendChild(a)
    }

    if (word.DictForm.KEle) {
        for (let i = 0; i < word.DictForm.KEle.length; i++) {
            const li = createLiButton(word.Kanji, word.DictForm.KEle[i].KEB, (event, data) => fn_update(event, {kanji: data}))
            kanji.appendChild(li)
        }
    }

    if (word.DictForm.REle) {
        for (let i = 0; i < word.DictForm.REle.length; i++) {
            const li = createLiButton(word.Kana, word.DictForm.REle[i].REB, (event, data) => fn_update(event, {kana: data}))
            readings.appendChild(li)
        }
    }

    if (word.DictForm.Sense) {
        senses.appendChild(buildSenseCards(word, fn_update))
    }
}

function buildReadingMeaning(rmGroups) {
    const container = document.createDocumentFragment();

    if (!rmGroups) return container;

    for (const group of rmGroups) {

        // ---------------- READINGS ----------------
        if (group.Readings && group.Readings.length > 0) {
            const div = document.createElement("div");
            div.className = "mb-2";

            const strong = document.createElement("strong");
            strong.textContent = "Readings:";
            div.appendChild(strong);

            div.appendChild(document.createElement("br"));

            for (const r of group.Readings) {
                const span = document.createElement("span");
                span.className = "badge bg-secondary";
                span.textContent = `${r.Value} (${r.Type})`;
                div.appendChild(span);
                div.appendChild(document.createTextNode(" "));
            }

            container.appendChild(div);
        }

        // ---------------- MEANINGS ----------------
        if (group.Meanings && group.Meanings.length > 0) {
            const div = document.createElement("div");
            div.className = "mb-2";

            const strong = document.createElement("strong");
            strong.textContent = "Meanings:";
            div.appendChild(strong);

            const ul = document.createElement("ul");
            ul.className = "mb-1";

            for (const m of group.Meanings) {
                const li = document.createElement("li");
                li.textContent = m.Value;
                ul.appendChild(li);
            }

            div.appendChild(ul);
            container.appendChild(div);
        }
    }

    return container;
}

function build_kanji_modal(clone, kanji, fn_mastered, fn_master, fn_mark, fn_delete) {
    modal = clone.querySelector(".modal");

    title = modal.querySelector(".study-kanji");
    small_text = modal.querySelector(".study-kana");
    hero = modal.querySelector(".kanji-hero");
    readings = modal.querySelector(".kanji-readings");

    action_mastered = modal.querySelector(".btn-mastered");
    action_master = modal.querySelector(".btn-master");
    action_mark = modal.querySelector(".btn-mark");
    action_delete = modal.querySelector(".btn-delete");

    meaning = modal.querySelector(".modal-meaning")
    words = modal.querySelector(".modal-words")
    modalreadings = modal.querySelector(".modal-readings")

    action_mastered.addEventListener("click", fn_mastered);
    action_master.addEventListener("click", fn_master);
    action_mark.addEventListener("click", fn_mark);
    action_delete.addEventListener("click", fn_delete);

    modal.id = `kanji-${kanji.Id}`;
    title.textContent = kanji.Kanji;
    small_text.textContent = `On: ${kanji.On ? kanji.On.join(", ") : "-"} | Kun: ${kanji.Kun ? kanji.Kun.join(", ") : "-"}`;
    hero.textContent = kanji.Kanji;
    readings.textContent = small_text.textContent;

    meaning.textContent = kanji.Meaning ? kanji.Meaning.join(", ") : "-";

    if ("MASTERED" == kanji.Status) {
        action_master.remove()
        action_mark.remove()
    }
    else {
        action_mastered.remove()
    }

    for (let i = 0; i < kanji.Words.length; i++) {
        a = document.createElement("a");
        a.textContent = kanji.Words[i]
        a.href = `/word/${kanji.Words[i]}`
        a.className = "icon-btn me-2 mb-2 p-1 kanji-btn"
        words.appendChild(a)
    }

    if (kanji.DictForm.ReadingMeaning) {
        modalreadings.appendChild(buildReadingMeaning(kanji.DictForm.ReadingMeaning.RMGroups))
    }
}

const study_progress = document.getElementById('study-progress')
var stats

function p_stat() {
    if (stats) {
        study_progress.innerHTML = `<span class="mastered">${stats.Mastered}</span> / <span class="learning">${stats.Learning}</span> / <span>${stats.Count}</span>`
    }
}

function set_mastery(s) {
    stats = s
    p_stat()
}

function increase_mastery() {
    stats.Mastered++
    p_stat()
}

function decrease_mastery() {
    stats.Mastered--
    p_stat()
}

function increase_marked() {
    stats.Learning++
    p_stat()
}

function decrease_marked() {
    stats.Learning--
    p_stat()
}

function increase_count() {
    stats.Count++
    p_stat()
}

function decrease_count() {
    stats.Count--
    p_stat()
}

function pdf() {
    url = window.location.pathname + "/pdf/" + JSON.stringify(filter)
    window.location.href = url;
}

var filter = {
    status: [],
    sort: {
        field: "date",
        order: -1,
    }
};

function filterer(btn) {
    mastered = document.getElementById('status-mastered').checked;
    learning = document.getElementById('status-learning').checked;
    normal   = document.getElementById('status-unknown').checked;
    wnew     = document.getElementById('status-new').checked;
    sortfld  = document.getElementById('sortField').value;

    if (btn) {
        filter.sort.order = btn.getAttribute('data-order')
    }

    filter.status = []
    if (mastered) {
        filter.status.push("MASTERED")
    }
    if (learning) {
        filter.status.push("LEARNING")
    }
    if (normal) {
        filter.status.push("UNKNOWN")
        filter.status.push("")
    }
    if (wnew) {
        filter.status.push("NEW")
    }

    console.log(filter, sortfld)
    filter_apply();

    const tx = nyantandb.transaction(["metadata"], "readwrite");
    const metaStore = tx.objectStore("metadata");
    metaStore.put(filter, "filter")
    tx.oncomplete = function() {
        console.log(`Successfully synced filter!`);
    };
}

function filter_init() {
    const tx = nyantandb.transaction(["metadata"], "readonly");
    const metaStore = tx.objectStore("metadata");

    const freq = metaStore.get("filter")
    freq.onsuccess = function() {
        if (freq.result) {
            filter = freq.result
            document.getElementById('status-mastered').checked = filter.status.includes("MASTERED");
            document.getElementById('status-learning').checked = filter.status.includes("LEARNING");
            document.getElementById('status-unknown').checked = filter.status.includes("UNKNOWN");
            document.getElementById('status-new').checked = filter.status.includes("NEW");
            document.getElementById('sortField').value = filter.sort.field
            filter_apply()
        }
    }
}

function filter_reset() {
    document.getElementById('status-mastered').checked = false;
    document.getElementById('status-learning').checked = false;
    document.getElementById('status-unknown').checked = false;
    document.getElementById('status-new').checked = false;
    document.getElementById('sortField').value = "date"
    document.getElementById("wordSearch").value = ""
    filter = {
        status: [],
        sort: {
            field: "date",
            order: -1,
        }
    };
    filter_apply();
    const tx = nyantandb.transaction(["metadata"], "readwrite");
    const metaStore = tx.objectStore("metadata");
    metaStore.put(filter, "filter")
    tx.oncomplete = function() {
        console.log(`Successfully synced filter!`);
    };
}

const wordSearchF = function() {
    const q = document.getElementById("wordSearch").value.toLowerCase();
    document.querySelectorAll(".searchable").forEach(row => {
        row.style.display =
            row.textContent.toLowerCase().includes(q)
                ? ""
                : "none";
    });
}
document.getElementById("wordSearch").addEventListener("input", wordSearchF);
