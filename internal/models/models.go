package models

import (
	"fmt"
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
	Year      string    `json:"year,omitempty"`
	Level     int       `json:"level"`
	CreatedAt time.Time `json:"createdAt"`
}

// Create crée un nouvel utilisateur dans la base de données
func (u *User) Create() error {
	query := `
		INSERT INTO users (username, email, hero_name, year, level, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`
	now := time.Now()

	// Si l'email est vide, utiliser le username comme email de substitution
	email := u.Email
	if email == "" {
		email = u.Username + "@example.com"
	}

	return db.DB.QueryRow(
		query, u.Username, email, u.HeroName, u.Year, 1, now,
	).Scan(&u.ID, &u.CreatedAt)
}

// Update met à jour les informations de l'utilisateur
func (u *User) Update() error {
	query := `
		UPDATE users
		SET hero_name = $1, year = $2, level = $3
		WHERE id = $4
	`

	_, err := db.DB.Exec(query, u.HeroName, u.Year, u.Level, u.ID)
	return err
}

// GetUserByID récupère un utilisateur par son ID
func GetUserByID(id int) (*User, error) {
	// Log détaillé pour debugging
	log.Printf("GetUserByID: Tentative de récupération de l'utilisateur avec ID=%d", id)

	// Vérifier d'abord si l'ID est valide
	if id <= 0 {
		log.Printf("GetUserByID: ID invalide (%d)", id)
		return nil, fmt.Errorf("ID utilisateur invalide: %d", id)
	}

	// Requête simplifiée pour s'assurer qu'elle fonctionne
	query := `
		SELECT id, username, COALESCE(hero_name, ''), COALESCE(year, ''), COALESCE(level, 1), created_at
		FROM users
		WHERE id = $1
	`

	var user User
	err := db.DB.QueryRow(query, id).Scan(
		&user.ID,
		&user.Username,
		&user.HeroName,
		&user.Year,
		&user.Level,
		&user.CreatedAt,
	)

	if err != nil {
		log.Printf("GetUserByID: Erreur lors de la récupération de l'utilisateur ID=%d: %v", id, err)
		return nil, err
	}

	log.Printf("GetUserByID: Utilisateur ID=%d récupéré avec succès: %s", id, user.Username)
	return &user, nil
}

// GetUserByUsername récupère un utilisateur par son nom d'utilisateur
func GetUserByUsername(username string) (*User, error) {
	log.Printf("GetUserByUsername: Tentative de récupération de l'utilisateur avec username=%s", username)

	// Vérifier si username est valide
	if username == "" {
		log.Printf("GetUserByUsername: Username vide")
		return nil, fmt.Errorf("nom d'utilisateur vide")
	}

	// Requête simplifiée
	query := `
		SELECT id, username, COALESCE(hero_name, ''), COALESCE(year, ''), COALESCE(level, 1), created_at
		FROM users
		WHERE username = $1
	`

	var user User
	err := db.DB.QueryRow(query, username).Scan(
		&user.ID,
		&user.Username,
		&user.HeroName,
		&user.Year,
		&user.Level,
		&user.CreatedAt,
	)

	if err != nil {
		log.Printf("GetUserByUsername: Erreur lors de la récupération de l'utilisateur username=%s: %v", username, err)
		return nil, err
	}

	log.Printf("GetUserByUsername: Utilisateur username=%s récupéré avec succès: ID=%d", username, user.ID)
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
