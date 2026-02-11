package logic

import (
	"nyaccabulary/dbase"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (user *User) Find(id string) {
    duser := dbase.User{}
    _id, _ := primitive.ObjectIDFromHex(id)
    err := duser.Select(_id)

    if nil != err {
        user.Id = ""
        return
    }

    user.Map(duser)
}

func (user *User) FindByUsername(username string) {
    duser := dbase.User{}
    err := duser.FindByUsername(username)

    if nil != err {
        user.Username = ""
        user.Id = ""
        return
    }

    user.Map(duser)
}

func (user *User) Update() error {
    duser := user.UnMap()
    log.Println("user updated: ", duser)
    return duser.Update()
}
