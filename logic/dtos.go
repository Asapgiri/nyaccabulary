package logic

import (
	"nyaccabulary/config"
	"nyaccabulary/dbase"
	"time"
)

type Display struct {
    PercentageP     float64
    PercentageN     float64
}

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
    Status          string
    LastShown       time.Time
    Display         Display
    DictForm        config.Entry
    Kanjis          []Kanji
}

type Kanji struct {
    _db             dbase.Kanji
    Id              string
    Date            time.Time
    User            User
    Kanji           string
    On              []string
    Kun             []string
    Meaning         []string
    Knows           int
    DontKnows       int
    LastShown       time.Time
    Status          string
    DictForm        config.Character

    OnStr     string
    KunStr    string
    MeaningStr string
}
