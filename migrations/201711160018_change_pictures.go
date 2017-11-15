package main

import (
	"fmt"
	"github.com/go-pg/migrations"
)

func init() {
	migrations.Register(func(db migrations.DB) error {
		fmt.Println("removing not-null constraint from pictures.owner_id")
		_, err := db.Exec(`
			ALTER TABLE pictures ALTER owner_id DROP NOT NULL;
		`)
		return err
	}, func(db migrations.DB) error {
		fmt.Println("adding not-null constraint from pictures.owner_id")
		_, err := db.Exec(`
			ALTER TABLE pictures ALTER owner_id SET NOT NULL;
		`)
		return err
	})
}
