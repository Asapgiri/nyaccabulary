package logic

import (
	"nyaccabulary/server/dbase"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (tag *Tag) List(user User, lastUpdated *time.Time) []Tag {
    dt := dbase.Tag{}

    dtags, _ := dt.List(&user._db, lastUpdated)
    tags := make([]Tag, len(dtags))
    for i, _ := range dtags {
        tags[i].Map(dtags[i], &user)
    }

    return tags
}

func (tag *Tag) Find(id string) {
    dt := dbase.Tag{}
    _id, _ := primitive.ObjectIDFromHex(id)
    err := dt.Select(_id)

    if nil != err {
        tag.Id = ""
        return
    }

    tag.Map(dt, nil)
}

func (tag *Tag) FindByName(user User, name string) {
    dt := dbase.Tag{}

    err := dt.FindByName(&user._db, name)
    if nil != err {
        tag.Id = ""
        return
    }

    tag.Map(dt, &user)
}

func (tag *Tag) Add() error {
    tag.Date = time.Now()
    tag.LastUpdated = time.Now()
    dt := tag.UnMap()
    err := dt.Add()
    tag.Id = dt.Id.Hex()
    return err
}

func (tag *Tag) Update() error {
    tag.LastUpdated = time.Now()
    dt := tag.UnMap()
    return dt.Update()
}

func (tag *Tag) Delete() error {
    // FIXME: Tag deletion should delete the tag ID from Words and Kanjis!
    dt := tag.UnMap()
    return dt.Delete()
}
