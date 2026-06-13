package pages

import (
	"fmt"
	"net/http"
	"nyaccabulary/logic"

	"github.com/asapgiri/golib/renderer"
)

func Kanjis(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        AccessViolation(w, r)
        return
    }

    mastered := BOOL_COOKIE_QUERY("mastered", w, r)

    user := logic.User{}
    user.Find(session.Auth.Id)

    dto := DtoKanji{
        ShowMastered: mastered,
        Mastered: 0,
    }

    fil, _ := renderer.ReadArtifact("kanji.html", w.Header())
    renderer.Render(session, w, fil, dto)
}

func OneKanji(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        // FIXME: Load new non saved word from dictionary...
        AccessViolation(w, r)
        return
    }

    q := r.PathValue("kanji")
    if "" == q {
        AccessViolation(w, r)
        return
    }

    user := logic.User{}
    user.Find(session.Auth.Id)

    kanji := logic.Kanji{}
    kanji.FindByName(user, q)

    fil, _ := renderer.ReadArtifact("show_kanji.html", w.Header())
    renderer.Render(session, w, fil, kanji)
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

    w.Header().Set("Content-Type", "text/plain")
    w.Header().Set("Cache-Control", "no-cache")

    // Ensure the ResponseWriter supports flushing
    flusher, ok := w.(http.Flusher)
    if !ok {
        http.Error(w, "Streaming not supported", http.StatusInternalServerError)
        return
    }

    user := logic.User{}
    word := logic.Word{}

    users := user.List()


    for i, u := range(users) {
        words := word.List(u, logic.Filter{Mastered: true})

        for j, wd := range(words) {
            wd.Kanjis = logic.FetchAndAddKanjisFromWord(wd)
            wd.Update()

            fmt.Fprintf(w, "User: %d/%d; Word: %d/%d done\n", i+1, len(users), j+1, len(words))
            flusher.Flush()
        }
    }

    fmt.Fprintf(w, "Done")
    flusher.Flush()
}

