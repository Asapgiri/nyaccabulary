package logic

type RolePerm struct {
    Name        string
    EditPerm    []string
}

type roles_t struct {
    USER        string
    MODERATOR   string
    ADMIN       string
    EDITOR      string
}

var ROLES = roles_t {
    USER:       "USER",
    MODERATOR:  "MODERATOR",
    ADMIN:      "ADMIN",
    EDITOR:     "EDITOR",
}

var RolePerms = []RolePerm{
    RolePerm{Name: ROLES.ADMIN,      EditPerm: []string{ROLES.ADMIN}},
    RolePerm{Name: ROLES.MODERATOR,  EditPerm: []string{ROLES.ADMIN}},
    RolePerm{Name: ROLES.EDITOR,     EditPerm: []string{ROLES.ADMIN, ROLES.MODERATOR}},
    RolePerm{Name: ROLES.USER,       EditPerm: []string{}},
}

func FindPermsFor(role string) RolePerm {
    for _, p := range(RolePerms) {
        if role == p.Name {
            return p
        }
    }

    return RolePerm{}
}
