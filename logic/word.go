package logic

import (
	"nyaccabulary/dbase"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

func formatDisplay(word Word) Display {
    var display Display

    total := word.DontKnows + word.Knows
    display.PercentageP = (float64(word.Knows) / float64(total)) * 100
    display.PercentageN = (float64(word.DontKnows) / float64(total)) * 100

    return display
}

func (word *Word) List(user User) []Word {
    dw := dbase.Word{}

    if "" == user.Id {
        return []Word{}
    }

    ws, _ := dw.List(&user._db)

    words := make([]Word, len(ws))
    for i, w := range(ws) {
        words[i].Map(w)
        words[i].Display = formatDisplay(words[i])
    }

    return words
}

func (word *Word) Find(id string) {
    dword := dbase.Word{}
    _id, _ := primitive.ObjectIDFromHex(id)
    err := dword.Select(_id)

    if nil != err {
        word.Id = ""
        return
    }

    word.Map(dword)
}

func (word *Word) Add() error {
    dword := word.UnMap()
    dword.Id = primitive.NewObjectID()
    word.Id = dword.Id.Hex()
    return dword.Add()
}

func (word *Word) Update() error {
    dw := word.UnMap()
    return dw.Update()
}

func (word *Word) Delete() error {
    dword := word.UnMap()
    return dword.Delete()
}
