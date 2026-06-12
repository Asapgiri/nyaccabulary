package api

import (
	"compress/gzip"
	"encoding/json"
	"time"

	"net/http"
	"nyaccabulary/logic"
	"nyaccabulary/pages"
)

func write_json(w http.ResponseWriter, s any) {
    send, _ := json.Marshal(s)
    w.Header().Set("Content-Type", "application/json")
    w.Write(send)
}

func write_json_gz(w http.ResponseWriter, s any) {
    w.Header().Set("Content-Type", "application/json")
    w.Header().Set("Content-Encoding", "gzip")

    gz := gzip.NewWriter(w)
    defer gz.Close()

    json.NewEncoder(gz).Encode(s)
}

func WordList(w http.ResponseWriter, r *http.Request) {
    session := pages.GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        pages.AccessViolation(w, r)
        return
    }

    start := time.Now()

    // FIXME: Should be replaced for proper filter..
    mastered := pages.BOOL_COOKIE_QUERY("mastered", w, r)

    user := logic.User{}
    user.Find(session.Auth.Id)

    word := logic.Word{}
    words := word.List(user, mastered)

    to_send := MapWordList(words)

    elapsed := time.Since(start) // time since start
    log.Printf("End: %s\n", elapsed)

    write_json_gz(w, to_send)

    log.Printf("End: %s\n", elapsed)
}


func WordAdd(w http.ResponseWriter, r *http.Request) {
    session := pages.GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        pages.AccessViolation(w, r)
        return
    }

    user := logic.User{}
    user.Find(session.Auth.Id)

    //entseq := r.FormValue

}
