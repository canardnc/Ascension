package handlers

import (
	"database/sql"
	"errors"
	"log"
	"time"

	"github.com/canardnc/Ascension/internal/db"
)

// UpdateMinigameProgressWithScore met à jour les données de progression d'un mini-jeu
// Cette fonction actualise:
// 1. La ligne exacte pour le joueur/categorie/mini-jeu/difficulté spécifiés: last_played, total_played, time_played
// 2. Toutes les lignes à difficulté inférieure ou égale: ajoute les points au score existant
func UpdateMinigameProgressWithScore(userID, minigameID, difficultyLevel, score, timeSpentMinutes int) (int, int, error) {
	// Commencer une transaction
	tx, err := db.DB.Begin()
	if err != nil {
		log.Printf("Erreur lors du début de la transaction: %v", err)
		return 0, 0, err
	}
	defer tx.Rollback()

	// 1. Vérifier que la ligne existe et récupérer le score actuel
	var currentScore int
	err = tx.QueryRow(`
		SELECT points
		FROM minigames_progress 
		WHERE user_id = $1 AND minigame_id = $2 AND difficulty_level = $3
	`, userID, minigameID, difficultyLevel).Scan(&currentScore)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			// La ligne n'existe pas - situation qui ne devrait pas arriver
			// car les mini-jeux sont pré-initialisés pour chaque utilisateur
			log.Printf("Entrée de progression non trouvée pour userID: %d, minigameID: %d, difficultyLevel: %d",
				userID, minigameID, difficultyLevel)
			return 0, 0, errors.New("progression non trouvée")
		}
		log.Printf("Erreur lors de la récupération du score actuel: %v", err)
		return 0, 0, err
	}

	// Calculer le nouveau score
	newScore := currentScore + score

	// 2. Mettre à jour la ligne spécifique avec tous les champs
	_, err = tx.Exec(`
		UPDATE minigames_progress
		SET points = $1, last_played = $2, total_played = total_played + 1, time_played = time_played + $3
		WHERE user_id = $4 AND minigame_id = $5 AND difficulty_level = $6
	`, newScore, time.Now(), timeSpentMinutes, userID, minigameID, difficultyLevel)
	if err != nil {
		log.Printf("Erreur lors de la mise à jour de la progression: %v", err)
		return 0, 0, err
	}

	// 3. Mettre à jour toutes les lignes à difficulté inférieure
	if difficultyLevel > 1 {
		_, err = tx.Exec(`
			UPDATE minigames_progress
			SET points = points + $1
			WHERE user_id = $2 AND minigame_id = $3 AND difficulty_level < $4
		`, score, userID, minigameID, difficultyLevel)
		if err != nil {
			log.Printf("Erreur lors de la mise à jour des difficultés inférieures: %v", err)
			return 0, 0, err
		}
	}

	// Valider la transaction
	if err := tx.Commit(); err != nil {
		log.Printf("Erreur lors de la validation de la transaction: %v", err)
		return 0, 0, err
	}

	// Retourner le score avant et après pour l'affichage
	return currentScore, newScore, nil
}
