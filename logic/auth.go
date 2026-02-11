package logic

import (
	"github.com/asapgiri/golib/session"
	"github.com/asapgiri/golib/logger"
	"nyaccabulary/config"
	"nyaccabulary/dbase"
	"errors"
	"net/mail"
	"slices"
	"strconv"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
)

var log = logger.Logger {
    Color: logger.Colors.Cyan,
    Pretext: "logic",
}

func Authenticate(a *session.Auth) {
    // TODO: Check if user can be mocked out to existing and be used for unauthenticated login...
    if a.Username != "" {
        user := User{}
        user.FindByUsername(a.Username)
        if "" == user.Username {
            *a = session.Auth{}
            return
        }

        a.Id = user.Id
        a.Username = user.Username
        a.Name = user.Name
        a.Email = user.Email
        a.Roles = user.Roles
        a.Error = ""
        a.IsAdmin = slices.Contains(user.Roles, ROLES.ADMIN)
        a.IsMod = a.IsAdmin || slices.Contains(user.Roles, ROLES.MODERATOR)
        a.IsEditor = a.IsAdmin || a.IsMod || slices.Contains(user.Roles, ROLES.EDITOR)
    }
}

func (user *User) Register(password_clear_a string, password_clear_b string) error {
    new_user := dbase.User{}

    if new_user.FindByUsername(user.Username) == nil {
        return errors.New("Username already exists!")
    }
    if "" != user.Email && new_user.FindByEmail(user.Email) == nil {
        return errors.New("Email already used!")
    }

    if len(user.Username) < config.Config.User.MinUsernameLen {
        return errors.New("Username must be minimum " + strconv.FormatInt(int64(config.Config.User.MinUsernameLen), 10) + " characters long!")
    }
    for _, bword := range(config.Config.User.NameCantContain) {
        if strings.Contains(user.Username, bword) {
            return errors.New("Username cant contain word: " + bword)
        }
    }

    if "" != user.Email {
        _, err := mail.ParseAddress(user.Email)
        if nil != err {
            return errors.New("Email validation error!")
        }
    }
    if len(password_clear_a) < config.Config.User.MinPasswordLen {
        return errors.New("Password validation error!")
    }
    if password_clear_a != password_clear_b {
        return errors.New("Double password doesnt match!")
    }

    pwh, _ := bcrypt.GenerateFromPassword([]byte(password_clear_a), 0)
    new_user = user.UnMap()
    new_user.Id = primitive.NewObjectID()
    new_user.PasswordHash = string(pwh)
    new_user.Roles = []string{ROLES.USER}
    new_user.RegDate = time.Now()
    new_user.EditDate = time.Now()

    new_user.Add()
    log.Printf("Registerd with %s:%s\n", new_user.Id, string(pwh))

    return nil
}

func (user *User) Login(uname_or_email string, password_clear string) error {
    duser := dbase.User{}
    duser_uname := dbase.User{}
    duser_email := dbase.User{}
    err_uname := duser_uname.FindByUsername(uname_or_email)
    err_email := duser_email.FindByEmail(uname_or_email)

    if nil != err_uname && nil != err_email {
        return errors.New("Bad username or email!")
    }

    if nil == err_uname {
        duser = duser_uname
    } else {
        duser = duser_email
    }

    if nil != bcrypt.CompareHashAndPassword([]byte(duser.PasswordHash), []byte(password_clear)) {
        return errors.New("Bad password!")
    }

    user.Map(duser)

    return nil
}

func (user *User) Logout() {
    // nothing to do here...
}

func (user *User) List() []User {
    duser := dbase.User{}
    dusers, _ := duser.List()

    users := make([]User, len(dusers))
    for i, u := range(dusers) {
        users[i].Map(u)
    }

    return users
}
