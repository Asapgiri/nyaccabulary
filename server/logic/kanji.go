package logic

import (
	"nyaccabulary/server/config"
	"nyaccabulary/server/dbase"
	"time"
	"unicode"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

func kanji_search(all []Kanji, s string) (Kanji, bool) {
    for _, k := range(all) {
        if s == k.Kanji {
            return k, true
        }
    }
    return Kanji{}, false
}

func kanji_generate_new(s string, user User) Kanji {
    kanji := Kanji{
        User: user,
        Kanji: s,
        Status: MASTERY.NEW,
    }

    for _, k := range(config.Config.KanjiDict.Chars) {
        if s == k.Literal {
            kanji.DictForm = k
            break
        }
    }

    if "" != kanji.DictForm.Literal {
        // Collect on, kun, meaning...

        for _, group := range(kanji.DictForm.ReadingMeaning.RMGroups) {
            // Fill in data [english only...]
            for _, y := range(group.Readings) {
                if "ja_on" == y.Type {
                    kanji.On = append(kanji.On, y.Value)
                } else if "ja_kun" == y.Type {
                    kanji.Kun = append(kanji.Kun, y.Value)
                }
            }
            for _, m := range(group.Meanings) {
                if "en" == m.Lang || "" == m.Lang || "eng" == m.Lang {
                    kanji.Meaning = append(kanji.Meaning, m.Value)
                }
            }
        }
    }

    return kanji
}

func FetchAndAddKanjisFromWord(word Word) []Kanji {
	var kanjis_to_return []Kanji
    var kanjis_already_present []Kanji

    kanji := Kanji{}
    kanjis_already_present = kanji.List(word.User, Filter{Mastered: true})

	for _, r := range(word.Kanji) {
		if unicode.Is(unicode.Han, r) {
            // Dont add the same entry twice
            _, present := kanji_search(kanjis_to_return, string(r))
            if present {
                continue
            }

            // Check if already exists
            kanji, ok := kanji_search(kanjis_already_present, string(r))
            if ok {
                kanjis_to_return = append(kanjis_to_return, kanji)
                continue
            }

            kanji = kanji_generate_new(string(r), word.User)
            kanji.Add()

            kanjis_to_return = append(kanjis_to_return, kanji)
		}
	}

	return kanjis_to_return
}

func (kanji *Kanji) GetMeta(user User, filter Filter) dbase.Meta {
    dw := dbase.Kanji{}

    df := dbase.Filter{
        Page: int64(filter.Page),
        Limit: int64(filter.Limit),
        Status: MASTERY.ALL,
    }

    return dw.GetMeta(&user._db, df)
}

func (kanji *Kanji) List(user User, filter Filter) []Kanji {
    dw := dbase.Kanji{}

    if "" == user.Id {
        return []Kanji{}
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

    kanjis, _ := kanji.MapList(ws, slist)

    return kanjis
}

func (kanji *Kanji) FindByName(user User, q string) error {
    dkanji := dbase.Kanji{}
    err := dkanji.FindByName(&user._db, q)
    if nil != err {
        return err
    }
    kanji.Map(dkanji)
    return nil
}

func (kanji *Kanji) Find(id string) {
    dkanji := dbase.Kanji{}
    _id, _ := primitive.ObjectIDFromHex(id)
    err := dkanji.Select(_id)

    if nil != err {
        kanji.Id = ""
        return
    }

    kanji.Map(dkanji)
}

func (kanji *Kanji) Add() error {
    kanji.Date = time.Now()
    kanji.LastUpdated = time.Now()
    dkanji := kanji.UnMap()
    dkanji.Id = primitive.NewObjectID()
    kanji.Id = dkanji.Id.Hex()
    return dkanji.Add()
}

func (kanji *Kanji) Update() error {
    kanji.LastUpdated = time.Now()
    dw := kanji.UnMap()
    return dw.Update()
}

func (kanji *Kanji) Delete() error {
    dkanji := kanji.UnMap()
    return dkanji.Delete()
}
