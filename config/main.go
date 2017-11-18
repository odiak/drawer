package config

import (
	"crypto/tls"
	"fmt"
	"os"

	"strconv"

	"github.com/go-pg/pg"
)

var (
	AppEnv    = os.Getenv("APP_ENV")
	Origin    = os.Getenv("APP_ORIGIN")
	Port      = parseUint(os.Getenv("APP_PORT"), 9000)
	PgOptions = &pg.Options{
		User:     os.Getenv("APP_DB_USER"),
		Password: os.Getenv("APP_DB_PASSWORD"),
		Addr:     os.Getenv("APP_DB_ADDR"),
		Database: os.Getenv("APP_DB_NAME"),
	}
	SmtpHost      = os.Getenv("APP_SMTP_HOST")
	SmtpPort      = int(parseUint(os.Getenv("APP_SMTP_PORT"), 587))
	SmtpUser      = os.Getenv("APP_SMTP_USER")
	SmtpPassword  = os.Getenv("APP_SMTP_PASSWORD")
	SmtpTlsConfig = &tls.Config{
		InsecureSkipVerify: parseBool(os.Getenv("APP_SMTP_TLS_INSECURE_SKIP_VERIFY"), false),
	}
)

func init() {
	if AppEnv == "" {
		AppEnv = "development"
	}

	if Origin == "" {
		Origin = fmt.Sprintf("http://localhost:%d", Port)
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

func parseBool(str string, defaultValue bool) bool {
	if str != "" {
		return !(str == "0" || str == "false")
	} else {
		return defaultValue
	}
}
