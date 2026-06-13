package api

import (
	"compress/gzip"
	"encoding/json"
	"net/http"

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
