const remove_new = (e) => {
    word_chip = e.srcElement

    fetch(`/api/word/${word_chip.id}/new`, {method: "POST"})
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json()
        })
        .then(() => {
            word_chip.classList.remove("new");

            word_chip.removeEventListener("click", remove_new);
        })
        .catch(err => {
            console.error("Fetch error:", err);
        });
}

function build_chip(data) {
    template = document.getElementById('template-chip');
    clone = template.content.cloneNode(true);

    word_chip = clone.querySelector(".word-chip")
    word_chip.id = data.Id
    word_chip.setAttribute("data-bs-target", `#word-${data.Id}`);
    word_chip.textContent = data.Kanji

    if ("NEW" == data.Status) {
        word_chip.classList.add("new");
        word_chip.addEventListener("click", remove_new);
    }
    else if ("LEARNING" == data.Status) {
        word_chip.classList.add("learning");
    }
    else if ("MASTERED" == data.Status) {
        word_chip.classList.add("mastered");
    }

    build_word_modal(clone, data, chip_mastered, chip_master, chip_mark, delete_chip, chip_update)

    return clone
}

function row_m(event, fun, after, t_body) {
    row = event.srcElement.closest(".chip")
    wc = row.querySelector(".word-chip")

    fetch(`/api/word/${wc.id}/${fun}`, {method: "POST", body: JSON.stringify(t_body)})
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
            row.replaceWith(build_chip(data))
            if (after) {
                after(data);
            }
        })
        .catch(err => {
            console.error("Fetch error:", err);
        });
}

function chip_mastered(event) {
    row_m(event, 'unset', decrease_mastery)
}

function chip_master(event) {
    row = event.srcElement.closest(".chip")
    wc = row.querySelector(".word-chip")
    if (wc.classList.contains('learning')) {
        var change_from_learning = true
    }
    row_m(event, 'force', () => {
        if (change_from_learning) {
            decrease_marked()
        }
        increase_mastery()
    })
}

function chip_mark(event) {
    row_m(event, 'set', word => {
        if ("MASTERED" == word.Status) {
            decrease_marked()
            increase_mastery()
        } else {
            increase_marked()
        }
    })
}

function chip_update(event, update) {
    row_m(event, "update", null, update)
}

function delete_chip(event) {
    row = event.srcElement.closest(".chip")
    wc = row.querySelector(".word-chip")

    fetch(`/api/word/${wc.id}/delete`, {method: "POST"})
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json()
        })
        .then(() => {
            const tx = nyantandb.transaction(["words"], "readwrite");
            const wordStore = tx.objectStore("words");
            wordStore.delete(wc.id)
            modalel = row.querySelector(".modal");
            modal = bootstrap.Modal.getInstance(modalel);
            if (modal) {
                modal.hide();
            }
            decrease_count();
            if (wc.classList.contains("mastered")) {
                decrease_mastery();
            }
            if (wc.classList.contains("learning")) {
                decrease_marked();
            }
            row.remove();
        })
        .catch(err => {
            console.error("Fetch error:", err);
        });
}

function fill_chipss(meta, data) {
    box = document.getElementById('word-grid');

    set_mastery(meta)

    data.sort((a, b) => b.Kanji.localeCompare(a.Kanji));

    for (let i = 0; i < data.length; i++) {
        box.appendChild(build_chip(data[i]));
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
            fill_chipss(meta, words)
        }
    }
}
