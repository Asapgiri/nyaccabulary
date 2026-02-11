package pages

import (
	"github.com/asapgiri/golib/renderer"
	"github.com/asapgiri/golib/session"
	"nyaccabulary/config"
	"nyaccabulary/logic"
	"net/http"
	"slices"
)

var NOTICE = session.NOTICE

func checkAdminPageAccess(session session.Sessioner) bool {
    return slices.Contains(session.Auth.Roles, logic.ROLES.ADMIN)  ||
           slices.Contains(session.Auth.Roles, logic.ROLES.EDITOR) ||
           slices.Contains(session.Auth.Roles, logic.ROLES.MODERATOR)
}

func checkEditorAccess(session session.Sessioner) bool {
    return slices.Contains(session.Auth.Roles, logic.ROLES.ADMIN) ||
           slices.Contains(session.Auth.Roles, logic.ROLES.EDITOR)
}

func adminRender(session session.Sessioner, w http.ResponseWriter, temp string, dto any) {
    renderer.RenderMultiTemplate(session, w, []string{temp, "admin/base.html"}, dto)
}

func AdminPage(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    if !checkAdminPageAccess(session) {
        NotFound(w, r)
        return
    }

    session.UpdateTitle(config.Config.Site, "Admin")
    adminRender(session, w, "admin/index.html", nil)
}

func adminRenderUsers(session session.Sessioner, w http.ResponseWriter) {
    user := logic.User{}

    dto := DtoAdminUsers{
        Users: user.List(),
        Roles: logic.RolePerms,
    }

    adminRender(session, w, "admin/users.html", dto)
}

func AdminUsers(w http.ResponseWriter, r *http.Request) {
    session := GetCurrentSession(w, r)

    if !checkAdminPageAccess(session) {
        NotFound(w, r)
        return
    }

    session.UpdateTitle(config.Config.Site, "Admin - Users")
    adminRenderUsers(session, w)
}
