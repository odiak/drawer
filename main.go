package main

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	"github.com/go-pg/pg"
	"github.com/gorilla/sessions"
	slim "github.com/mattn/go-slim"
	"github.com/odiak/drawer/config"
	"github.com/odiak/drawer/sessionstore"
)

func main() {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))

	db := pg.Connect(config.PgOptions)
	db.OnQueryProcessed(func(event *pg.QueryProcessedEvent) {
		query, err := event.FormattedQuery()
		if err != nil {
			panic(err)
		}
		fmt.Println(fmt.Sprintf("SQL Query: %s, %s", time.Since(event.StartTime), query))
	})
	sessionStore := sessionstore.NewStore(db, &sessions.Options{
		MaxAge: 2592000, // 30 days
	}, []byte("foobar1234"))

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		tmpl, err := slim.ParseFile("views/index.slim")
		if err != nil {
			panic(err)
		}
		s, err := sessionStore.Get(r, "val")
		if err != nil {
			panic(err)
		}
		fmt.Println(s.ID)
		fmt.Println(s.IsNew)
		if s.Values["t"] == nil {
			s.Values["t"] = time.Now().Unix()
		}
		t := s.Values["t"]
		err = s.Save(r, w)
		if err != nil {
			panic(err)
		}
		err = tmpl.Execute(w, slim.Values{
			"t": t,
		})
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
