package store

import (
	"github.com/go-pg/pg/orm"
)

type User struct {
	ID         int32
	ScreenName string `sql:",notnull"`
	Name       string `sql:",notnull"`
	Email      string `sql:",notnull"`
}

func FindUserByEmail(db orm.DB, email string) (*User, error) {
	user := &User{}
	err := db.Model(user).Where("email = ?", email).Select()
	return user, err
}
