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
	Year      string    `json:"year,omitempty"`
	Level     int       `json:"level"`
	CreatedAt time.Time `json:"createdAt"`
	Admin     bool      `json:"admin"`   // Nouveau champ pour le droit administrateur
	Teacher   bool      `json:"teacher"` // Nouveau champ pour le droit enseignant
	Parent    bool      `json:"parent"`  // Nouveau champ pour le droit parent
}

// Create crée un nouvel utilisateur dans la base de données
func (u *User) Create() error {
	query := `
		INSERT INTO users (username, email, hero_name, year, level, created_at, admin, teacher, parent)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, created_at
	`
	now := time.Now()
	return db.DB.QueryRow(
		query, u.Username, u.Username+"@gmail.com", u.HeroName, u.Year, 1, now, u.Admin, u.Teacher, u.Parent,
	).Scan(&u.ID, &u.CreatedAt)
}

// Update met à jour les informations de l'utilisateur
func (u *User) Update() error {
	query := `
		UPDATE users
		SET hero_name = $1, year = $2, level = $3, admin = $4, teacher = $5, parent = $6
		WHERE id = $7
	`

	_, err := db.DB.Exec(query, u.HeroName, u.Year, u.Level, u.Admin, u.Teacher, u.Parent, u.ID)
	return err
}

// GetUserByID récupère un utilisateur par son ID
func GetUserByID(id int) (*User, error) {
	query := `
		SELECT id, username, hero_name, year, level, created_at, admin, teacher, parent
		FROM users
		WHERE id = $1
	`

	var user User
	err := db.DB.QueryRow(query, id).Scan(
		&user.ID, &user.Username, &user.HeroName, &user.Year, &user.Level, &user.CreatedAt,
		&user.Admin, &user.Teacher, &user.Parent,
	)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

// GetUserByUsername récupère un utilisateur par son nom d'utilisateur
func GetUserByUsername(username string) (*User, error) {
	query := `
		SELECT id, username, hero_name, year, level, created_at, admin, teacher, parent
		FROM users
		WHERE username = $1
	`

	var user User
	err := db.DB.QueryRow(query, username).Scan(
		&user.ID, &user.Username, &user.HeroName, &user.Year, &user.Level, &user.CreatedAt,
		&user.Admin, &user.Teacher, &user.Parent,
	)
	if err != nil {
		log.Printf("Getuserbyname, Erreur lors de la récupération de l'utilisateur : %v", err)
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

// GetLevelStars récupère le nombre d'étoiles et le score pour un niveau donné
func GetLevelStars(userID, levelID int) (stars int, score int, err error) {
	query := `
        SELECT stars, score
        FROM level_progress
        WHERE user_id = $1 AND level_id = $2
    `

	err = db.DB.QueryRow(query, userID, levelID).Scan(&stars, &score)
	return
}

// GetMaxLevelID récupère l'ID du niveau maximum disponible dans le jeu
func GetMaxLevelID() (int, error) {
	query := `
        SELECT COALESCE(MAX(level), 0) 
        FROM levels
    `
	// Alternative si vous stockez les niveaux dans une autre table :
	// Si les niveaux sont dans une table "levels" avec une colonne "id" :
	// SELECT COALESCE(MAX(id), 0) FROM levels

	var maxLevelID int
	err := db.DB.QueryRow(query).Scan(&maxLevelID)
	if err != nil {
		return 0, err
	}

	return maxLevelID, nil
}

// UpdateLevelStars met à jour le nombre d'étoiles et le score pour un niveau
func UpdateLevelStars(userID, levelID, stars, score int) error {
	query := `
        INSERT INTO level_progress (user_id, level_id, stars, score, completed_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (user_id, level_id)
        DO UPDATE SET 
            stars = CASE WHEN EXCLUDED.stars > level_progress.stars THEN EXCLUDED.stars ELSE level_progress.stars END,
            score = CASE WHEN EXCLUDED.score > level_progress.score THEN EXCLUDED.score ELSE level_progress.score END,
            completed_at = CASE 
                WHEN EXCLUDED.stars > level_progress.stars OR EXCLUDED.score > level_progress.score 
                THEN NOW() 
                ELSE level_progress.completed_at 
            END
    `

	_, err := db.DB.Exec(query, userID, levelID, stars, score)
	return err
}

// UpdateUserRights met à jour les droits d'un utilisateur
func UpdateUserRights(userID int, isAdmin, isTeacher, isParent bool) error {
	query := `
		UPDATE users
		SET admin = $1, teacher = $2, parent = $3
		WHERE id = $4
	`

	_, err := db.DB.Exec(query, isAdmin, isTeacher, isParent, userID)
	return err
}
