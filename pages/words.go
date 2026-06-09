package pages

import (
	"io"
	"math/rand"
	"net/http"
	"nyaccabulary/config"
	"nyaccabulary/logic"
	"slices"
	"strings"
	"time"

	"github.com/asapgiri/golib/renderer"
	"github.com/asapgiri/golib/session"
	"github.com/phpdave11/gofpdf"
)

func sync(user logic.User, words MkWords) {
    // TODO: ...
}

func lookUpWords(word string) (config.Entry, bool) {
    for _, w := range(config.Config.JMdict.Entries) {
        for _, kele := range(w.KEle) {
            if kele.KEB == word {
                return w, true
            }
        }
    }
    return config.Entry{}, false
}

func WordsPdf(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        AccessViolation(w, r)
        return
    }

    m := r.URL.Query().Get("mastered")
    mastered := ("on" == m || "true" == m)

    user := logic.User{}
    user.Find(session.Auth.Id)

    word := logic.Word{}
    words := word.List(user, mastered)
    slices.Reverse(words)

    pdf := gofpdf.New("P", "mm", "A4", "")
    pdf.AddUTF8Font("NotoSansJP", "", "fonts/NotoSansJP-Regular.ttf")

    pdf.SetFont("NotoSansJP", "", 12)
    pdf.AddPage()

    // pdf.Ln(5)

    for _, word := range words {
        // Check if the word is mastered
        masteredIndicator := ""
        fillColor := false
        if word.Mastered {
            masteredIndicator = "✓"
            pdf.SetFillColor(144, 238, 144) // light green RGB
            fillColor = true
        } else {
            pdf.SetFillColor(255, 255, 255) // white background
            fillColor = false
        }

        // Indicator column
        pdf.CellFormat(10, 10, masteredIndicator, "", 0, "C", fillColor, 0, "")
        // Kana
        pdf.CellFormat(40, 10, word.Kana, "", 0, "L", fillColor, 0, "")
        // Kanji
        pdf.CellFormat(40, 10, word.Kanji, "", 0, "L", fillColor, 0, "")
        // Meaning
        pdf.MultiCell(110, 10, word.Meaning, "", "L", fillColor)
    }

    w.Header().Set("Content-Type", "application/pdf")
    w.Header().Set("Content-Disposition", `inline; filename="words.pdf"`)

    pdf.Output(w)
}

func WordSync(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        AccessViolation(w, r)
        return
    }

    http.Redirect(w, r, "/word", http.StatusSeeOther)
}

func Words(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        AccessViolation(w, r)
        return
    }

    m := r.URL.Query().Get("mastered")
    mastered := ("on" == m || "true" == m)

    user := logic.User{}
    user.Find(session.Auth.Id)

    word := logic.Word{}
    words := word.List(user, mastered)
    slices.SortFunc(words, func(a, b logic.Word) int {
        return strings.Compare(a.Kanji, b.Kanji)
    })

    dto := DtoRoot{
        Words: words,
        ShowMastered: mastered,
        Mastered: 0,
        WordCount: len(words),
    }

    if mastered {
        for _, w := range(words) {
            if w.Mastered {
                dto.Mastered++
            }
        }
    }

    fil, _ := renderer.ReadArtifact("words.html", w.Header())
    renderer.Render(session, w, fil, dto)
}

func WordsBulkAdd(w http.ResponseWriter, r *http.Request) {
    sess := GetCurrentSession(w, r)

    if "" == sess.Auth.Username {
        AccessViolation(w, r)
        return
    }

    words := r.FormValue("form[words]")

    user := logic.User{}
    user.Find(sess.Auth.Id)

    ww := logic.Word{}
    known_words := ww.List(user, true)

    if "" != words {
        for _, w := range(strings.Split(words, "\n")) {
            word := strings.TrimSpace(w)
            if "" != word {
                // Check if word is already in users dictionary...
                exists := false
                for _, kw := range(known_words) {
                    if kw.Kanji == word {
                        exists = true
                    }
                }
                if exists {
                    sess.Notice.Set(session.NOTICE.INFO, "Word '" + word + "' is already in known list.")
                    continue
                }

                dictf, ok := lookUpWords(word)
                if ok {
                    kana := ""
                    meaning := ""

                    if len(dictf.REle) > 0 {
                        kana = dictf.REle[0].REB
                    }

                    // Fill in data [english only...]
                    for _, s := range(dictf.Sense) {
                        for _, gloss := range(s.Gloss) {
                            if "en" == gloss.Lang || "" == gloss.Lang || "eng" == gloss.Lang {
                                // FIXME: Pay attention te examples and stuff...
                                meaning = gloss.Value
                            }
                        }
                    }

                    new_word := logic.Word{
                        Date: time.Now(),
                        User: user,
                        Kanji: word,
                        Kana: kana,
                        Meaning: meaning,
                        DictForm: dictf,
                    }
                    new_word.Add()
                    sess.Notice.Set(session.NOTICE.SUCCESS, "Added '" + word + "' successfully.")
                } else {
                    sess.Notice.Set(session.NOTICE.WARNING, "Failed to add word: '" + word + "'.")
                }
            }
        }

        // ...

        http.Redirect(w, r, "/word", http.StatusSeeOther)
        return
    }

    fil, _ := renderer.ReadArtifact("wordsbulk.html", w.Header())
    renderer.Render(sess, w, fil, nil)
}

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
    dictf   := config.Entry{}

    if "" == meaning {
        dictf, ok := lookUpWords(kanji)
        if ok {
            // b, _ := json.MarshalIndent(dictf, "", "  ")
            // log.Println(string(b))
            // for _, k := range(dictf) {}

            if len(dictf.REle) > 0 {
                kana = dictf.REle[0].REB
            }

            // Fill in data [english only...]
            for _, s := range(dictf.Sense) {
                for _, gloss := range(s.Gloss) {
                    if "en" == gloss.Lang || "" == gloss.Lang || "eng" == gloss.Lang {
                        // FIXME: Pay attention te examples and stuff...
                        meaning = gloss.Value
                    }
                }
            }
        }
    }

    if "" != strings.TrimSpace(kanji) || "" != strings.TrimSpace(meaning) {
        word := logic.Word{
            Date: time.Now(),
            User: user,
            Kanji: kanji,
            Kana: kana,
            Meaning: meaning,
            DictForm: dictf,
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
        words = orderWordsLearn(word.List(user, false))
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

func WordMaster(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        http.Redirect(w, r, "/", http.StatusSeeOther)
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

    word.Mastered = "set" == function
    word.Update()

    // Remove word from current word store for user..
    words, ok := session.Store.Get("words-learn")
    if ok {
        findWordInStore(session, words.([]logic.Word), word.Id)
    }

    http.Redirect(w, r, r.Referer(), http.StatusSeeOther)
}
