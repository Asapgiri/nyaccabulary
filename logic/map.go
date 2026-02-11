package logic

import (
	"nyaccabulary/dbase"
)

func (user *User) Map(duser dbase.User) {
    user._db            = duser
    user.Id             = duser.Id.Hex()
    user.RegDate        = duser.RegDate
    user.EditDate       = duser.EditDate
    user.Username       = duser.Username
    user.Name           = duser.Name
    user.Email          = duser.Email
    user.Phone          = duser.Phone
    user.EmailVisible   = duser.EmailVisible
    user.PhoneVisible   = duser.PhoneVisible
    user.Roles          = duser.Roles
}

func (user *User) UnMap() dbase.User {
    duser := user._db

    duser.RegDate       = user.RegDate
    duser.EditDate      = user.EditDate
    duser.Username      = user.Username
    duser.Name          = user.Name
    duser.Email         = user.Email
    duser.Phone         = user.Phone
    duser.EmailVisible  = user.EmailVisible
    duser.PhoneVisible  = user.PhoneVisible
    duser.Roles         = user.Roles

    return duser
}
