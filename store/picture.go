package store

import (
	"time"

	"github.com/go-pg/pg/orm"
)

type Picture struct {
	ID        string
	OwnerID   int32     `sql:",notnull"`
	CreatedAt time.Time `sql:",notnull"`
	UpdatedAt time.Time `sql:",notnull"`
}

func (p *Picture) BeforeInsert(db orm.DB) error {
	now := time.Now()
	if p.CreatedAt.IsZero() {
		p.CreatedAt = now
	}
	if p.UpdatedAt.IsZero() {
		p.UpdatedAt = now
	}
	return nil
}

func (p *Picture) BeforeUpdate(db orm.DB) error {
	if p.UpdatedAt.IsZero() {
		p.UpdatedAt = time.Now()
	}
	return nil
}

func FindPictureByID(db orm.DB, id string) (*Picture, error) {
	picture := &Picture{ID: id}
	err := db.Select(picture)
	return picture, err
}
