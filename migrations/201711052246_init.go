package main

import (
	"fmt"
	"github.com/go-pg/migrations"
)

func init() {
	migrations.Register(func(db migrations.DB) error {
		fmt.Println("creating initial tables")
		_, err := db.Exec(`
			CREATE TABLE users (
				id serial PRIMARY KEY,
				screen_name text NOT NULL UNIQUE,
				name text NOT NULL DEFAULT '',
				email text NOT NULL UNIQUE
			);

			CREATE TABLE login_requests (
				token text PRIMARY KEY,
				email text NOT NULL,
				created_at timestamptz NOT NULL,
				expires_at timestamptz NOT NULL,
				activated_at timestamptz
			);

			CREATE TABLE pictures (
				id text PRIMARY KEY,
				owner_id integer NOT NULL REFERENCES users (id),
				created_at timestamptz NOT NULL,
				updated_at timestamptz NOT NULL
			);

			CREATE TABLE sessions (
				key text PRIMARY KEY,
				data text,
				created_at timestamptz NOT NULL,
				updated_at timestamptz NOT NULL,
				expires_at timestamptz NOT NULL
			);
		`)
		return err
	}, func(db migrations.DB) error {
		fmt.Println("dropping initial tables")
		_, err := db.Exec(`
			DROP TABLE IF EXISTS users, login_requests, pictures, sessions CASCADE;
		`)
		return err
	})
}
