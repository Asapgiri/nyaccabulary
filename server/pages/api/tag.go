package api

import (
	"encoding/json"
	"net/http"
	"nyaccabulary/server/logic"
	"nyaccabulary/server/pages"
	"strings"
)

func TagList(w http.ResponseWriter, r *http.Request) {
	session := pages.GetCurrentSession(w, r)
	if "" == session.Auth.Username {
		AccessViolation(w, r)
		return
	}

	user := logic.User{}
	user.Find(session.Auth.Id)
	tag := logic.Tag{}
	write_json(w, MapTagList(tag.List(user, nil)))
}

func ownsTags(ids []string, userID string) bool {
	for _, id := range ids {
		tag := logic.Tag{}
		tag.Find(id)
		if "" == tag.Id || tag.User.Id != userID {
			return false
		}
	}
	return true
}

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
		User:  user,
		Name:  tag_req.Name,
		Color: tag_req.Color,
	}
	tag.Add()
	rtag.Map(tag)

	write_json(w, rtag)
}

func TagUpdate(w http.ResponseWriter, r *http.Request) {
	session := pages.GetCurrentSession(w, r)
	if "" == session.Auth.Username {
		AccessViolation(w, r)
		return
	}

	var request TagAddRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid tag data", http.StatusBadRequest)
		return
	}
	request.Name = strings.TrimSpace(request.Name)
	if request.Name == "" || len(request.Name) > 80 {
		http.Error(w, "Tag name must be between 1 and 80 characters", http.StatusBadRequest)
		return
	}

	tag := logic.Tag{}
	tag.Find(r.PathValue("id"))
	if tag.Id == "" || tag.User.Id != session.Auth.Id {
		AccessViolation(w, r)
		return
	}
	tag.Name = request.Name
	tag.Color = request.Color
	if err := tag.Update(); err != nil {
		http.Error(w, "Could not update tag", http.StatusInternalServerError)
		return
	}
	var response Tag
	response.Map(tag)
	write_json(w, response)
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

	if err := tag.Delete(); err != nil {
		http.Error(w, "Could not delete tag", http.StatusInternalServerError)
		return
	}

	write_json(w, Response{Status: "DONE"})
}
