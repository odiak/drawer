package sessionstore

import (
	"encoding/base32"
	"encoding/gob"
	"net/http"
	"strings"
	"time"

	"github.com/go-pg/pg/orm"
	"github.com/gorilla/securecookie"
	"github.com/gorilla/sessions"
	"github.com/odiak/drawer/store"
	"github.com/pkg/errors"
)

type SessionStore struct {
	Codecs  []securecookie.Codec
	Options *sessions.Options
	db      orm.DB
}

func init() {
	gob.Register(time.Time{})
}

func NewStore(db orm.DB, options *sessions.Options, keyPairs ...[]byte) *SessionStore {
	return &SessionStore{
		Codecs:  securecookie.CodecsFromPairs(keyPairs...),
		Options: options,
		db:      db,
	}
}

func (ss *SessionStore) Get(r *http.Request, name string) (*sessions.Session, error) {
	return sessions.GetRegistry(r).Get(ss, name)
}

func (ss *SessionStore) New(r *http.Request, name string) (*sessions.Session, error) {
	session := sessions.NewSession(ss, name)
	session.Options = &sessions.Options{
		Path:     ss.Options.Path,
		Domain:   ss.Options.Domain,
		MaxAge:   ss.Options.MaxAge,
		Secure:   ss.Options.Secure,
		HttpOnly: ss.Options.HttpOnly,
	}
	session.IsNew = true

	var err error
	if c, errCookie := r.Cookie(name); errCookie == nil {
		err = securecookie.DecodeMulti(name, c.Value, &session.ID, ss.Codecs...)
		if err == nil {
			err = ss.load(session)
			if err == nil {
				session.IsNew = false
			} else {
				err = nil
			}
		}
	}

	return session, err
}

func (ss *SessionStore) Save(r *http.Request, w http.ResponseWriter, session *sessions.Session) error {
	var err error
	if err = ss.save(session); err != nil {
		return err
	}
	encoded, err := securecookie.EncodeMulti(session.Name(), session.ID, ss.Codecs...)
	if err != nil {
		return err
	}
	http.SetCookie(w, sessions.NewCookie(session.Name(), encoded, session.Options))
	return nil
}

func (ss *SessionStore) Delete(r *http.Request, w http.ResponseWriter, session *sessions.Session) error {
	options := *session.Options
	options.MaxAge = -1
	http.SetCookie(w, sessions.NewCookie(session.Name(), "", &options))
	for k := range session.Values {
		delete(session.Values, k)
	}

	delErr := ss.destroy(session)
	if delErr != nil {
		return delErr
	}
	return nil
}

func (ss *SessionStore) load(session *sessions.Session) error {
	s := &store.Session{}
	err := ss.db.Model(s).Where("key = ?", session.ID).Limit(1).Select()
	if err != nil {
		return err
	}
	if s.ExpiresAt.Sub(time.Now()) < 0 {
		return errors.New("Session expired")
	}

	err = securecookie.DecodeMulti(session.Name(), s.Data, &session.Values, ss.Codecs...)
	if err != nil {
		return err
	}
	session.Values["created_at"] = s.CreatedAt
	session.Values["updated_at"] = s.UpdatedAt
	session.Values["expires_at"] = s.ExpiresAt
	return nil
}

func (ss *SessionStore) save(session *sessions.Session) error {
	encoded, err := securecookie.EncodeMulti(session.Name(), session.Values, ss.Codecs...)
	if err != nil {
		return err
	}

	cr := session.Values["created_at"]
	ex := session.Values["expires_at"]

	var (
		createdAt time.Time
		expiresAt time.Time
		ok        bool
	)
	if cr == nil {
		createdAt = time.Now()
	} else {
		if createdAt, ok = cr.(time.Time); !ok {
			createdAt = time.Now()
		}
	}

	if ex == nil {
		expiresAt = time.Now().Add(time.Second * time.Duration(session.Options.MaxAge))
	} else {
		if expiresAt, ok = ex.(time.Time); !ok {
			expiresAt = time.Now()
		}
		if expiresAt.Sub(time.Now().Add(time.Second*time.Duration(session.Options.MaxAge))) < 0 {
			expiresAt = time.Now().Add(time.Second * time.Duration(session.Options.MaxAge))
		}
	}

	if session.ID == "" {
		session.ID = strings.TrimRight(
			base32.StdEncoding.EncodeToString(
				securecookie.GenerateRandomKey(32),
			), "=")
	}

	s := store.Session{
		Key:       session.ID,
		Data:      encoded,
		CreatedAt: createdAt,
		ExpiresAt: expiresAt,
		UpdatedAt: time.Now(),
	}

	if session.IsNew {
		return ss.insert(&s)
	}

	return ss.update(&s)
}

func (ss *SessionStore) destroy(session *sessions.Session) error {
	_, err := ss.db.Model(&store.Session{}).Where("key = ?", session.ID).Delete()
	return err
}

func (ss *SessionStore) insert(s *store.Session) error {
	return ss.db.Insert(s)
}

func (ss *SessionStore) update(s *store.Session) error {
	return ss.db.Update(s)
}
