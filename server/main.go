package main

import (
	"nyaccabulary/server/config"
	"nyaccabulary/server/dbase"
	"net/http"
	"os"
	"strings"

	"github.com/asapgiri/golib/logger"
)

var log = logger.Logger {
    Color: logger.Colors.Green,
    Pretext: "main",
}

func cors(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        log.Printf("%s %s", r.Method, r.URL.Path)
        origin := r.Header.Get("Origin")

        switch origin {
        case "https://nyantan.net",
             "https://nyantan.net:8443",
             "https://localhost",
             "capacitor://localhost":
            w.Header().Set("Access-Control-Allow-Origin", origin)
        }

        w.Header().Set("Access-Control-Allow-Credentials", "true")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

        if r.Method == http.MethodOptions {
            w.WriteHeader(http.StatusNoContent)
            return
        }

        next.ServeHTTP(w, r)
    })
}

func main() {
    config.InitConfig()
    // logic.SetupEmail()

    err := dbase.Connect()
    setup_routes()

    args := os.Args[1:]
    if 0 < len(args) {
        config.Config.Http.Port = args[0];
    }

    if "" != config.Config.Http.Cert && "" != config.Config.Http.Key {
        err = http.ListenAndServeTLS(strings.Join([]string{":", config.Config.Http.Port}, ""),
                                        config.Config.Http.Cert, config.Config.Http.Key, cors(http.DefaultServeMux))
    } else {
        err = http.ListenAndServe(strings.Join([]string{":", config.Config.Http.Port}, ""), cors(http.DefaultServeMux))
    }

    log.Println(err)
}
