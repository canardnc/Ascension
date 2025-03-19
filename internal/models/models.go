package models

import (
	"time"

	"github.com/canardnc/Ascension/internal/db"
)

// User représente un utilisateur dans le système
type User struct {
	ID        int       `json:"id"`
	GoogleID  string    `json:"googleId,omitempty"`
	Email     string    `json:"email"`
	Username  string    `json:"username"`
	HeroName  string    `json:"heroName,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
}

// Create crée un nouvel utilisateur dans la base de données
func (u *User) Create() error {
	query := `
		INSERT INTO users (google_id, email, hero_name, created_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at
	`

	// Pour une authentification simple, on utilise le username comme email et un google_id généré
	if u.GoogleID == "" {
		u.GoogleID = "local_" + u.Username
	}
	if u.Email == "" {
		u.Email = u.Username + "@local.auth"
	}

	now := time.Now()
	return db.DB.QueryRow(
		query, u.GoogleID, u.Email, u.HeroName, now,
	).Scan(&u.ID, &u.CreatedAt)
}

// Update met à jour les informations de l'utilisateur
func (u *User) Update() error {
	query := `
		UPDATE users
		SET hero_name = $1
		WHERE id = $2
	`

	_, err := db.DB.Exec(query, u.HeroName, u.ID)
	return err
}

// GetUserByID récupère un utilisateur par son ID
func GetUserByID(id int) (*User, error) {
	query := `
		SELECT id, google_id, email, hero_name, created_at
		FROM users
		WHERE id = $1
	`

	var user User
	err := db.DB.QueryRow(query, id).Scan(
		&user.ID, &user.GoogleID, &user.Email, &user.HeroName, &user.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	// Définir le username basé sur l'email pour l'authentification simple
	user.Username = user.Email
	if len(user.Email) > 0 && user.Email[len(user.Email)-10:] == "@local.auth" {
		user.Username = user.Email[:len(user.Email)-10]
	}

	return &user, nil
}

// GetUserByUsername récupère un utilisateur par son nom d'utilisateur (pour l'auth simple)
func GetUserByUsername(username string) (*User, error) {
	// Pour l'authentification simple, on cherche par email qui correspond à username@local.auth
	email := username + "@local.auth"
	
	query := `
		SELECT id, google_id, email, hero_name, created_at
		FROM users
		WHERE email = $1
	`

	var user User
	err := db.DB.QueryRow(query, email).Scan(
		&user.ID, &user.GoogleID, &user.Email, &user.HeroName, &user.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	user.Username = username
	return &user, nil
}

// GetBestScore récupère le meilleur score de l'utilisateur
func (u *User) GetBestScore() (int, error) {
	query := `
		SELECT COALESCE(MAX(score), 0)
		FROM game_scores
		WHERE user_id = $1
	`

	var bestScore int
	err := db.DB.QueryRow(query, u.ID).Scan(&bestScore)
	if err != nil {
		return 0, err
	}

	return bestScore, nil
}
