package api

import (
	"net/http"
	"nyaccabulary/logic"
	"nyaccabulary/pages"
	"strings"
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

        for i := range kanjis {
            k := &kanjis[i]
            k.OnStr = strings.Join(k.On, ", ")
            k.KunStr = strings.Join(k.Kun, ", ")
            k.MeaningStr = strings.Join(k.Meaning, ", ")
        }

        to_send = PagedResponse{
            Page: Page{
                Current: filter.Page,
                Count: int(meta.PageCount),
                Limit: filter.Limit,
            },
            Stats: Stats{
                Mastered: int(meta.Mastered),
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

    kanji := logic.Kanji{}
    kanji.Find(id)

    if "" == kanji.Id || kanji.User.Id != session.Auth.Id {
        AccessViolation(w, r)
        return
    }

    if "new" == function {
        kanji.Status = logic.MASTERY.UNKNOWN
    } else if "force" == function {
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

    write_json(w, kanji)
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
