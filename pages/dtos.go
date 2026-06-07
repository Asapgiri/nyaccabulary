package pages

import "nyaccabulary/logic"

type Pages struct {
    Current int
    Count   int
    Ppp     int
    PppOpts []int
}

type DtoRoot struct {
    Words           []logic.Word
    Page            Pages
    ShowMastered    bool
}

type DtoAdminUsers struct {
    Roles   []logic.RolePerm
    Users   []logic.User
}
