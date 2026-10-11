package api

import (
	"encoding/json"
	"net/mail"
	"net/http"
	"nyaccabulary/server/dbase"
	"nyaccabulary/server/logic"
	"nyaccabulary/server/pages"
	"strings"
	"time"
)

type UserSettingsRequest struct {
    Name string
    Email string
    Phone string
    EmailVisible bool
    PhoneVisible bool
}

type PasswordChangeRequest struct {
    CurrentPassword string
    NewPassword string
    ConfirmPassword string
}

func UserSettings(w http.ResponseWriter, r *http.Request) {
    session := pages.GetCurrentSession(w, r)
    if "" == session.Auth.Username { AccessViolation(w, r); return }

    user := logic.User{}
    user.Find(session.Auth.Id)
    var req UserSettingsRequest
    if err := json.NewDecoder(r.Body).Decode(&req); nil != err { http.Error(w, "Invalid request", http.StatusBadRequest); return }
    req.Name = strings.TrimSpace(req.Name)
    req.Email = strings.TrimSpace(req.Email)
    if "" != req.Email {
        if _, err := mail.ParseAddress(req.Email); nil != err { http.Error(w, "Enter a valid email address", http.StatusBadRequest); return }
        existing := dbase.User{}
        if err := existing.FindByEmail(req.Email); nil == err && existing.Id.Hex() != user.Id { http.Error(w, "That email address is already in use", http.StatusConflict); return }
    }
    user.Name, user.Email, user.Phone = req.Name, req.Email, strings.TrimSpace(req.Phone)
    user.EmailVisible, user.PhoneVisible = req.EmailVisible, req.PhoneVisible
    user.EditDate = time.Now()
    if err := user.Update(); nil != err { http.Error(w, "Could not save settings", http.StatusInternalServerError); return }
    write_json(w, user)
}

func UserPassword(w http.ResponseWriter, r *http.Request) {
    session := pages.GetCurrentSession(w, r)
    if "" == session.Auth.Username { AccessViolation(w, r); return }
    user := logic.User{}
    user.Find(session.Auth.Id)
    var req PasswordChangeRequest
    if err := json.NewDecoder(r.Body).Decode(&req); nil != err { http.Error(w, "Invalid request", http.StatusBadRequest); return }
    if err := user.ChangePassword(req.CurrentPassword, req.NewPassword, req.ConfirmPassword); nil != err { http.Error(w, err.Error(), http.StatusBadRequest); return }
    write_json(w, Response{Status: "SUCCESS"})
}

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
            log.Println("user not found ", req.Username)
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
