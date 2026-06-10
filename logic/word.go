package logic

import (
	"nyaccabulary/dbase"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Mastery struct {
    MASTERED    string
    LEARNING    string
    UNKNOWN     string
    NEW         string
}

var MASTERY = Mastery{
    MASTERED: "MASTERED",
    LEARNING: "LEARNING",
    UNKNOWN:  "UNKNOWN",
    NEW:      "NEW",
}


func formatDisplay(word Word) Display {
    var display Display

    total := word.DontKnows + word.Knows
    display.PercentageP = (float64(word.Knows) / float64(total)) * 100
    display.PercentageN = (float64(word.DontKnows) / float64(total)) * 100

    return display
}

func (word *Word) List(user User, showMastered bool) []Word {
    dw := dbase.Word{}

    if "" == user.Id {
        return []Word{}
    }

    slist := []string{
        MASTERY.LEARNING,
        MASTERY.UNKNOWN,
        MASTERY.NEW,
        "",
    }
    if showMastered {
        slist = append(slist, MASTERY.MASTERED)
    }
    ws, _ := dw.List(&user._db, slist)

    words := make([]Word, len(ws))
    for i, w := range(ws) {
        words[i].Map(w)
        words[i].Display = formatDisplay(words[i])
    }

    return words
}

func (word *Word) Find(id string) {
    dword := dbase.Word{}
    _id, _ := primitive.ObjectIDFromHex(id)
    err := dword.Select(_id)

    if nil != err {
        word.Id = ""
        return
    }

    word.Map(dword)
}

func (word *Word) Add() error {
    // map the kanjis before anything else.. for unmap to work properly
    word.Kanjis = kanji_pick_from_word(*word)
    dword := word.UnMap()
    dword.Id = primitive.NewObjectID()
    word.Id = dword.Id.Hex()
    return dword.Add()
}

func (word *Word) Update() error {
    dw := word.UnMap()
    return dw.Update()
}

func (word *Word) Delete() error {
    dword := word.UnMap()
    return dword.Delete()
}
