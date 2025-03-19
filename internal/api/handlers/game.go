package handlers

import (
	"io/ioutil"
	"net/http"

	"github.com/gin-gonic/gin"
	"gopkg.in/yaml.v2"
)

// GetGameConfig récupère les configurations du jeu (monstres, niveaux, etc.)
func GetGameConfig(c *gin.Context) {
	configType := c.Param("type")
	var filePath string
	
	switch configType {
	case "monsters":
		filePath = "configs/monsters.yaml"
	case "levels":
		filePath = "configs/levels.yaml"
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Type de configuration inconnu"})
		return
	}
	
	// Lire le fichier de configuration
	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la lecture de la configuration"})
		return
	}
	
	// Analyser le YAML
	var config interface{}
	if err := yaml.Unmarshal(data, &config); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de l'analyse de la configuration"})
		return
	}
	
	c.JSON(http.StatusOK, config)
}
