package dbase

import (
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// =====================================================================================================================
// Internal Word Listing CRUD

func (word *Word) GetMeta(user *User, filter Filter) Meta {
    return get_meta(dbWORDS, user, filter)
}

func (word *Word) List(user *User, filter Filter) ([]Word, error) {
    var words []Word
    meta := word.GetMeta(user, filter)
    err := list(dbWORDS, user, filter, meta, &words)
    return words, err
}

func (word *Word) FindByKanji(user *User, kanji string) error {
    filter := bson.D{
        {"user", user.Id},
        {"kanji", kanji},
    }
    return dbWORDS.FindOne(context.Background(), filter).Decode(word)
}

func (word *Word) Select(id primitive.ObjectID) error {
    return dbWORDS.FindOne(context.Background(), bson.D{{"_id", id}}).Decode(word)
}

func (word *Word) Add() error {
    _, err := dbWORDS.InsertOne(context.Background(), word)
    return err
}

func (word *Word) Update() error {
    _, err := dbWORDS.ReplaceOne(context.Background(), bson.D{{"_id", word.Id}}, word)
    return err
}

func (word *Word) Delete() error {
    filter := bson.D{{"_id", word.Id}}
    _, err := dbWORDS.DeleteOne(context.Background(), filter)
    return err
}

