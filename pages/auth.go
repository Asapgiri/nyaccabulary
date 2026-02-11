package pages

import (
	"github.com/asapgiri/golib/renderer"
	"nyaccabulary/config"
	"nyaccabulary/logic"
	"net/http"
)

func Login(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    // FIXME: Cannot do if logged in..

    // TODO: login with phone number...?
    uname := r.FormValue("form[userNameOrEmail]")
    upass := r.FormValue("form[userPass]")

    if "" != uname {
        user := logic.User{}
        err := user.Login(uname, upass)
        if nil != err {
            session.SetError(err.Error())
        } else {
            session.Delete(w, r)
            session.New(w, r, user.Username)
        }
    } else {
        session.SetError("")
    }

    if "" == session.Auth.Username {
        fil, _ := renderer.ReadArtifact("auth/login.html", w.Header())
        session.UpdateTitle(config.Config.Site, "Login")
        renderer.Render(session, w, fil, nil)
    } else {
        http.Redirect(w, r, "/", http.StatusSeeOther)
    }
}

func Register(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    // FIXME: Cannot do if logged in..

    uuname := r.FormValue("form[userUsername]")
    uemail := r.FormValue("form[userEmail]")
    uphone := r.FormValue("form[userPhone]")
    uname := r.FormValue("form[userName]")
    upassa := r.FormValue("form[userPassA]")
    upassb := r.FormValue("form[userPassB]")

    // FIXME: Check for other form values...
    if "" != uuname {
        user := logic.User{
            Username: uuname,
            Email: uemail,
            Name: uname,
            Phone: uphone,
        }
        err := user.Register(upassa, upassb)
        if nil != err {
            session.SetError(err.Error())
            log.Println(err.Error())
        } else {
            session.Delete(w, r)
            session.New(w, r, user.Username)
        }
    } else {
        session.SetError("")
    }

    if "" == session.Auth.Username {
        fil, _ := renderer.ReadArtifact("auth/register.html", w.Header())
        session.UpdateTitle(config.Config.Site, "Register")
        renderer.Render(session, w, fil, nil)
    } else {
        http.Redirect(w, r, "/", http.StatusSeeOther)
    }
}

func Logout(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)
    session.Delete(w, r)
    http.Redirect(w, r, "/", http.StatusSeeOther)
}
