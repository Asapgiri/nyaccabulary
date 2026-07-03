package pages

import (
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"nyaccabulary/server/config"
	"nyaccabulary/server/logic"
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

func foundInKele(dictf config.Entry, query string, em bool) bool {
    for _, kele := range(dictf.KEle) {
        if !em && strings.Contains(kele.KEB, query) || em && kele.KEB == query {
            return true
        }
    }
    return false
}

func foundInRele(dictf config.Entry, query string, em bool) bool {
    for _, rele := range(dictf.REle) {
        if !em && strings.Contains(rele.REB, query) || em && rele.REB == query {
            return true
        }
    }
    return false
}

func foundInGloss(dictf config.Entry, query string, em bool) bool {
    query = strings.ToLower(query)
    for _, sense := range(dictf.Sense) {
        for _, gloss := range sense.Gloss {
            if !em && strings.Contains(gloss.Value, query) || em && gloss.Value == query {
                return true
            }
        }
    }
    return false
}

func createResult(dictf config.Entry, words []logic.Word) SearchResult {
    res := SearchResult{
        Result: dictf,
    }

    // Look up if user already have the word saved
    for _, w := range words {
        if w.DictForm.EntSeq == dictf.EntSeq {
            res.Word = w
            break
        }
    }

    return res
}

func LookUpAllWordMatches(user logic.User, query string, em bool) []SearchResult {
    var retlist []SearchResult

    word := logic.Word{}
    words := word.List(user, logic.Filter{Mastered: true})

    for _, dictf := range(config.Config.JMdict.Entries) {
        if foundInKele(dictf, query, em) || foundInRele(dictf, query, em) || foundInGloss(dictf, query, em) {
            retlist = append(retlist, createResult(dictf, words))
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

    f := r.PathValue("filter")
    log.Println(f)

    filter := logic.Filter{}
    json.Unmarshal([]byte(f), &filter)
    log.Println(filter)

    user := logic.User{}
    user.Find(session.Auth.Id)

    word := logic.Word{}
    words := word.List(user, filter)
    slices.Reverse(words)

    pdf := gofpdf.New("P", "mm", "A4", "")
    font := "UDDigiKyokashoN"
    pdf.AddUTF8Font(font, "", "fonts/UDDigiKyokashoNK-R-03.ttf")

    pageW, _ := pdf.GetPageSize()
    left, _, right, _ := pdf.GetMargins()
    usableWidth := pageW - left - right

    cardWidth := usableWidth / 3
    textHeight := cardWidth / 3

    pdf.AddPage()

    for i, w := range words {
        r, g, b := statusColor(w.Status)
        pdf.SetFillColor(r, g, b)
        pdf.SetTextColor(255, 255, 255)
        pdf.SetFont(font, "", 7)
        pdf.CellFormat(1, textHeight-1, "", "", 0, "l", true, 0, "")
        pdf.SetTextColor(0, 0, 0)

        x, y := pdf.GetXY()

        // kanji
        pdf.SetXY(x+1, y)
        pdf.SetFont(font, "", 18)
        pdf.CellFormat(cardWidth-2, textHeight / 3, trim(pdf, w.Kanji, cardWidth-2), "", 0, "L", false, 0, "")

        // kana
        pdf.SetXY(x+1, y + (textHeight / 3))
        pdf.SetFont(font, "", 10)
        pdf.CellFormat(cardWidth-2, textHeight / 3, trim(pdf, w.Kana, cardWidth-2), "", 0, "L", false, 0, "")

        // meaning
        pdf.SetXY(x+1, y + (textHeight / 3 * 2))
        pdf.CellFormat(cardWidth-2, textHeight / 3, trim(pdf, w.Meaning, cardWidth-2), "", 0, "L", false, 0, "")

        if 0 != ((i+1) % 3) {
            pdf.SetXY(x+cardWidth-1, y)
        } else {
            x, y := pdf.GetXY()
            pdf.SetXY(x-usableWidth, y+(textHeight / 3 * 2))
        }
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

func BulkAdd(user logic.User, s string, progress func(int, int)) BulkInfo {
    var info BulkInfo

    if "" == s {
        return info
    }

    ww := logic.Word{}
    known_words := ww.List(user, logic.Filter{Mastered: true})

    lines := strings.Split(s, "\n")

    for i, l := range(lines) {
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
            } else if "" != bulkline.Meaning {
                info.Added = append(info.Added, bulkline.Kanji)
            } else {
                info.Failed = append(info.Failed, bulkline.Kanji)
                bulkline.Status = logic.MASTERY.LOOKUP_FAILED
            }

            bulkline.Date = time.Now()
            bulkline.User = user
            bulkline.Add()
            if ok || "" != bulkline.Meaning {
                known_words = append(known_words, bulkline)
            }
        }
        if nil != progress {
            progress(i, len(lines))
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

    info := BulkAdd(user, lines, nil)

    if len(info.Exists) > 0 {
        sess.Notice.Set(session.NOTICE.INFO, "Words already on list: '" + strings.Join(info.Exists, ", ") + "'")
    }
    if len(info.Added) > 0 {
        sess.Notice.Set(session.NOTICE.SUCCESS, "Added: '" + strings.Join(info.Added, ", ") + "'")
    }
    if len(info.Failed) > 0 {
        sess.Notice.Set(session.NOTICE.WARNING, "Failed to add: '" + strings.Join(info.Failed, ", ") + "'")
    }
    // ...

    http.Redirect(w, r, r.Referer(), http.StatusSeeOther)
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
        dto.Results = LookUpAllWordMatches(user, dto.Query, dto.ExactMatch)
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
            User: user,
            Meaning: GetWordMeaning(dictf),
            Status: logic.MASTERY.NEW,
            DictForm: dictf,
        }

        if len(dictf.KEle) > 0 && len(dictf.REle) > 0 {
            word.Kanji = dictf.KEle[0].KEB
            word.Kana = dictf.REle[0].REB
        } else if len(dictf.REle) > 0 {
            word.Kanji = dictf.REle[0].REB
            word.Kana = dictf.REle[0].REB
        } else {
            sess.Notice.Set(session.NOTICE.DANGER, "Failed to add word with entry: " + entseq)
            http.Redirect(w, r, r.Referer(), http.StatusSeeOther)
            return
        }

        word.Add()
        sess.Notice.Set(session.NOTICE.SUCCESS, "Successfully added word: " + word.Kanji)
    } else {
        sess.Notice.Set(session.NOTICE.DANGER, "Failed to add word with entry: " + entseq)
    }

    http.Redirect(w, r, r.Referer(), http.StatusSeeOther)
}
