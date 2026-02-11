package logic

import (
	"time"
    "nyaccabulary/dbase"
)

type User struct {
    _db             dbase.User
    Id              string
    RegDate         time.Time
    EditDate        time.Time
    Username        string
    Name            string
    Email           string
    Phone           string
    EmailVisible    bool
    PhoneVisible    bool
    Roles           []string
}
