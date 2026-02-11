package pages

import "nyaccabulary/logic"

type DtoMain struct {
    Title   string
    // etc...
}

type Pages struct {
    Current int
    Count   int
    Ppp     int
    PppOpts []int
}

type DtoRoot struct {
    Main    DtoMain
    Page    Pages
}

type DtoAdminUsers struct {
    Roles   []logic.RolePerm
    Users   []logic.User
}
