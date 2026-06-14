package dbase

import (
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func get_meta(db *mongo.Collection, user *User, filter Filter) Meta {
    var meta Meta

    query := bson.D{{"user", user.Id}}
    if len(filter.Status) > 0 {
        query = append(query, bson.E{"$or", bson.A{
            bson.D{{"status", bson.D{{"$in", filter.Status}}}},
            bson.D{{"status", bson.D{{"$exists", false}}}}, // include docs without status
        }})
    }
    meta.Count, _ = db.CountDocuments(context.Background(), query)

    query = append(query, bson.E{"status", "MASTERED"})
    meta.Mastered, _ = db.CountDocuments(context.Background(), query)

    query = append(query, bson.E{"status", "LEARNING"})
    meta.Learning, _ = db.CountDocuments(context.Background(), query)

    if filter.Limit > 0 {
        meta.PageCount = meta.Count / filter.Limit
        if meta.Count % filter.Limit > 0 {
            meta.PageCount++
        }
    }

    return meta
}

func list(db *mongo.Collection, user *User, filter Filter, meta Meta, results interface{}) error {
    query := bson.D{{"user", user.Id}}

    if len(filter.Status) > 0 {
        query = append(query, bson.E{"$or", bson.A{
            bson.D{{"status", bson.D{{"$in", filter.Status}}}},
            bson.D{{"status", bson.D{{"$exists", false}}}}, // include docs without status
        }})
    }

    if !filter.LastUpdated.IsZero() {
        query = append(query, bson.E{
            Key:   "lastupdated",
            Value: bson.D{{"$gte", filter.LastUpdated}},
        })
    }

    opts := options.Find()

    if "" != filter.Sort.Field {
        opts.SetSort(bson.D{{Key: filter.Sort.Field, Value: filter.Sort.Order}})
    }

    if 0 != filter.Limit {
        cursor_start := filter.Page * filter.Limit
        if meta.Count >= cursor_start {
            opts.SetSkip(cursor_start)
            opts.SetLimit(filter.Limit)
        }
    }

    cursor, err := db.Find(context.Background(), query, opts)
    if nil != err {
        return err
    }
    defer cursor.Close(context.Background())

    err = cursor.All(context.Background(), results)

    return err
}
