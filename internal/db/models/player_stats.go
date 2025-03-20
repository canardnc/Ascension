package models

import (
	"log"
	"time"

	"github.com/canardnc/Ascension/internal/db"
)

// PlayerStats représente les statistiques principales d'un joueur
type PlayerStats struct {
	ID                       int       `json:"id"`
	UserID                   int       `json:"userId"`
	Strength                 int       `json:"strength"`
	Endurance                int       `json:"endurance"`
	Recovery                 int       `json:"recovery"`
	Agility                  int       `json:"agility"`
	AvailableStrengthPoints  int       `json:"availableStrengthPoints"`
	AvailableEndurancePoints int       `json:"availableEndurancePoints"`
	AvailableRecoveryPoints  int       `json:"availableRecoveryPoints"`
	AvailableAgilityPoints   int       `json:"availableAgilityPoints"`
	UpdatedAt                time.Time `json:"updatedAt"`
}

// PlayerSubStats représente les sous-statistiques d'un joueur
type PlayerSubStats struct {
	ID        int       `json:"id"`
	UserID    int       `json:"userId"`
	Attack    int       `json:"attack"`
	Precision int       `json:"precision"`
	Critical  int       `json:"critical"`
	Health    int       `json:"health"`
	Armor     int       `json:"armor"`
	Dodge     int       `json:"dodge"`
	Regen     int       `json:"regen"`
	Lifesteal int       `json:"lifesteal"`
	Range     int       `json:"range"`
	Speed     int       `json:"speed"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// PlayerEnergy représente l'énergie d'un joueur
type PlayerEnergy struct {
	ID            int       `json:"id"`
	UserID        int       `json:"userId"`
	CurrentEnergy int       `json:"currentEnergy"`
	MaxEnergy     int       `json:"maxEnergy"`
	LastRefresh   time.Time `json:"lastRefresh"`
}

// UnlockedLevel représente un niveau débloqué par le joueur
type UnlockedLevel struct {
	ID         int       `json:"id"`
	UserID     int       `json:"userId"`
	LevelID    int       `json:"levelId"`
	UnlockedAt time.Time `json:"unlockedAt"`
}

// TrainingCompleted représente un exercice d'entraînement complété
type TrainingCompleted struct {
	ID           int       `json:"id"`
	UserID       int       `json:"userId"`
	Category     string    `json:"category"`
	ExerciseName string    `json:"exerciseName"`
	Difficulty   int       `json:"difficulty"`
	PointsEarned int       `json:"pointsEarned"`
	CompletedAt  time.Time `json:"completedAt"`
}

// GetPlayerStatsByUserID récupère les statistiques principales d'un joueur
func GetPlayerStatsByUserID(userID int) (*PlayerStats, error) {
	query := `
		SELECT id, user_id, strength, endurance, recovery, agility, 
		       available_strength_points, available_endurance_points, 
		       available_recovery_points, available_agility_points, 
		       updated_at
		FROM player_stats
		WHERE user_id = $1
	`

	var stats PlayerStats
	err := db.DB.QueryRow(query, userID).Scan(
		&stats.ID, &stats.UserID, &stats.Strength, &stats.Endurance,
		&stats.Recovery, &stats.Agility, &stats.AvailableStrengthPoints,
		&stats.AvailableEndurancePoints, &stats.AvailableRecoveryPoints,
		&stats.AvailableAgilityPoints, &stats.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &stats, nil
}

// GetPlayerSubStatsByUserID récupère les sous-statistiques d'un joueur
func GetPlayerSubStatsByUserID(userID int) (*PlayerSubStats, error) {
	query := `
		SELECT id, user_id, attack, precision, critical, health, armor, dodge, 
		       regen, lifesteal, range, speed, updated_at
		FROM player_substats
		WHERE user_id = $1
	`

	var subStats PlayerSubStats
	err := db.DB.QueryRow(query, userID).Scan(
		&subStats.ID, &subStats.UserID, &subStats.Attack, &subStats.Precision,
		&subStats.Critical, &subStats.Health, &subStats.Armor, &subStats.Dodge,
		&subStats.Regen, &subStats.Lifesteal, &subStats.Range, &subStats.Speed,
		&subStats.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &subStats, nil
}

// GetPlayerEnergyByUserID récupère l'énergie d'un joueur
func GetPlayerEnergyByUserID(userID int) (*PlayerEnergy, error) {
	query := `
		SELECT id, user_id, current_energy, max_energy, last_refresh
		FROM player_energy
		WHERE user_id = $1
	`

	var energy PlayerEnergy
	err := db.DB.QueryRow(query, userID).Scan(
		&energy.ID, &energy.UserID, &energy.CurrentEnergy,
		&energy.MaxEnergy, &energy.LastRefresh,
	)
	if err != nil {
		return nil, err
	}

	// Vérifier si l'énergie doit être rechargée (toutes les 5 minutes)
	now := time.Now()
	elapsed := now.Sub(energy.LastRefresh).Minutes()
	energyRegenRate := 1 // 1 point d'énergie toutes les 5 minutes

	if elapsed >= 5 {
		minutesPassed := int(elapsed)
		energyToRegen := (minutesPassed / 5) * energyRegenRate

		if energyToRegen > 0 {
			// Mettre à jour l'énergie
			newEnergy := energy.CurrentEnergy + energyToRegen
			if newEnergy > energy.MaxEnergy {
				newEnergy = energy.MaxEnergy
			}

			updateQuery := `
				UPDATE player_energy
				SET current_energy = $1, last_refresh = $2
				WHERE user_id = $3
			`

			_, err := db.DB.Exec(updateQuery, newEnergy, now, userID)
			if err != nil {
				return nil, err
			}

			energy.CurrentEnergy = newEnergy
			energy.LastRefresh = now
		}
	}

	return &energy, nil
}

// GetUnlockedLevelsByUserID récupère les niveaux débloqués par un joueur
func GetUnlockedLevelsByUserID(userID int) ([]int, error) {
	query := `
		SELECT level_id
		FROM unlocked_levels
		WHERE user_id = $1
		ORDER BY level_id
	`

	rows, err := db.DB.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var levels []int
	for rows.Next() {
		var levelID int
		if err := rows.Scan(&levelID); err != nil {
			return nil, err
		}
		levels = append(levels, levelID)
	}

	return levels, nil
}

// SavePlayerStats enregistre les statistiques principales d'un joueur
func (stats *PlayerStats) Save() error {
	query := `
		UPDATE player_stats
		SET strength = $1, endurance = $2, recovery = $3, agility = $4,
		    available_strength_points = $5, available_endurance_points = $6,
		    available_recovery_points = $7, available_agility_points = $8,
		    updated_at = $9
		WHERE user_id = $10
	`

	now := time.Now()
	_, err := db.DB.Exec(
		query,
		stats.Strength, stats.Endurance, stats.Recovery, stats.Agility,
		stats.AvailableStrengthPoints, stats.AvailableEndurancePoints,
		stats.AvailableRecoveryPoints, stats.AvailableAgilityPoints,
		now, stats.UserID,
	)
	if err != nil {
		return err
	}

	stats.UpdatedAt = now
	return nil
}

// SavePlayerSubStats enregistre les sous-statistiques d'un joueur
func (subStats *PlayerSubStats) Save() error {
	query := `
		UPDATE player_substats
		SET attack = $1, precision = $2, critical = $3, health = $4,
		    armor = $5, dodge = $6, regen = $7, lifesteal = $8,
		    range = $9, speed = $10, updated_at = $11
		WHERE user_id = $12
	`

	now := time.Now()
	_, err := db.DB.Exec(
		query,
		subStats.Attack, subStats.Precision, subStats.Critical, subStats.Health,
		subStats.Armor, subStats.Dodge, subStats.Regen, subStats.Lifesteal,
		subStats.Range, subStats.Speed, now, subStats.UserID,
	)
	if err != nil {
		return err
	}

	subStats.UpdatedAt = now
	return nil
}

// RecordTrainingCompletion enregistre un exercice d'entraînement complété
func RecordTrainingCompletion(userID int, category, exerciseName string, difficulty, pointsEarned int) error {
	query := `
		INSERT INTO training_completed 
		(user_id, category, exercise_name, difficulty, points_earned)
		VALUES ($1, $2, $3, $4, $5)
	`

	_, err := db.DB.Exec(query, userID, category, exerciseName, difficulty, pointsEarned)
	return err
}

// UnlockLevel débloque un niveau pour un joueur
func UnlockLevel(userID, levelID int) error {
	// Vérifier d'abord si le niveau est déjà débloqué
	query := `
        SELECT COUNT(*) 
        FROM unlocked_levels 
        WHERE user_id = $1 AND level_id = $2
    `

	var count int
	err := db.DB.QueryRow(query, userID, levelID).Scan(&count)
	if err != nil {
		log.Printf("Erreur lors de la vérification du niveau débloqué: %v", err)
		return err
	}

	// Si le niveau est déjà débloqué, rien à faire
	if count > 0 {
		log.Printf("Le niveau %d est déjà débloqué pour l'utilisateur %d", levelID, userID)
		return nil
	}

	// Insérer le nouveau niveau débloqué
	insertQuery := `
        INSERT INTO unlocked_levels (user_id, level_id)
        VALUES ($1, $2)
    `

	_, err = db.DB.Exec(insertQuery, userID, levelID)
	if err != nil {
		log.Printf("Erreur lors de l'insertion du niveau débloqué: %v", err)
		return err
	}

	log.Printf("Niveau %d débloqué avec succès pour l'utilisateur %d", levelID, userID)
	return nil
}

// UseEnergy consomme de l'énergie pour un joueur
func UseEnergy(userID, amount int) (bool, error) {
	// Récupérer l'énergie actuelle
	energy, err := GetPlayerEnergyByUserID(userID)
	if err != nil {
		return false, err
	}

	// Vérifier si le joueur a assez d'énergie
	if energy.CurrentEnergy < amount {
		return false, nil
	}

	// Consommer l'énergie
	query := `
		UPDATE player_energy
		SET current_energy = current_energy - $1
		WHERE user_id = $2
	`

	_, err = db.DB.Exec(query, amount, userID)
	if err != nil {
		return false, err
	}

	return true, nil
}
