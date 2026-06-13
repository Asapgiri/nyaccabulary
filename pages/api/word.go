package api

import (
	"encoding/json"
	"net/http"
	"nyaccabulary/config"
	"nyaccabulary/logic"
	"nyaccabulary/pages"
	"slices"
	"strings"
	"time"
)

func WordList(w http.ResponseWriter, r *http.Request) {
    session := pages.GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        AccessViolation(w, r)
        return
    }

    user := logic.User{}
    user.Find(session.Auth.Id)

    word := logic.Word{}
    var to_send any

    id := r.PathValue("id")

    if "" != id {
        word.Find(id)
        wd := Word{}
        wd.Map(word)
        to_send = wd
    } else {
        // FIXME: Should be replaced for proper filter..
        mastered := pages.BOOL_COOKIE_QUERY("mastered", w, r)
        words := word.List(user, mastered)
        slices.Reverse(words)
        to_send = MapWordList(words)
    }

    write_json_gz(w, to_send)
}

func WordAdd(w http.ResponseWriter, r *http.Request) {
    session := pages.GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        AccessViolation(w, r)
        return
    }

    user := logic.User{}
    user.Find(session.Auth.Id)

    entseq := r.PathValue("entseq")

    var rword Word

    if "" == entseq {
        var word_req WordAddRequest
        json.NewDecoder(r.Body).Decode(&word_req)

        dictf, ok := pages.LookUpWords(word_req.Kanji)

        if "" == rword.Meaning && ok {
            if len(dictf.REle) > 0 {
                word_req.Kana = dictf.REle[0].REB
            }

            word_req.Meaning = pages.GetWordMeaning(dictf)
        }

        if "" != strings.TrimSpace(word_req.Kanji) || "" != strings.TrimSpace(word_req.Meaning) {
            word := logic.Word{
                Date: time.Now(),
                User: user,
                Kanji: word_req.Kanji,
                Kana: word_req.Kana,
                Meaning: word_req.Meaning,
                Status: logic.MASTERY.NEW,
                DictForm: dictf,
            }
            word.Add()
            rword.Map(word)
        }
    } else {
        var dictf config.Entry
        for _, e := range config.Config.JMdict.Entries {
            if e.EntSeq == entseq {
                dictf = e
                break
            }
        }

        if "" != dictf.EntSeq {
            word := logic.Word{
                Date: time.Now(),
                User: user,
                Kanji: dictf.KEle[0].KEB,
                Kana: dictf.REle[0].REB,
                Meaning: pages.GetWordMeaning(dictf),
                Status: logic.MASTERY.NEW,
                DictForm: dictf,
            }
            word.Add()
            // FIXME: using kanji for word lookup will fail after some point...
            rword.Map(word)
        }
    }

    write_json(w, rword)
}

func WordBulkAdd(w http.ResponseWriter, r *http.Request) {
    session := pages.GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        AccessViolation(w, r)
        return
    }

    lines := r.FormValue("form[words]")
    if "" == lines {
        AccessViolation(w, r)
    }

    user := logic.User{}
    user.Find(session.Auth.Id)

    write_json(w, pages.BulkAdd(user, lines))
}

func WordPatch(w http.ResponseWriter, r *http.Request) {
    session := pages.GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        AccessViolation(w, r)
        return
    }

    id          := r.PathValue("id")
    function    := r.PathValue("func")

    word := logic.Word{}
    word.Find(id)

    if "" == word.Id || word.User.Id != session.Auth.Id {
        AccessViolation(w, r)
        return
    }

    if "new" == function {
        word.Status = logic.MASTERY.UNKNOWN
    } else if "force" == function {
        word.Status = logic.MASTERY.MASTERED
    } else if "set" == function {
        if logic.MASTERY.LEARNING == word.Status {
            word.Status = logic.MASTERY.MASTERED
            // Remove word from current word store for user..
            words, ok := session.Store.Get("words-learn")
            if ok {
                pages.FindWordInStore(session, words.([]logic.Word), word.Id)
            }
        } else {
            word.Status = logic.MASTERY.LEARNING
        }
    } else {
        word.Status = logic.MASTERY.UNKNOWN
    }
    word.Update()

    write_json(w, word)
}

func WordDelete(w http.ResponseWriter, r *http.Request) {
    session := pages.GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        AccessViolation(w, r)
        return
    }

    user := logic.User{}
    user.Find(session.Auth.Id)

    id := r.PathValue("id")
    word := logic.Word{}
    word.Find(id)

    if "" == word.Id || word.User.Id != session.Auth.Id {
        AccessViolation(w, r)
        return
    }

    word.Delete()

    // Remove word from current word store for user..
    words, ok := session.Store.Get("words-learn")
    if ok {
        pages.FindWordInStore(session, words.([]logic.Word), word.Id)
    }

    write_json(w, Response{Status: "DONE"})
}
