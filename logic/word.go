package logic

import (
	"nyaccabulary/dbase"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Mastery struct {
    MASTERED        string
    LEARNING        string
    UNKNOWN         string
    NEW             string
    LOOKUP_FAILED   string
}

var MASTERY = Mastery{
    MASTERED:       "MASTERED",
    LEARNING:       "LEARNING",
    UNKNOWN:        "UNKNOWN",
    NEW:            "NEW",
    LOOKUP_FAILED:  "LOOKUP_FAILED",
}


func formatDisplay(word Word) Display {
    var display Display

    total := word.DontKnows + word.Knows
    display.PercentageP = (float64(word.Knows) / float64(total)) * 100
    display.PercentageN = (float64(word.DontKnows) / float64(total)) * 100

    return display
}

func (word *Word) GetMeta(user User, filter Filter) dbase.WordMeta {
    dw := dbase.Word{}

    df := dbase.Filter{
        Page: int64(filter.Page),
        Limit: int64(filter.Limit),
    }

    return dw.GetMeta(&user._db, df)
}

func (word *Word) List(user User, filter Filter) []Word {
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
    if filter.Mastered {
        slist = append(slist, MASTERY.MASTERED)
    }
    ws, err := dw.List(&user._db, dbase.Filter{
        Status: slist,
        Page: int64(filter.Page),
        Limit: int64(filter.Limit),
        Sort: dbase.Sort{Field: "date", Order: -1},
    })
    log.Println(err)

    words, _ := word.MapList(ws, slist)
    for _, w := range(words) {
        w.Display = formatDisplay(w)
    }

    return words
}

func (word *Word) ListFailed(user User) []Word {
    dw := dbase.Word{}

    ws, _ := dw.List(&user._db, dbase.Filter{
        Status: []string{MASTERY.LOOKUP_FAILED},
    })

    words := make([]Word, len(ws))
    for i, w := range(ws) {
        words[i].Map(w)
    }

    return words
}

func (word *Word) FindByKanji(user User, kanji string) error {
    dword := dbase.Word{}
    err := dword.FindByKanji(&user._db, kanji)
    if nil != err {
        return err
    }
    word.Map(dword)
    return nil
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
    word.Kanjis = FetchAndAddKanjisFromWord(*word)
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
