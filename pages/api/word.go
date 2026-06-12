package api

import (
	"encoding/json"
	//"math"
	"net/http"
	"nyaccabulary/logic"
	"nyaccabulary/pages"
)

func write_json(w http.ResponseWriter, s any) {
    send, err := json.Marshal(s)

    log.Println(err)

    w.Header().Set("Content-Type", "application/json")
    w.Write(send)
}

func WordList(w http.ResponseWriter, r *http.Request) {
    session := pages.GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        pages.AccessViolation(w, r)
        return
    }

    // FIXME: Should be replaced for proper filter..
    mastered := pages.BOOL_COOKIE_QUERY("mastered", w, r)

    user := logic.User{}
    user.Find(session.Auth.Id)

    log.Println(user.Name)

    word := logic.Word{}
    words := word.List(user, mastered)

    to_send := MapWordList(words)

    write_json(w, to_send)
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
