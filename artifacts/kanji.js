const remove_new = (e) => {
    kanji_chip = e.srcElement

    fetch(`/api/kanji/${kanji_chip.id}/new`, {method: "POST"})
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json()
        })
        .then(() => {
            kanji_chip.classList.remove("new");

            kanji_chip.removeEventListener("click", remove_new);
        })
        .catch(err => {
            console.error("Fetch error:", err);
        });
}

function build_chip(data) {
    template = document.getElementById('template-chip');
    clone = template.content.cloneNode(true);

    kanji_chip = clone.querySelector(".word-chip")
    kanji_chip.id = data.Id
    kanji_chip.setAttribute("data-bs-target", `#kanji-${data.Id}`);
    kanji_chip.textContent = data.Kanji

    if ("NEW" == data.Status) {
        kanji_chip.classList.add("new");
        kanji_chip.addEventListener("click", remove_new);
    }
    else if ("LEARNING" == data.Status) {
        kanji_chip.classList.add("learning");
    }
    else if ("MASTERED" == data.Status) {
        kanji_chip.classList.add("mastered");
    }

    build_kanji_modal(clone, data, chip_mastered, chip_master, chip_mark, delete_chip)

    return clone
}

function row_m(event, fun, after) {
    row = event.srcElement.closest(".chip")
    wc = row.querySelector(".word-chip")

    fetch(`/api/kanji/${wc.id}/${fun}`, {method: "POST"})
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

function delete_chip(event) {
    row = event.srcElement.closest(".chip")
    wc = row.querySelector(".word-chip")

    fetch(`/api/kanji/${wc.id}/delete`, {method: "POST"})
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json()
        })
        .then(() => {
            const tx = nyantandb.transaction(["kanjis"], "readwrite");
            const kanjiStore = tx.objectStore("kanjis");
            kanjiStore.delete(wc.id)
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

function sort(kanjis, method) {
    kanjis.sort((a, b) => new Date(b.Date) - new Date(a.Date));
}

let initResolve;
const initFinished = new Promise(resolve => {
    initResolve = resolve;
});

function fill_chipss(meta, data) {
    box = document.getElementById('word-grid');

    set_mastery(meta)

    data.sort((a, b) => b.Kanji.localeCompare(a.Kanji));

    for (let i = 0; i < data.length; i++) {
        box.appendChild(build_chip(data[i]));
    }

    initResolve()
}

async function db_sync_kanjis(data) {
    await initFinished;

    if (!data) {
        return
    }

    data.Words.forEach(d => {
        row = document.getElementById(d.Id)
        if (!row) {
            box.prepend(build_chip(d));
        }
        row.replaceWith(build_chip(d))
    });
}

function db_init_kanjis() {
    const tx = nyantandb.transaction(["metadata", "kanjis"], "readonly");
    const kanjiStore = tx.objectStore("kanjis");
    const metaStore = tx.objectStore("metadata");

    const metaReq = metaStore.get("kanjisStats")
    metaReq.onsuccess = function() {
        meta = metaReq.result
        const kanjisReq = kanjiStore.getAll()
        kanjisReq.onsuccess = function() {
            kanjis = kanjisReq.result
            fill_chipss(meta, kanjis)
        }
    }
}
