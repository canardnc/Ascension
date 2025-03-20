package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"github.com/canardnc/Ascension/internal/api/middleware"
	"github.com/canardnc/Ascension/internal/db/models"
)

// StatsResponse représente la réponse complète des statistiques d'un joueur
type StatsResponse struct {
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

	// Sous-statistiques
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

	// Énergie
	CurrentEnergy int `json:"currentEnergy"`
	MaxEnergy     int `json:"maxEnergy"`

	// Niveaux débloqués
	UnlockedLevels []int `json:"unlockedLevels"`
}

// GetPlayerStats récupère toutes les statistiques d'un joueur
func GetPlayerStats(w http.ResponseWriter, r *http.Request) {
	// Récupérer l'ID utilisateur depuis le contexte
	userId := r.Context().Value("userId").(int)
	log.Printf("GET player stats is called for user %d", userId)

	// Récupérer les statistiques principales
	stats, err := models.GetPlayerStatsByUserID(userId)
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération des statistiques")
		return
	}

	// Récupérer les sous-statistiques
	subStats, err := models.GetPlayerSubStatsByUserID(userId)
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération des sous-statistiques")
		return
	}

	// Récupérer l'énergie
	energy, err := models.GetPlayerEnergyByUserID(userId)
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération de l'énergie")
		return
	}

	// Récupérer les niveaux débloqués
	unlockedLevels, err := models.GetUnlockedLevelsByUserID(userId)
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération des niveaux débloqués")
		return
	}

	// Construire la réponse
	response := StatsResponse{
		// Statistiques principales
		Strength:  stats.Strength,
		Endurance: stats.Endurance,
		Recovery:  stats.Recovery,
		Agility:   stats.Agility,

		// Points disponibles
		AvailableStrengthPoints:  stats.AvailableStrengthPoints,
		AvailableEndurancePoints: stats.AvailableEndurancePoints,
		AvailableRecoveryPoints:  stats.AvailableRecoveryPoints,
		AvailableAgilityPoints:   stats.AvailableAgilityPoints,

		// Sous-statistiques
		Attack:    subStats.Attack,
		Precision: subStats.Precision,
		Critical:  subStats.Critical,
		Health:    subStats.Health,
		Armor:     subStats.Armor,
		Dodge:     subStats.Dodge,
		Regen:     subStats.Regen,
		Lifesteal: subStats.Lifesteal,
		Range:     subStats.Range,
		Speed:     subStats.Speed,

		// Énergie
		CurrentEnergy: energy.CurrentEnergy,
		MaxEnergy:     energy.MaxEnergy,

		// Niveaux débloqués
		UnlockedLevels: unlockedLevels,
	}

	middleware.RespondWithJSON(w, http.StatusOK, response)
}

// StatsUpdateRequest représente une demande de mise à jour des sous-statistiques
type StatsUpdateRequest struct {
	Category string         `json:"category"`
	SubStats map[string]int `json:"subStats"`
}

// UpdatePlayerStats met à jour les sous-statistiques d'un joueur
func UpdatePlayerStats(w http.ResponseWriter, r *http.Request) {
	// Récupérer l'ID utilisateur depuis le contexte
	userId := r.Context().Value("userId").(int)

	var request StatsUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		middleware.RespondWithError(w, http.StatusBadRequest, "Données invalides")
		return
	}

	// Récupérer les statistiques actuelles
	stats, err := models.GetPlayerStatsByUserID(userId)
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération des statistiques")
		return
	}

	// Récupérer les sous-statistiques actuelles
	subStats, err := models.GetPlayerSubStatsByUserID(userId)
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération des sous-statistiques")
		return
	}

	// Calculer la différence totale de points
	pointsDiff := 0

	switch request.Category {
	case "strength":
		// Traiter les sous-stats de force
		if val, ok := request.SubStats["attack"]; ok {
			pointsDiff += val - subStats.Attack
			subStats.Attack = val
		}
		if val, ok := request.SubStats["precision"]; ok {
			pointsDiff += val - subStats.Precision
			subStats.Precision = val
		}
		if val, ok := request.SubStats["critical"]; ok {
			pointsDiff += val - subStats.Critical
			subStats.Critical = val
		}

		// Vérifier si le joueur a assez de points
		if pointsDiff > stats.AvailableStrengthPoints {
			middleware.RespondWithError(w, http.StatusBadRequest, "Pas assez de points disponibles")
			return
		}

		// Mettre à jour les points disponibles
		stats.AvailableStrengthPoints -= pointsDiff

	case "endurance":
		// Traiter les sous-stats d'endurance
		if val, ok := request.SubStats["health"]; ok {
			pointsDiff += val - subStats.Health
			subStats.Health = val
		}
		if val, ok := request.SubStats["armor"]; ok {
			pointsDiff += val - subStats.Armor
			subStats.Armor = val
		}
		if val, ok := request.SubStats["dodge"]; ok {
			pointsDiff += val - subStats.Dodge
			subStats.Dodge = val
		}

		// Vérifier si le joueur a assez de points
		if pointsDiff > stats.AvailableEndurancePoints {
			middleware.RespondWithError(w, http.StatusBadRequest, "Pas assez de points disponibles")
			return
		}

		// Mettre à jour les points disponibles
		stats.AvailableEndurancePoints -= pointsDiff

	case "recovery":
		// Traiter les sous-stats de récupération
		if val, ok := request.SubStats["regen"]; ok {
			pointsDiff += val - subStats.Regen
			subStats.Regen = val
		}
		if val, ok := request.SubStats["lifesteal"]; ok {
			pointsDiff += val - subStats.Lifesteal
			subStats.Lifesteal = val
		}

		// Vérifier si le joueur a assez de points
		if pointsDiff > stats.AvailableRecoveryPoints {
			middleware.RespondWithError(w, http.StatusBadRequest, "Pas assez de points disponibles")
			return
		}

		// Mettre à jour les points disponibles
		stats.AvailableRecoveryPoints -= pointsDiff

	case "agility":
		// Traiter les sous-stats d'agilité
		if val, ok := request.SubStats["range"]; ok {
			pointsDiff += val - subStats.Range
			subStats.Range = val
		}
		if val, ok := request.SubStats["speed"]; ok {
			pointsDiff += val - subStats.Speed
			subStats.Speed = val
		}

		// Vérifier si le joueur a assez de points
		if pointsDiff > stats.AvailableAgilityPoints {
			middleware.RespondWithError(w, http.StatusBadRequest, "Pas assez de points disponibles")
			return
		}

		// Mettre à jour les points disponibles
		stats.AvailableAgilityPoints -= pointsDiff

	default:
		middleware.RespondWithError(w, http.StatusBadRequest, "Catégorie invalide")
		return
	}

	// Mettre à jour les valeurs des stats principales
	stats.Strength = subStats.Attack + subStats.Precision + subStats.Critical
	stats.Endurance = subStats.Health + subStats.Armor + subStats.Dodge
	stats.Recovery = subStats.Regen + subStats.Lifesteal
	stats.Agility = subStats.Range + subStats.Speed

	// Sauvegarder les statistiques mises à jour
	if err := stats.Save(); err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la sauvegarde des statistiques")
		return
	}

	// Sauvegarder les sous-statistiques mises à jour
	if err := subStats.Save(); err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la sauvegarde des sous-statistiques")
		return
	}

	middleware.RespondWithJSON(w, http.StatusOK, map[string]bool{"success": true})
}

// TrainingRequest représente une demande d'enregistrement d'exercice complété
type TrainingRequest struct {
	Category     string `json:"category"`
	ExerciseName string `json:"exerciseName"`
	Difficulty   int    `json:"difficulty"`
	PointsEarned int    `json:"pointsEarned"`
}

// CompleteTraining enregistre un exercice d'entraînement complété
func CompleteTraining(w http.ResponseWriter, r *http.Request) {
	// Récupérer l'ID utilisateur depuis le contexte
	userId := r.Context().Value("userId").(int)

	var request TrainingRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		middleware.RespondWithError(w, http.StatusBadRequest, "Données invalides")
		return
	}

	if request.Category == "" || request.ExerciseName == "" || request.Difficulty <= 0 || request.PointsEarned <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "Paramètres invalides")
		return
	}

	// Enregistrer l'exercice complété
	err := models.RecordTrainingCompletion(
		userId,
		request.Category,
		request.ExerciseName,
		request.Difficulty,
		request.PointsEarned,
	)
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de l'enregistrement de l'exercice")
		return
	}

	// Récupérer les statistiques actuelles
	stats, err := models.GetPlayerStatsByUserID(userId)
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération des statistiques")
		return
	}

	// Mettre à jour les points disponibles selon la catégorie
	switch request.Category {
	case "strength":
		stats.AvailableStrengthPoints += request.PointsEarned
	case "endurance":
		stats.AvailableEndurancePoints += request.PointsEarned
	case "recovery":
		stats.AvailableRecoveryPoints += request.PointsEarned
	case "agility":
		stats.AvailableAgilityPoints += request.PointsEarned
	}

	// Sauvegarder les statistiques mises à jour
	if err := stats.Save(); err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la sauvegarde des points")
		return
	}

	middleware.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success":      true,
		"pointsEarned": request.PointsEarned,
	})
}

// BattleRequest représente une demande de début de combat
type BattleRequest struct {
	LevelID int `json:"levelId"`
}

// StartBattle démarre un combat de niveau
func StartBattle(w http.ResponseWriter, r *http.Request) {
	// Récupérer l'ID utilisateur depuis le contexte
	userId := r.Context().Value("userId").(int)

	var request BattleRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		middleware.RespondWithError(w, http.StatusBadRequest, "Données invalides")
		return
	}

	if request.LevelID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID de niveau invalide")
		return
	}

	// Vérifier si le niveau est débloqué
	unlockedLevels, err := models.GetUnlockedLevelsByUserID(userId)
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la vérification des niveaux débloqués")
		return
	}

	levelUnlocked := false
	for _, level := range unlockedLevels {
		if level == request.LevelID {
			levelUnlocked = true
			break
		}
	}

	if !levelUnlocked {
		middleware.RespondWithError(w, http.StatusForbidden, "Niveau non débloqué")
		return
	}

	// Calculer le coût en énergie (5 + niveau-1)
	energyCost := 5 + (request.LevelID - 1)

	// Vérifier et consommer l'énergie
	hasEnough, err := models.UseEnergy(userId, energyCost)
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la vérification de l'énergie")
		return
	}

	if !hasEnough {
		middleware.RespondWithError(w, http.StatusForbidden, "Pas assez d'énergie")
		return
	}

	middleware.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Combat démarré avec succès",
	})
}

// CompleteBattleRequest représente une demande de fin de combat
type CompleteBattleRequest struct {
	LevelID    int  `json:"levelId"`
	Success    bool `json:"success"`
	Score      int  `json:"score"`
	StarsCount int  `json:"starsCount"`
	TimeSpent  int  `json:"timeSpent"` // en secondes
}

// CompleteBattle enregistre le résultat d'un combat et débloque éventuellement le niveau suivant
func CompleteBattle(w http.ResponseWriter, r *http.Request) {
	// Récupérer l'ID utilisateur depuis le contexte
	userId := r.Context().Value("userId").(int)

	var request CompleteBattleRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		middleware.RespondWithError(w, http.StatusBadRequest, "Données invalides")
		return
	}

	if request.LevelID <= 0 || request.Score < 0 || request.TimeSpent <= 0 || request.StarsCount < 0 || request.StarsCount > 3 {
		middleware.RespondWithError(w, http.StatusBadRequest, "Paramètres invalides")
		return
	}

	// Enregistrement des logs pour le debug
	log.Printf("CompleteBattle - UserID: %d, LevelID: %d, Success: %v, Stars: %d",
		userId, request.LevelID, request.Success, request.StarsCount)

	// Créer un nouveau score
	score := models.Score{
		UserID:   userId,
		Score:    request.Score,
		Duration: request.TimeSpent,
	}

	// Enregistrer le score
	if err := score.Create(); err != nil {
		log.Printf("Erreur lors de l'enregistrement du score: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de l'enregistrement du score")
		return
	}

	// Vérifier si c'est un nouveau record
	isNewBest, err := score.IsNewBestScore()
	if err != nil {
		log.Printf("Erreur lors de la vérification du score: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la vérification du score")
		return
	}

	var nextLevelUnlocked bool = false

	// Si le joueur a obtenu 3 étoiles (terminé toutes les vagues), débloquer le niveau suivant
	if request.StarsCount == 3 {
		nextLevel := request.LevelID + 1

		log.Printf("Niveau %d terminé avec 3 étoiles. Tentative de débloquage du niveau %d",
			request.LevelID, nextLevel)

		// Vérifier le nombre maximum de niveaux (à ajuster selon votre jeu)
		maxLevel := 5
		if nextLevel <= maxLevel {
			if err := models.UnlockLevel(userId, nextLevel); err != nil {
				log.Printf("Erreur lors du déblocage du niveau %d: %v", nextLevel, err)
				middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors du déblocage du niveau suivant")
				return
			}
			nextLevelUnlocked = true
			log.Printf("Niveau %d débloqué avec succès", nextLevel)
		}
	}

	// Mettre à jour les étoiles pour ce niveau
	currentStars, err := models.GetLevelStars(userId, request.LevelID)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("Erreur lors de la récupération des étoiles: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération des étoiles")
		return
	}

	// Mettre à jour seulement si le résultat est meilleur
	if request.StarsCount > currentStars {
		if err := models.UpdateLevelStars(userId, request.LevelID, request.StarsCount); err != nil {
			log.Printf("Erreur lors de la mise à jour des étoiles: %v", err)
			middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la mise à jour des étoiles")
			return
		}
		log.Printf("Étoiles mises à jour pour le niveau %d: %d", request.LevelID, request.StarsCount)
	}

	middleware.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success":           true,
		"isNewBest":         isNewBest,
		"nextLevelUnlocked": nextLevelUnlocked,
	})
}
