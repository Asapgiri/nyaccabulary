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

    build_word_modal(clone, data, chip_mastered, chip_master, chip_mark, delete_chip)

    return clone
}

function row_m(event, fun, after) {
    row = event.srcElement.closest(".chip")
    wc = row.querySelector(".word-chip")

    fetch(`/api/word/${wc.id}/${fun}`, {method: "POST"})
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
    row_m(event, 'force', increase_mastery)
}

function chip_mark(event) {
    row_m(event, 'set', word => {
        if ("MASTERED" == word.Status) {
            increase_mastery()
        }
    })
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
            modalel = row.querySelector(".modal");
            modal = bootstrap.Modal.getInstance(modalel);
            if (modal) {
                modal.hide();
            }
            if (wc.classList.contains("mastered")) {
                decrease_mastery()
            }
            row.remove();
        })
        .catch(err => {
            console.error("Fetch error:", err);
        });
}

function fill_chipss(data) {
    box = document.getElementById('word-grid');

    set_mastery(data.Stats)

    console.log(data)

    for (let i = 0; i < data.Data.length; i++) {
        box.appendChild(build_chip(data.Data[i]));
    }

    if (data.Page.Count > 0 && data.Page.Current < (data.Page.Count-1)) {
        fetch_paged({
            page: data.Page.Current + 1,
            limit: data.Page.Limit,
            mastered: true,
            sort: {
                field: "kanji",
                order: -1,
            },
        })
    }
}

function fetch_paged(sender) {
    fetch("/api/word/paged", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(sender)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json()
        })
        .then(data => fill_chipss(data))
        .catch(err => {
            console.error("Fetch error:", err);
        });
}

fetch_paged({
    page: 0,
    limit: 25,
    mastered: true,
    sort: {
        field: "kanji",
        order: -1,
    },
})
