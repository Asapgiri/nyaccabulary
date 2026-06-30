package dbase

import (
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// =====================================================================================================================
// Internal User Listing CRUD

func (user *User) List() ([]User, error) {
    var anyime []User

    cursor, err := dbUSERS.Find(context.Background(), bson.D{{}})
    if nil != err {
        return anyime, err
    }
    defer cursor.Close(context.Background())

    err = cursor.All(context.Background(), &anyime)

    return anyime, err
}

func (user *User) Select(id primitive.ObjectID) error {
    return dbUSERS.FindOne(context.Background(), bson.D{{"_id", id}}).Decode(user)
}

func (user *User) FindByUsername(username string) error {
    return dbUSERS.FindOne(context.Background(), bson.D{{"username", username}}).Decode(user)
}

func (user *User) FindByEmail(email string) error {
    return dbUSERS.FindOne(context.Background(), bson.D{{"email", email}}).Decode(user)
}

func (user *User) Add() error {
    _, err := dbUSERS.InsertOne(context.Background(), user)
    return err
}

func (user *User) Update() error {
    _, err := dbUSERS.ReplaceOne(context.Background(), bson.D{{"_id", user.Id}}, user)
    return err
}

func (user *User) Delete() error {
    filter := bson.D{{"_id", user.Id}}
    _, err := dbUSERS.DeleteOne(context.Background(), filter)
    return err
}
