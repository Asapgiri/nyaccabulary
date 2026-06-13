package dbase

import (
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// =====================================================================================================================
// Internal Kanji Listing CRUD

func (kanji *Kanji) GetMeta(user *User, filter Filter) Meta {
    var meta Meta

    query := bson.D{{"user", user.Id}}
    if len(filter.Status) > 0 {
        query = append(query, bson.E{"$or", bson.A{
            bson.D{{"status", bson.D{{"$in", filter.Status}}}},
            bson.D{{"status", bson.D{{"$exists", false}}}}, // include docs without status
        }})
    }
    meta.Count, _ = dbKANJI.CountDocuments(context.Background(), query)

    query = append(query, bson.E{"status", "MASTERED"})
    meta.Mastered, _ = dbKANJI.CountDocuments(context.Background(), query)

    if filter.Limit > 0 {
        meta.PageCount = meta.Count / filter.Limit
        if meta.Count % filter.Limit > 0 {
            meta.PageCount++
        }
    }

    return meta
}

func (kanji *Kanji) List(user *User, filter Filter) ([]Kanji, error) {
    var kanjis []Kanji

    query := bson.D{{"user", user.Id}}

    if len(filter.Status) > 0 {
        query = append(query, bson.E{"$or", bson.A{
            bson.D{{"status", bson.D{{"$in", filter.Status}}}},
            bson.D{{"status", bson.D{{"$exists", false}}}}, // include docs without status
        }})
    }

    opts := options.Find()

    if "" != filter.Sort.Field {
        opts.SetSort(bson.D{{Key: filter.Sort.Field, Value: filter.Sort.Order}})
    }

    if 0 != filter.Limit {
        meta := kanji.GetMeta(user, filter)
        cursor_start := filter.Page * filter.Limit
        if meta.Count >= cursor_start {
            opts.SetSkip(cursor_start)
            opts.SetLimit(filter.Limit)
        }
    }

    cursor, err := dbKANJI.Find(context.Background(), query, opts)
    if nil != err {
        return kanjis, err
    }
    defer cursor.Close(context.Background())

    err = cursor.All(context.Background(), &kanjis)

    return kanjis, err
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
