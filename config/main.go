package config

import (
	"os"

	"github.com/go-pg/pg"
	"strconv"
)

var Port uint
var PgOptions *pg.Options

func init() {
	Port = parseUint(os.Getenv("APP_PORT"), 9000)
	PgOptions = &pg.Options{
		User:     "kaido",
		Addr:     "127.0.0.1:5432",
		Database: "drawer",
	}
}

func parseUint(str string, defaultValue uint) uint {
	if str != "" {
		n, err := strconv.ParseUint(str, 10, 32)
		if err != nil {
			panic(err)
		}
		return uint(n)
	} else {
		return defaultValue
	}
}
