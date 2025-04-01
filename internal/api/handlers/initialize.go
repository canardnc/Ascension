package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/canardnc/Ascension/internal/api/middleware"
	"github.com/canardnc/Ascension/internal/db"
	"github.com/canardnc/Ascension/internal/db/models"
)

// InitializePlayerRequest représente les données nécessaires pour initialiser un joueur
type InitializePlayerRequest struct {
	HeroName string `json:"heroName"`
	Year     string `json:"year"`
}

// InitializePlayer initialise TOUTES les données d'un nouveau joueur
func InitializePlayer(w http.ResponseWriter, r *http.Request) {
	// Récupérer l'ID utilisateur depuis le contexte
	userID, ok := r.Context().Value("userId").(int)
	if !ok {
		log.Printf("ERREUR CRITIQUE: Impossible de récupérer l'userID du contexte")
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur d'authentification")
		return
	}

	log.Printf("InitializePlayer: Démarrage de l'initialisation pour l'utilisateur ID=%d", userID)

	// Analyser la requête
	var request InitializePlayerRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		log.Printf("Erreur de décodage JSON: %v", err)
		middleware.RespondWithError(w, http.StatusBadRequest, "Données invalides")
		return
	}

	// Valider les données
	if request.HeroName == "" {
		middleware.RespondWithError(w, http.StatusBadRequest, "Nom de héros requis")
		return
	}

	log.Printf("Données reçues: heroName='%s', year='%s'", request.HeroName, request.Year)

	// Vérifier si l'utilisateur existe vraiment
	user, err := models.GetUserByID(userID)
	if err != nil {
		log.Printf("ERREUR CRITIQUE: Impossible de récupérer l'utilisateur ID=%d: %v", userID, err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Utilisateur non trouvé")
		return
	}

	log.Printf("InitializePlayer: Utilisateur trouvé: ID=%d, Username=%s", user.ID, user.Username)

	// Exécuter l'initialisation du joueur
	err = completePlayerInitialization(userID, request.HeroName, request.Year)
	if err != nil {
		log.Printf("Erreur lors de l'initialisation complète du joueur %d: %v", userID, err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de l'initialisation du joueur")
		return
	}

	// Retourner une réponse positive
	middleware.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Joueur initialisé avec succès",
	})

	log.Printf("InitializePlayer: Initialisation terminée avec succès pour l'utilisateur ID=%d", userID)
}

// completePlayerInitialization initialise complètement un joueur dans toutes les tables
func completePlayerInitialization(userID int, heroName, year string) error {
	log.Printf("Début de l'initialisation complète du joueur %d avec nom '%s' et année '%s'", userID, heroName, year)

	// Tableau pour stocker les erreurs non critiques
	var nonCriticalErrors []string

	// 1. Mettre à jour les informations du joueur dans users
	_, err := db.DB.Exec(`
		UPDATE users 
		SET hero_name = $1, year = $2 
		WHERE id = $3
	`, heroName, year, userID)
	if err != nil {
		log.Printf("ERREUR CRITIQUE: Mise à jour du joueur: %v", err)
		return err
	}
	log.Printf("✓ Informations utilisateur mises à jour")

	// 2. Initialiser player_stats (4 lignes, une par catégorie)
	for categoryID := 1; categoryID <= 4; categoryID++ {
		_, err := db.DB.Exec(`
			INSERT INTO player_stats (user_id, category_id, points, updated_at)
			VALUES ($1, $2, 1, NOW())
			ON CONFLICT (user_id, category_id) DO UPDATE 
			SET points = 1, updated_at = NOW()
		`, userID, categoryID)
		if err != nil {
			log.Printf("Erreur non critique: Initialisation stat cat %d: %v", categoryID, err)
			nonCriticalErrors = append(nonCriticalErrors, err.Error())
			// Continuer malgré l'erreur
		}
	}
	log.Printf("✓ Statistiques principales initialisées")

	// 3. Initialiser player_substats (10 lignes)
	subStatsData := []struct {
		CategoryID    int
		SubCategoryID int
		Points        int
	}{
		{1, 1, 1}, {1, 2, 0}, {1, 3, 0}, // Force
		{2, 4, 1}, {2, 5, 0}, {2, 6, 0}, // Endurance
		{3, 7, 1}, {3, 8, 0}, // Récupération
		{4, 9, 1}, {4, 10, 0}, // Agilité
	}

	for _, data := range subStatsData {
		_, err := db.DB.Exec(`
			INSERT INTO player_substats (user_id, category_id, subcategory_id, points, updated_at)
			VALUES ($1, $2, $3, $4, NOW())
			ON CONFLICT (user_id, subcategory_id) DO UPDATE 
			SET points = $4, updated_at = NOW()
		`, userID, data.CategoryID, data.SubCategoryID, data.Points)
		if err != nil {
			log.Printf("Erreur non critique: Initialisation substat %d,%d: %v",
				data.CategoryID, data.SubCategoryID, err)
			nonCriticalErrors = append(nonCriticalErrors, err.Error())
			// Continuer malgré l'erreur
		}
	}
	log.Printf("✓ Sous-statistiques initialisées")

	// 4. Initialiser player_energy
	_, err = db.DB.Exec(`
		INSERT INTO player_energy (user_id, current_energy, max_energy, last_refresh)
		VALUES ($1, 20, 20, NOW())
		
	`, userID)
	if err != nil {
		log.Printf("Erreur non critique: Initialisation énergie: %v", err)
		nonCriticalErrors = append(nonCriticalErrors, err.Error())
		// Continuer malgré l'erreur
	}
	log.Printf("✓ Énergie initialisée")

	// 5. Initialiser unlocked_levels pour le niveau 1
	_, err = db.DB.Exec(`
		INSERT INTO unlocked_levels (user_id, level_id, unlocked_at)
		VALUES ($1, 1, NOW())
		ON CONFLICT DO NOTHING
	`, userID)
	if err != nil {
		log.Printf("Erreur non critique: Déblocage niveau 1: %v", err)
		nonCriticalErrors = append(nonCriticalErrors, err.Error())
		// Continuer malgré l'erreur
	}
	log.Printf("✓ Niveau 1 débloqué")

	// 6. Initialiser level_progress pour le niveau 1
	_, err = db.DB.Exec(`
		INSERT INTO level_progress (user_id, level_id, stars, completed_at)
		VALUES ($1, 1, 0, NOW())
		ON CONFLICT DO NOTHING
	`, userID)
	if err != nil {
		log.Printf("Erreur non critique: Progression niveau 1: %v", err)
		nonCriticalErrors = append(nonCriticalErrors, err.Error())
		// Continuer malgré l'erreur
	}
	log.Printf("✓ Progression niveau 1 initialisée")

	// 7. Récupérer les mini-jeux existants
	rows, err := db.DB.Query(`
		SELECT minigame_id, category_id 
		FROM minigames
	`)

	var miniGames []struct {
		ID         int
		CategoryID int
	}

	if err != nil {
		log.Printf("Erreur lors de la récupération des mini-jeux: %v", err)
		// Utiliser des mini-jeux par défaut
		miniGames = []struct {
			ID         int
			CategoryID int
		}{
			{1, 1}, {2, 1}, // Force
			{3, 2}, {4, 2}, // Endurance
			{5, 3}, // Récupération
			{6, 4}, // Agilité
		}
	} else {
		// Récupérer les mini-jeux
		for rows.Next() {
			var mg struct {
				ID         int
				CategoryID int
			}
			if err := rows.Scan(&mg.ID, &mg.CategoryID); err != nil {
				log.Printf("Erreur lors de la lecture des données de mini-jeux: %v", err)
				continue
			}
			miniGames = append(miniGames, mg)
		}
		rows.Close()

		// Si aucun mini-jeu trouvé, utiliser valeurs par défaut
		if len(miniGames) == 0 {
			miniGames = []struct {
				ID         int
				CategoryID int
			}{
				{1, 1}, {2, 1}, // Force
				{3, 2}, {4, 2}, // Endurance
				{5, 3}, // Récupération
				{6, 4}, // Agilité
			}
		}
	}

	// 8. Initialiser les minigames_progress pour chaque niveau de difficulté
	for _, mg := range miniGames {
		for diffLevel := 1; diffLevel <= 3; diffLevel++ {
			_, err := db.DB.Exec(`
				INSERT INTO minigames_progress 
				(user_id, minigame_id, difficulty_level, points, available, cost, time_played, total_played, last_played)
				VALUES ($1, $2, $3, 0, false, $4, 0, 0, NOW())
				ON CONFLICT (user_id, minigame_id, difficulty_level) DO UPDATE
				SET available = false, cost = $4
			`, userID, mg.ID, diffLevel, diffLevel)

			if err != nil {
				log.Printf("Erreur non critique: Initialisation mini-jeu %d niveau %d: %v",
					mg.ID, diffLevel, err)
				nonCriticalErrors = append(nonCriticalErrors, err.Error())
				// Continuer malgré l'erreur
			}
		}
	}
	log.Printf("✓ Mini-jeux initialisés")

	// 9. Activer certains mini-jeux selon l'année scolaire
	var minigamesToActivate []struct {
		ID    int
		Level int
	}

	// Déterminer quels mini-jeux activer selon l'année scolaire
	switch year {
	case "CP":
		// CP: Activer uniquement le mini-jeu 1, difficulté 1
		minigamesToActivate = append(minigamesToActivate, struct {
			ID    int
			Level int
		}{1, 1})

	case "CE1":
		// CE1: Activer mini-jeux 1 et 2, difficulté 1
		minigamesToActivate = append(minigamesToActivate,
			struct {
				ID    int
				Level int
			}{1, 1},
			struct {
				ID    int
				Level int
			}{2, 1})

	case "CE2":
		// CE2: Activer les 3 premiers mini-jeux en difficulté 1
		minigamesToActivate = append(minigamesToActivate,
			struct {
				ID    int
				Level int
			}{1, 1},
			struct {
				ID    int
				Level int
			}{2, 1},
			struct {
				ID    int
				Level int
			}{3, 1})

	case "CM1":
		// CM1: Mini-jeux 1-6 en difficulté 1, 1-2 en difficulté 2
		for _, mg := range miniGames {
			minigamesToActivate = append(minigamesToActivate, struct {
				ID    int
				Level int
			}{mg.ID, 1})

			if mg.ID <= 2 {
				minigamesToActivate = append(minigamesToActivate, struct {
					ID    int
					Level int
				}{mg.ID, 2})
			}
		}

	case "CM2", "DYS":
		// CM2/DYS: Tous les mini-jeux en difficulté 1 et 2
		for _, mg := range miniGames {
			minigamesToActivate = append(minigamesToActivate,
				struct {
					ID    int
					Level int
				}{mg.ID, 1})
			minigamesToActivate = append(minigamesToActivate,
				struct {
					ID    int
					Level int
				}{mg.ID, 2})
		}
	}

	// Activer les mini-jeux sélectionnés
	for _, mg := range minigamesToActivate {
		_, err := db.DB.Exec(`
			UPDATE minigames_progress 
			SET available = true 
			WHERE user_id = $1 AND minigame_id = $2 AND difficulty_level = $3
		`, userID, mg.ID, mg.Level)

		if err != nil {
			log.Printf("Erreur non critique: Activation mini-jeu %d niveau %d: %v",
				mg.ID, mg.Level, err)
			nonCriticalErrors = append(nonCriticalErrors, err.Error())
			// Continuer malgré l'erreur
		}
	}
	log.Printf("✓ Mini-jeux activés selon le niveau scolaire: %s", year)

	// Si des erreurs non critiques se sont produites, les logger mais poursuivre
	if len(nonCriticalErrors) > 0 {
		log.Printf("Initialisation terminée avec %d avertissements", len(nonCriticalErrors))
	} else {
		log.Printf("Initialisation complète réussie pour le joueur %d", userID)
	}

	return nil
}
