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
    actions_u.href = `/word/mastered/set/${data.Id}`

    if ("NEW" == data.Status) {
        planner_row.classList.add("new");
        word_chip.classList.add("new");
    }
    else if ("LEARNING" == data.Status) {
        planner_row.classList.add("learning");
        word_chip.classList.add("learning");
    }
    else if ("MASTERED" == data.Status) {
        planner_row.classList.add("mastered");
        word_chip.classList.add("mastered");
        mini_bar.remove();
        actions_u.href = `/word/mastered/unset/${data.Id}`
        actions_u.title = "Unmaster"
        actions_u.textContent = "⟲"
        actions_u.classList.remove("icon-btn-master")
        actions_u.classList.add("icon-btn-unmaster")
    }

    word_chip.setAttribute("data-bs-target", `#word-${data.Id}`);
    word_chip.textContent = data.Kanji
    kana.textContent = data.Kana
    meaning.textContent = data.Meaning

    if (mini_bar) {
        mini_bar.querySelector(".bad").style.width = `${data.Display.PercentageN}%`;
        mini_bar.querySelector(".good").style.width = `${data.Display.PercentageP}%`;
    }

    //actions_x.href = `/word/delete/${data.Id}`
    actions_x.addEventListener("click", delete_row);

    build_word_modal(clone, data, row_mastered, row_master, row_mark, delete_row)

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
            form_kanji.value = ""
            form_kana.value = ""
            form_meaning.value = ""
        })
        .catch(err => {
            console.error("Fetch error:", err);
        });
}

function row_mastered() {}
function row_master() {}
function row_mark() {}

function delete_row(event) {
    event.preventDefault();

    row = event.srcElement.parentElement.parentElement

    console.log(row);

    fetch(`/api/word/${row.id}`, {method: "DELETE"})
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json()
        })
        .then(() => row.remove())
        .catch(err => {
            console.error("Fetch error:", err);
        });
}

function fill_rows(data) {
    box         = document.getElementById('planner-box');

    for (let i = 0; i < data.length; i++) {
        //console.log(data[i])

        box.appendChild(build_row(data[i]));
        //console.log(build_row(data[i]))
    }
}

fetch("/api/word")
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json()
    })
    .then(data => fill_rows(data))
    .catch(err => {
        console.error("Fetch error:", err);
    });
