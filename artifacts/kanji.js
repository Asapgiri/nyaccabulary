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

    kanji_chip = clone.querySelector(".kanji-chip")
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
    wc = row.querySelector(".kanji-chip")

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
    wc = row.querySelector(".kanji-chip")

    fetch(`/api/kanji/${wc.id}/delete`, {method: "POST"})
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
            row.remove();
        })
        .catch(err => {
            console.error("Fetch error:", err);
        });
}

function fill_chipss(data) {
    box = document.getElementById('kanji-grid');

    set_mastery(data.Stats)

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
    fetch("/api/kanji/paged", {
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
    limit: 100,
    mastered: true,
    sort: {
        field: "kanji",
        order: -1,
    },
})
