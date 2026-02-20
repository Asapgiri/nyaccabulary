package dbase

import (
	"github.com/asapgiri/golib/logger"
	"context"
	"nyaccabulary/config"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var mongo_client *mongo.Client
var db *mongo.Database

var dbUSERS             *mongo.Collection
var dbWORDS             *mongo.Collection

var log = logger.Logger {
    Color: logger.Colors.Purple,
    Pretext: "database",
}

func count(db *mongo.Collection, pipeline mongo.Pipeline) int {
    pipeline = append(pipeline, bson.D{{Key: "$count", Value: "count"}})
    log.Println(pipeline)

    cursor, err := db.Aggregate(context.Background(), pipeline)
    if nil != err {
        log.Println(err)
        return 0
    }
    defer cursor.Close(context.Background())

    var result []bson.M
    err = cursor.All(context.Background(), &result)
    if nil != err {
        return 0
    }
    log.Println(result)

    var count int
    if len(result) > 0 {
        log.Println(result[0])
        log.Println(result[0]["count"])
        count = int(result[0]["count"].(int32))
    }

    return count
}

// =====================================================================================================================
// Basic connect and stuff

func Connect() error {
    var err error

    // Use the SetServerAPIOptions() method to set the Stable API version to 1
	serverAPI := options.ServerAPI(options.ServerAPIVersion1)
	opts := options.Client().ApplyURI(config.Config.Dbase.Url).SetServerAPIOptions(serverAPI)

    // Create a new client and connect to the server
    mongo_client, err = mongo.Connect(context.Background(), opts)
	if err != nil {
        return err
	}
    db = mongo_client.Database(config.Config.Dbase.Name)

	// Send a ping to confirm a successful connection
	var result bson.M
	if err := db.RunCommand(context.Background(), bson.D{{"ping", 1}}).Decode(&result); err != nil {
		panic(err)
	}
	log.Println("Pinged your deployment. You successfully connected to MongoDB!")

    dbUSERS             = db.Collection("users")
    dbWORDS             = db.Collection("words")

    return nil
}

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

// =====================================================================================================================
// Internal User Listing CRUD

func (word *Word) List(user *User) ([]Word, error) {
    var anyime []Word

    cursor, err := dbWORDS.Find(context.Background(), bson.D{{"user", user.Id}})
    if nil != err {
        return anyime, err
    }
    defer cursor.Close(context.Background())

    err = cursor.All(context.Background(), &anyime)

    return anyime, err
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
