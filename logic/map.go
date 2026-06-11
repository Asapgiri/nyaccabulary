package logic

import (
	"nyaccabulary/dbase"

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

func (word *Word) Map(dword dbase.Word) {
    user := User{}
    user.Find(dword.User.Hex())

    word._db            = dword
    word.Id             = dword.Id.Hex()
    word.Date           = dword.Date
    word.User           = user
    word.Kanji          = dword.Kanji
    word.Kana           = dword.Kana
    word.Meaning        = dword.Meaning
    word.Knows          = dword.Knows
    word.DontKnows      = dword.DontKnows
    word.Status         = dword.Status
    word.LastShown      = dword.LastShown
    word.DictForm       = dword.DictForm

    word.Kanjis = make([]Kanji, len(dword.Kanjis))
    for i, k := range(dword.Kanjis) {
        dk := dbase.Kanji{}
        dk.Select(k)
        word.Kanjis[i].Map(dk)
    }
}

func (word *Word) UnMap() dbase.Word {
    dword := word._db

    dword.Id, _         = primitive.ObjectIDFromHex(word.Id)
    dword.Date          = word.Date
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

func (kanji *Kanji) Map(dkanji dbase.Kanji) {
    user := User{}
    user.Find(dkanji.User.Hex())

    kanji.Id            = dkanji.Id.Hex()
    kanji.Date          = dkanji.Date
    kanji.User          = user
    kanji.Kanji         = dkanji.Kanji
    kanji.On            = dkanji.On
    kanji.Kun           = dkanji.Kun
    kanji.Meaning       = dkanji.Meaning
    kanji.Knows         = dkanji.Knows
    kanji.DontKnows     = dkanji.DontKnows
    kanji.LastShown     = dkanji.LastShown
    kanji.Status        = dkanji.Status
    kanji.DictForm      = dkanji.DictForm

    dwords := dkanji.ListWords()
    kanji.Words = make([]string, len(dwords))
    for i, w := range dwords {
        kanji.Words[i] = w.Kanji
    }
}

func (kanji *Kanji) UnMap() dbase.Kanji {
    dkanji := kanji._db

    dkanji.Id, _        = primitive.ObjectIDFromHex(kanji.Id)
    dkanji.Date         = dkanji.Date
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
