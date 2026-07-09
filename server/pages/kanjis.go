package pages

import (
	"encoding/json"
	"fmt"
	"net/http"
	"nyaccabulary/server/logic"
	"slices"
	"strings"

	"github.com/asapgiri/golib/renderer"
	"github.com/phpdave11/gofpdf"
)

func calculateStringWidth(pdf *gofpdf.Fpdf, text string, width float64) int {
    runes := []rune(text)

    for i := 1; i <= len(runes); i++ {
        if pdf.GetStringWidth(string(runes[:i])) > width {
            return i - 1
        }
    }

    return len(runes)
}

func trim(pdf *gofpdf.Fpdf, text string, width float64) string {
    const suffix = " [...]"

    runes := []rune(text)

    if pdf.GetStringWidth(text) <= width-1 {
        return text
    }

    maxRunes := calculateStringWidth(pdf, text, width-3)

    if maxRunes < 0 {
        maxRunes = 0
    }

    return string(runes[:maxRunes])
}

func statusColor(status string) (r, g, b int) {
	switch status {
	case logic.MASTERY.MASTERED:
		return 46, 125, 50 // green
	case logic.MASTERY.LEARNING:
		return 255, 193, 7 // amber
	case logic.MASTERY.NEW:
		return 33, 150, 243 // blue
	default:
		return 255, 255, 255
	}
}

func KanjisPdf(w http.ResponseWriter, r *http.Request) {
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

    kanji := logic.Kanji{}
    kanjis := kanji.List(user, filter)
    slices.Reverse(kanjis)

    pdf := gofpdf.New("P", "mm", "A4", "")
    font := "UDDigiKyokashoN"
    pdf.AddUTF8Font(font, "", "fonts/UDDigiKyokashoNK-R-03.ttf")

    pageW, _ := pdf.GetPageSize()
    left, _, right, _ := pdf.GetMargins()
    usableWidth := pageW - left - right

    cellWidth := usableWidth / 3
    kanjiWidth := cellWidth / 4
    textWidth := (kanjiWidth * 3) - 3
    textHeight := kanjiWidth / 3

    pdf.AddPage()

    for i, k := range kanjis {
        r, g, b := statusColor(k.Status)
        pdf.SetFillColor(r, g, b)
        pdf.SetTextColor(255, 255, 255)
        pdf.SetFont(font, "", 7)
        pdf.CellFormat(1, kanjiWidth-1, "", "", 0, "l", true, 0, "")
        pdf.SetTextColor(0, 0, 0)


        pdf.SetFont(font, "", 32)
        pdf.CellFormat(kanjiWidth, kanjiWidth, k.Kanji, "", 0, "L", false, 0, "")

        pdf.SetFont(font, "", 10)
        text := fmt.Sprintf(
            "%s\n%s\n%s",
            trim(pdf, "On: " + strings.Join(k.On, ", "), textWidth),
            trim(pdf, "Kun: " + strings.Join(k.Kun, ", "), textWidth),
            trim(pdf, strings.Join(k.Meaning, ", "), textWidth),
        )
        x, y := pdf.GetXY()
        pdf.MultiCell(textWidth, textHeight, text, "", "L", false)
        // reset cursor next to current cell, if not end of line
        if 0 != ((i+1) % 3) {
            pdf.SetXY(x+textWidth, y)
        } else {
            x, y := pdf.GetXY()
            pdf.SetXY(x, y+5)
        }
    }

    w.Header().Set("Content-Type", "application/pdf")
    w.Header().Set("Content-Disposition", `inline; filename="kanjis.pdf"`)

    pdf.Output(w)
}

func Kanjis(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        AccessViolation(w, r)
        return
    }

    mastered := BOOL_COOKIE_QUERY("mastered", w, r)

    user := logic.User{}
    user.Find(session.Auth.Id)

    dto := DtoKanji{
        ShowMastered: mastered,
        Mastered: 0,
    }

    fil, _ := renderer.ReadArtifact("kanji.html", w.Header())
    renderer.Render(session, w, fil, dto)
}

func OneKanji(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        // FIXME: Load new non saved word from dictionary...
        AccessViolation(w, r)
        return
    }

    q := r.PathValue("kanji")
    if "" == q {
        AccessViolation(w, r)
        return
    }

    user := logic.User{}
    user.Find(session.Auth.Id)

    kanji := logic.Kanji{}
    kanji.FindByName(user, q)

    fil, _ := renderer.ReadArtifact("show_kanji.html", w.Header())
    renderer.Render(session, w, fil, kanji)
}

func KanjiMaster(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        http.Redirect(w, r, "/", http.StatusSeeOther)
        return
    }

    id          := r.PathValue("id")
    function    := r.PathValue("func")

    kanji := logic.Kanji{}
    kanji.Find(id)

    if "" == kanji.Id || kanji.User.Id != session.Auth.Id {
        AccessViolation(w, r)
        return
    }

    if "force" == function {
        kanji.Status = logic.MASTERY.MASTERED
    } else if "set" == function {
        if logic.MASTERY.LEARNING == kanji.Status {
            kanji.Status = logic.MASTERY.MASTERED
        } else {
            kanji.Status = logic.MASTERY.LEARNING
        }
    } else {
        kanji.Status = logic.MASTERY.UNKNOWN
    }
    kanji.Update()

    http.Redirect(w, r, r.Referer(), http.StatusSeeOther)
}

func AdminKanjisSyncAllWords(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    if !checkAdminPageAccess(session) {
        NotFound(w, r)
        return
    }

    w.Header().Set("Content-Type", "text/plain")
    w.Header().Set("Cache-Control", "no-cache")

    // Ensure the ResponseWriter supports flushing
    flusher, ok := w.(http.Flusher)
    if !ok {
        http.Error(w, "Streaming not supported", http.StatusInternalServerError)
        return
    }

    user := logic.User{}
    word := logic.Word{}
    kanji := logic.Kanji{}

    users := user.List()

    var kanji_refresh_list []logic.Kanji
    var word_update_list []logic.Word

    for i, u := range(users) {
        words := word.List(u, logic.Filter{Mastered: true})
        kanji_list := kanji.List(word.User, logic.Filter{Mastered: true})

        for j, wd := range(words) {
            var kanjis_to_add []logic.Kanji
            wd.Kanjis, kanjis_to_add = logic.FetchAndAddKanjisFromWord(wd, kanji_list)
            word_update_list = append(word_update_list, wd)

            for _, k := range kanjis_to_add {
                kanji_refresh_list = append(kanji_refresh_list, k)
                kanji_list = append(kanji_list, k)
            }

            fmt.Fprintf(w, "User: %d/%d; Word: %d/%d done\n", i+1, len(users), j+1, len(words))
            flusher.Flush()
        }
    }

    word.BulkUpdate(word_update_list)
    kanji.BulkAdd(kanji_refresh_list)

    fmt.Fprintf(w, "Done")
    flusher.Flush()
}

