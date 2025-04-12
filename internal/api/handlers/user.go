package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/canardnc/Ascension/internal/api/middleware"
	"github.com/canardnc/Ascension/internal/db"
	"github.com/canardnc/Ascension/internal/db/models"
)

// UserUpdateRequest représente une demande de mise à jour du profil utilisateur
type UserUpdateRequest struct {
	HeroName string `json:"heroName"`
	Year     string `json:"year"`
}

// UserResponse représente les informations de l'utilisateur renvoyées à l'API
type UserResponse struct {
	ID        int    `json:"id"`
	HeroName  string `json:"heroName,omitempty"`
	Year      string `json:"year,omitempty"`
	Level     int    `json:"level"`
	BestScore int    `json:"bestScore"`
	Admin     bool   `json:"admin"`
	Teacher   bool   `json:"teacher"`
	Parent    bool   `json:"parent"`
}

// GetUserInfo récupère les informations de l'utilisateur courant
func GetUserInfo(w http.ResponseWriter, r *http.Request) {
	// Récupérer l'ID utilisateur depuis le contexte
	userId := r.Context().Value("userId").(int)

	user, err := models.GetUserByID(userId)
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération des informations utilisateur")
		return
	}

	bestScore, err := user.GetBestScore()
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération du meilleur score")
		return
	}

	response := UserResponse{
		ID:        user.ID,
		HeroName:  user.HeroName,
		Year:      user.Year,
		Level:     user.Level,
		BestScore: bestScore,
		Admin:     user.Admin,
		Teacher:   user.Teacher,
		Parent:    user.Parent,
	}

	middleware.RespondWithJSON(w, http.StatusOK, response)
}

// UpdateUser met à jour les informations de l'utilisateur
func UpdateUser(w http.ResponseWriter, r *http.Request) {
	// Récupérer l'ID utilisateur depuis le contexte
	userId := r.Context().Value("userId").(int)

	var request UserUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		middleware.RespondWithError(w, http.StatusBadRequest, "Données invalides")
		return
	}

	if request.HeroName == "" {
		middleware.RespondWithError(w, http.StatusBadRequest, "Nom de héros requis")
		return
	}

	user, err := models.GetUserByID(userId)
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération des informations utilisateur")
		return
	}

	user.HeroName = request.HeroName
	user.Year = request.Year

	if err := user.Update(); err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la mise à jour du profil")
		return
	}

	middleware.RespondWithJSON(w, http.StatusOK, map[string]bool{"success": true})
}

// DeleteUser supprime complètement un utilisateur et toutes ses données associées
func DeleteUser(w http.ResponseWriter, r *http.Request) {
	// Vérifier si l'utilisateur est admin
	adminUserID := r.Context().Value("userId").(int)
	adminUser, err := models.GetUserByID(adminUserID)
	if err != nil || !adminUser.Admin {
		middleware.RespondWithError(w, http.StatusForbidden, "Accès restreint aux administrateurs")
		return
	}

	// Extraire l'ID de l'URL (format: /api/users/{id})
	path := r.URL.Path
	parts := strings.Split(path, "/")
	if len(parts) < 4 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID utilisateur manquant")
		return
	}

	userIDStr := parts[3]
	userID, err := strconv.Atoi(userIDStr)
	if err != nil || userID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID utilisateur invalide")
		return
	}

	// Empêcher la suppression de son propre compte admin
	if userID == adminUserID {
		middleware.RespondWithError(w, http.StatusBadRequest, "Vous ne pouvez pas supprimer votre propre compte administrateur")
		return
	}

	// Démarrer une transaction pour s'assurer que tout est supprimé correctement
	tx, err := db.DB.Begin()
	if err != nil {
		log.Printf("Erreur lors du début de la transaction: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la suppression de l'utilisateur")
		return
	}
	defer tx.Rollback()

	// Supprimer toutes les données associées à l'utilisateur
	// Ordre important pour respecter les contraintes de clé étrangère
	tables := []string{
		"minigames_progress",
		"player_substats",
		"player_stats",
		"player_energy",
		"unlocked_levels",
		"level_progress",
		"game_scores",
	}

	for _, table := range tables {
		query := fmt.Sprintf("DELETE FROM %s WHERE user_id = $1", table)
		_, err := tx.Exec(query, userID)
		if err != nil {
			log.Printf("Erreur lors de la suppression des données de %s pour l'utilisateur %d: %v", table, userID, err)
			// On continue malgré les erreurs, certaines tables peuvent ne pas exister
			// ou ne pas avoir de relation avec l'utilisateur
		}
	}
	// Table users en dernier
	query := fmt.Sprintf("DELETE FROM %s WHERE id = $1", "users")
	_, err = tx.Exec(query, userID)
	if err != nil {
		log.Printf("Erreur lors de la suppression des données de %s pour l'utilisateur %d: %v", "users", userID, err)
		// On continue malgré les erreurs, certaines tables peuvent ne pas exister
		// ou ne pas avoir de relation avec l'utilisateur
	}

	// Valider la transaction
	if err := tx.Commit(); err != nil {
		log.Printf("Erreur lors de la validation de la transaction: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la suppression de l'utilisateur")
		return
	}

	middleware.RespondWithJSON(w, http.StatusOK, map[string]bool{"success": true})
}

// ResetUser réinitialise un utilisateur en supprimant toutes ses données sauf son compte
func ResetUser(w http.ResponseWriter, r *http.Request) {
	// Vérifier si l'utilisateur est admin
	adminUserID := r.Context().Value("userId").(int)
	adminUser, err := models.GetUserByID(adminUserID)
	if err != nil || !adminUser.Admin {
		middleware.RespondWithError(w, http.StatusForbidden, "Accès restreint aux administrateurs")
		return
	}

	// Extraire l'ID de l'URL (format: /api/users/{id}/reset)
	path := r.URL.Path
	parts := strings.Split(path, "/")
	if len(parts) < 4 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID utilisateur manquant")
		return
	}

	userIDStr := parts[3]
	userID, err := strconv.Atoi(userIDStr)
	if err != nil || userID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID utilisateur invalide")
		return
	}

	// Récupérer l'utilisateur pour obtenir ses informations de base
	user, err := models.GetUserByID(userID)
	if err != nil {
		if err == sql.ErrNoRows {
			middleware.RespondWithError(w, http.StatusNotFound, "Utilisateur non trouvé")
		} else {
			log.Printf("Erreur lors de la récupération de l'utilisateur %d: %v", userID, err)
			middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération de l'utilisateur")
		}
		return
	}

	// Démarrer une transaction pour s'assurer que tout est réinitialisé correctement
	tx, err := db.DB.Begin()
	if err != nil {
		log.Printf("Erreur lors du début de la transaction: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la réinitialisation de l'utilisateur")
		return
	}
	defer tx.Rollback()

	// Supprimer toutes les données associées à l'utilisateur (sauf la table users)
	tables := []string{
		"minigames_progress",
		"player_substats",
		"player_stats",
		"player_energy",
		"unlocked_levels",
		"level_progress",
		"game_scores",
	}

	for _, table := range tables {
		query := fmt.Sprintf("DELETE FROM %s WHERE user_id = $1", table)
		_, err := tx.Exec(query, userID)
		if err != nil {
			log.Printf("Erreur lors de la suppression des données de %s pour l'utilisateur %d: %v", table, userID, err)
			// On continue malgré les erreurs
		}
	}

	// Valider la transaction
	if err := tx.Commit(); err != nil {
		log.Printf("Erreur lors de la validation de la transaction: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la réinitialisation de l'utilisateur")
		return
	}

	// Réinitialiser l'utilisateur en appelant la fonction d'initialisation
	err = completePlayerInitialization(userID, user.HeroName, user.Year)
	if err != nil {
		log.Printf("Erreur lors de la réinitialisation de l'utilisateur %d: %v", userID, err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la réinitialisation de l'utilisateur")
		return
	}

	middleware.RespondWithJSON(w, http.StatusOK, map[string]bool{"success": true})
}
