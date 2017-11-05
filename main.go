package main

import (
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	slim "github.com/mattn/go-slim"
)

func main() {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		tmpl, err := slim.ParseFile("views/index.slim")
		if err != nil {
			panic(err)
		}
		err = tmpl.Execute(w, slim.Values{})
		if err != nil {
			panic(err)
		}
	})

	workDir, _ := os.Getwd()
	staticDir := filepath.Join(workDir, "static")
	fileServer(r, "/static/", http.Dir(staticDir))

	http.ListenAndServe(":9000", r)
}

func fileServer(r chi.Router, path string, root http.FileSystem) {
	fs := http.StripPrefix(path, http.FileServer(root))

	if path != "/" && path[len(path)-1] != '/' {
		r.Get(path, http.RedirectHandler(path+"/", 301).ServeHTTP)
		path += "/"
	}
	path += "*"

	r.Get(path, func(w http.ResponseWriter, r *http.Request) {
		fs.ServeHTTP(w, r)
	})
}
