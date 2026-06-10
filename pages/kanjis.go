package pages

import (
	"encoding/json"
	"io"
	"net/http"
	"nyaccabulary/logic"
	"slices"
	"strings"

	"github.com/asapgiri/golib/renderer"
)

func Kanjis(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        AccessViolation(w, r)
        return
    }

    mastered := read_mastered(w, r)

    user := logic.User{}
    user.Find(session.Auth.Id)

    kanji := logic.Kanji{}
    kanjis := kanji.List(user, mastered)
    slices.SortFunc(kanjis, func(a, b logic.Kanji) int {
        return strings.Compare(a.Kanji, b.Kanji)
    })

    dto := DtoKanji{
        Kanjis: kanjis,
        ShowMastered: mastered,
        Mastered: 0,
        KanjiCount: len(kanjis),
    }

    if mastered {
        for _, w := range(kanjis) {
            if logic.MASTERY.MASTERED == w.Status {
                dto.Mastered++
            }
        }
    }

    for i := range kanjis {
        k := &kanjis[i]
        k.OnStr = strings.Join(k.On, ", ")
        k.KunStr = strings.Join(k.Kun, ", ")
        k.MeaningStr = strings.Join(k.Meaning, ", ")
    }

    fil, _ := renderer.ReadArtifact("kanji.html", w.Header())
    renderer.Render(session, w, fil, dto)
}

func KanjiMaster(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        http.Redirect(w, r, "/", http.StatusSeeOther)
        return
    }

    id          := r.PathValue("id")
    function    := r.PathValue("func")

    kanji := logic.Kanji{}
    kanji.Find(id)

    if "" == kanji.Id || kanji.User.Id != session.Auth.Id {
        AccessViolation(w, r)
        return
    }

    if "force" == function {
        kanji.Status = logic.MASTERY.MASTERED
    } else if "set" == function {
        if logic.MASTERY.LEARNING == kanji.Status {
            kanji.Status = logic.MASTERY.MASTERED
        } else {
            kanji.Status = logic.MASTERY.LEARNING
        }
    } else {
        kanji.Status = logic.MASTERY.UNKNOWN
    }
    kanji.Update()

    http.Redirect(w, r, r.Referer(), http.StatusSeeOther)
}

func AdminKanjisSyncAllWords(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    if !checkAdminPageAccess(session) {
        NotFound(w, r)
        return
    }

    user := logic.User{}
    word := logic.Word{}

    users := user.List()
    new_kanjis := [][]logic.Kanji{}

    for _, u := range(users) {
        words := word.List(u, true)

        for _, w := range(words) {
            new_kanjis = append(new_kanjis, logic.FetchAndAddKanjisFromWord(w))
        }
    }

    b, _ := json.MarshalIndent(new_kanjis, "", "  ")
    io.WriteString(w, string(b))
}

