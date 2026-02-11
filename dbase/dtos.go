package dbase

import (
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
}
