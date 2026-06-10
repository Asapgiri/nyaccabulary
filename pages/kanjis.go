package pages

import (
	"net/http"
	"nyaccabulary/logic"
	"slices"
	"strings"

	"github.com/asapgiri/golib/renderer"
)

func Kanjis(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        AccessViolation(w, r)
        return
    }

    mastered := read_mastered(w, r)

    user := logic.User{}
    user.Find(session.Auth.Id)

    kanji := logic.Kanji{}
    kanjis := kanji.List(user, mastered)
    slices.SortFunc(kanjis, func(a, b logic.Kanji) int {
        return strings.Compare(a.Kanji, b.Kanji)
    })

    dto := DtoKanji{
        Kanjis: kanjis,
        ShowMastered: mastered,
        Mastered: 0,
        KanjiCount: len(kanjis),
    }

    if mastered {
        for _, w := range(kanjis) {
            if logic.MASTERY.MASTERED == w.Status {
                dto.Mastered++
            }
        }
    }

    for i := range kanjis {
        k := &kanjis[i]
        k.OnStr = strings.Join(k.On, ", ")
        k.KunStr = strings.Join(k.Kun, ", ")
        k.MeaningStr = strings.Join(k.Meaning, ", ")
    }

    fil, _ := renderer.ReadArtifact("kanji.html", w.Header())
    renderer.Render(session, w, fil, dto)
}
