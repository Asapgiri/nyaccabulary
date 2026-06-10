package main

import (
	"nyaccabulary/pages"
	"net/http"
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

    http.HandleFunc("GET /word",                        pages.Words)
    http.HandleFunc("GET /word/bulkadd",                pages.WordsBulkAdd)
    http.HandleFunc("GET /word/pdf",                    pages.WordsPdf)
    http.HandleFunc("POST /word/bulkadd",               pages.WordsBulkAdd)
    http.HandleFunc("POST /word/save",                  pages.WordSave)
    http.HandleFunc("GET /word/list",                   pages.WordList)
    http.HandleFunc("GET /word/delete/{id}",            pages.WordDelete)
    http.HandleFunc("GET /word/mastered/{func}/{id}",   pages.WordMaster)

    http.HandleFunc("GET /learn",                       pages.WordLearn)
    http.HandleFunc("POST /learn/{id}/{answer}",        pages.WordAnswer)

    http.HandleFunc("GET /kana",                        pages.ShowKana)

    http.HandleFunc("GET /kanji",                       pages.Kanjis)
    http.HandleFunc("GET /kanji/mastered/{func}/{id}",   pages.KanjiMaster)
    // http.HandleFunc("GET /kanji/pdf",                   pages.KanjisPdf)


    http.HandleFunc("GET /admin/kanji/sync-all-words",  pages.AdminKanjisSyncAllWords)


    http.HandleFunc("GET /access-violation",    pages.AccessViolation)
}
