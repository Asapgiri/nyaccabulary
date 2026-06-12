package pages

import (
	"net/http"
	"nyaccabulary/config"
	"nyaccabulary/logic"

	"github.com/asapgiri/golib/session"
)

func GetCurrentSession(w http.ResponseWriter, r *http.Request) session.Sessioner {
    sess := session.Sessioner{}
    sess.Authenticate(w, r)
    logic.Authenticate(&sess.Auth)

    sess.Config = config.Config.Site
    sess.Path = r.URL.Path

    sess.Meta = session.MetaData{}

    return sess
}
