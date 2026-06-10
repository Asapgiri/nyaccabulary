package dbase

import (
	"nyaccabulary/config"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

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
    // FIXME: Should every token be encrypted?
    MangaKotoba     string
}

type Word struct {
    Id              primitive.ObjectID `bson:"_id"`
    Date            time.Time
    User            primitive.ObjectID
    Kanji           string
    Kana            string
    Meaning         string
    Knows           int
    DontKnows       int
    Mastered        bool
    LastShown       time.Time
    DictForm        config.Entry
}

type Kanji struct {
    Id              primitive.ObjectID `bson:"_id"`
    Date            time.Time
    User            primitive.ObjectID
    Meaning         string
    Furigana        string
    Knows           int
    DontKnows       int
    Mastered        bool
    LastShown       time.Time
}
