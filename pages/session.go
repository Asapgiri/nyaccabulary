package pages

import (
	"github.com/asapgiri/golib/session"
	"nyaccabulary/config"
	"nyaccabulary/logic"
	"net/http"
)

func GetCurrentSession(w http.ResponseWriter, r *http.Request) session.Sessioner {
    sess := session.Sessioner{}
    sess.Authenticate(w, r)
    logic.Authenticate(&sess.Auth)

    sess.Config = config.Config.Site
    sess.Path = r.URL.String()

    sess.Meta = session.MetaData{}

    return sess
}
