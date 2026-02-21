package pages

import (
	"io"
	"math/rand"
	"net/http"
	"nyaccabulary/logic"
	"strings"
	"time"

	"github.com/asapgiri/golib/renderer"
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

func WordDelete(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        AccessViolation(w, r)
        return
    }

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
        findWordInStore(session, words.([]logic.Word), word.Id)
    }

    http.Redirect(w, r, "/", http.StatusSeeOther)
}

func findWordInStore(session session.Sessioner, words []logic.Word, id string) logic.Word {
    for i, w := range(words) {
        if w.Id == id {
            word := w
            if len(words) > 1 {
                words = append(words[:i], words[i+1:]...)
                session.Store.Set("words-learn", words)
            } else {
                session.Store.Remove("words-learn")
            }
            return word
        }
    }

    return logic.Word{}
}

func orderWordsLearn(words []logic.Word) []logic.Word {
    words_ret := []logic.Word{}

    for _, w := range(words) {
        total := w.Knows + w.DontKnows
        var fail_rate float64

        if total > 0 {
            fail_rate = float64(w.DontKnows) / float64(total)
        } else {
            words_ret = append(words_ret, w)
            continue
        }

        days_sinse := time.Now().Sub(w.LastShown).Hours() / 24.0

        if fail_rate >= 0.50 && total < 3 && days_sinse >= 0.02 || /* FIXME: Should come from learning config [...] */
           fail_rate >= 0.30 && days_sinse >= 2 ||
           fail_rate >= 0.25 && days_sinse >= 5 ||
           fail_rate >= 0.10 && days_sinse >= 7 {
            words_ret = append(words_ret, w)
        }
    }

    return words_ret
}

func selectRandom[T any](list []T) T {
    if len(list) <= 0 {
        var zero T
        return zero
    }

    return list[rand.Intn(len(list))]
}

func WordLearn(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        http.Redirect(w, r, "/", http.StatusSeeOther)
        return
    }

    wd, ok := session.Store.Get("words-learn")
    var words []logic.Word

    if nil != wd {
        words = wd.([]logic.Word)
    } else {
        words = []logic.Word{}
    }

    if !ok || len(words) <= 0 {
        user := logic.User{}
        user.Find(session.Auth.Id)

        word := logic.Word{}
        words = orderWordsLearn(word.List(user))
        session.Store.Set("words-learn", words)
    }

    word := selectRandom(words)

    fil, _ := renderer.ReadArtifact("practice.html", w.Header())
    renderer.Render(session, w, fil, word)
}

func WordAnswer(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        http.Redirect(w, r, "/", http.StatusSeeOther)
        return
    }

    words, ok := session.Store.Get("words-learn")
    if !ok {
        // FIXME: Should be handled better?
        http.Redirect(w, r, "/learn", http.StatusSeeOther)
        return
    }

    id      := r.PathValue("id")
    answer  := r.PathValue("answer")

    word := findWordInStore(session, words.([]logic.Word), id)

    if "" == word.Id {
        http.Redirect(w, r, "/learn", http.StatusSeeOther)
        return
    }

    if answer == "easy" || answer == "good" {
        word.Knows++
    } else {
        word.DontKnows++
    }
    word.LastShown = time.Now()
    word.Update()

    io.WriteString(w, "OK")
}
