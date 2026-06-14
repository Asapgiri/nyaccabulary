package api

import (
	"fmt"
	"nyaccabulary/logic"
)

func (w *Word) Map(lw logic.Word) {
    w.Id            = lw.Id
    w.Date          = lw.Date
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

    w.Display.PercentageN   = fmt.Sprintf("%.2f", lw.Display.PercentageN)
    w.Display.PercentageP   = fmt.Sprintf("%.2f", lw.Display.PercentageP)
}

func (k *Kanji) Map(lk logic.Kanji) {
    k.Id            = lk.Id
    k.Date          = lk.Date
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

func MapKanjiListString(lkl []logic.Kanji) []string {
    kl := make([]string, len(lkl))
    for i, k := range lkl {
        kl[i] = k.Kanji
    }
    return kl
}
