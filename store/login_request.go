package store

import (
	"time"

	"github.com/go-pg/pg/orm"
)

type LoginRequest struct {
	Token       string    `sql:",notnull,pk"`
	Email       string    `sql:",notnull"`
	CreatedAt   time.Time `sql:",notnull"`
	ActivatedAt time.Time
	ExpiresAt   time.Time `sql:",notnull"`
}

func (lr *LoginRequest) BeforeInsert(db orm.DB) error {
	now := time.Now()
	if lr.CreatedAt.IsZero() {
		lr.CreatedAt = now
	}
	return nil
}
