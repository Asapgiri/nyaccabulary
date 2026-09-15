package dbase

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// =====================================================================================================================
// Internal Tag Listing CRUD

func (tag *Tag) List(user *User, lastUpdated *time.Time) ([]Tag, error) {
    var tags []Tag

    query := bson.D{{"user", user.Id}}
    if nil != lastUpdated {
        query = append(query, bson.E{
            Key:   "lastupdated",
            Value: bson.D{{"$gte", *lastUpdated}},
        })
    }

    cursor, err := dbTAG.Find(context.Background(), query)
    if nil != err {
        return tags, err
    }
    defer cursor.Close(context.Background())

    err = cursor.All(context.Background(), &tags)
    return tags, err
}

func (tag *Tag) Select(id primitive.ObjectID) error {
    return dbTAG.FindOne(context.Background(), bson.D{{"_id", id}}).Decode(tag)
}

func (tag *Tag) FindByName(user *User, name string) error {
    filter := bson.D{
        {"user", user.Id},
        {"name", name},
    }
    return dbTAG.FindOne(context.Background(), filter).Decode(tag)
}

func (tag *Tag) Add() error {
    _, err := dbTAG.InsertOne(context.Background(), tag)
    return err
}

func (tag *Tag) Update() error {
    _, err := dbTAG.ReplaceOne(context.Background(), bson.D{{"_id", tag.Id}}, tag)
    return err
}

func (tag *Tag) Delete() error {
    _, err := dbTAG.DeleteOne(context.Background(), bson.D{{"_id", tag.Id}})
    return err
}
