package models

import (
	"fmt"
	"log"
	"time"

	"github.com/canardnc/Ascension/internal/db"
)

// Structures de base
type StatCategory struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	DisplayName string `json:"displayName"`
}

type StatSubCategory struct {
	ID          int    `json:"id"`
	CategoryID  int    `json:"categoryId"`
	Name        string `json:"name"`
	DisplayName string `json:"displayName"`
}

type PlayerStat struct {
	ID         int       `json:"id"`
	UserID     int       `json:"userId"`
	CategoryID int       `json:"categoryId"`
	Points     int       `json:"points"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

type PlayerSubStat struct {
	ID            int       `json:"id"`
	UserID        int       `json:"userId"`
	CategoryID    int       `json:"categoryId"`
	SubCategoryID int       `json:"subCategoryId"`
	Points        int       `json:"points"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

type PlayerEnergy struct {
	UserID        int       `json:"userId"`
	CurrentEnergy int       `json:"currentEnergy"`
	MaxEnergy     int       `json:"maxEnergy"`
	LastRefresh   time.Time `json:"lastRefresh"`
}

// Structures de réponse pour la compatibilité
type PlayerStatsResponse struct {
	// Statistiques principales
	Strength  int `json:"strength"`
	Endurance int `json:"endurance"`
	Recovery  int `json:"recovery"`
	Agility   int `json:"agility"`

	// Points disponibles
	AvailableStrengthPoints  int `json:"availableStrengthPoints"`
	AvailableEndurancePoints int `json:"availableEndurancePoints"`
	AvailableRecoveryPoints  int `json:"availableRecoveryPoints"`
	AvailableAgilityPoints   int `json:"availableAgilityPoints"`
}

type PlayerSubStatsResponse struct {
	Attack    int `json:"attack"`
	Precision int `json:"precision"`
	Critical  int `json:"critical"`
	Health    int `json:"health"`
	Armor     int `json:"armor"`
	Dodge     int `json:"dodge"`
	Regen     int `json:"regen"`
	Lifesteal int `json:"lifesteal"`
	Range     int `json:"range"`
	Speed     int `json:"speed"`
}

// Constantes pour les catégories et sous-catégories
const (
	CategoryStrength  = 1
	CategoryEndurance = 2
	CategoryRecovery  = 3
	CategoryAgility   = 4

	SubCategoryAttack    = 1
	SubCategoryPrecision = 2
	SubCategoryCritical  = 3
	SubCategoryHealth    = 4
	SubCategoryArmor     = 5
	SubCategoryDodge     = 6
	SubCategoryRegen     = 7
	SubCategoryLifesteal = 8
	SubCategoryRange     = 9
	SubCategorySpeed     = 10
)

// Obtenez la liste des catégories
func GetAllStatCategories() ([]StatCategory, error) {
	query := `SELECT id, name, display_name FROM stat_categories ORDER BY id`

	rows, err := db.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []StatCategory
	for rows.Next() {
		var category StatCategory
		if err := rows.Scan(&category.ID, &category.Name, &category.DisplayName); err != nil {
			return nil, err
		}
		categories = append(categories, category)
	}

	return categories, nil
}

// Obtenez la liste des sous-catégories
func GetAllStatSubCategories() ([]StatSubCategory, error) {
	query := `SELECT id, category_id, name, display_name FROM stat_subcategories ORDER BY id`

	rows, err := db.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var subCategories []StatSubCategory
	for rows.Next() {
		var subCategory StatSubCategory
		if err := rows.Scan(&subCategory.ID, &subCategory.CategoryID, &subCategory.Name, &subCategory.DisplayName); err != nil {
			return nil, err
		}
		subCategories = append(subCategories, subCategory)
	}

	return subCategories, nil
}

// Récupérer une catégorie par son ID
func GetStatCategoryByID(id int) (*StatCategory, error) {
	query := `SELECT id, name, display_name FROM stat_categories WHERE id = $1`

	var category StatCategory
	err := db.DB.QueryRow(query, id).Scan(&category.ID, &category.Name, &category.DisplayName)
	if err != nil {
		return nil, err
	}

	return &category, nil
}

// Récupérer une catégorie par son nom
func GetStatCategoryByName(name string) (*StatCategory, error) {
	query := `SELECT id, name, display_name FROM stat_categories WHERE name = $1`

	var category StatCategory
	err := db.DB.QueryRow(query, name).Scan(&category.ID, &category.Name, &category.DisplayName)
	if err != nil {
		return nil, err
	}

	return &category, nil
}

// Récupérer une sous-catégorie par son ID
func GetStatSubCategoryByID(id int) (*StatSubCategory, error) {
	query := `SELECT id, category_id, name, display_name FROM stat_subcategories WHERE id = $1`

	var subCategory StatSubCategory
	err := db.DB.QueryRow(query, id).Scan(&subCategory.ID, &subCategory.CategoryID, &subCategory.Name, &subCategory.DisplayName)
	if err != nil {
		return nil, err
	}

	return &subCategory, nil
}

// Récupérer une sous-catégorie par son nom et l'ID de catégorie
func GetStatSubCategoryByNameAndCategory(name string, categoryID int) (*StatSubCategory, error) {
	query := `SELECT id, category_id, name, display_name FROM stat_subcategories 
	          WHERE name = $1 AND category_id = $2`

	var subCategory StatSubCategory
	err := db.DB.QueryRow(query, name, categoryID).Scan(&subCategory.ID, &subCategory.CategoryID, &subCategory.Name, &subCategory.DisplayName)
	if err != nil {
		return nil, err
	}

	return &subCategory, nil
}

// Récupérer les statistiques d'un joueur pour toutes les catégories
func GetAllPlayerStats(userID int) ([]PlayerStat, error) {
	query := `SELECT id, user_id, category_id, points, updated_at 
	          FROM player_stats WHERE user_id = $1 ORDER BY category_id`

	rows, err := db.DB.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stats []PlayerStat
	for rows.Next() {
		var stat PlayerStat
		if err := rows.Scan(&stat.ID, &stat.UserID, &stat.CategoryID, &stat.Points, &stat.UpdatedAt); err != nil {
			return nil, err
		}
		stats = append(stats, stat)
	}

	return stats, nil
}

// Récupérer les statistiques d'un joueur pour une catégorie spécifique
func GetPlayerStatsByCategory(userID int, categoryID int) (*PlayerStat, error) {
	query := `SELECT id, user_id, category_id, points, updated_at 
	          FROM player_stats WHERE user_id = $1 AND category_id = $2`

	var stat PlayerStat
	err := db.DB.QueryRow(query, userID, categoryID).Scan(&stat.ID, &stat.UserID, &stat.CategoryID, &stat.Points, &stat.UpdatedAt)
	if err != nil {
		return nil, err
	}

	return &stat, nil
}

// Récupérer les sous-statistiques d'un joueur pour toutes les catégories
func GetAllPlayerSubStats(userID int) ([]PlayerSubStat, error) {
	query := `SELECT id, user_id, category_id, subcategory_id, points, updated_at 
	          FROM player_substats WHERE user_id = $1 ORDER BY subcategory_id`

	rows, err := db.DB.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stats []PlayerSubStat
	for rows.Next() {
		var stat PlayerSubStat
		if err := rows.Scan(&stat.ID, &stat.UserID, &stat.CategoryID, &stat.SubCategoryID, &stat.Points, &stat.UpdatedAt); err != nil {
			return nil, err
		}
		stats = append(stats, stat)
	}

	return stats, nil
}

// Récupérer les sous-statistiques d'un joueur pour une catégorie spécifique
func GetPlayerSubStatsByCategory(userID int, categoryID int) ([]PlayerSubStat, error) {
	query := `SELECT id, user_id, category_id, subcategory_id, points, updated_at 
	          FROM player_substats WHERE user_id = $1 AND category_id = $2 ORDER BY subcategory_id`

	rows, err := db.DB.Query(query, userID, categoryID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stats []PlayerSubStat
	for rows.Next() {
		var stat PlayerSubStat
		if err := rows.Scan(&stat.ID, &stat.UserID, &stat.CategoryID, &stat.SubCategoryID, &stat.Points, &stat.UpdatedAt); err != nil {
			return nil, err
		}
		stats = append(stats, stat)
	}

	return stats, nil
}

// Obtenir les points disponibles pour une catégorie
func GetAvailablePoints(userID int, categoryID int) (int, error) {
	query := `SELECT get_available_points($1, $2)`

	var availablePoints int
	err := db.DB.QueryRow(query, userID, categoryID).Scan(&availablePoints)
	if err != nil {
		return 0, err
	}

	return availablePoints, nil
}

// Mettre à jour les points d'une statistique principale
func UpdatePlayerStat(userID int, categoryID int, points int) error {
	query := `UPDATE player_stats 
	          SET points = $1, updated_at = NOW() 
	          WHERE user_id = $2 AND category_id = $3`

	result, err := db.DB.Exec(query, points, userID, categoryID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		// La statistique n'existe pas, on l'insère
		insertQuery := `INSERT INTO player_stats (user_id, category_id, points) 
		               VALUES ($1, $2, $3)`
		_, err = db.DB.Exec(insertQuery, userID, categoryID, points)
		if err != nil {
			return err
		}
	}

	return nil
}

// Mettre à jour les points d'une sous-statistique
func UpdatePlayerSubStat(userID int, subCategoryID int, points int) error {
	// D'abord, récupérer la catégorie parente pour la mettre à jour également
	var categoryID int
	err := db.DB.QueryRow(
		`SELECT category_id FROM stat_subcategories WHERE id = $1`,
		subCategoryID,
	).Scan(&categoryID)
	if err != nil {
		return err
	}

	// Mettre à jour la sous-statistique
	query := `UPDATE player_substats 
	          SET points = $1, updated_at = NOW() 
	          WHERE user_id = $2 AND subcategory_id = $3`

	result, err := db.DB.Exec(query, points, userID, subCategoryID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		// La sous-statistique n'existe pas, on l'insère
		insertQuery := `INSERT INTO player_substats (user_id, category_id, subcategory_id, points) 
		               VALUES ($1, $2, $3, $4)`
		_, err = db.DB.Exec(insertQuery, userID, categoryID, subCategoryID, points)
		if err != nil {
			return err
		}
	}

	return nil
}

// Mettre à jour plusieurs sous-statistiques d'une catégorie
func UpdatePlayerSubStatsForCategory(userID int, categoryID int, subStats map[string]int) error {
	// Ajouter des logs pour le débogage
	log.Printf("Mise à jour des sous-stats pour userID: %d, categoryID: %d, subStats: %+v",
		userID, categoryID, subStats)

	// Récupérer toutes les sous-catégories pour cette catégorie
	query := `
        SELECT id, name 
        FROM stat_subcategories 
        WHERE category_id = $1
    `
	rows, err := db.DB.Query(query, categoryID)
	if err != nil {
		log.Printf("Erreur lors de la récupération des sous-catégories: %v", err)
		return err
	}
	defer rows.Close()

	// Créer une map des noms de sous-catégories vers leurs IDs
	subCategoryMap := make(map[string]int)
	for rows.Next() {
		var id int
		var name string
		if err := rows.Scan(&id, &name); err != nil {
			return err
		}
		subCategoryMap[name] = id
	}

	// Démarrer une transaction
	tx, err := db.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Pour chaque sous-statistique à mettre à jour
	for subName, points := range subStats {
		// Récupérer l'ID de la sous-catégorie
		subCategoryID, exists := subCategoryMap[subName]
		if !exists {
			log.Printf("Avertissement: sous-catégorie non trouvée: %s", subName)
			continue // Ignorer cette sous-catégorie et continuer
		}

		log.Printf("Mise à jour de la sous-stat %s (ID: %d) à %d points",
			subName, subCategoryID, points)

		// Mettre à jour ou insérer la sous-statistique
		upsertQuery := `
            INSERT INTO player_substats (user_id, category_id, subcategory_id, points, updated_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (user_id, subcategory_id) 
            DO UPDATE SET points = $4, updated_at = NOW()
        `

		_, err := tx.Exec(upsertQuery, userID, categoryID, subCategoryID, points)
		if err != nil {
			log.Printf("Erreur lors de la mise à jour de la sous-stat %s: %v", subName, err)
			return err
		}
	}

	// Valider la transaction
	if err := tx.Commit(); err != nil {
		log.Printf("Erreur lors de la validation de la transaction: %v", err)
		return err
	}

	log.Printf("Mise à jour réussie pour userID: %d, categoryID: %d", userID, categoryID)
	return nil
}

// GetPlayerEnergyByUserID récupère l'énergie d'un joueur
func GetPlayerEnergyByUserID(userID int) (*PlayerEnergy, error) {
	query := `
		SELECT user_id, current_energy, max_energy, last_refresh
		FROM player_energy
		WHERE user_id = $1
	`

	var energy PlayerEnergy
	err := db.DB.QueryRow(query, userID).Scan(
		&energy.UserID, &energy.CurrentEnergy,
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

// Convertir toutes les statistiques en format de réponse API
func GetPlayerStatsResponse(userID int) (*PlayerStatsResponse, error) {
	// Récupérer toutes les statistiques
	stats, err := GetAllPlayerStats(userID)
	if err != nil {
		return nil, err
	}

	// Récupérer toutes les sous-statistiques
	subStats, err := GetAllPlayerSubStats(userID)
	if err != nil {
		return nil, err
	}

	// Mapper les sous-statistiques par ID
	subStatsMap := make(map[int]int) // map[subCategoryID]points
	for _, subStat := range subStats {
		subStatsMap[subStat.SubCategoryID] = subStat.Points
	}

	// Calculer les totaux et disponibles par catégorie
	strengthTotal := 0
	enduranceTotal := 0
	recoveryTotal := 0
	agilityTotal := 0

	for _, stat := range stats {
		switch stat.CategoryID {
		case CategoryStrength:
			strengthTotal = stat.Points
		case CategoryEndurance:
			enduranceTotal = stat.Points
		case CategoryRecovery:
			recoveryTotal = stat.Points
		case CategoryAgility:
			agilityTotal = stat.Points
		}
	}

	// Calculer les statistiques utilisées
	strengthUsed := subStatsMap[SubCategoryAttack] + subStatsMap[SubCategoryPrecision] + subStatsMap[SubCategoryCritical]
	enduranceUsed := subStatsMap[SubCategoryHealth] + subStatsMap[SubCategoryArmor] + subStatsMap[SubCategoryDodge]
	recoveryUsed := subStatsMap[SubCategoryRegen] + subStatsMap[SubCategoryLifesteal]
	agilityUsed := subStatsMap[SubCategoryRange] + subStatsMap[SubCategorySpeed]

	// Calculer les points disponibles
	availableStrength := strengthTotal - strengthUsed
	availableEndurance := enduranceTotal - enduranceUsed
	availableRecovery := recoveryTotal - recoveryUsed
	availableAgility := agilityTotal - agilityUsed

	// S'assurer que les disponibles ne sont jamais négatifs
	if availableStrength < 0 {
		availableStrength = 0
	}
	if availableEndurance < 0 {
		availableEndurance = 0
	}
	if availableRecovery < 0 {
		availableRecovery = 0
	}
	if availableAgility < 0 {
		availableAgility = 0
	}

	return &PlayerStatsResponse{
		Strength:                 strengthUsed,
		Endurance:                enduranceUsed,
		Recovery:                 recoveryUsed,
		Agility:                  agilityUsed,
		AvailableStrengthPoints:  availableStrength,
		AvailableEndurancePoints: availableEndurance,
		AvailableRecoveryPoints:  availableRecovery,
		AvailableAgilityPoints:   availableAgility,
	}, nil
}

// Convertir les sous-statistiques en format de réponse API
func GetPlayerSubStatsResponse(userID int) (*PlayerSubStatsResponse, error) {
	// Récupérer toutes les sous-statistiques
	subStats, err := GetAllPlayerSubStats(userID)
	if err != nil {
		return nil, err
	}

	// Mapper les sous-statistiques par ID
	subStatsMap := make(map[int]int) // map[subCategoryID]points
	for _, subStat := range subStats {
		subStatsMap[subStat.SubCategoryID] = subStat.Points
	}

	return &PlayerSubStatsResponse{
		Attack:    subStatsMap[SubCategoryAttack],
		Precision: subStatsMap[SubCategoryPrecision],
		Critical:  subStatsMap[SubCategoryCritical],
		Health:    subStatsMap[SubCategoryHealth],
		Armor:     subStatsMap[SubCategoryArmor],
		Dodge:     subStatsMap[SubCategoryDodge],
		Regen:     subStatsMap[SubCategoryRegen],
		Lifesteal: subStatsMap[SubCategoryLifesteal],
		Range:     subStatsMap[SubCategoryRange],
		Speed:     subStatsMap[SubCategorySpeed],
	}, nil
}

// Ajouter des points à une catégorie de statistique
func AddPointsToCategory(userID int, categoryName string, points int) error {
	// Récupérer l'ID de la catégorie
	category, err := GetStatCategoryByName(categoryName)
	if err != nil {
		return fmt.Errorf("catégorie non trouvée: %s, erreur: %v", categoryName, err)
	}

	// Récupérer les points actuels
	stat, err := GetPlayerStatsByCategory(userID, category.ID)
	if err != nil {
		// Si la statistique n'existe pas encore, on initialise
		currentPoints := 0
		return UpdatePlayerStat(userID, category.ID, currentPoints+points)
	}

	// Mettre à jour les points
	return UpdatePlayerStat(userID, category.ID, stat.Points+points)
}
