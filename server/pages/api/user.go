package api

import (
	"encoding/json"
	"net/http"
	"nyaccabulary/server/logic"
	"nyaccabulary/server/pages"
)

func UserAuth(w http.ResponseWriter, r *http.Request) {
    session := pages.GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        w.Write([]byte("{}"))
        return
    }

    user := logic.User{}
    user.Find(session.Auth.Id)

    // ausr := User{}
    // ausr.m

    write_json(w, user)
}

func Login(w http.ResponseWriter, r *http.Request) {
    session := pages.GetCurrentSession(w, r)

    if "" != session.Auth.Username {
        w.Write([]byte("{}"))
        return
    }

    var user logic.User
    var req LoginRequest
    json.NewDecoder(r.Body).Decode(&req)

    if "" != req.Username {
        err := user.Login(req.Username, req.Password)
        if nil != err {
            session.SetError(err.Error())
            log.Println("user not found ", req)
        } else {
            session.Delete(w, r)
            log.Println("logging in " + user.Username)
            session.New(w, r, user.Username)
            log.Println("logging in " + session.Auth.Username)
        }
    } else {
        session.SetError("")
    }

    write_json(w, user)
}

func Logout(w http.ResponseWriter, r *http.Request) {
    session := pages.GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        w.Write([]byte("{}"))
        return
    }

    session.Delete(w, r)
    write_json(w, Response{Status: "SUCCESS"})
}
