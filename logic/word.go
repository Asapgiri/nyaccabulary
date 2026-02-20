package logic

import (
	"nyaccabulary/dbase"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (word *Word) List(user User) []Word {
    dw := dbase.Word{}

    if "" == user.Id {
        return []Word{}
    }

    ws, _ := dw.List(&user._db)

    words := make([]Word, len(ws))
    for i, w := range(ws) {
        words[i].Map(w)
    }

    return words
}

func (word *Word) Add() error {
    dword := word.UnMap()
    dword.Id = primitive.NewObjectID()
    word.Id = dword.Id.Hex()
    return dword.Add()
}
