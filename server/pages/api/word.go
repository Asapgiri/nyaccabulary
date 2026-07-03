package api

import (
	"encoding/json"
	"io"
	"net/http"
	"nyaccabulary/server/config"
	"nyaccabulary/server/logic"
	"nyaccabulary/server/pages"
	"strings"
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
        filter := pages.ParseFilter(r)

        meta := word.GetMeta(user, filter)
        words := word.List(user, filter)

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
            Data:   MapWordList(words),
        }
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
                User: user,
                Meaning: pages.GetWordMeaning(dictf),
                Status: logic.MASTERY.NEW,
                DictForm: dictf,
            }

            if len(dictf.KEle) > 0 && len(dictf.REle) > 0 {
                word.Kanji = dictf.KEle[0].KEB
                word.Kana = dictf.REle[0].REB
            } else if len(dictf.REle) > 0 {
                word.Kanji = dictf.REle[0].REB
                word.Kana = dictf.REle[0].REB
            } else {
                write_json(w, Response{Status: "ERROR", Errors: "KEle and REle lookup failed from entseq: " + entseq})
                return
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

    l, _ := io.ReadAll(r.Body)
    lines := string(l)
    if "" == lines {
        AccessViolation(w, r)
        return
    }

    user := logic.User{}
    user.Find(session.Auth.Id)

    w.Header().Set("Content-Type", "text/event-stream")
    w.Header().Set("Cache-Control", "no-cache")
    w.Header().Set("Connection", "keep-alive")

    flusher, ok := w.(http.Flusher)
    if !ok {
        http.Error(w, "Streaming not supported", http.StatusInternalServerError)
        return
    }

    enc := json.NewEncoder(w)

    write_json(w, pages.BulkAdd(user, lines, func(i, count int) {
        enc.Encode(struct {
            Index int `json:"index"`
            Count int `json:"count"`
        }{ Index: i, Count: count, })
        flusher.Flush()
    }))
    flusher.Flush()
}

func mark_word_kanjis(word logic.Word) {
    for _, k := range word.Kanjis {
        if logic.MASTERY.MASTERED != k.Status && logic.MASTERY.LEARNING != k.Status {
            k.Status = logic.MASTERY.LEARNING
            k.Update()
        }
    }
}

func WordPatch(w http.ResponseWriter, r *http.Request) {
    session := pages.GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        AccessViolation(w, r)
        return
    }

    id          := r.PathValue("id")
    function    := r.PathValue("func")

    var rword Word
    word := logic.Word{}
    word.Find(id)

    if "" == word.Id || word.User.Id != session.Auth.Id {
        AccessViolation(w, r)
        return
    }

    switch function {
    case "new":
        word.Status = logic.MASTERY.UNKNOWN
    case "force":
        word.Status = logic.MASTERY.MASTERED
        mark_word_kanjis(word)
    case "set":
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
        mark_word_kanjis(word)
    case "unset":
        word.Status = logic.MASTERY.UNKNOWN
    case "update":
        var update WordAddRequest
        json.NewDecoder(r.Body).Decode(&update)
        if "" != update.Kanji {
            var kanjis_to_add []logic.Kanji
            word.Kanji = strings.TrimSpace(update.Kanji)
            word.Kanjis, kanjis_to_add = logic.FetchAndAddKanjisFromWord(word, []logic.Kanji{})
            kanji := logic.Kanji{}
            kanji.BulkAdd(kanjis_to_add)
        }
        if "" != update.Kana {
            word.Kana = strings.TrimSpace(update.Kana)
        }
        if "" != update.Meaning {
            word.Meaning = strings.TrimSpace(update.Meaning)
        }
    default:
        write_json(w, Response{Status: "ERROR", Errors: "Undecognised function"})
        return
    }

    word.Update()
    rword.Map(word)

    write_json(w, rword)
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

func WordSearch(w http.ResponseWriter, r *http.Request) {
    session := pages.GetCurrentSession(w, r)

    user := logic.User{}

    if "" != session.Auth.Username {
        user.Find(session.Auth.Id)
    }

    m := r.URL.Query().Get("exactmatch")

    dto := pages.DtoSearch{
        Query: r.URL.Query().Get("query"),
        ExactMatch: (m == "on" || m == "true"),
    }

    if "" != dto.Query {
        dto.Results = pages.LookUpAllWordMatches(user, dto.Query, dto.ExactMatch)
    }

    write_json_gz(w, dto)
}
