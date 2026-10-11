package api

import (
	"encoding/json"
	"net/http"
	"nyaccabulary/server/logic"
	"nyaccabulary/server/pages"
	"slices"
	"strings"
	"time"
)

type AdminUser struct {
	Id       string
	Username string
	Name     string
	Email    string
	Phone    string
	RegDate  time.Time
	Roles    []string
}

type AdminUsersResponse struct {
	Users []AdminUser
	Roles []string
}

type UserRolesRequest struct{ Roles []string }

func hasAdminAccess(w http.ResponseWriter, r *http.Request) bool {
	session := pages.GetCurrentSession(w, r)
	if !slices.Contains(session.Auth.Roles, logic.ROLES.ADMIN) {
		w.WriteHeader(http.StatusForbidden)
		write_json(w, Response{Status: "ERROR", Errors: "Administrator access required"})
		return false
	}
	return true
}

func AdminUsers(w http.ResponseWriter, r *http.Request) {
	if !hasAdminAccess(w, r) {
		return
	}
	users := (&logic.User{}).List()
	result := AdminUsersResponse{Users: make([]AdminUser, 0, len(users)), Roles: []string{logic.ROLES.USER, logic.ROLES.EDITOR, logic.ROLES.MODERATOR, logic.ROLES.ADMIN}}
	for _, user := range users {
		result.Users = append(result.Users, AdminUser{Id: user.Id, Username: user.Username, Name: user.Name, Email: user.Email, Phone: user.Phone, RegDate: user.RegDate, Roles: user.Roles})
	}
	write_json(w, result)
}

func AdminUserRoles(w http.ResponseWriter, r *http.Request) {
	if !hasAdminAccess(w, r) {
		return
	}
	var req UserRolesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	allowed := []string{logic.ROLES.USER, logic.ROLES.EDITOR, logic.ROLES.MODERATOR, logic.ROLES.ADMIN}
	roles := make([]string, 0, len(req.Roles))
	for _, role := range req.Roles {
		role = strings.TrimSpace(role)
		if !slices.Contains(allowed, role) {
			http.Error(w, "Unknown role", http.StatusBadRequest)
			return
		}
		if !slices.Contains(roles, role) {
			roles = append(roles, role)
		}
	}
	target := logic.User{}
	target.Find(r.PathValue("id"))
	if target.Id == "" {
		http.NotFound(w, r)
		return
	}
	session := pages.GetCurrentSession(w, r)
	if target.Id == session.Auth.Id && !slices.Contains(roles, logic.ROLES.ADMIN) {
		http.Error(w, "You cannot remove your own administrator role", http.StatusBadRequest)
		return
	}
	if slices.Contains(target.Roles, logic.ROLES.ADMIN) && !slices.Contains(roles, logic.ROLES.ADMIN) {
		adminCount := 0
		for _, existing := range (&logic.User{}).List() {
			if slices.Contains(existing.Roles, logic.ROLES.ADMIN) {
				adminCount++
			}
		}
		if adminCount <= 1 {
			http.Error(w, "At least one administrator account must remain", http.StatusBadRequest)
			return
		}
	}
	target.Roles = roles
	if err := target.Update(); err != nil {
		http.Error(w, "Could not update roles", http.StatusInternalServerError)
		return
	}
	write_json(w, AdminUser{Id: target.Id, Username: target.Username, Name: target.Name, Email: target.Email, Phone: target.Phone, RegDate: target.RegDate, Roles: target.Roles})
}
