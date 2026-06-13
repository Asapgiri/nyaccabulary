package pages

import (
	"fmt"
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

// func sync(user logic.User, words MkWords) {
//     // TODO: ...
// }

func lookUpAllWordMatches(user logic.User, query string, em bool) []SearchResult {
    var retlist []SearchResult

    word := logic.Word{}
    words := word.List(user, logic.Filter{Mastered: true})

    for _, dictf := range(config.Config.JMdict.Entries) {
        for _, kele := range(dictf.KEle) {
            if !em && strings.Contains(kele.KEB, query) || em && kele.KEB == query {
                res := SearchResult{
                    Result: dictf,
                }

                for _, w := range words {
                    if w.DictForm.EntSeq == dictf.EntSeq {
                        res.Word = w
                        break
                    }
                }

                retlist = append(retlist, res)
            }
        }
    }

    return retlist
}

func LookUpWords(word string) (config.Entry, bool) {
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

    filter := ParseFilter(r)

    user := logic.User{}
    user.Find(session.Auth.Id)

    word := logic.Word{}
    words := word.List(user, filter)
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
        if logic.MASTERY.MASTERED == word.Status {
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

func BOOL_COOKIE_QUERY(name string, w http.ResponseWriter, r *http.Request) bool {
    m := r.URL.Query().Get(name)
    var result bool

    if m != "" {
        // GET parameter exists → update value and cookie
        result = (m == "on" || m == "true")
        http.SetCookie(w, &http.Cookie{
            Name:     name,
            Value:    fmt.Sprintf("%t", result),
            Path:     "/",
            MaxAge:   365 * 24 * 60 * 60, // 1 year
            HttpOnly: true,
        })
    } else {
        // No GET parameter → try reading cookie
        if c, err := r.Cookie(name); err == nil {
            result = (c.Value == "true")
        } else {
            result = false // default
        }
    }

    return result
}

func Words(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        AccessViolation(w, r)
        return
    }

    // FIXME: Should be replaced for proper filter..
    mastered := BOOL_COOKIE_QUERY("mastered", w, r)

    user := logic.User{}
    user.Find(session.Auth.Id)

    dto := DtoRoot{
        ShowMastered: mastered,
        Mastered: 0,
    }

    fil, _ := renderer.ReadArtifact("words.html", w.Header())
    renderer.Render(session, w, fil, dto)
}

func WordsFailedToAdd(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        AccessViolation(w, r)
        return
    }

    user := logic.User{}
    user.Find(session.Auth.Id)

    word := logic.Word{}
    words := word.ListFailed(user)

    dto := DtoRoot{
        Words: words,
        WordCount: len(words),
    }

    fil, _ := renderer.ReadArtifact("words.html", w.Header())
    renderer.Render(session, w, fil, dto)
}

func OneWord(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        // FIXME: Load new non saved word from dictionary...
        AccessViolation(w, r)
        return
    }

    kanji := r.PathValue("word")
    if "" == kanji {
        AccessViolation(w, r)
        return
    }

    user := logic.User{}
    user.Find(session.Auth.Id)

    word := logic.Word{}
    word.FindByKanji(user, kanji)

    fil, _ := renderer.ReadArtifact("show_word.html", w.Header())
    renderer.Render(session, w, fil, word)
}

func GetWordMeaning(dictf config.Entry) (string) {
    // Fill in data [english only...]
    for _, s := range(dictf.Sense) {
        for _, gloss := range(s.Gloss) {
            if "en" == gloss.Lang || "" == gloss.Lang || "eng" == gloss.Lang {
                // FIXME: Pay attention te examples and stuff...
                return gloss.Value
            }
        }
    }
    return ""
}

type bulkP struct {
    Kanji   string
    Kana    string
    Meaning string
    Status  string
}

// Clean up word from syntax
// kanji[,hiragana][,meaning][+]
func parseBulkLine(line string) logic.Word {
    var ret logic.Word

    if len(line) == 1 {
        ret.Kanji = line
        return ret
    }

    runic := []rune(line)
    lc := runic[len(runic)-1]
    if '+' == lc || '＋' == lc {
        ret.Status = logic.MASTERY.MASTERED
        line = strings.ReplaceAll(line, "+", "")
        line = strings.ReplaceAll(line, "＋", "")
    } else {
        ret.Status = logic.MASTERY.NEW
    }

    parts := strings.Split(line, ",")
    if len(parts) >= 3 {
        ret.Kana = parts[1]
        ret.Meaning = parts[2]
    } else if len(parts) == 2 {
        ret.Meaning = parts[1]
    }
    ret.Kanji = parts[0]

    return ret
}

type BulkInfo struct {
    Added   []string
    Exists  []string
    Failed  []string
}

func BulkAdd(user logic.User, s string) BulkInfo {
    var info BulkInfo

    if "" == s {
        return info
    }

    ww := logic.Word{}
    known_words := ww.List(user, logic.Filter{Mastered: true})

    for _, l := range(strings.Split(s, "\n")) {
        line := strings.TrimSpace(l)
        if "" != line {
            bulkline := parseBulkLine(line)

            // Check if word is already in users dictionary...
            exists := false
            for _, kw := range(known_words) {
                if kw.Kanji == bulkline.Kanji {
                    exists = true
                }
            }
            if exists {
                info.Exists = append(info.Exists, bulkline.Kanji)
                continue
            }

            dictf, ok := LookUpWords(bulkline.Kanji)
            if ok {
                bulkline.DictForm = dictf

                if "" == bulkline.Kana && len(dictf.REle) > 0 {
                    bulkline.Kana = dictf.REle[0].REB
                }

                if "" == bulkline.Meaning {
                    bulkline.Meaning = GetWordMeaning(dictf)
                }

                info.Added = append(info.Added, bulkline.Kanji)
            } else {
                info.Failed = append(info.Failed, bulkline.Kanji)
                bulkline.Status = logic.MASTERY.LOOKUP_FAILED
            }

            bulkline.Date = time.Now()
            bulkline.User = user
            bulkline.Add()
        }
    }

    return info
}

func WordsBulkAdd(w http.ResponseWriter, r *http.Request) {
    sess := GetCurrentSession(w, r)

    if "" == sess.Auth.Username {
        AccessViolation(w, r)
        return
    }

    lines := r.FormValue("form[words]")
    if "" == lines {
        fil, _ := renderer.ReadArtifact("wordsbulk.html", w.Header())
        renderer.Render(sess, w, fil, nil)
    }

    user := logic.User{}
    user.Find(sess.Auth.Id)

    info := BulkAdd(user, lines)

    sess.Notice.Set(session.NOTICE.INFO, "Words already on list: " + strings.Join(info.Exists, ", "))
    sess.Notice.Set(session.NOTICE.SUCCESS, "Added: '" + strings.Join(info.Added, ", "))
    sess.Notice.Set(session.NOTICE.WARNING, "Failed to add: '" + strings.Join(info.Added, ", "))
    // ...

    http.Redirect(w, r, "/word", http.StatusSeeOther)
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

    dictf, ok := LookUpWords(kanji)

    if "" == meaning && ok {
        if len(dictf.REle) > 0 {
            kana = dictf.REle[0].REB
        }

        meaning = GetWordMeaning(dictf)
    }

    if "" != strings.TrimSpace(kanji) || "" != strings.TrimSpace(meaning) {
        word := logic.Word{
            Date: time.Now(),
            User: user,
            Kanji: kanji,
            Kana: kana,
            Meaning: meaning,
            Status: logic.MASTERY.NEW,
            DictForm: dictf,
        }
        word.Add()
    } else {
        sess.Notice.Set(session.NOTICE.DANGER, "Cannot add empty word!")
    }

    http.Redirect(w, r, "/", http.StatusSeeOther)
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
        FindWordInStore(session, words.([]logic.Word), word.Id)
    }

    http.Redirect(w, r, "/", http.StatusSeeOther)
}

func FindWordInStore(session session.Sessioner, words []logic.Word, id string) logic.Word {
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
        words = orderWordsLearn(word.List(user, logic.Filter{}))
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

    word := FindWordInStore(session, words.([]logic.Word), id)

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

    if "force" == function {
        word.Status = logic.MASTERY.MASTERED
    } else if "set" == function {
        if logic.MASTERY.LEARNING == word.Status {
            word.Status = logic.MASTERY.MASTERED
            // Remove word from current word store for user..
            words, ok := session.Store.Get("words-learn")
            if ok {
                FindWordInStore(session, words.([]logic.Word), word.Id)
            }
        } else {
            word.Status = logic.MASTERY.LEARNING
        }
    } else {
        word.Status = logic.MASTERY.UNKNOWN
    }
    word.Update()

    http.Redirect(w, r, r.Referer(), http.StatusSeeOther)
}

func WordSearch(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        http.Redirect(w, r, "/", http.StatusSeeOther)
        return
    }

    user := logic.User{}
    user.Find(session.Auth.Id)

    m := r.URL.Query().Get("exactmatch")

    dto := DtoSearch{
        Query: r.URL.Query().Get("query"),
        ExactMatch: (m == "on" || m == "true"),
    }

    if "" != dto.Query {
        dto.Results = lookUpAllWordMatches(user, dto.Query, dto.ExactMatch)
    }

    fil, _ := renderer.ReadArtifact("search.html", w.Header())
    renderer.Render(session, w, fil, dto)
}

func WordAdd(w http.ResponseWriter, r *http.Request) {
    sess := GetCurrentSession(w, r)

    if "" == sess.Auth.Username {
        http.Redirect(w, r, "/", http.StatusSeeOther)
        return
    }

    user := logic.User{}
    user.Find(sess.Auth.Id)

    entseq := r.PathValue("entseq")

    var dictf config.Entry
    for _, e := range config.Config.JMdict.Entries {
        if e.EntSeq == entseq {
            dictf = e
            break
        }
    }

    if "" != dictf.EntSeq {
        word := logic.Word{
            Date: time.Now(),
            User: user,
            Kanji: dictf.KEle[0].KEB,
            Kana: dictf.REle[0].REB,
            Meaning: GetWordMeaning(dictf),
            Status: logic.MASTERY.NEW,
            DictForm: dictf,
        }
        word.Add()
        // FIXME: using kanji for word lookup will fail after some point...
        sess.Notice.Set(session.NOTICE.SUCCESS, "Successfully added word: " + word.Kanji)
    } else {
        sess.Notice.Set(session.NOTICE.DANGER, "Failed to add word with entry: " + entseq)
    }

    http.Redirect(w, r, r.Referer(), http.StatusSeeOther)
}
