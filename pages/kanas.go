package pages

import (
	"net/http"

	"github.com/asapgiri/golib/renderer"
)

func ShowKanas(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    fil, _ := renderer.ReadArtifact("kanas.html", w.Header())
    renderer.Render(session, w, fil, nil)
}
