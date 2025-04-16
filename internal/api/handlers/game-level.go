package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/canardnc/Ascension/internal/api/middleware"
	"github.com/canardnc/Ascension/internal/db"
	"github.com/canardnc/Ascension/internal/db/models" // Importer le package models pour utiliser GetUserByID
)

// LevelEntry représente une entrée de monstre dans un niveau
type LevelEntry struct {
	ID           int `json:"id"`
	Level        int `json:"level"`
	MonsterID    int `json:"monster_id"`
	MonsterLevel int `json:"monster_level"`
	CoordsX      int `json:"coords_x"`
	CoordsY      int `json:"coords_y"`
	SpawnTime    int `json:"spawn_time"`
	Amount       int `json:"amount"`
}

// LevelsResponse représente la réponse de l'API pour la liste des niveaux
type LevelsResponse struct {
	Levels []LevelEntry `json:"levels"`
}

// LevelRequest représente une demande de création/mise à jour de niveau
type LevelRequest struct {
	Level int `json:"level"`
}

// LevelMonsterRequest représente une demande d'ajout de monstre à un niveau
type LevelMonsterRequest struct {
	Level        int `json:"level"`
	MonsterID    int `json:"monster_id"`
	MonsterLevel int `json:"monster_level"`
	CoordsX      int `json:"coords_x"`
	CoordsY      int `json:"coords_y"`
	SpawnTime    int `json:"spawn_time"`
	Amount       int `json:"amount"`
}

// GetLevels récupère tous les niveaux du jeu
func GetLevels(w http.ResponseWriter, r *http.Request) {
	// Vérifier si l'utilisateur est admin
	userID := r.Context().Value("userId").(int)
	user, err := models.GetUserByID(userID) // Utiliser la fonction du package models
	if err != nil || !user.Admin {
		middleware.RespondWithError(w, http.StatusForbidden, "Accès restreint aux administrateurs")
		return
	}

	// Récupérer les niveaux depuis la base de données
	query := `
		SELECT id, level, monster_id, monster_level, coords_x, coords_y, spawn_time, amount
		FROM levels
		ORDER BY level, id
	`

	rows, err := db.DB.Query(query)
	if err != nil {
		log.Printf("Erreur lors de la récupération des niveaux: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération des niveaux")
		return
	}
	defer rows.Close()

	// Parcourir les résultats
	var levels []LevelEntry
	for rows.Next() {
		var level LevelEntry
		if err := rows.Scan(
			&level.ID, &level.Level, &level.MonsterID, &level.MonsterLevel,
			&level.CoordsX, &level.CoordsY, &level.SpawnTime, &level.Amount,
		); err != nil {
			log.Printf("Erreur lors de la lecture d'un niveau: %v", err)
			middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la lecture des données des niveaux")
			return
		}
		levels = append(levels, level)
	}

	// Vérifier s'il y a eu des erreurs lors du parcours
	if err := rows.Err(); err != nil {
		log.Printf("Erreur lors du parcours des niveaux: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors du parcours des niveaux")
		return
	}

	// Renvoyer la réponse
	response := LevelsResponse{
		Levels: levels,
	}

	middleware.RespondWithJSON(w, http.StatusOK, response)
}

// GetLevelEntries récupère toutes les entrées pour un niveau spécifique
func GetLevelEntries(w http.ResponseWriter, r *http.Request) {
	// Vérifier si l'utilisateur est admin
	userID := r.Context().Value("userId").(int)
	user, err := models.GetUserByID(userID) // Utiliser la fonction du package models
	if err != nil || !user.Admin {
		middleware.RespondWithError(w, http.StatusForbidden, "Accès restreint aux administrateurs")
		return
	}

	// Extraire l'ID du niveau de l'URL (format: /api/game/levels/{id}/monsters)
	path := r.URL.Path
	parts := strings.Split(path, "/")
	if len(parts) < 5 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID niveau manquant")
		return
	}

	levelIDStr := parts[4]
	levelID, err := strconv.Atoi(levelIDStr)
	if err != nil || levelID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID niveau invalide")
		return
	}

	// Récupérer les entrées du niveau depuis la base de données
	query := `
		SELECT id, level, monster_id, monster_level, coords_x, coords_y, spawn_time, amount
		FROM levels
		WHERE level = $1
		ORDER BY id
	`

	rows, err := db.DB.Query(query, levelID)
	if err != nil {
		log.Printf("Erreur lors de la récupération des entrées du niveau %d: %v", levelID, err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération des entrées du niveau")
		return
	}
	defer rows.Close()

	// Parcourir les résultats
	var entries []LevelEntry
	for rows.Next() {
		var entry LevelEntry
		if err := rows.Scan(
			&entry.ID, &entry.Level, &entry.MonsterID, &entry.MonsterLevel,
			&entry.CoordsX, &entry.CoordsY, &entry.SpawnTime, &entry.Amount,
		); err != nil {
			log.Printf("Erreur lors de la lecture d'une entrée de niveau: %v", err)
			middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la lecture des données des entrées du niveau")
			return
		}
		entries = append(entries, entry)
	}

	// Vérifier s'il y a eu des erreurs lors du parcours
	if err := rows.Err(); err != nil {
		log.Printf("Erreur lors du parcours des entrées du niveau: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors du parcours des entrées du niveau")
		return
	}

	// Renvoyer la réponse
	response := LevelsResponse{
		Levels: entries,
	}

	middleware.RespondWithJSON(w, http.StatusOK, response)
}

// CreateLevel crée un nouveau niveau (vide, sans monstres)
func CreateLevel(w http.ResponseWriter, r *http.Request) {
	// Vérifier si l'utilisateur est admin
	userID := r.Context().Value("userId").(int)
	user, err := models.GetUserByID(userID) // Utiliser la fonction du package models
	if err != nil || !user.Admin {
		middleware.RespondWithError(w, http.StatusForbidden, "Accès restreint aux administrateurs")
		return
	}

	// Décoder la requête
	var request LevelRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		middleware.RespondWithError(w, http.StatusBadRequest, "Format de données invalide")
		return
	}

	// Valider les données
	if request.Level <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "Le numéro de niveau doit être positif")
		return
	}

	// Vérifier si le niveau existe déjà
	var exists bool
	err = db.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM levels WHERE level = $1)", request.Level).Scan(&exists)
	if err != nil {
		log.Printf("Erreur lors de la vérification de l'existence du niveau %d: %v", request.Level, err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la vérification de l'existence du niveau")
		return
	}

	if exists {
		middleware.RespondWithError(w, http.StatusConflict, "Ce niveau existe déjà")
		return
	}

	// Comme nous créons un niveau vide, nous n'avons pas besoin d'insérer d'entrées dans la table
	// Nous retournons simplement un succès
	response := map[string]interface{}{
		"success": true,
		"level":   request.Level,
		"message": "Niveau créé avec succès (vide)",
	}

	middleware.RespondWithJSON(w, http.StatusCreated, response)
}

// AddMonsterToLevel ajoute un monstre à un niveau existant
func AddMonsterToLevel(w http.ResponseWriter, r *http.Request) {
	// Vérifier si l'utilisateur est admin
	userID := r.Context().Value("userId").(int)
	user, err := models.GetUserByID(userID) // Utiliser la fonction du package models
	if err != nil || !user.Admin {
		middleware.RespondWithError(w, http.StatusForbidden, "Accès restreint aux administrateurs")
		return
	}

	// Extraire l'ID du niveau de l'URL (format: /api/game/levels/{id}/monsters)
	path := r.URL.Path
	parts := strings.Split(path, "/")
	if len(parts) < 5 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID niveau manquant")
		return
	}

	levelIDStr := parts[4]
	levelID, err := strconv.Atoi(levelIDStr)
	if err != nil || levelID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID niveau invalide")
		return
	}

	// Décoder la requête
	var request LevelMonsterRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		middleware.RespondWithError(w, http.StatusBadRequest, "Format de données invalide")
		return
	}

	// Valider les données
	if request.Level != levelID {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID niveau incohérent")
		return
	}

	if request.MonsterID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID monstre invalide")
		return
	}

	if request.MonsterLevel <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "Le niveau du monstre doit être positif")
		return
	}

	if request.Amount <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "La quantité doit être positive")
		return
	}

	// Vérifier si le monstre existe
	var exists bool
	err = db.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM monsters WHERE monster_id = $1)", request.MonsterID).Scan(&exists)
	if err != nil {
		log.Printf("Erreur lors de la vérification de l'existence du monstre %d: %v", request.MonsterID, err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la vérification de l'existence du monstre")
		return
	}

	if !exists {
		middleware.RespondWithError(w, http.StatusNotFound, "Monstre non trouvé")
		return
	}

	// Insérer le monstre dans le niveau
	query := `
		INSERT INTO levels (level, monster_id, monster_level, coords_x, coords_y, spawn_time, amount)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`

	fmt.Printf("INSERTION monstre : %v\nNiveau monstre: %v", query, request.MonsterLevel)
	var entryID int
	err = db.DB.QueryRow(
		query,
		request.Level, request.MonsterID, request.MonsterLevel,
		request.CoordsX, request.CoordsY, request.SpawnTime, request.Amount,
	).Scan(&entryID)

	if err != nil {
		log.Printf("Erreur lors de l'ajout du monstre au niveau: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de l'ajout du monstre au niveau")
		return
	}

	// Créer l'objet réponse
	entry := LevelEntry{
		ID:           entryID,
		Level:        request.Level,
		MonsterID:    request.MonsterID,
		MonsterLevel: request.MonsterLevel,
		CoordsX:      request.CoordsX,
		CoordsY:      request.CoordsY,
		SpawnTime:    request.SpawnTime,
		Amount:       request.Amount,
	}

	middleware.RespondWithJSON(w, http.StatusCreated, entry)
}

// UpdateLevelEntry met à jour une entrée de monstre dans un niveau
func UpdateLevelEntry(w http.ResponseWriter, r *http.Request) {
	// Vérifier si l'utilisateur est admin
	userID := r.Context().Value("userId").(int)
	user, err := models.GetUserByID(userID) // Utiliser la fonction du package models
	if err != nil || !user.Admin {
		middleware.RespondWithError(w, http.StatusForbidden, "Accès restreint aux administrateurs")
		return
	}

	// Extraire l'ID de l'entrée de l'URL (format: /api/game/levels/entries/{id})
	path := r.URL.Path
	parts := strings.Split(path, "/")
	if len(parts) < 5 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID entrée manquant")
		return
	}

	entryIDStr := parts[len(parts)-1]
	entryID, err := strconv.Atoi(entryIDStr)
	if err != nil || entryID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID entrée invalide")
		return
	}

	// Décoder la requête
	var entry LevelEntry
	if err := json.NewDecoder(r.Body).Decode(&entry); err != nil {
		middleware.RespondWithError(w, http.StatusBadRequest, "Format de données invalide")
		return
	}

	// S'assurer que l'ID dans l'URL correspond à celui dans le corps
	if entry.ID != 0 && entry.ID != entryID {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID entrée incohérent")
		return
	}
	entry.ID = entryID

	// Valider les données
	if entry.Level <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "Le numéro de niveau doit être positif")
		return
	}

	if entry.MonsterID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID monstre invalide")
		return
	}

	if entry.MonsterLevel <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "Le niveau du monstre doit être positif")
		return
	}

	if entry.Amount <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "La quantité doit être positive")
		return
	}

	// Vérifier si l'entrée existe
	var exists bool
	err = db.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM levels WHERE id = $1)", entryID).Scan(&exists)
	if err != nil {
		log.Printf("Erreur lors de la vérification de l'existence de l'entrée %d: %v", entryID, err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la vérification de l'existence de l'entrée")
		return
	}

	if !exists {
		middleware.RespondWithError(w, http.StatusNotFound, "Entrée non trouvée")
		return
	}

	// Vérifier si le monstre existe
	err = db.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM monsters WHERE monster_id = $1)", entry.MonsterID).Scan(&exists)
	if err != nil {
		log.Printf("Erreur lors de la vérification de l'existence du monstre %d: %v", entry.MonsterID, err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la vérification de l'existence du monstre")
		return
	}

	if !exists {
		middleware.RespondWithError(w, http.StatusNotFound, "Monstre non trouvé")
		return
	}

	// Mettre à jour l'entrée dans la base de données
	query := `
		UPDATE levels
		SET level = $1, monster_id = $2, monster_level = $3, 
			coords_x = $4, coords_y = $5, spawn_time = $6, amount = $7
		WHERE id = $8
	`

	_, err = db.DB.Exec(
		query,
		entry.Level, entry.MonsterID, entry.MonsterLevel,
		entry.CoordsX, entry.CoordsY, entry.SpawnTime, entry.Amount,
		entryID,
	)

	if err != nil {
		log.Printf("Erreur lors de la mise à jour de l'entrée %d: %v", entryID, err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la mise à jour de l'entrée")
		return
	}

	// Renvoyer la réponse
	middleware.RespondWithJSON(w, http.StatusOK, entry)
}

// DeleteLevelEntry supprime une entrée de monstre d'un niveau
func DeleteLevelEntry(w http.ResponseWriter, r *http.Request) {
	// Vérifier si l'utilisateur est admin
	userID := r.Context().Value("userId").(int)
	user, err := models.GetUserByID(userID) // Utiliser la fonction du package models
	if err != nil || !user.Admin {
		middleware.RespondWithError(w, http.StatusForbidden, "Accès restreint aux administrateurs")
		return
	}

	// Extraire l'ID de l'entrée de l'URL (format: /api/game/levels/entries/{id})
	path := r.URL.Path
	parts := strings.Split(path, "/")
	if len(parts) < 5 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID entrée manquant")
		return
	}

	entryIDStr := parts[len(parts)-1]
	entryID, err := strconv.Atoi(entryIDStr)
	if err != nil || entryID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID entrée invalide")
		return
	}

	// Vérifier si l'entrée existe
	var exists bool
	err = db.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM levels WHERE id = $1)", entryID).Scan(&exists)
	if err != nil {
		log.Printf("Erreur lors de la vérification de l'existence de l'entrée %d: %v", entryID, err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la vérification de l'existence de l'entrée")
		return
	}

	if !exists {
		middleware.RespondWithError(w, http.StatusNotFound, "Entrée non trouvée")
		return
	}

	// Supprimer l'entrée de la base de données
	_, err = db.DB.Exec("DELETE FROM levels WHERE id = $1", entryID)
	if err != nil {
		log.Printf("Erreur lors de la suppression de l'entrée %d: %v", entryID, err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la suppression de l'entrée")
		return
	}

	// Renvoyer la réponse
	middleware.RespondWithJSON(w, http.StatusOK, map[string]bool{"success": true})
}

// DeleteLevel supprime toutes les entrées d'un niveau
func DeleteLevel(w http.ResponseWriter, r *http.Request) {
	// Vérifier si l'utilisateur est admin
	userID := r.Context().Value("userId").(int)
	user, err := models.GetUserByID(userID) // Utiliser la fonction du package models
	if err != nil || !user.Admin {
		middleware.RespondWithError(w, http.StatusForbidden, "Accès restreint aux administrateurs")
		return
	}

	// Extraire l'ID du niveau de l'URL (format: /api/game/levels/{id})
	path := r.URL.Path
	parts := strings.Split(path, "/")
	if len(parts) < 4 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID niveau manquant")
		return
	}

	levelIDStr := parts[len(parts)-1]
	levelID, err := strconv.Atoi(levelIDStr)
	if err != nil || levelID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID niveau invalide")
		return
	}

	// Vérifier si le niveau existe
	var count int
	err = db.DB.QueryRow("SELECT COUNT(*) FROM levels WHERE level = $1", levelID).Scan(&count)
	if err != nil {
		log.Printf("Erreur lors de la vérification de l'existence du niveau %d: %v", levelID, err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la vérification de l'existence du niveau")
		return
	}

	if count == 0 {
		middleware.RespondWithError(w, http.StatusNotFound, "Niveau non trouvé")
		return
	}

	// Supprimer toutes les entrées du niveau
	_, err = db.DB.Exec("DELETE FROM levels WHERE level = $1", levelID)
	if err != nil {
		log.Printf("Erreur lors de la suppression du niveau %d: %v", levelID, err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la suppression du niveau")
		return
	}

	// Renvoyer la réponse
	middleware.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Niveau supprimé avec succès",
		"count":   count,
	})
}
