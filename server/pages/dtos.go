package pages

import (
	"nyaccabulary/server/config"
	"nyaccabulary/server/logic"
)

type Pages struct {
    Current int
    Count   int
    Ppp     int
    PppOpts []int
}

type DtoRoot struct {
    Words           []logic.Word
    Page            Pages
    ShowMastered    bool
    Mastered        int
    WordCount       int
}

type DtoKanji struct {
    Kanjis          []logic.Kanji
    Page            Pages
    ShowMastered    bool
    Mastered        int
    KanjiCount      int
}

type SearchResult struct {
    Word    logic.Word
    Result  config.Entry
}

type DtoSearch struct {
    Query       string
    ExactMatch  bool
    Results     []SearchResult
}

type DtoAdminUsers struct {
    Roles   []logic.RolePerm
    Users   []logic.User
}
