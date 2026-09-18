package api

import (
	"encoding/json"
	"net/http"
	"nyaccabulary/server/logic"
	"nyaccabulary/server/pages"
)

func TagAdd(w http.ResponseWriter, r *http.Request) {
    session := pages.GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        AccessViolation(w, r)
        return
    }

    user := logic.User{}
    user.Find(session.Auth.Id)

    var rtag Tag
    var tag_req TagAddRequest
    json.NewDecoder(r.Body).Decode(&tag_req)

    tag := logic.Tag{
        User: user,
        Name: tag_req.Name,
        Color: tag_req.Color,
    }
    tag.Add()
    rtag.Map(tag)

    write_json(w, rtag)
}

func TagDelete(w http.ResponseWriter, r *http.Request) {
    session := pages.GetCurrentSession(w, r)

    if "" == session.Auth.Username {
        AccessViolation(w, r)
        return
    }

    user := logic.User{}
    user.Find(session.Auth.Id)

    id := r.PathValue("id")
    tag := logic.Tag{}
    tag.Find(id)

    if "" == tag.Id || tag.User.Id != session.Auth.Id {
        AccessViolation(w, r)
        return
    }

    tag.Delete()

    write_json(w, Response{Status: "DONE"})
}
