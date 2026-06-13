package main

import (
	"net/http"
	"nyaccabulary/pages"
	"nyaccabulary/pages/api"
)

func setup_routes() {
    http.HandleFunc("GET /",                    pages.Root)
    http.HandleFunc("GET /index",               pages.Root)
    http.HandleFunc("GET /index.html",          pages.Root)

    http.HandleFunc("GET /login",               pages.Login)
    http.HandleFunc("POST /login",              pages.Login)
    http.HandleFunc("GET /register",            pages.Register)
    http.HandleFunc("POST /register",           pages.Register)
    http.HandleFunc("GET /logout",              pages.Logout)
    http.HandleFunc("GET /pwr_r",               pages.NotFound)

    http.HandleFunc("GET /search",                      pages.WordSearch)

    http.HandleFunc("GET /word",                        pages.Words)
    http.HandleFunc("GET /word/{word}",                 pages.OneWord)
    http.HandleFunc("GET /word/bulkadd",                pages.WordsBulkAdd)
    http.HandleFunc("GET /word/add/{entseq}",           pages.WordAdd)
    http.HandleFunc("GET /word/pdf",                    pages.WordsPdf)
    http.HandleFunc("POST /word/bulkadd",               pages.WordsBulkAdd)
    http.HandleFunc("POST /word/save",                  pages.WordSave)
    http.HandleFunc("GET /word/delete/{id}",            pages.WordDelete)
    http.HandleFunc("GET /word/mastered/{func}/{id}",   pages.WordMaster)
    http.HandleFunc("GET /word/failed-to-add",          pages.WordsFailedToAdd)

    http.HandleFunc("GET /learn",                       pages.WordLearn)
    http.HandleFunc("POST /learn/{id}/{answer}",        pages.WordAnswer)

    http.HandleFunc("GET /kana",                        pages.ShowKana)

    http.HandleFunc("GET /kanji",                       pages.Kanjis)
    http.HandleFunc("GET /kanji/{kanji}",               pages.OneKanji)
    http.HandleFunc("GET /kanji/mastered/{func}/{id}",  pages.KanjiMaster)
    // http.HandleFunc("GET /kanji/pdf",                   pages.KanjisPdf)

    // api pages
    http.HandleFunc("POST   /api/word",                 api.WordAdd)
    http.HandleFunc("POST   /api/word/{entseq}",        api.WordAdd)
    http.HandleFunc("POST   /api/word/bulk",            api.WordBulkAdd)
    http.HandleFunc("GET    /api/word",                 api.WordList)
    http.HandleFunc("GET    /api/word/{id}",            api.WordList)
    http.HandleFunc("PATCH  /api/word/{id}/{func}",     api.WordPatch)
    http.HandleFunc("DELETE /api/word/{id}",            api.WordDelete)


    http.HandleFunc("GET /admin/kanji/sync-all-words",  pages.AdminKanjisSyncAllWords)


    http.HandleFunc("GET /access-violation",    pages.AccessViolation)
}
