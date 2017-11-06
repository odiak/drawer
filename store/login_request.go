package store

import (
	"time"
)

type LoginRequest struct {
	Token       string    `sql:",notnull"`
	Email       string    `sql:",notnull"`
	CreatedAt   time.Time `sql:",notnull"`
	ActivatedAt time.Time `sql:",notnull"`
	ExpiresAt   time.Time `sql:",notnull"`
}
