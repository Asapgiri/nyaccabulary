package dbase

import (
	"nyaccabulary/server/config"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Sort struct {
    Field   string
    Order   int64
}

type Filter struct {
    Page        int64
    Limit       int64
    Sort        Sort
    Status      []string
    LastUpdated time.Time
}

type Meta struct {
    Mastered    int64
    Learning    int64
    Count       int64
    PageCount   int64
}

// type PagedResponse struct {
//     Page    ResponsePage
//     Words   struct {
//         Mastered    int
//         Count       int
//         Order       string
//     }
//     Data            any
// }

type User struct {
    Id              primitive.ObjectID `bson:"_id"`
    RegDate         time.Time
    EditDate        time.Time
    Username        string             `bson:"username"`
    PasswordHash    string
    Name            string
    Email           string             `bson:"email"`
    EmailVerified   bool
    Phone           string
    EmailVisible    bool
    PhoneVisible    bool
    Roles           []string
}

type Word struct {
    Id              primitive.ObjectID `bson:"_id"`
    Date            time.Time
    LastUpdated     time.Time
    User            primitive.ObjectID
    Kanji           string
    Kana            string
    Meaning         string
    Knows           int
    DontKnows       int
    LastShown       time.Time
    Status          string
    DictForm        config.Entry
    Kanjis          []primitive.ObjectID
}

type Kanji struct {
    Id              primitive.ObjectID `bson:"_id"`
    Date            time.Time
    LastUpdated     time.Time
    User            primitive.ObjectID
    Kanji           string
    On              []string
    Kun             []string
    Meaning         []string
    Knows           int
    DontKnows       int
    LastShown       time.Time
    Status          string
    DictForm        config.Character
}
