package api

import (
	"net/http"
	"nyaccabulary/server/logic"
	"nyaccabulary/server/pages"
)

func KanjiList(w http.ResponseWriter, r *http.Request) {
    session := pages.GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        AccessViolation(w, r)
        return
    }

    user := logic.User{}
    user.Find(session.Auth.Id)

    kanji := logic.Kanji{}
    var to_send any

    id := r.PathValue("id")

    if "" != id {
        kanji.Find(id)
        wd := Kanji{}
        wd.Map(kanji)
        to_send = wd
    } else {
        filter := pages.ParseFilter(r)

        meta := kanji.GetMeta(user, filter)
        kanjis := kanji.List(user, filter)

        to_send = PagedResponse{
            Page: Page{
                Current: filter.Page,
                Count: int(meta.PageCount),
                Limit: filter.Limit,
            },
            Stats: Stats{
                Mastered: int(meta.Mastered),
                Learning: int(meta.Learning),
                Count: int(meta.Count),
            },
            Data:   MapKanjiList(kanjis),
        }
    }

    write_json_gz(w, to_send)
}

func KanjiPatch(w http.ResponseWriter, r *http.Request) {
    session := pages.GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        AccessViolation(w, r)
        return
    }

    id          := r.PathValue("id")
    function    := r.PathValue("func")

    var rkanji Kanji
    kanji := logic.Kanji{}
    kanji.Find(id)

    if "" == kanji.Id || kanji.User.Id != session.Auth.Id {
        AccessViolation(w, r)
        return
    }

    switch function {
    case "new":
        kanji.Status = logic.MASTERY.UNKNOWN
    case "force":
        kanji.Status = logic.MASTERY.MASTERED
    case "set":
        if logic.MASTERY.LEARNING == kanji.Status {
            kanji.Status = logic.MASTERY.MASTERED
        } else {
            kanji.Status = logic.MASTERY.LEARNING
        }
    case "unset":
        kanji.Status = logic.MASTERY.UNKNOWN
    default:
        write_json(w, Response{Status: "ERROR", Errors: "Undecognised function"})
        return
    }

    kanji.Update()
    rkanji.Map(kanji)

    write_json(w, rkanji)
}

func KanjiDelete(w http.ResponseWriter, r *http.Request) {
    session := pages.GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        AccessViolation(w, r)
        return
    }

    user := logic.User{}
    user.Find(session.Auth.Id)

    id := r.PathValue("id")
    kanji := logic.Kanji{}
    kanji.Find(id)

    if "" == kanji.Id || kanji.User.Id != session.Auth.Id {
        AccessViolation(w, r)
        return
    }

    kanji.Delete()

    write_json(w, Response{Status: "DONE"})
}
