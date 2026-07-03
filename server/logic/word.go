package logic

import (
	"nyaccabulary/server/dbase"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Mastery struct {
    MASTERED        string
    LEARNING        string
    UNKNOWN         string
    NEW             string
    LOOKUP_FAILED   string
    ALL             []string
}

var MASTERY = Mastery{
    MASTERED:       "MASTERED",
    LEARNING:       "LEARNING",
    UNKNOWN:        "UNKNOWN",
    NEW:            "NEW",
    LOOKUP_FAILED:  "LOOKUP_FAILED",
    ALL: []string{
        "MASTERED",
        "LEARNING",
        "UNKNOWN",
        "NEW",
        "",
    },
}

func (word *Word) GetMeta(user User, filter Filter) dbase.Meta {
    dw := dbase.Word{}

    df := dbase.Filter{
        Page: int64(filter.Page),
        Limit: int64(filter.Limit),
        Status: MASTERY.ALL,
    }

    return dw.GetMeta(&user._db, df)
}

func (word *Word) List(user User, filter Filter) []Word {
    dw := dbase.Word{}

    if "" == user.Id {
        return []Word{}
    }

    var slist []string
    if len(filter.Status) > 0 {
        slist = filter.Status
    } else {
        slist = []string{
            MASTERY.LEARNING,
            MASTERY.UNKNOWN,
            MASTERY.NEW,
            "",
        }
        if filter.Mastered {
            slist = append(slist, MASTERY.MASTERED)
        }
    }

    if "" == filter.Sort.Field {
        filter.Sort.Field = "date"
        filter.Sort.Order = -1
    }

    ws, _ := dw.List(&user._db, dbase.Filter{
        Status: slist,
        Page: int64(filter.Page),
        Limit: int64(filter.Limit),
        Sort: filter.Sort,
        LastUpdated: filter.LastUpdated,
    })

    words, _ := word.MapList(ws, slist)

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

func (word *Word) raw_add_init(kanji_list []Kanji) (dbase.Word, []Kanji) {
    var kanjis_to_add []Kanji
    word.Date = time.Now()
    word.LastUpdated = time.Now()
    // map the kanjis before anything else.. for unmap to work properly
    word.Kanjis, kanjis_to_add = FetchAndAddKanjisFromWord(*word, kanji_list)
    dword := word.UnMap()
    dword.Id = primitive.NewObjectID()
    word.Id = dword.Id.Hex()
    return dword, kanjis_to_add
}

func (word *Word) Add() error {
    var kanji Kanji
    dword, kanjis_to_add := word.raw_add_init([]Kanji{})
    kanji.BulkAdd(kanjis_to_add)
    return dword.Add()
}

func (word *Word) BulkAdd(words []Word) error {
    var kanji Kanji
    var dword dbase.Word
    var kanji_list_to_add []Kanji

    kanji_list := kanji.List(word.User, Filter{Mastered: true})
    dword_list := make([]interface{}, len(words))

    for i, w := range words {
        var kanjis_to_add []Kanji
        dword_list[i], kanjis_to_add = w.raw_add_init(kanji_list)
        for _, k := range kanjis_to_add {
            kanji_list_to_add = append(kanji_list_to_add, k)
            kanji_list = append(kanji_list, k)
        }
    }

    kanji.BulkAdd(kanji_list_to_add)

    return dword.Add()
}

func (word *Word) Update() error {
    word.LastUpdated = time.Now()
    dw := word.UnMap()
    return dw.Update()
}

func (word *Word) Delete() error {
    dword := word.UnMap()
    return dword.Delete()
}
