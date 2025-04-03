package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
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

// StatsUpdateRequest représente une demande de mise à jour des sous-statistiques
type StatsUpdateRequest struct {
	Category string         `json:"category"`
	SubStats map[string]int `json:"subStats"`
}

// TrainingRequest représente une demande d'enregistrement d'exercice complété
type TrainingRequest struct {
	Category     string `json:"category"`
	ExerciseName string `json:"exerciseName"`
	Difficulty   int    `json:"difficulty"`
	PointsEarned int    `json:"pointsEarned"`
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
	log.Printf("CompleteBattle - UserID: %d, LevelID: %d, Success: %v, Stars: %d, Score: %d",
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

	// Récupérer les étoiles et le score actuels pour ce niveau
	currentStars, currentScore, err := models.GetLevelStars(userId, request.LevelID)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("Erreur lors de la récupération des étoiles et du score: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération des données de progression")
		return
	}

	// Déterminer si le score et/ou les étoiles doivent être mis à jour
	updateNeeded := false
	newRecord := false

	// Vérifier si le nouveau score est meilleur
	if request.Score > currentScore {
		updateNeeded = true
		newRecord = true
		log.Printf("Nouveau record de score pour le niveau %d: %d (ancien: %d)",
			request.LevelID, request.Score, currentScore)
	}

	// Obtenir dynamiquement le niveau maximum disponible
	maxLevel, err := models.GetMaxLevelID()
	if err != nil {
		log.Printf("Erreur lors de la récupération du niveau maximum: %v", err)
		// Ne pas échouer la requête pour cette erreur non critique
		// Utiliser une valeur par défaut ou continuer sans déverrouillage
		maxLevel = request.LevelID // Par sécurité, ne pas déverrouiller de niveau supplémentaire
	}

	// Vérifier si le nouveau nombre d'étoiles est meilleur
	if request.StarsCount > currentStars {
		updateNeeded = true
		log.Printf("Nouvelle progression d'étoiles pour le niveau %d: %d (ancien: %d)",
			request.LevelID, request.StarsCount, currentStars)

		// Si le joueur a obtenu 3 étoiles (terminé toutes les vagues), débloquer le niveau suivant
		if request.StarsCount == 3 {
			nextLevel := request.LevelID + 1

			log.Printf("Niveau %d terminé avec 3 étoiles. Tentative de débloquage du niveau %d",
				request.LevelID, nextLevel)

			// Vérifier le nombre maximum de niveaux (à ajuster selon votre jeu)
			maxLevel := maxLevel
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
	}

	// Mettre à jour la progression si nécessaire
	if updateNeeded {
		if err := models.UpdateLevelStars(userId, request.LevelID, request.StarsCount, request.Score); err != nil {
			log.Printf("Erreur lors de la mise à jour de la progression: %v", err)
			middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la mise à jour de la progression")
			return
		}
		log.Printf("Progression mise à jour pour le niveau %d: %d étoiles, score %d",
			request.LevelID, request.StarsCount, request.Score)
	}

	middleware.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success":           true,
		"isNewBest":         isNewBest,
		"isNewLevelRecord":  newRecord,
		"nextLevelUnlocked": nextLevelUnlocked,
	})
}

// GetPlayerStats récupère toutes les statistiques d'un joueur
func GetPlayerStats(w http.ResponseWriter, r *http.Request) {
	// Récupérer l'ID utilisateur depuis le contexte
	userId := r.Context().Value("userId").(int)

	// Récupérer les statistiques principales
	mainStats, err := models.GetPlayerStatsResponse(userId)
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération des statistiques")
		return
	}

	// Récupérer les sous-statistiques
	subStats, err := models.GetPlayerSubStatsResponse(userId)
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
		Strength:  mainStats.Strength,
		Endurance: mainStats.Endurance,
		Recovery:  mainStats.Recovery,
		Agility:   mainStats.Agility,

		// Points disponibles
		AvailableStrengthPoints:  mainStats.AvailableStrengthPoints,
		AvailableEndurancePoints: mainStats.AvailableEndurancePoints,
		AvailableRecoveryPoints:  mainStats.AvailableRecoveryPoints,
		AvailableAgilityPoints:   mainStats.AvailableAgilityPoints,

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

// UpdatePlayerStats met à jour les sous-statistiques d'un joueur
func UpdatePlayerStats(w http.ResponseWriter, r *http.Request) {
	// Récupérer l'ID utilisateur depuis le contexte
	userId := r.Context().Value("userId").(int)

	var request StatsUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		log.Printf("Erreur de décodage JSON: %v", err)
		middleware.RespondWithError(w, http.StatusBadRequest, "Données invalides")
		return
	}

	log.Printf("Requête de mise à jour reçue: %+v", request)

	// Récupérer l'ID de la catégorie
	category, err := models.GetStatCategoryByName(request.Category)
	if err != nil {
		log.Printf("Catégorie invalide: %s, erreur: %v", request.Category, err)
		middleware.RespondWithError(w, http.StatusBadRequest, "Catégorie invalide: "+request.Category)
		return
	}

	// Vérifier les points disponibles
	availablePoints, err := models.GetAvailablePoints(userId, category.ID)
	if err != nil {
		log.Printf("Erreur lors du calcul des points disponibles: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors du calcul des points disponibles")
		return
	}

	// Obtenir les sous-stats actuelles
	currentSubStats, err := models.GetPlayerSubStatsByCategory(userId, category.ID)
	if err != nil {
		log.Printf("Erreur lors de la récupération des sous-stats actuelles: %v", err)
		// Ne pas échouer ici, juste loguer l'erreur
	}

	// Mapper les sous-stats actuelles par nom
	currentSubStatsMap := make(map[string]int)
	for _, subStat := range currentSubStats {
		subCategory, err := models.GetStatSubCategoryByID(subStat.SubCategoryID)
		if err == nil {
			currentSubStatsMap[subCategory.Name] = subStat.Points
		}
	}

	// Calculer la différence
	currentTotal := 0
	for _, points := range currentSubStatsMap {
		currentTotal += points
	}

	requestedTotal := 0
	for _, points := range request.SubStats {
		requestedTotal += points
	}

	pointsDiff := requestedTotal - currentTotal
	log.Printf("Points actuels: %d, Points demandés: %d, Différence: %d, Disponibles: %d",
		currentTotal, requestedTotal, pointsDiff, availablePoints)

	if pointsDiff > availablePoints {
		middleware.RespondWithError(w, http.StatusBadRequest,
			fmt.Sprintf("Pas assez de points disponibles. Demandés: %d, Disponibles: %d",
				pointsDiff, availablePoints))
		return
	}

	// Mettre à jour les sous-statistiques
	err = models.UpdatePlayerSubStatsForCategory(userId, category.ID, request.SubStats)
	if err != nil {
		log.Printf("Erreur lors de la mise à jour des sous-stats: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la mise à jour des statistiques")
		return
	}

	middleware.RespondWithJSON(w, http.StatusOK, map[string]bool{"success": true})
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

	middleware.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success":      true,
		"pointsEarned": request.PointsEarned,
	})

}
