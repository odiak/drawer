package sessionstore

import (
	"net/http"
	"time"

	"github.com/go-pg/pg"
	"github.com/go-pg/pg/orm"
	"github.com/gorilla/securecookie"
	"github.com/gorilla/sessions"
	"github.com/odiak/drawer/store"
	"github.com/pkg/errors"
)

type SessionStore struct {
	Codecs  []securecookie.Codec
	Options *sessions.Options
	Path    string
	db      orm.DB
}

func NewStore(db orm.DB, options *sessions.Options, keyPairs ...[]byte) (*SessionStore, error) {
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
	if sessions == nil {
		return nil, nil
	}

	opts := *ss.Options
	session.Options = &opts
	session.IsNew = true

	var err error
	if c, errCookie := r.Cookie(name); errCookie == nil {
		err = securecookie.DecodeMulti(name, c.Value, &session.ID, ss.Codecs...)
		if err == nil {
			err = ss.load(session)
			if err == nil {
				session.IsNew = false
			} else if errors.Cause(err) == pg.ErrNoRows {
				err = nil
			}
		}
	}

	ss.MaxAge(ss.Options.MaxAge)

	return session, err
}

func (ss *SessionStore) Save(r *http.Request, w http.ResponseWriter, session *sessions.Session) error {
	if session.Options.MaxAge < 0 {
	}
}

func (ss *SessionStore) MaxLength(l int) {
	for _, c := range ss.Codecs {
		if codec, ok := c.(*securecookie.SecureCookie); ok {
			codec.MaxLength(l)
		}
	}
}

func (ss *SessionStore) MaxAge(age int) {
	ss.Options.MaxAge = age

	for _, codec := range ss.Codecs {
		if sc, ok := codec.(*securecookie.SecureCookie); ok {
			sc.MaxAge(age)
		}
	}
}

func (ss *SessionStore) load(session *sessions.Session) error {
	s := &store.Session{}
	err := ss.selectOne(s, session.ID)
	if err != nil {
		return err
	}

	return securecookie.DecodeMulti(session.Name(), s.Data, &session.Values, ss.Codecs...)
}

func (ss *SessionStore) save(session *sessions.Session) error {
	encoded, err := securecookie.EncodeMulti(session.Name(), session.Values, ss.Codecs...)
	if err != nil {
		return err
	}

	cr := session.Values["created_at"]
	ex := session.Values["expires_at"]

	createdAt, ok := cr.(time.Time)
	if !ok {
		createdAt = time.Now()
	}

	var expiresAt time.Time
	if ex == nil {
		expiresAt = time.Now().Add(time.Second * time.Duration(session.Options.MaxAge))
	} else {
		expiresAt = ex.(time.Time)
		if expiresAt.Sub(time.Now().Add(time.Second*time.Duration(session.Options.MaxAge))) < 0 {
			expiresAt = time.Now().Add(time.Seconds * time.Duration(session.Options.MaxAge))
		}
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

func (ss *SessionStore) selectOne(s *store.Session, key string) error {
	err := ss.db.Model(s).Where("key = ?", key).Limit(1).Select()
	if err != nil {
		return errors.Wrapf(err, "Session was not found in database")
	}

	return nil
}

func (ss *SessionStore) insert(s *store.Session) {
	return ss.db.Insert(s)
}

func (ss *SessionStore) update(s *store.Session) {
	return ss.db.Update(s)
}
