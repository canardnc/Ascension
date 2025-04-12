package models

import (
	"time"

	"github.com/canardnc/Ascension/internal/db"
)

// MinigameHistory représente une entrée dans l'historique des parties de mini-jeux
type MinigameHistory struct {
	ID              int        `json:"id"`
	UserID          int        `json:"userId"`
	MinigameID      int        `json:"minigameId"`
	DifficultyLevel int        `json:"difficultyLevel"`
	StartDate       time.Time  `json:"startDate"`
	EndDate         *time.Time `json:"endDate,omitempty"`
	Score           *int       `json:"score,omitempty"`
	Duration        *int       `json:"duration,omitempty"`
}

// StartMinigameSession crée une nouvelle entrée dans l'historique pour le début d'une partie
func StartMinigameSession(userID, minigameID, difficultyLevel int) (*MinigameHistory, error) {
	query := `
		INSERT INTO minigames_history (user_id, minigame_id, difficulty_level, start_date)
		VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
		RETURNING id, start_date
	`

	var history MinigameHistory
	history.UserID = userID
	history.MinigameID = minigameID
	history.DifficultyLevel = difficultyLevel

	err := db.DB.QueryRow(query, userID, minigameID, difficultyLevel).Scan(&history.ID, &history.StartDate)
	if err != nil {
		return nil, err
	}

	return &history, nil
}

// EndMinigameSession met à jour l'entrée existante avec les résultats de fin de partie
func EndMinigameSession(historyID, score, duration int) error {
	query := `
		UPDATE minigames_history
		SET end_date = CURRENT_TIMESTAMP, score = $2, duration = $3
		WHERE id = $1
	`

	_, err := db.DB.Exec(query, historyID, score, duration)
	return err
}

// GetMinigameHistory récupère l'historique des parties pour un utilisateur
func GetMinigameHistory(userID int, limit int) ([]MinigameHistory, error) {
	query := `
		SELECT id, user_id, minigame_id, difficulty_level, start_date, end_date, score, duration
		FROM minigames_history
		WHERE user_id = $1
		ORDER BY start_date DESC
		LIMIT $2
	`

	rows, err := db.DB.Query(query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var history []MinigameHistory
	for rows.Next() {
		var h MinigameHistory
		if err := rows.Scan(
			&h.ID, &h.UserID, &h.MinigameID, &h.DifficultyLevel,
			&h.StartDate, &h.EndDate, &h.Score, &h.Duration,
		); err != nil {
			return nil, err
		}
		history = append(history, h)
	}

	return history, nil
}
