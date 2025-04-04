package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/canardnc/Ascension/internal/api/middleware"
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
	Username  string `json:"username"`
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
		Username:  user.Username,
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
