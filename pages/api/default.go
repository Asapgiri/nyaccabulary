package api

import (
	"compress/gzip"
	"encoding/json"
	"net/http"
	"nyaccabulary/logic"
	"nyaccabulary/pages"

	"github.com/asapgiri/golib/logger"
)

var log = logger.Logger {
    Color: logger.Colors.Light_Cyan,
    Pretext: "api",
}

func write_json(w http.ResponseWriter, s any) {
    send, _ := json.Marshal(s)
    w.Header().Set("Content-Type", "application/json")
    w.Write(send)
}

func write_json_gz(w http.ResponseWriter, s any) {
    w.Header().Set("Content-Type", "application/json")
    w.Header().Set("Content-Encoding", "gzip")

    gz := gzip.NewWriter(w)
    defer gz.Close()

    json.NewEncoder(gz).Encode(s)
}

func AccessViolation(w http.ResponseWriter, r *http.Request) {
    write_json(w, Response{Status: "ERROR", Errors: "AccessViolation"})
}

func Sync(w http.ResponseWriter, r *http.Request) {
    session := pages.GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        AccessViolation(w, r)
        return
    }

    filter := pages.ParseFilter(r)

    user := logic.User{}
    user.Find(session.Auth.Id)

    word := logic.Word{}
    kanji := logic.Kanji{}

    wmeta := word.GetMeta(user, filter)
    kmeta := kanji.GetMeta(user, filter)

    to_send := SyncResponse{
        WordStats: Stats{
            Mastered: int(wmeta.Mastered),
            Learning: int(wmeta.Learning),
            Count: int(wmeta.Count),
        },
        KanjiStats: Stats{
            Mastered: int(kmeta.Mastered),
            Learning: int(kmeta.Learning),
            Count: int(kmeta.Count),
        },
        Words: MapWordList(word.List(user, filter)),
        Kanjis: MapKanjiList(kanji.List(user, filter)),
    }

    write_json_gz(w, to_send)
}
