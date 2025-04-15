package models

import (
	"time"

	"github.com/canardnc/Ascension/internal/db"
)

type MinigameProgress struct {
	ID              int       `json:"id"`
	UserID          int       `json:"userId"`
	CategoryID      int       `json:"categoryId"`
	MinigameID      int       `json:"minigameId"`
	DifficultyLevel int       `json:"difficultyLevel"`
	Points          int       `json:"points"`
	LastPlayed      time.Time `json:"lastPlayed"`
	TotalPlayed     int       `json:"totalPlayed"`
	Available       bool      `json:"available"`
}

func GetMinigameProgress(userID, minigameID, difficultyLevel int) (*MinigameProgress, error) {
	query := `
		SELECT id, user_id, category_id, minigame_id, difficulty_level, points, last_played, total_played, available
		FROM minigames_progress
		WHERE user_id = $1 AND minigame_id = $2 AND difficulty_level = $3
	`
	var progress MinigameProgress
	err := db.DB.QueryRow(query, userID, minigameID, difficultyLevel).Scan(
		&progress.ID, &progress.UserID, &progress.CategoryID, &progress.MinigameID,
		&progress.DifficultyLevel, &progress.Points, &progress.LastPlayed,
		&progress.TotalPlayed, &progress.Available,
	)
	if err != nil {
		return nil, err
	}
	return &progress, nil
}

func GetMinigamesByCategory(userID, categoryID int) ([]MinigameProgress, error) {
	query := `
        SELECT mp.id, mp.user_id, m.category_id, mp.minigame_id, mp.difficulty_level, 
               mp.points, mp.last_played, mp.total_played, mp.available
        FROM minigames_progress mp
        JOIN minigames m ON mp.minigame_id = m.minigame_id
        WHERE mp.user_id = $1 AND m.category_id = $2 AND mp.available = true
        ORDER BY mp.minigame_id, mp.difficulty_level
    `
	rows, err := db.DB.Query(query, userID, categoryID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var minigames []MinigameProgress
	for rows.Next() {
		var minigame MinigameProgress
		if err := rows.Scan(
			&minigame.ID, &minigame.UserID, &minigame.CategoryID, &minigame.MinigameID,
			&minigame.DifficultyLevel, &minigame.Points, &minigame.LastPlayed,
			&minigame.TotalPlayed, &minigame.Available,
		); err != nil {
			return nil, err
		}
		minigames = append(minigames, minigame)
	}
	return minigames, nil
}

func UpdateMinigameProgress(userID, minigameID, difficultyLevel, points, timeSpent int) error {
	query := `
		UPDATE minigames_progress
		SET points = $1, last_played = $2, total_played = total_played + 1
		WHERE user_id = $3 AND minigame_id = $4 AND difficulty_level = $5
	`
	now := time.Now()
	_, err := db.DB.Exec(query, points, now, userID, minigameID, difficultyLevel)
	return err
}

func CalculateStars(score int) int {
	thresholds := []int{100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200}
	for i, threshold := range thresholds {
		if score < threshold {
			return i
		}
	}
	return 10
}

func CalculateProgressPercentage(score int) float64 {
	thresholds := []int{0, 100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200}
	stars := CalculateStars(score)
	if stars >= 10 {
		return 100.0
	}
	lower := thresholds[stars]
	upper := thresholds[stars+1]
	return float64(score-lower) / float64(upper-lower) * 100.0
}
