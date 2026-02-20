package logic

import (
	"time"
    "nyaccabulary/dbase"
)

type User struct {
    _db             dbase.User
    Id              string
    RegDate         time.Time
    EditDate        time.Time
    Username        string
    Name            string
    Email           string
    Phone           string
    EmailVisible    bool
    PhoneVisible    bool
    Roles           []string
}

type Word struct {
    _db             dbase.Word
    Id              string
    Date            time.Time
    User            User
    Kanji           string
    Kana            string
    Meaning         string
    Knows           int
    DontKnows       int
    LastShown       time.Time
}
