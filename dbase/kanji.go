package dbase

import (
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// =====================================================================================================================
// Internal Kanji Listing CRUD

func (kanji *Kanji) List(user *User, statuses []string) ([]Kanji, error) {
    var anyime []Kanji

    filter := bson.D{
        {"user", user.Id},
        {"$or", bson.A{
            bson.D{{"status", bson.D{{"$in", statuses}}}},
            bson.D{{"status", bson.D{{"$exists", false}}}}, // include docs without status
        }},
    }

    cursor, err := dbKANJI.Find(context.Background(), filter)
    if nil != err {
        return anyime, err
    }
    defer cursor.Close(context.Background())

    err = cursor.All(context.Background(), &anyime)

    return anyime, err
}

func (kanji *Kanji) ListWords() []Word {
    var wl []Word

    filter := bson.D{
        {"user", kanji.User},
        {"kanjis", kanji.Id},
    }

    cursor, err := dbWORDS.Find(context.Background(), filter)
    if nil != err {
        return []Word{}
    }
    defer cursor.Close(context.Background())

    err = cursor.All(context.Background(), &wl)

    return wl
}

func (kanji *Kanji) FindByName(user *User, q string) error {
    filter := bson.D{
        {"user", user.Id},
        {"kanji", q},
    }
    return dbKANJI.FindOne(context.Background(), filter).Decode(kanji)
}

func (kanji *Kanji) Select(id primitive.ObjectID) error {
    return dbKANJI.FindOne(context.Background(), bson.D{{"_id", id}}).Decode(kanji)
}

func (kanji *Kanji) Add() error {
    _, err := dbKANJI.InsertOne(context.Background(), kanji)
    return err
}

func (kanji *Kanji) Update() error {
    _, err := dbKANJI.ReplaceOne(context.Background(), bson.D{{"_id", kanji.Id}}, kanji)
    return err
}

func (kanji *Kanji) Delete() error {
    filter := bson.D{{"_id", kanji.Id}}
    _, err := dbKANJI.DeleteOne(context.Background(), filter)
    return err
}
