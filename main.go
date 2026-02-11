package main

import (
	"nyaccabulary/config"
	"nyaccabulary/dbase"
	"net/http"
	"os"
	"strings"

	"github.com/asapgiri/golib/logger"
)

var log = logger.Logger {
    Color: logger.Colors.Green,
    Pretext: "main",
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
                                        config.Config.Http.Cert, config.Config.Http.Key, nil)
    } else {
        err = http.ListenAndServe(strings.Join([]string{":", config.Config.Http.Port}, ""), nil)
    }

    log.Println(err)
}
