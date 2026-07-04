package main

import (
	"net/http"
	"nyaccabulary/server/pages"
	"nyaccabulary/server/pages/api"
)

func cors_ok(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Access-Control-Allow-Origin", "https://localhost")
    w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
    w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
    w.WriteHeader(http.StatusNoContent)
}

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
    http.HandleFunc("GET /word/pdf/{filter}",           pages.WordsPdf)
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
    http.HandleFunc("GET /kanji/pdf/{filter}",          pages.KanjisPdf)

    // api pages
    http.HandleFunc("GET    /api/search",               api.WordSearch)
    http.HandleFunc("GET    /api/user",                 api.UserAuth)
    http.HandleFunc("POST   /api/login",                api.Login)
    http.HandleFunc("POST   /api/register",             api.Register)
    http.HandleFunc("POST   /api/logout",               api.Logout)

    http.HandleFunc("OPTIONS /api/login", cors_ok)
    http.HandleFunc("OPTIONS /api/logout", cors_ok)

    http.HandleFunc("POST   /api/word",                 api.WordAdd)
    http.HandleFunc("POST   /api/word/{entseq}",        api.WordAdd)
    http.HandleFunc("POST   /api/word/bulk",            api.WordBulkAdd)
    http.HandleFunc("GET    /api/word",                 api.WordList)
    http.HandleFunc("POST   /api/word/paged",           api.WordList)
    http.HandleFunc("GET    /api/word/{id}",            api.WordList)
    http.HandleFunc("POST   /api/word/{id}/{func}",     api.WordPatch)
    http.HandleFunc("POST   /api/word/{id}/delete",     api.WordDelete)

    http.HandleFunc("GET /api/word/pdf/{filter}",       pages.WordsPdf)
    http.HandleFunc("GET /api/kanji/pdf/{filter}",      pages.KanjisPdf)

    // api kanjis
    //http.HandleFunc("POST   /api/kanji",                api.KanjiAdd)
    http.HandleFunc("GET    /api/kanji",                api.KanjiList)
    http.HandleFunc("POST   /api/kanji/paged",          api.KanjiList)
    http.HandleFunc("GET    /api/kanji/{id}",           api.KanjiList)
    http.HandleFunc("POST   /api/kanji/{id}/{func}",    api.KanjiPatch)
    http.HandleFunc("POST   /api/kanji/{id}/delete",    api.KanjiDelete)

    http.HandleFunc("POST   /api/sync",                 api.Sync)


    http.HandleFunc("GET /admin/kanji/sync-all-words",  pages.AdminKanjisSyncAllWords)


    http.HandleFunc("GET /access-violation",    pages.AccessViolation)
}
