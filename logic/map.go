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
    word.LastShown      = dword.LastShown
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
    dword.LastShown     = word.LastShown

    return dword
}
