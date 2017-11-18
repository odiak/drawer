package main

import (
	"context"
	"encoding/base64"
	"fmt"
	"gopkg.in/gomail.v2"
	"image/png"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"text/template"
	"time"

	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	"github.com/go-pg/pg"
	"github.com/go-pg/pg/orm"
	"github.com/gorilla/sessions"
	"github.com/odiak/drawer/config"
	"github.com/odiak/drawer/sessionstore"
	"github.com/odiak/drawer/store"
	"github.com/odiak/drawer/util"
)

const (
	SESSION_KEY = "drawer_session"
)

func main() {
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

	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))
	r.Use(bindValue("db", db))
	r.Use(bindValue("sessionStore", sessionStore))
	r.Use(withCsrfProtection)

	r.Get("/", withCurrentUser(func(w http.ResponseWriter, r *http.Request) {
		currentUser := r.Context().Value("currentUser").(*store.User)
		renderTemplate("index", w, map[string]interface{}{
			"currentUser": currentUser,
			"csrfToken":   r.Context().Value("csrfToken").(string),
		})
	}))

	r.Post("/", withCurrentUser(func(w http.ResponseWriter, r *http.Request) {
		currentUser := r.Context().Value("currentUser").(*store.User)
		db := r.Context().Value("db").(*pg.DB)

		id := util.RandomStr(16)
		if err := writerImage(id, r.PostFormValue("image")); err != nil {
			panic(err)
		}

		picture := &store.Picture{
			ID: id,
		}
		if currentUser != nil {
			picture.OwnerID = currentUser.ID
		}
		if err := db.Insert(picture); err != nil {
			panic(err)
		}
		http.Redirect(w, r, fmt.Sprintf("/p/%s", id), 302)
	}))

	r.Get("/p/{pictureID}", withCurrentUser(func(w http.ResponseWriter, r *http.Request) {
		currentUser := getCurrentUser(r)
		db := getDB(r)
		id := chi.URLParam(r, "pictureID")
		picture, err := store.FindPictureByID(db, id)
		if err != nil {
			if err == pg.ErrNoRows {
				renderTemplate("404", w, nil)
				return
			}
			panic(err)
		}
		renderTemplate("detail", w, map[string]interface{}{
			"currentUser": currentUser,
			"picture":     picture,
			"csrfToken":   r.Context().Value("csrfToken").(string),
		})
	}))

	r.Post("/p/{pictureID}/save", withCurrentUser(func(w http.ResponseWriter, r *http.Request) {
		currentUser := getCurrentUser(r)
		db := getDB(r)
		id := chi.URLParam(r, "pictureID")
		picture, err := store.FindPictureByID(db, id)
		if err != nil {
			if err == pg.ErrNoRows {
				renderTemplate("404", w, nil)
				return
			}
			panic(err)
		}
		isNew := false
		if (currentUser == nil && picture.OwnerID != 0) || (currentUser != nil && picture.OwnerID != currentUser.ID) {
			id = util.RandomStr(16)
			isNew = true
		}
		if err := writerImage(id, r.PostFormValue("image")); err != nil {
			panic(err)
		}
		if isNew {
			err = db.Insert(picture)
		} else {
			err = db.Update(picture)
		}
		if err != nil {
			panic(err)
		}
		http.Redirect(w, r, fmt.Sprintf("/p/%s", id), 302)
	}))

	r.Get("/login", func(w http.ResponseWriter, r *http.Request) {
		renderTemplate("login", w, map[string]interface{}{
			"csrfToken": r.Context().Value("csrfToken").(string),
		})
	})

	r.Post("/login", func(w http.ResponseWriter, r *http.Request) {
		db := r.Context().Value("db").(orm.DB)
		loginReq := &store.LoginRequest{
			Email:     r.PostFormValue("email"),
			Token:     util.RandomStr(64),
			ExpiresAt: time.Now().Add(6 * time.Hour),
		}
		err := db.Insert(loginReq)
		if err != nil {
			panic(err)
		}

		m := gomail.NewMessage()
		m.SetHeader("From", "drawer-noreply@odiak.net")
		m.SetHeader("To", loginReq.Email)
		m.SetHeader("Subject", "Email confirmation from draw.odiak.net")
		m.SetBody("text/plain", fmt.Sprintf(
			"Please access following URL to comfirm your email address.\n"+
				"%s/activate_login_request?token=%s\n\n",
			config.Origin,
			loginReq.Token,
		))

		d := gomail.NewDialer(
			config.SmtpHost,
			config.SmtpPort,
			config.SmtpUser,
			config.SmtpPassword,
		)
		d.TLSConfig = config.SmtpTlsConfig

		if err := d.DialAndSend(m); err != nil {
			panic(err)
		}

		http.Redirect(w, r, "/login_request_sent", 302)
	})

	r.Get("/login_request_sent", func(w http.ResponseWriter, r *http.Request) {
		renderTemplate("login_request_sent", w, map[string]interface{}{})
	})

	r.Get("/activate_login_request", func(w http.ResponseWriter, r *http.Request) {
		token := r.FormValue("token")
		db := r.Context().Value("db").(*pg.DB)
		ss := r.Context().Value("sessionStore").(*sessionstore.SessionStore)
		loginReq := &store.LoginRequest{}
		err := db.Model(loginReq).
			Where("activated_at IS NULL").
			Where("token = ?", token).
			Where("expires_at > ?", time.Now()).
			Select()
		if err != nil {
			if err == pg.ErrNoRows {
				renderTemplate("login_request_expired", w, nil)
				return
			} else {
				panic(err)
			}
		}
		loginReq.ActivatedAt = time.Now()
		err = db.Update(loginReq)
		if err != nil {
			panic(err)
		}
		user, err := store.FindUserByEmail(db, loginReq.Email)
		if err != nil {
			if err != pg.ErrNoRows {
				panic(err)
			}
		} else {
			setCurrentUser(ss, r, w, user)
			http.Redirect(w, r, "/", 302)
			return
		}

		setSessionValue(ss, r, w, "email", loginReq.Email)

		http.Redirect(w, r, "/register", 302)
	})

	r.Get("/register", func(w http.ResponseWriter, r *http.Request) {
		renderTemplate("register", w, map[string]interface{}{
			"csrfToken": r.Context().Value("csrfToken").(string),
		})
	})

	r.Post("/register", func(w http.ResponseWriter, r *http.Request) {
		ss := r.Context().Value("sessionStore").(*sessionstore.SessionStore)
		db := r.Context().Value("db").(*pg.DB)
		email := getSessionValue(ss, r, "email").(string)
		user := &store.User{
			Name:       r.FormValue("name"),
			ScreenName: r.FormValue("screenName"),
			Email:      email,
		}
		err := db.Insert(user)
		if err != nil {
			panic(err)
		}
		setCurrentUser(ss, r, w, user)
		http.Redirect(w, r, "/", 302)
	})

	workDir, _ := os.Getwd()
	staticDir := filepath.Join(workDir, "static")
	fileServer(r, "/static/", http.Dir(staticDir))

	fmt.Println("running server")
	http.ListenAndServe(":9000", r)
}

func fileServer(r chi.Router, path string, root http.FileSystem) {
	fs := http.StripPrefix(path, http.FileServer(root))

	if path != "/" && path[len(path)-1] != '/' {
		r.Get(path, http.RedirectHandler(path+"/", 302).ServeHTTP)
		path += "/"
	}
	path += "*"

	r.Get(path, func(w http.ResponseWriter, r *http.Request) {
		fs.ServeHTTP(w, r)
	})
}

func renderTemplate(name string, dst io.Writer, data interface{}) {
	tmpl, err := template.ParseFiles("views/" + name + ".html")
	if err != nil {
		panic(err)
	}
	err = tmpl.Execute(dst, data)
	if err != nil {
		panic(err)
	}
}

func getCsrfToken(ss *sessionstore.SessionStore, r *http.Request, w http.ResponseWriter) string {
	s, err := ss.Get(r, SESSION_KEY)
	if err != nil {
		panic(err)
	}
	token, ok := s.Values["csrfToken"].(string)
	if !ok {
		token = util.RandomStr(64)
		s.Values["csrfToken"] = token
		err = ss.Save(r, w, s)
		if err != nil {
			panic(err)
		}
	}
	return token
}

func withCsrfProtection(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		ss := ctx.Value("sessionStore").(*sessionstore.SessionStore)
		token := getCsrfToken(ss, r, w)
		if !(r.Method == "GET" || r.Method == "HEAD" || r.Method == "OPTION" || r.Method == "TRACE") && r.PostFormValue("csrfToken") != token {
			w.Write([]byte("error"))
			return
		}
		next.ServeHTTP(w, r.WithContext(context.WithValue(ctx, "csrfToken", token)))
	})
}

func getCurrentUserFromDB(ss *sessionstore.SessionStore, r *http.Request, db orm.DB) *store.User {
	s, err := ss.Get(r, SESSION_KEY)
	if err != nil {
		panic(err)
	}
	userID, ok := s.Values["userID"].(int32)
	if !ok {
		return nil
	}
	user := &store.User{}
	err = db.Model(user).Where("id = ?", userID).Select()
	if err != nil {
		if err == pg.ErrNoRows {
			return nil
		}
		panic(err)
	}
	return user
}

func getCurrentUser(r *http.Request) *store.User {
	return r.Context().Value("currentUser").(*store.User)
}

func getDB(r *http.Request) *pg.DB {
	return r.Context().Value("db").(*pg.DB)
}

func getSessionValue(ss *sessionstore.SessionStore, r *http.Request, key string) interface{} {
	s, err := ss.Get(r, SESSION_KEY)
	if err != nil {
		panic(err)
	}
	return s.Values[key]
}

func setSessionValue(ss *sessionstore.SessionStore, r *http.Request, w http.ResponseWriter, key string, value interface{}) {
	s, err := ss.Get(r, SESSION_KEY)
	if err != nil {
		panic(err)
	}
	s.Values[key] = value
	err = ss.Save(r, w, s)
	if err != nil {
		panic(err)
	}
}

func setCurrentUser(ss *sessionstore.SessionStore, r *http.Request, w http.ResponseWriter, user *store.User) {
	s, err := ss.Get(r, SESSION_KEY)
	if err != nil {
		panic(err)
	}
	s.Values["userID"] = user.ID
	err = ss.Save(r, w, s)
	if err != nil {
		panic(err)
	}
}

func bindValue(name string, value interface{}) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			next.ServeHTTP(w, r.WithContext(
				context.WithValue(r.Context(), name, value)))
		})
	}
}

func withCurrentUser(f http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		db := ctx.Value("db").(orm.DB)
		ss := ctx.Value("sessionStore").(*sessionstore.SessionStore)
		f(w, r.WithContext(context.WithValue(ctx, "currentUser",
			getCurrentUserFromDB(ss, r, db))))
	}
}

func writerImage(id, image string) error {
	reader := base64.NewDecoder(base64.StdEncoding, strings.NewReader(image))
	img, err := png.Decode(reader)
	if err != nil {
		return err
	}

	if err := os.MkdirAll("static/images", 0777); err != nil {
		return err
	}
	f, err := os.Create(fmt.Sprintf("static/images/%s.png", id))
	if err != nil {
		return err
	}
	if err := png.Encode(f, img); err != nil {
		f.Close()
		return err
	}
	if err := f.Close(); err != nil {
		return err
	}
	return nil
}
