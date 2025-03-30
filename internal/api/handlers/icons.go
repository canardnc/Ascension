package handlers

import (
	"net/http"
	"strconv"

	"github.com/canardnc/Ascension/internal/api/middleware"
	"github.com/canardnc/Ascension/internal/db"
)

// IconResponse représente une icône dans la réponse API
type IconResponse struct {
	ID          int    `json:"id"`
	Filename    string `json:"filename"`
	Type        string `json:"type"`
	Description string `json:"description"`
	EnglishWord string `json:"englishWord"` // Assurons-nous que la casse est correcte
}

// GetRandomIcons récupère un nombre spécifié d'icônes aléatoires de la base de données
func GetRandomIcons(w http.ResponseWriter, r *http.Request) {
	// Récupérer le nombre d'icônes demandées depuis les paramètres de requête
	countStr := r.URL.Query().Get("count")
	count, err := strconv.Atoi(countStr)
	if err != nil || count <= 0 {
		count = 10 // Valeur par défaut
	}

	// Limiter le nombre maximal d'icônes à récupérer
	if count > 50 {
		count = 50
	}

	// Récupérer le niveau de difficulté
	difficultyStr := r.URL.Query().Get("difficulty")
	difficulty, err := strconv.Atoi(difficultyStr)
	if err != nil || difficulty < 1 || difficulty > 3 {
		difficulty = 1 // Niveau par défaut
	}

	// Construire la requête SQL de base
	query := `
		SELECT id, filename, type, description, description_en AS "englishWord"
		FROM icons
	`

	// Ajouter le filtre selon le niveau de difficulté
	params := []interface{}{}

	switch difficulty {
	case 1:
		// IDs pour le niveau 1
		query += " WHERE id IN (1,2,3,4,5,13,26,31,32,33,40,49,50,60,68,105,106,122,125,126,127,133,134,149,150,159,161)"
	case 2:
		// IDs pour le niveau 2 (incluant ceux du niveau 1)
		query += " WHERE id IN (1,2,3,4,5,13,26,31,32,33,40,49,50,60,68,105,106,122,125,126,127,133,134,149,150,159,161,"
		query += "9,10,12,14,15,16,19,20,23,24,25,27,35,41,42,43,46,52,54,55,56,58,62,63,64,67,69,74,75,78,80,84,85,86,88,89,90,91,93,96,97,101,104,108,109,111,112,113,117,118,123,124,130,135,137,140,141,144,147,151,152,153,154,155,156,158,160,165,166)"
	case 3:
		// IDs pour le niveau 3 (1 à 168)
		query += " WHERE id BETWEEN 1 AND 168"
	}

	// Ajouter l'ordre aléatoire et la limite
	query += " ORDER BY RANDOM() LIMIT $1"
	params = append(params, count)

	// Exécuter la requête
	rows, err := db.DB.Query(query, params...)
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération des icônes")
		return
	}
	defer rows.Close()

	// Parcourir les résultats
	var icons []IconResponse
	for rows.Next() {
		var icon IconResponse
		if err := rows.Scan(&icon.ID, &icon.Filename, &icon.Type, &icon.Description, &icon.EnglishWord); err != nil {
			middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la lecture des données d'icônes")
			return
		}
		icons = append(icons, icon)
	}

	// Vérifier s'il y a eu des erreurs lors du parcours
	if err := rows.Err(); err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors du parcours des icônes")
		return
	}

	// Envoyer la réponse
	middleware.RespondWithJSON(w, http.StatusOK, icons)
}
