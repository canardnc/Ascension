package models

import (
	"time"

	"github.com/canardnc/Ascension/internal/db"
)

// Score représente un score de jeu
type Score struct {
	ID         int       `json:"id"`
	UserID     int       `json:"userId"`
	Score      int       `json:"score"`
	Duration   int       `json:"duration"` // en secondes
	CompletedAt time.Time `json:"completedAt"`
}

// Create enregistre un nouveau score dans la base de données
func (s *Score) Create() error {
	query := `
		INSERT INTO game_scores (user_id, score, duration, completed_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id, completed_at
	`

	now := time.Now()
	return db.DB.QueryRow(
		query, s.UserID, s.Score, s.Duration, now,
	).Scan(&s.ID, &s.CompletedAt)
}

// IsNewBestScore vérifie si le score est un nouveau record pour l'utilisateur
func (s *Score) IsNewBestScore() (bool, error) {
	query := `
		SELECT COUNT(*) = 0
		FROM game_scores
		WHERE user_id = $1 AND score > $2
	`

	var isNewBest bool
	err := db.DB.QueryRow(query, s.UserID, s.Score).Scan(&isNewBest)
	return isNewBest, err
}

// GetScoresByUserID récupère tous les scores d'un utilisateur
func GetScoresByUserID(userID int, limit int) ([]Score, error) {
	query := `
		SELECT id, user_id, score, duration, completed_at
		FROM game_scores
		WHERE user_id = $1
		ORDER BY score DESC
		LIMIT $2
	`

	rows, err := db.DB.Query(query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var scores []Score
	for rows.Next() {
		var score Score
		if err := rows.Scan(
			&score.ID, &score.UserID, &score.Score,
			&score.Duration, &score.CompletedAt,
		); err != nil {
			return nil, err
		}
		scores = append(scores, score)
	}

	return scores, nil
}
