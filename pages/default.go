package pages

import (
	"github.com/asapgiri/golib/logger"
	"github.com/asapgiri/golib/renderer"
	"github.com/asapgiri/golib/session"
	"nyaccabulary/config"
	"nyaccabulary/logic"
	"io"
	"net/http"
	"strconv"
)

var log = logger.Logger {
    Color: logger.Colors.Red,
    Pretext: "pages",
}

func Unexpected(session session.Sessioner, w http.ResponseWriter, r *http.Request) {
    fil, typ := renderer.ReadArtifact(r.URL.Path, w.Header())
    if "" == fil {
        // FIXME: Redirect due to request type...
        //http.Error(w, "File not found", http.StatusNotFound)

        NotFound(w, r)
        return
    }

    if "text" == typ {
        log.Println(r.URL.Path)
        renderer.Render(session, w, fil, nil)
    } else {
        // TODO: Check if file type/path needs auth..
        // If it is in artifacts tho is shouldn't..
        io.WriteString(w, fil)
    }
}

func Root(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    if "/" == r.URL.Path {
        page, err := strconv.ParseInt(r.URL.Query().Get("page"), 10, 32)
        if nil != err {
            page = 0
        }
        post_per_page, err := strconv.ParseInt(r.URL.Query().Get("ppp"), 10, 32)
        if nil != err {
            post_per_page = 25
        }
        log.Println(page, post_per_page)

        words := []logic.Word{}

        if "" != session.Auth.Username {
            user := logic.User{}
            user.FindByUsername(session.Auth.Username)

            word := logic.Word{}
            words = word.List(user)
        }

        dto := DtoRoot{
            Words: words,
            //Posts: plist,
            Page: Pages{
                Current: int(page),
                Count: 0, //pages,
                Ppp: int(post_per_page),
                PppOpts: []int{10, 25, 50, 100},
            },
        }

        fil := ""
        if "" == session.Auth.Username {
            fil, _ = renderer.ReadArtifact("auth/login.html", w.Header())
        } else {
            fil, _ = renderer.ReadArtifact("index.html", w.Header())
        }
        renderer.Render(session, w, fil, dto)
    } else {
        Unexpected(session, w, r)
    }
}

func NotFound(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    session.UpdateTitle(config.Config.Site, "You do not have access fot this page!")
    fil, _ := renderer.ReadArtifact("not-found.html", w.Header())
    renderer.Render(session, w, fil, nil)
}

func AccessViolation(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    session.UpdateTitle(config.Config.Site, "You do not have access fot this page!")
    fil, _ := renderer.ReadArtifact("auth/access-violation.html", w.Header())
    renderer.Render(session, w, fil, nil)
}

func renderPageWithAccessViolation(w http.ResponseWriter, r *http.Request) {
    AccessViolation(w, r)
}
