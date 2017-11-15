package util

import (
	"math/rand"
	"time"
)

const (
	chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
)

func RandomStr(n int) string {
	rand.Seed(time.Now().UnixNano())

	b := make([]byte, n)
	m := len(chars)
	for i := range b {
		b[i] = chars[rand.Intn(m)]
	}
	return string(b)
}
