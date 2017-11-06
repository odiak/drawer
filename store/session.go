package store

import (
	"time"
)

type Session struct {
	Key       string    `sql:",notnull,pk"`
	Data      string    `sql:",notnull"`
	CreatedAt time.Time `sql:",notnull"`
	UpdatedAt time.Time `sql:",notnull"`
	ExpiresAt time.Time `sql:",notnull"`
}
