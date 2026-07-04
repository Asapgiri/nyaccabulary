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

func Register(w http.ResponseWriter, r *http.Request) {
    session := pages.GetCurrentSession(w, r)

    if "" != session.Auth.Username {
        AccessViolation(w, r)
        return
    }

    var resp RegisterResponse
    var req RegisterRequest
    json.NewDecoder(r.Body).Decode(&req)

    // FIXME: Check for other form values...
    if "" != req.Username {
        user := logic.User{
            Username: req.Username,
            Email: req.Email,
            Name: req.Name,
            Phone: req.Phone,
        }
        err := user.Register(req.PasswordA, req.PasswordB)
        if nil != err {
            resp = RegisterResponse{Status: "FAILURE", Error: err.Error()}
        } else {
            resp = RegisterResponse{Status: "SUCCESS", User: user}
            session.Delete(w, r)
            session.New(w, r, user.Username)
        }
    } else {
        resp = RegisterResponse{Status: "FAILURE", Error: "Invalid request!"}
    }

    write_json(w, resp)
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
