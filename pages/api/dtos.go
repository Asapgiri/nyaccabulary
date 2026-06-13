package api

import (
	"nyaccabulary/config"
	// "nyaccabulary/logic"
	"time"
)

type Response struct {
    Status  string
    Errors  any
}

type WordAddRequest struct {
    Kanji   string `json:"kanji"`
    Kana    string `json:"kana"`
    Meaning string `json:"meaning"`
}

type User struct {
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
    Id              string
    Date            time.Time
    // User            User
    Kanji           string
    Kana            string
    Meaning         string
    Knows           int
    DontKnows       int
    Status          string
    LastShown       time.Time
    Display         struct{
        PercentageP string
        PercentageN string
    }
    DictForm        config.Entry
    Kanjis          []string
}

type Kanji struct {
    Id              string
    Date            time.Time
    // User            User
    Kanji           string
    On              []string
    Kun             []string
    Meaning         []string
    Knows           int
    DontKnows       int
    LastShown       time.Time
    Status          string
    DictForm        config.Character

    Words           []string

    OnStr     string
    KunStr    string
    MeaningStr string
}
