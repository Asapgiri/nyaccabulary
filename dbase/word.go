package dbase

import (
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// =====================================================================================================================
// Internal Word Listing CRUD

func (word *Word) GetMeta(user *User, filter Filter) Meta {
    var meta Meta

    query := bson.D{{"user", user.Id}}
    if len(filter.Status) > 0 {
        query = append(query, bson.E{"$or", bson.A{
            bson.D{{"status", bson.D{{"$in", filter.Status}}}},
            bson.D{{"status", bson.D{{"$exists", false}}}}, // include docs without status
        }})
    }
    meta.Count, _ = dbWORDS.CountDocuments(context.Background(), query)

    query = append(query, bson.E{"status", "MASTERED"})
    meta.Mastered, _ = dbWORDS.CountDocuments(context.Background(), query)

    if filter.Limit > 0 {
        meta.PageCount = meta.Count / filter.Limit
        if meta.Count % filter.Limit > 0 {
            meta.PageCount++
        }
    }

    return meta
}

func (word *Word) List(user *User, filter Filter) ([]Word, error) {
    var words []Word

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
        meta := word.GetMeta(user, filter)
        cursor_start := filter.Page * filter.Limit
        if meta.Count >= cursor_start {
            opts.SetSkip(cursor_start)
            opts.SetLimit(filter.Limit)
        }
    }

    cursor, err := dbWORDS.Find(context.Background(), query, opts)
    if nil != err {
        return words, err
    }
    defer cursor.Close(context.Background())

    err = cursor.All(context.Background(), &words)

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

