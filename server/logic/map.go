package logic

import (
	"errors"
	"nyaccabulary/server/dbase"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (user *User) Map(duser dbase.User) {
    user._db            = duser
    user.Id             = duser.Id.Hex()
    user.RegDate        = duser.RegDate
    user.EditDate       = duser.EditDate
    user.Username       = duser.Username
    user.Name           = duser.Name
    user.Email          = duser.Email
    user.Phone          = duser.Phone
    user.EmailVisible   = duser.EmailVisible
    user.PhoneVisible   = duser.PhoneVisible
    user.Roles          = duser.Roles
}

func (user *User) UnMap() dbase.User {
    duser := user._db

    duser.RegDate       = user.RegDate
    duser.EditDate      = user.EditDate
    duser.Username      = user.Username
    duser.Name          = user.Name
    duser.Email         = user.Email
    duser.Phone         = user.Phone
    duser.EmailVisible  = user.EmailVisible
    duser.PhoneVisible  = user.PhoneVisible
    duser.Roles         = user.Roles

    return duser
}

func (word *Word) raw_map(dword dbase.Word) {
    word._db            = dword
    word.Id             = dword.Id.Hex()
    word.Date           = dword.Date
    word.LastUpdated    = dword.LastUpdated
    word.Kanji          = dword.Kanji
    word.Kana           = dword.Kana
    word.Meaning        = dword.Meaning
    word.Knows          = dword.Knows
    word.DontKnows      = dword.DontKnows
    word.Status         = dword.Status
    word.LastShown      = dword.LastShown
    word.DictForm       = dword.DictForm
}

func (word *Word) Map(dword dbase.Word) {
    user := User{}
    user.Find(dword.User.Hex())
    word.User = user

    word.raw_map(dword)

    word.Kanjis = make([]Kanji, len(dword.Kanjis))
    for i, k := range(dword.Kanjis) {
        dk := dbase.Kanji{}
        dk.Select(k)
        word.Kanjis[i].Map(dk)
    }
}

func (word *Word) MapList(dwords []dbase.Word, statuses []string) ([]Word, error) {
    if len(dwords) == 0 {
        return []Word{}, errors.New("List is empty")
    }

    user := User{}
    user.Find(dwords[0].User.Hex())

    dkanji := dbase.Kanji{}
    dkanjis, _ := dkanji.List(&user._db, dbase.Filter{Status: statuses})

    words := make([]Word, len(dwords))
    for i, w := range dwords {
        if w.User.Hex() != user.Id {
            return words, errors.New("List contains words from different users!")
        }

        words[i].raw_map(w)
        words[i].User = user

        words[i].Kanjis = make([]Kanji, len(w.Kanjis))
        for j, k := range w.Kanjis {
            for _, dk := range dkanjis {
                if dk.Id.Hex() == k.Hex() {
                    words[i].Kanjis[j].raw_map(dk)
                    words[i].Kanjis[j].User = user
                    break
                }
            }
        }
    }

    return words, nil
}


func (word *Word) UnMap() dbase.Word {
    dword := word._db

    dword.Id, _         = primitive.ObjectIDFromHex(word.Id)
    dword.Date          = word.Date
    dword.LastUpdated   = word.LastUpdated
    dword.User, _       = primitive.ObjectIDFromHex(word.User.Id)
    dword.Kanji         = word.Kanji
    dword.Kana          = word.Kana
    dword.Meaning       = word.Meaning
    dword.Knows         = word.Knows
    dword.DontKnows     = word.DontKnows
    dword.Status        = word.Status
    dword.LastShown     = word.LastShown
    dword.DictForm      = word.DictForm

    dword.Kanjis = make([]primitive.ObjectID, len(word.Kanjis))
    for i, k := range(word.Kanjis) {
        dword.Kanjis[i], _ = primitive.ObjectIDFromHex(k.Id)
    }

    return dword
}

func (kanji *Kanji) raw_map(dkanji dbase.Kanji) {
    kanji.Id            = dkanji.Id.Hex()
    kanji.Date          = dkanji.Date
    kanji.LastUpdated   = dkanji.LastUpdated
    kanji.Kanji         = dkanji.Kanji
    kanji.On            = dkanji.On
    kanji.Kun           = dkanji.Kun
    kanji.Meaning       = dkanji.Meaning
    kanji.Knows         = dkanji.Knows
    kanji.DontKnows     = dkanji.DontKnows
    kanji.LastShown     = dkanji.LastShown
    kanji.Status        = dkanji.Status
    kanji.DictForm      = dkanji.DictForm
}

func (kanji *Kanji) Map(dkanji dbase.Kanji) {
    user := User{}
    user.Find(dkanji.User.Hex())

    kanji.raw_map(dkanji)
    kanji.User = user

    dwords := dkanji.ListWords()
    kanji.Words = make([]string, len(dwords))
    for i, w := range dwords {
        kanji.Words[i] = w.Kanji
    }
}

func (kanji *Kanji) MapList(dkanjis []dbase.Kanji, statuses []string) ([]Kanji, error) {
    if len(dkanjis) == 0 {
        return []Kanji{}, errors.New("List is empty")
    }

    user := User{}
    user.Find(dkanjis[0].User.Hex())

    dword := dbase.Word{}
    dwords, _ := dword.List(&user._db, dbase.Filter{
        Status: statuses,
    })

    kanjis := make([]Kanji, len(dkanjis))
    for i, k := range dkanjis {
        if k.User.Hex() != user.Id {
            return kanjis, errors.New("List contains words from different users!")
        }

        kanjis[i].raw_map(k)
        kanjis[i].User = user

        kanjis[i].Words = []string{}
        for _, w := range dwords {
            for _, oi := range w.Kanjis {
                if oi.Hex() == k.Id.Hex() {
                    kanjis[i].Words = append(kanjis[i].Words, w.Kanji)
                }
            }
        }
    }

    return kanjis, nil
}

func (kanji *Kanji) UnMap() dbase.Kanji {
    dkanji := kanji._db

    dkanji.Id, _        = primitive.ObjectIDFromHex(kanji.Id)
    dkanji.Date         = kanji.Date
    dkanji.LastUpdated  = kanji.LastUpdated
    dkanji.User, _      = primitive.ObjectIDFromHex(kanji.User.Id)
    dkanji.Kanji        = kanji.Kanji
    dkanji.On           = kanji.On
    dkanji.Kun          = kanji.Kun
    dkanji.Meaning      = kanji.Meaning
    dkanji.Knows        = kanji.Knows
    dkanji.DontKnows    = kanji.DontKnows
    dkanji.LastShown    = kanji.LastShown
    dkanji.Status       = kanji.Status
    dkanji.DictForm     = kanji.DictForm

    return dkanji
}
