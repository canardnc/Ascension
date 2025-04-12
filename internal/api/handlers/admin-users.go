package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/canardnc/Ascension/internal/api/middleware"
	"github.com/canardnc/Ascension/internal/db/models"
)

// Structures de requête et réponse pour l'API admin

// UserListResponse représente la réponse pour la liste paginée des utilisateurs
type UserListResponse struct {
	Users      []UserListItem `json:"users"`
	TotalCount int            `json:"totalCount"`
	Page       int            `json:"page"`
	PerPage    int            `json:"perPage"`
	TotalPages int            `json:"totalPages"`
}

// UserListItem représente un utilisateur dans la liste
type UserListItem struct {
	ID       int    `json:"id"`
	Email    string `json:"email"`
	HeroName string `json:"heroName"`
	Year     string `json:"year"`
	Admin    bool   `json:"admin"`
	Teacher  bool   `json:"teacher"`
	Parent   bool   `json:"parent"`
}

// UserDetailResponse représente les détails complets d'un utilisateur
type UserDetailResponse struct {
	ID        int          `json:"id"`
	Email     string       `json:"email"`
	HeroName  string       `json:"heroName"`
	Year      string       `json:"year"`
	Level     int          `json:"level"`
	CreatedAt string       `json:"createdAt"`
	Admin     bool         `json:"admin"`
	Teacher   bool         `json:"teacher"`
	Parent    bool         `json:"parent"`
	Energy    EnergyStatus `json:"energy"`
	Stats     UserStats    `json:"stats"`
}

// EnergyStatus représente l'état de l'énergie d'un utilisateur
type EnergyStatus struct {
	Current int `json:"current"`
	Max     int `json:"max"`
}

// UserStats représente les statistiques d'un utilisateur
type UserStats struct {
	MaxLevel   int `json:"maxLevel"`
	TotalScore int `json:"totalScore"`
}

// AdminUserUpdateRequest représente une demande de mise à jour des données d'un utilisateur par un admin
type AdminUserUpdateRequest struct {
	Email    string `json:"email"`
	HeroName string `json:"heroName"`
	Year     string `json:"year"`
}

// UserPermissionsRequest représente une demande de mise à jour des permissions d'un utilisateur
type UserPermissionsRequest struct {
	Admin   *bool `json:"admin,omitempty"`
	Teacher *bool `json:"teacher,omitempty"`
	Parent  *bool `json:"parent,omitempty"`
}

// GetUsersList récupère la liste paginée des utilisateurs
func GetUsersList(w http.ResponseWriter, r *http.Request) {
	// Vérifier si l'utilisateur est admin
	userID := r.Context().Value("userId").(int)
	user, err := models.GetUserByID(userID)
	if err != nil || !user.Admin {
		middleware.RespondWithError(w, http.StatusForbidden, "Accès restreint aux administrateurs")
		return
	}

	// Récupérer les paramètres de requête
	query := r.URL.Query().Get("q")
	pageStr := r.URL.Query().Get("page")
	perPageStr := r.URL.Query().Get("perPage")

	// Valeurs par défaut
	page := 1
	perPage := 10

	// Convertir les paramètres
	if pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	if perPageStr != "" {
		if pp, err := strconv.Atoi(perPageStr); err == nil && pp > 0 && pp <= 100 {
			perPage = pp
		}
	}

	// Récupérer le nombre total d'utilisateurs
	totalCount, err := models.GetUsersCount(query)
	if err != nil {
		log.Printf("Erreur lors du comptage des utilisateurs: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération des utilisateurs")
		return
	}

	// Calculer le nombre total de pages
	totalPages := (totalCount + perPage - 1) / perPage

	// Récupérer les utilisateurs pour la page actuelle
	users, err := models.GetUsersPaginated(query, page, perPage)
	if err != nil {
		log.Printf("Erreur lors de la récupération des utilisateurs: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération des utilisateurs")
		return
	}

	// Convertir les résultats en format de réponse
	userItems := make([]UserListItem, 0, len(users))
	for _, u := range users {
		userItems = append(userItems, UserListItem{
			ID:       u.ID,
			Email:    u.Email,
			HeroName: u.HeroName,
			Year:     u.Year,
			Admin:    u.Admin,
			Teacher:  u.Teacher,
			Parent:   u.Parent,
		})
	}

	// Créer la réponse
	response := UserListResponse{
		Users:      userItems,
		TotalCount: totalCount,
		Page:       page,
		PerPage:    perPage,
		TotalPages: totalPages,
	}

	middleware.RespondWithJSON(w, http.StatusOK, response)
}

// GetUserDetails récupère les détails d'un utilisateur spécifique
func GetUserDetails(w http.ResponseWriter, r *http.Request) {
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

	// Récupérer les détails de l'utilisateur
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

	// Récupérer le meilleur score de l'utilisateur
	totalScore, err := user.GetBestScore()
	if err != nil {
		log.Printf("Erreur lors de la récupération du score de l'utilisateur %d: %v", userID, err)
		totalScore = 0 // Utiliser 0 par défaut en cas d'erreur
	}

	// Récupérer les niveaux débloqués
	unlockedLevels, err := models.GetUnlockedLevelsByUserID(userID)
	if err != nil {
		log.Printf("Erreur lors de la récupération des niveaux débloqués pour l'utilisateur %d: %v", userID, err)
		unlockedLevels = []int{1} // Niveau 1 par défaut
	}

	// Calculer le niveau maximum débloqué
	maxLevel := 1
	if len(unlockedLevels) > 0 {
		for _, level := range unlockedLevels {
			if level > maxLevel {
				maxLevel = level
			}
		}
	}

	// Récupérer l'énergie de l'utilisateur
	energy, err := models.GetPlayerEnergyByUserID(userID)
	if err != nil {
		log.Printf("Erreur lors de la récupération de l'énergie pour l'utilisateur %d: %v", userID, err)
		// Valeurs par défaut si l'énergie n'est pas trouvée
		energy = &models.PlayerEnergy{
			CurrentEnergy: 10,
			MaxEnergy:     20,
		}
	}

	// Créer la réponse
	response := UserDetailResponse{
		ID:        user.ID,
		Email:     user.Email,
		HeroName:  user.HeroName,
		Year:      user.Year,
		Level:     user.Level,
		CreatedAt: user.CreatedAt.Format("2006-01-02 15:04:05"),
		Admin:     user.Admin,
		Teacher:   user.Teacher,
		Parent:    user.Parent,
		Energy: EnergyStatus{
			Current: energy.CurrentEnergy,
			Max:     energy.MaxEnergy,
		},
		Stats: UserStats{
			MaxLevel:   maxLevel,
			TotalScore: totalScore,
		},
	}

	middleware.RespondWithJSON(w, http.StatusOK, response)
}

// AdminUpdateUser met à jour les informations d'un utilisateur (interface admin)
func AdminUpdateUser(w http.ResponseWriter, r *http.Request) {
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

	// Décoder la requête
	var request AdminUserUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		middleware.RespondWithError(w, http.StatusBadRequest, "Requête invalide")
		return
	}

	// Récupérer l'utilisateur existant
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

	// Mettre à jour les champs
	user.Email = request.Email
	user.HeroName = request.HeroName
	user.Year = request.Year

	// Enregistrer les modifications
	if err := user.Update(); err != nil {
		log.Printf("Erreur lors de la mise à jour de l'utilisateur %d: %v", userID, err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la mise à jour de l'utilisateur")
		return
	}

	middleware.RespondWithJSON(w, http.StatusOK, map[string]bool{"success": true})
}

// UpdateUserPermissions met à jour les permissions d'un utilisateur
func UpdateUserPermissions(w http.ResponseWriter, r *http.Request) {
	// Vérifier si l'utilisateur est admin
	adminUserID := r.Context().Value("userId").(int)
	adminUser, err := models.GetUserByID(adminUserID)
	if err != nil || !adminUser.Admin {
		middleware.RespondWithError(w, http.StatusForbidden, "Accès restreint aux administrateurs")
		return
	}

	// Extraire l'ID de l'URL (format: /api/users/{id}/permissions)
	path := r.URL.Path
	parts := strings.Split(path, "/")
	if len(parts) < 5 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID utilisateur manquant")
		return
	}

	userIDStr := parts[3]
	userID, err := strconv.Atoi(userIDStr)
	if err != nil || userID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID utilisateur invalide")
		return
	}

	// Décoder la requête
	var request UserPermissionsRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		middleware.RespondWithError(w, http.StatusBadRequest, "Requête invalide")
		return
	}

	// Récupérer l'utilisateur existant
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

	// Mettre à jour les permissions si elles sont spécifiées
	updated := false
	if request.Admin != nil {
		user.Admin = *request.Admin
		updated = true
	}
	if request.Teacher != nil {
		user.Teacher = *request.Teacher
		updated = true
	}
	if request.Parent != nil {
		user.Parent = *request.Parent
		updated = true
	}

	// Si aucune permission n'a été mise à jour, retourner une erreur
	if !updated {
		middleware.RespondWithError(w, http.StatusBadRequest, "Aucune permission à mettre à jour")
		return
	}

	// Enregistrer les modifications
	if err := models.UpdateUserRights(userID, user.Admin, user.Teacher, user.Parent); err != nil {
		log.Printf("Erreur lors de la mise à jour des permissions de l'utilisateur %d: %v", userID, err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la mise à jour des permissions")
		return
	}

	middleware.RespondWithJSON(w, http.StatusOK, map[string]bool{"success": true})
}

// RechargeUserEnergy recharge l'énergie d'un utilisateur au maximum
func RechargeUserEnergy(w http.ResponseWriter, r *http.Request) {
	// Vérifier si l'utilisateur est admin
	adminUserID := r.Context().Value("userId").(int)
	adminUser, err := models.GetUserByID(adminUserID)
	if err != nil || !adminUser.Admin {
		middleware.RespondWithError(w, http.StatusForbidden, "Accès restreint aux administrateurs")
		return
	}

	// Extraire l'ID de l'URL (format: /api/users/{id}/recharge-energy)
	path := r.URL.Path
	parts := strings.Split(path, "/")
	if len(parts) < 5 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID utilisateur manquant")
		return
	}

	userIDStr := parts[3]
	userID, err := strconv.Atoi(userIDStr)
	if err != nil || userID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID utilisateur invalide")
		return
	}

	// Récupérer l'énergie de l'utilisateur
	energy, err := models.GetPlayerEnergyByUserID(userID)
	if err != nil {
		log.Printf("Erreur lors de la récupération de l'énergie pour l'utilisateur %d: %v", userID, err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération de l'énergie")
		return
	}

	// Mettre à jour l'énergie au maximum
	err = models.RechargeEnergy(userID, energy.MaxEnergy)
	if err != nil {
		log.Printf("Erreur lors de la recharge de l'énergie pour l'utilisateur %d: %v", userID, err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la recharge de l'énergie")
		return
	}

	middleware.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"energy": EnergyStatus{
			Current: energy.MaxEnergy,
			Max:     energy.MaxEnergy,
		},
	})
}
