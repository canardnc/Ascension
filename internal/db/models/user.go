package models

import (
	"log"
	"time"

	"github.com/canardnc/Ascension/internal/db"
)

// User représente un utilisateur dans le système
type User struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	HeroName  string    `json:"heroName,omitempty"`
	Level     int       `json:"level"`
	CreatedAt time.Time `json:"createdAt"`
}

// Create crée un nouvel utilisateur dans la base de données
func (u *User) Create() error {
	query := `
		INSERT INTO users (username, email, hero_name, level, created_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at
	`
	now := time.Now()
	return db.DB.QueryRow(
		query, u.Username, u.Username+"@gmail.com", u.HeroName, 1, now,
	).Scan(&u.ID, &u.CreatedAt)
}

// Update met à jour les informations de l'utilisateur
func (u *User) Update() error {
	query := `
		UPDATE users
		SET hero_name = $1, level = $2
		WHERE id = $3
	`

	_, err := db.DB.Exec(query, u.HeroName, u.Level, u.ID)
	return err
}

// GetUserByID récupère un utilisateur par son ID
func GetUserByID(id int) (*User, error) {
	query := `
		SELECT id, username, hero_name, level, created_at
		FROM users
		WHERE id = $1
	`

	var user User
	err := db.DB.QueryRow(query, id).Scan(
		&user.ID, &user.Username, &user.HeroName, &user.Level, &user.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

// GetUserByUsername récupère un utilisateur par son nom d'utilisateur
func GetUserByUsername(username string) (*User, error) {
	query := `
		SELECT id, username, hero_name, level, created_at
		FROM users
		WHERE username = $1
	`

	var user User
	err := db.DB.QueryRow(query, username).Scan(
		&user.ID, &user.Username, &user.HeroName, &user.Level, &user.CreatedAt,
	)
	if err != nil {
		log.Printf("Erreur lors de la récupération de l'utilisateur : %v", err)
		return nil, err
	}

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
