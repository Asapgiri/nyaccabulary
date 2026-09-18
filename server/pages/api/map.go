package api

import (
	"nyaccabulary/server/logic"
)

func (w *Word) Map(lw logic.Word) {
    w.Id            = lw.Id
    w.Date          = lw.Date
    w.LastUpdated   = lw.LastUpdated
    // w.User          = lw.User
    w.Kanji         = lw.Kanji
    w.Kana          = lw.Kana
    w.Meaning       = lw.Meaning
    w.Knows         = lw.Knows
    w.DontKnows     = lw.DontKnows
    w.Status        = lw.Status
    w.LastShown     = lw.LastShown
    w.DictForm      = lw.DictForm

    w.Kanjis        = MapKanjiListString(lw.Kanjis)
    w.Tags          = lw.Tags
}

func (k *Kanji) Map(lk logic.Kanji) {
    k.Id            = lk.Id
    k.Date          = lk.Date
    k.LastUpdated   = lk.LastUpdated
    // k.User          = lk.User
    k.Kanji         = lk.Kanji
    k.On            = lk.On
    k.Kun           = lk.Kun
    k.Meaning       = lk.Meaning
    k.Knows         = lk.Knows
    k.DontKnows     = lk.DontKnows
    k.LastShown     = lk.LastShown
    k.Status        = lk.Status
    k.DictForm      = lk.DictForm

    k.Words         = lk.Words
    k.Tags          = lk.Tags
}

func (t *Tag) Map(lt logic.Tag) {
    t.Id            = lt.Id
    t.Date          = lt.Date
    t.LastUpdated   = lt.LastUpdated
    t.Name          = lt.Name
    t.Color         = lt.Color
}

func MapWordList(lwl []logic.Word) []Word {
    wl := make([]Word, len(lwl))
    for i, w := range lwl {
        wl[i].Map(w)
    }
    return wl
}

func MapKanjiList(lkl []logic.Kanji) []Kanji {
    kl := make([]Kanji, len(lkl))
    for i, k := range lkl {
        kl[i].Map(k)
    }
    return kl
}

func MapTagList(ltl []logic.Tag) []Tag {
    tl := make([]Tag, len(ltl))
    for i, t := range ltl {
        tl[i].Map(t)
    }
    return tl
}

func MapKanjiListString(lkl []logic.Kanji) []WKanji {
    kl := make([]WKanji, len(lkl))
    for i, k := range lkl {
        kl[i] = WKanji{
            Id: k.Id,
            Kanji: k.Kanji,
            Status: k.Status,
        }
    }
    return kl
}
