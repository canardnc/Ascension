package handlers

import (
	"io/ioutil"
	"net/http"
	"strconv"

	"github.com/canardnc/Ascension/internal/api/middleware"
	"github.com/canardnc/Ascension/internal/db/models"
	"gopkg.in/yaml.v2"
)

// GetGameConfig récupère les configurations du jeu (monstres, niveaux, etc.)
func GetGameConfig(w http.ResponseWriter, r *http.Request, configType string) {
	var filePath string

	switch configType {
	case "monsters":
		filePath = "configs/monsters.yaml"
	case "levels":
		filePath = "configs/levels.yaml"
	default:
		middleware.RespondWithError(w, http.StatusBadRequest, "Type de configuration inconnu")
		return
	}

	// Lire le fichier de configuration
	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la lecture de la configuration")
		return
	}

	// Analyser le YAML
	var config interface{}
	if err := yaml.Unmarshal(data, &config); err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de l'analyse de la configuration")
		return
	}

	middleware.RespondWithJSON(w, http.StatusOK, config)
}

func GetLevelInfo(w http.ResponseWriter, r *http.Request) {
	// Récupérer l'ID du niveau
	levelIdStr := r.URL.Query().Get("id")
	levelId, err := strconv.Atoi(levelIdStr)
	if err != nil || levelId <= 0 {
		levelId = 1 // Niveau par défaut
	}

	// Vérifier si le joueur a débloqué ce niveau
	userId := r.Context().Value("userId").(int)
	unlockedLevels, err := models.GetUnlockedLevelsByUserID(userId)
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération des niveaux débloqués")
		return
	}

	levelUnlocked := false
	for _, level := range unlockedLevels {
		if level == levelId {
			levelUnlocked = true
			break
		}
	}

	if !levelUnlocked {
		middleware.RespondWithError(w, http.StatusForbidden, "Niveau non débloqué")
		return
	}

	// Renvoyer les informations du niveau
	middleware.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"id":       levelId,
		"unlocked": true,
	})
}
