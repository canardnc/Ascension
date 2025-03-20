package handlers

import (
	"io/ioutil"
	"net/http"

	"github.com/canardnc/Ascension/internal/api/middleware"
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
