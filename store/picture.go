package store

import (
	"time"
)

type Picture struct {
	ID        string
	OwnerID   int32     `sql:",notnull"`
	CreatedAt time.Time `sql:",notnull"`
	UpdatedAt time.Time `sql:",notnull"`
}
