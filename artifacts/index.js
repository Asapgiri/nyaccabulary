const remove_new = (e) => {
    word_chip = e.srcElement
    planner_row = word_chip.parentElement

    fetch(`/api/word/${planner_row.id}/new`, {method: "POST"})
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json()
        })
        .then(() => {
            planner_row.classList.remove("new");
            word_chip.classList.remove("new");

            word_chip.removeEventListener("click", remove_new);
        })
        .catch(err => {
            console.error("Fetch error:", err);
        });
}

function build_row(data) {
    template = document.getElementById('template-row');
    clone = template.content.cloneNode(true);

    planner_row = clone.querySelector(".planner-row")
    word_chip = clone.querySelector(".word-chip")
    kana = clone.querySelector(".kana")
    meaning = clone.querySelector(".meaning")
    mini_bar = clone.querySelector(".mini-bar")
    actions_u = clone.querySelector(".icon-btn-master")
    actions_x = clone.querySelector(".icon-btn-delete")

    planner_row.id = data.Id
    actions_u.addEventListener("click", row_mark);

    if ("NEW" == data.Status) {
        planner_row.classList.add("new");
        word_chip.classList.add("new");
        word_chip.addEventListener("click", remove_new);
    }
    else if ("LEARNING" == data.Status) {
        planner_row.classList.add("learning");
        word_chip.classList.add("learning");
        actions_u.textContent = "✓"
    }
    else if ("MASTERED" == data.Status) {
        planner_row.classList.add("mastered");
        word_chip.classList.add("mastered");
        mini_bar.remove();
        actions_u.title = "Unmaster"
        actions_u.textContent = "⟲"
        actions_u.classList.remove("icon-btn-master")
        actions_u.classList.add("icon-btn-unmaster")
        actions_u.removeEventListener("click", row_mark);
        actions_u.addEventListener("click", row_mastered);
    }

    word_chip.setAttribute("data-bs-target", `#word-${data.Id}`);
    word_chip.textContent = data.Kanji
    kana.textContent = data.Kana
    meaning.textContent = data.Meaning

    if (mini_bar) {
        mini_bar.querySelector(".bad").style.width = `${data.Display.PercentageN}%`;
        mini_bar.querySelector(".good").style.width = `${data.Display.PercentageP}%`;
    }

    actions_x.addEventListener("click", delete_row);

    build_word_modal(clone, data, row_mastered, row_master, row_mark, delete_row, row_update)

    return clone
}

function add_row() {
    form_kanji = document.getElementById('form[kanji]')
    form_kana = document.getElementById('form[kana]')
    form_meaning = document.getElementById('form[meaning]')

    sbody = {
        kanji: form_kanji.value,
        kana: form_kana.value,
        meaning: form_meaning.value,
    }

    fetch(`/api/word`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(sbody)

    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json()
        })
        .then(data => {
            box = document.getElementById('planner-box');
            box.prepend(build_row(data));
            increase_count();
            form_kanji.value = ""
            form_kana.value = ""
            form_meaning.value = ""
        })
        .catch(err => {
            console.error("Fetch error:", err);
        });
}

function row_m(event, fun, after, t_body) {
    row = event.srcElement.closest(".planner-row")

    fetch(`/api/word/${row.id}/${fun}`, {method: "POST", body: JSON.stringify(t_body)})
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json()
        })
        .then(data => {
            modalel = row.querySelector(".modal");
            modal = bootstrap.Modal.getInstance(modalel);
            if (modal) {
                modal.hide();
            }
            row.replaceWith(build_row(data))
            if (after) {
                after(data);
            }
        })
        .catch(err => {
            console.error("Fetch error:", err);
        });
}

function row_mastered(event) {
    row_m(event, 'unset', decrease_mastery)
}

function row_master(event) {
    const row = event.srcElement.closest(".planner-row")
    if (row.classList.contains('learning')) {
        var change_from_learning = true
    }
    row_m(event, 'force', () => {
        if (change_from_learning) {
            decrease_marked()
        }
        increase_mastery()
    })
}

function row_mark(event) {
    row_m(event, 'set', word => {
        if ("MASTERED" == word.Status) {
            decrease_marked()
            increase_mastery()
        } else {
            increase_marked()
        }
    })
}

function row_update(event, update) {
    row_m(event, "update", null, update)
}

function delete_row(event) {
    row = event.srcElement.closest(".planner-row")

    fetch(`/api/word/${row.id}/delete`, {method: "POST"})
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json()
        })
        .then(() => {
            const tx = nyantandb.transaction(["words"], "readwrite");
            const wordStore = tx.objectStore("words");
            wordStore.delete(row.id)
            modalel = row.querySelector(".modal");
            modal = bootstrap.Modal.getInstance(modalel);
            if (modal) {_mastery
                modal.hide();
            }
            decrease_count();
            if (row.classList.contains("mastered")) {
                decrease_mastery();
            }
            if (row.classList.contains("learning")) {
                decrease_marked();
            }
            row.remove();
        })
        .catch(err => {
            console.error("Fetch error:", err);
        });
}

function fill_rows(meta, data) {
    box = document.getElementById('planner-box');

    set_mastery(meta)

    data.sort((a, b) => new Date(b.Date) - new Date(a.Date));

    for (let i = 0; i < data.length; i++) {
        box.appendChild(build_row(data[i]));
    }
}

function db_sync_words() {
    const tx = nyantandb.transaction(["metadata", "words"], "readonly");
    const wordStore = tx.objectStore("words");
    const metaStore = tx.objectStore("metadata");

    const metaReq = metaStore.get("wordsStats")
    metaReq.onsuccess = function() {
        meta = metaReq.result
        const wordsReq = wordStore.getAll()
        wordsReq.onsuccess = function() {
            words = wordsReq.result
            fill_rows(meta, words)
        }
    }
}
