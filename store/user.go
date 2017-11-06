package store

type User struct {
	ID         int32
	ScreenName string `sql:",notnull"`
	Name       string `sql:",notnull"`
	Email      string `sql:",notnull"`
}
