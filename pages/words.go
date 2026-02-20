package pages

import (
	"net/http"
	"nyaccabulary/logic"
	"strings"
	"time"

	"github.com/asapgiri/golib/session"
)

func WordSave(w http.ResponseWriter, r *http.Request) {
    sess := GetCurrentSession(w, r)

    if "" == sess.Auth.Username {
        AccessViolation(w, r)
        return
    }

    user := logic.User{}
    user.Find(sess.Auth.Id)

    kanji   := r.FormValue("form[kanji]")
    kana    := r.FormValue("form[kana]")
    meaning := r.FormValue("form[meaning]")

    if "" != strings.TrimSpace(kanji) || "" != strings.TrimSpace(meaning) {
        word := logic.Word{
            Date: time.Now(),
            User: user,
            Kanji: kanji,
            Kana: kana,
            Meaning: meaning,
        }
        word.Add()
    } else {
        sess.Notice.Set(session.NOTICE.DANGER, "Cannot add empty word!")
    }

    http.Redirect(w, r, "/", http.StatusSeeOther)
}

func WordList(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        AccessViolation(w, r)
        return
    }

}
