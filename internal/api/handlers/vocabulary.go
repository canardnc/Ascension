package handlers

import (
	"net/http"
	"strconv"

	"github.com/canardnc/Ascension/internal/api/middleware"
	"github.com/canardnc/Ascension/internal/db"
)

// VocabularyResponse représente un élément de vocabulaire dans la réponse API
type VocabularyResponse struct {
	ID            int    `json:"id"`
	Filename      string `json:"filename"`
	Type          string `json:"type"`
	Description   string `json:"description"`
	DescriptionEn string `json:"description_en"`
	Difficulty    int    `json:"difficulty"`
}

// GetVocabularyByDifficulty récupère les éléments de vocabulaire par niveau de difficulté
func GetVocabularyByDifficulty(w http.ResponseWriter, r *http.Request) {
	// Récupérer le niveau de difficulté depuis les paramètres de requête
	difficultyStr := r.URL.Query().Get("difficulty")
	difficulty, err := strconv.Atoi(difficultyStr)
	if err != nil || difficulty < 1 || difficulty > 3 {
		difficulty = 1 // Niveau par défaut
	}

	// Construire la requête SQL
	query := `
		SELECT id, filename, type, description, description_en, difficulty
		FROM vocabulary
		WHERE difficulty = $1
	`

	// Exécuter la requête
	rows, err := db.DB.Query(query, difficulty)
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération du vocabulaire")
		return
	}
	defer rows.Close()

	// Parcourir les résultats
	var vocabulary []VocabularyResponse
	for rows.Next() {
		var item VocabularyResponse
		if err := rows.Scan(&item.ID, &item.Filename, &item.Type, &item.Description, &item.DescriptionEn, &item.Difficulty); err != nil {
			middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la lecture des données de vocabulaire")
			return
		}
		vocabulary = append(vocabulary, item)
	}

	// Vérifier s'il y a eu des erreurs lors du parcours
	if err := rows.Err(); err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors du parcours du vocabulaire")
		return
	}

	// Envoyer la réponse
	middleware.RespondWithJSON(w, http.StatusOK, vocabulary)
}
