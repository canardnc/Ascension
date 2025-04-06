package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/canardnc/Ascension/internal/api/middleware"
	"github.com/canardnc/Ascension/internal/db"
	"github.com/canardnc/Ascension/internal/db/models"
)

// MinigameListResponse représente la réponse pour la liste paginée des mini-jeux
type MinigameListResponse struct {
	Minigames  []MinigameItem `json:"minigames"`
	TotalCount int            `json:"totalCount"`
	Page       int            `json:"page"`
	PerPage    int            `json:"perPage"`
	TotalPages int            `json:"totalPages"`
}

// MinigameItem représente un mini-jeu dans la liste
type MinigameItem struct {
	MinigameID   int    `json:"minigame_id"`
	Title        string `json:"title"`
	CategoryID   int    `json:"category_id"`
	Description  string `json:"description"`
	Difficulties []int  `json:"difficulties"`
}

// MinigameDetailResponse représente les détails complets d'un mini-jeu
type MinigameDetailResponse struct {
	MinigameID   int                `json:"minigame_id"`
	Title        string             `json:"title"`
	CategoryID   int                `json:"category_id"`
	Description  string             `json:"description"`
	Difficulties []DifficultyDetail `json:"difficulties"`
}

// DifficultyDetail représente les détails d'un niveau de difficulté
type DifficultyDetail struct {
	Level         int                `json:"level"`
	Years         []string           `json:"years"`
	Prerequisites []PrerequisiteItem `json:"prerequisites"`
	Unlocks       []UnlockItem       `json:"unlocks"`
	Stats         DifficultyStats    `json:"stats"`
}

// DifficultyStats représente les statistiques d'un niveau de difficulté
type DifficultyStats struct {
	PlayerCount  int `json:"playerCount"`
	AverageScore int `json:"averageScore"`
	AverageTime  int `json:"averageTimeSeconds"`
}

// PrerequisiteItem représente un prérequis pour débloquer un mini-jeu
type PrerequisiteItem struct {
	MinigameID      int    `json:"minigame_id"`
	Title           string `json:"title"`
	DifficultyLevel int    `json:"difficulty_level"`
	ScoreRequired   int    `json:"score_required"`
}

// UnlockItem représente un mini-jeu débloqué
type UnlockItem struct {
	MinigameID      int    `json:"minigame_id"`
	Title           string `json:"title"`
	DifficultyLevel int    `json:"difficulty_level"`
	ScoreRequired   int    `json:"score_required"`
}

// MinigameCreateRequest représente une demande de création de mini-jeu
type MinigameCreateRequest struct {
	Title           string `json:"title"`
	CategoryID      int    `json:"category_id"`
	Description     string `json:"description"`
	DifficultyLevel int    `json:"difficulty_level"`
}

// MinigameUpdateRequest représente une demande de mise à jour de mini-jeu
type MinigameUpdateRequest struct {
	Title       string `json:"title"`
	CategoryID  int    `json:"category_id"`
	Description string `json:"description"`
}

// DifficultyAddRequest représente une demande d'ajout de niveau de difficulté
type DifficultyAddRequest struct {
	Level int `json:"level"`
}

// YearAddRequest représente une demande d'ajout d'année scolaire
type YearAddRequest struct {
	Year string `json:"year"`
}

// PrerequisiteAddRequest représente une demande d'ajout de prérequis
type PrerequisiteAddRequest struct {
	MinigameID      int `json:"minigame_id"`
	DifficultyLevel int `json:"difficulty_level"`
	ScoreRequired   int `json:"score_required"`
}

// UnlockAddRequest représente une demande d'ajout de débloquage
type UnlockAddRequest struct {
	MinigameID      int `json:"minigame_id"`
	DifficultyLevel int `json:"difficulty_level"`
	ScoreRequired   int `json:"score_required"`
}

// GetAdminMinigamesList récupère la liste paginée des mini-jeux pour l'administration
func GetAdminMinigamesList(w http.ResponseWriter, r *http.Request) {
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

	// Calculer l'offset pour la pagination
	offset := (page - 1) * perPage

	// Construire la requête SQL de base pour le comptage
	countQuery := `
		SELECT COUNT(*) FROM minigames
	`
	// Ajouter la condition de recherche si nécessaire
	countParams := []interface{}{}
	if query != "" {
		countQuery += ` WHERE title ILIKE $1 OR description ILIKE $1`
		countParams = append(countParams, "%"+query+"%")
	}

	// Exécuter le comptage
	var totalCount int
	err = db.DB.QueryRow(countQuery, countParams...).Scan(&totalCount)
	if err != nil {
		log.Printf("Erreur lors du comptage des mini-jeux: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération des mini-jeux")
		return
	}

	// Calculer le nombre total de pages
	totalPages := (totalCount + perPage - 1) / perPage

	// Construire la requête SQL pour récupérer les données
	dataQuery := `
		SELECT minigame_id, title, category_id, description
		FROM minigames
	`
	// Ajouter la condition de recherche si nécessaire
	dataParams := []interface{}{}
	paramIndex := 1
	if query != "" {
		dataQuery += ` WHERE title ILIKE $1 OR description ILIKE $1`
		dataParams = append(dataParams, "%"+query+"%")
		paramIndex++
	}

	// Ajouter l'ordre et la pagination
	dataQuery += ` ORDER BY minigame_id DESC LIMIT $` + strconv.Itoa(paramIndex) + ` OFFSET $` + strconv.Itoa(paramIndex+1)
	dataParams = append(dataParams, perPage, offset)

	// Exécuter la requête
	rows, err := db.DB.Query(dataQuery, dataParams...)
	if err != nil {
		log.Printf("Erreur lors de l'exécution de la requête mini-jeux: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération des mini-jeux")
		return
	}
	defer rows.Close()

	// Préparer la réponse
	var minigames []MinigameItem
	for rows.Next() {
		var minigame MinigameItem
		if err := rows.Scan(&minigame.MinigameID, &minigame.Title, &minigame.CategoryID, &minigame.Description); err != nil {
			log.Printf("Erreur lors de la lecture d'un mini-jeu: %v", err)
			middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la lecture des données des mini-jeux")
			return
		}

		// Récupérer les niveaux de difficulté pour ce mini-jeu
		diffQuery := `
			SELECT DISTINCT difficulty_level
			FROM minigames_progress
			WHERE minigame_id = $1
			ORDER BY difficulty_level
		`
		diffRows, err := db.DB.Query(diffQuery, minigame.MinigameID)
		if err != nil {
			log.Printf("Erreur lors de la récupération des niveaux de difficulté: %v", err)
			// Continuer malgré l'erreur
		} else {
			defer diffRows.Close()
			for diffRows.Next() {
				var level int
				if err := diffRows.Scan(&level); err != nil {
					continue
				}
				minigame.Difficulties = append(minigame.Difficulties, level)
			}
		}

		minigames = append(minigames, minigame)
	}

	// Créer la réponse
	response := MinigameListResponse{
		Minigames:  minigames,
		TotalCount: totalCount,
		Page:       page,
		PerPage:    perPage,
		TotalPages: totalPages,
	}

	middleware.RespondWithJSON(w, http.StatusOK, response)
}

// GetAdminMinigameDetail récupère les détails d'un mini-jeu pour l'administration
func GetAdminMinigameDetail(w http.ResponseWriter, r *http.Request) {
	// Vérifier si l'utilisateur est admin
	userID := r.Context().Value("userId").(int)
	user, err := models.GetUserByID(userID)
	if err != nil || !user.Admin {
		middleware.RespondWithError(w, http.StatusForbidden, "Accès restreint aux administrateurs")
		return
	}

	// Extraire l'ID du mini-jeu de l'URL
	path := r.URL.Path
	parts := strings.Split(path, "/")
	if len(parts) < 5 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID mini-jeu manquant")
		return
	}

	minigameIDStr := parts[4]
	minigameID, err := strconv.Atoi(minigameIDStr)
	if err != nil || minigameID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID mini-jeu invalide")
		return
	}

	// Récupérer les informations de base du mini-jeu
	var detail MinigameDetailResponse
	query := `
		SELECT minigame_id, title, category_id, description
		FROM minigames
		WHERE minigame_id = $1
	`
	err = db.DB.QueryRow(query, minigameID).Scan(
		&detail.MinigameID, &detail.Title, &detail.CategoryID, &detail.Description,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			middleware.RespondWithError(w, http.StatusNotFound, "Mini-jeu non trouvé")
		} else {
			log.Printf("Erreur lors de la récupération du mini-jeu %d: %v", minigameID, err)
			middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération du mini-jeu")
		}
		return
	}

	// Récupérer les niveaux de difficulté
	diffQuery := `
		SELECT DISTINCT difficulty_level
		FROM minigames_progress
		WHERE minigame_id = $1
		ORDER BY difficulty_level
	`
	diffRows, err := db.DB.Query(diffQuery, minigameID)
	if err != nil {
		log.Printf("Erreur lors de la récupération des niveaux de difficulté: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération des niveaux de difficulté")
		return
	}
	defer diffRows.Close()

	var diffLevels []int
	for diffRows.Next() {
		var level int
		if err := diffRows.Scan(&level); err != nil {
			continue
		}
		diffLevels = append(diffLevels, level)
	}

	// Pour chaque niveau de difficulté, récupérer les détails
	for _, level := range diffLevels {
		diffDetail := DifficultyDetail{
			Level: level,
		}

		// Récupérer les années scolaires associées
		yearsQuery := `
			SELECT year
			FROM minigames_year
			WHERE minigame_id = $1 AND difficulty_level = $2
			ORDER BY year
		`
		yearsRows, err := db.DB.Query(yearsQuery, minigameID, level)
		if err == nil {
			defer yearsRows.Close()
			for yearsRows.Next() {
				var year string
				if err := yearsRows.Scan(&year); err != nil {
					continue
				}
				diffDetail.Years = append(diffDetail.Years, year)
			}
		}

		// Récupérer les prérequis
		prereqQuery := `
			SELECT r.minigame_id_required, m.title, r.difficulty_level_required, r.score_required
			FROM minigames_requirements r
			JOIN minigames m ON r.minigame_id_required = m.minigame_id
			WHERE r.minigame_id = $1 AND r.difficulty_level = $2
			ORDER BY m.title
		`
		prereqRows, err := db.DB.Query(prereqQuery, minigameID, level)
		if err == nil {
			defer prereqRows.Close()
			for prereqRows.Next() {
				var prereq PrerequisiteItem
				if err := prereqRows.Scan(&prereq.MinigameID, &prereq.Title, &prereq.DifficultyLevel, &prereq.ScoreRequired); err != nil {
					continue
				}
				diffDetail.Prerequisites = append(diffDetail.Prerequisites, prereq)
			}
		}

		// Récupérer les mini-jeux débloqués par celui-ci
		unlockQuery := `
			SELECT r.minigame_id, m.title, r.difficulty_level, r.score_required
			FROM minigames_requirements r
			JOIN minigames m ON r.minigame_id = m.minigame_id
			WHERE r.minigame_id_required = $1 AND r.difficulty_level_required = $2
			ORDER BY m.title
		`
		unlockRows, err := db.DB.Query(unlockQuery, minigameID, level)
		if err == nil {
			defer unlockRows.Close()
			for unlockRows.Next() {
				var unlock UnlockItem
				if err := unlockRows.Scan(&unlock.MinigameID, &unlock.Title, &unlock.DifficultyLevel, &unlock.ScoreRequired); err != nil {
					continue
				}
				diffDetail.Unlocks = append(diffDetail.Unlocks, unlock)
			}
		}

		// Récupérer les statistiques
		statsQuery := `
			SELECT 
				COUNT(DISTINCT user_id) as player_count,
				COALESCE(AVG(points), 0) as avg_score,
				COALESCE(AVG(time_played), 0) as avg_time
			FROM minigames_progress
			WHERE minigame_id = $1 AND difficulty_level = $2 AND total_played > 0
		`
		var stats DifficultyStats
		err = db.DB.QueryRow(statsQuery, minigameID, level).Scan(
			&stats.PlayerCount, &stats.AverageScore, &stats.AverageTime,
		)
		if err == nil {
			diffDetail.Stats = stats
		} else {
			// Valeurs par défaut en cas d'erreur
			diffDetail.Stats = DifficultyStats{0, 0, 0}
		}

		detail.Difficulties = append(detail.Difficulties, diffDetail)
	}

	middleware.RespondWithJSON(w, http.StatusOK, detail)
}

// CreateMinigame crée un nouveau mini-jeu
func CreateMinigame(w http.ResponseWriter, r *http.Request) {
	// Vérifier si l'utilisateur est admin
	userID := r.Context().Value("userId").(int)
	user, err := models.GetUserByID(userID)
	if err != nil || !user.Admin {
		middleware.RespondWithError(w, http.StatusForbidden, "Accès restreint aux administrateurs")
		return
	}

	// Décoder la requête
	var request MinigameCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		middleware.RespondWithError(w, http.StatusBadRequest, "Données invalides")
		return
	}

	// Validation des données
	if request.Title == "" {
		middleware.RespondWithError(w, http.StatusBadRequest, "Le titre est requis")
		return
	}

	if request.CategoryID <= 0 || request.CategoryID > 4 {
		middleware.RespondWithError(w, http.StatusBadRequest, "Catégorie invalide")
		return
	}

	if request.DifficultyLevel <= 0 || request.DifficultyLevel > 3 {
		middleware.RespondWithError(w, http.StatusBadRequest, "Niveau de difficulté invalide")
		return
	}

	// Démarrer une transaction
	tx, err := db.DB.Begin()
	if err != nil {
		log.Printf("Erreur lors du début de la transaction: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la création du mini-jeu")
		return
	}
	defer tx.Rollback()

	// Insérer le mini-jeu
	var minigameID int
	insertQuery := `
        INSERT INTO minigames (title, category_id, description, difficulty_level)
        VALUES ($1, $2, $3, $4)
        RETURNING minigame_id
    `
	err = tx.QueryRow(insertQuery, request.Title, request.CategoryID, request.Description, request.DifficultyLevel).Scan(&minigameID)
	if err != nil {
		log.Printf("Erreur lors de l'insertion du mini-jeu: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la création du mini-jeu")
		return
	}

	// Méthode optimisée: créer les entrées pour tous les utilisateurs en une seule requête
	_, err = tx.Exec(`
        INSERT INTO minigames_progress 
        (user_id, minigame_id, difficulty_level, points, available, cost, time_played, total_played, last_played)
        SELECT id, $1, $2, 0, false, $2, 0, 0, NOW()
        FROM users
        ON CONFLICT (user_id, minigame_id, difficulty_level) DO NOTHING
    `, minigameID, request.DifficultyLevel)

	if err != nil {
		log.Printf("Erreur lors de l'initialisation des mini-jeux pour les utilisateurs: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la création du mini-jeu")
		return
	}

	// Valider la transaction
	if err := tx.Commit(); err != nil {
		log.Printf("Erreur lors de la validation de la transaction: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la création du mini-jeu")
		return
	}

	// Préparer la réponse
	response := MinigameItem{
		MinigameID:   minigameID,
		Title:        request.Title,
		CategoryID:   request.CategoryID,
		Description:  request.Description,
		Difficulties: []int{request.DifficultyLevel},
	}

	middleware.RespondWithJSON(w, http.StatusCreated, response)
}

// UpdateMinigame met à jour un mini-jeu existant
func UpdateMinigame(w http.ResponseWriter, r *http.Request) {
	// Vérifier si l'utilisateur est admin
	userID := r.Context().Value("userId").(int)
	user, err := models.GetUserByID(userID)
	if err != nil || !user.Admin {
		middleware.RespondWithError(w, http.StatusForbidden, "Accès restreint aux administrateurs")
		return
	}

	// Extraire l'ID du mini-jeu de l'URL
	path := r.URL.Path
	parts := strings.Split(path, "/")
	if len(parts) < 5 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID mini-jeu manquant")
		return
	}

	minigameIDStr := parts[4]
	minigameID, err := strconv.Atoi(minigameIDStr)
	if err != nil || minigameID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID mini-jeu invalide")
		return
	}

	// Décoder la requête
	var request MinigameUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		middleware.RespondWithError(w, http.StatusBadRequest, "Données invalides")
		return
	}

	// Validation des données
	if request.Title == "" {
		middleware.RespondWithError(w, http.StatusBadRequest, "Le titre est requis")
		return
	}

	if request.CategoryID <= 0 || request.CategoryID > 4 {
		middleware.RespondWithError(w, http.StatusBadRequest, "Catégorie invalide")
		return
	}

	// Vérifier si le mini-jeu existe
	var exists bool
	existsQuery := `SELECT EXISTS(SELECT 1 FROM minigames WHERE minigame_id = $1)`
	err = db.DB.QueryRow(existsQuery, minigameID).Scan(&exists)
	if err != nil {
		log.Printf("Erreur lors de la vérification de l'existence du mini-jeu: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la mise à jour du mini-jeu")
		return
	}

	if !exists {
		middleware.RespondWithError(w, http.StatusNotFound, "Mini-jeu non trouvé")
		return
	}

	// Mettre à jour le mini-jeu
	updateQuery := `
		UPDATE minigames 
		SET title = $1, category_id = $2, description = $3
		WHERE minigame_id = $4
	`
	_, err = db.DB.Exec(updateQuery, request.Title, request.CategoryID, request.Description, minigameID)
	if err != nil {
		log.Printf("Erreur lors de la mise à jour du mini-jeu: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la mise à jour du mini-jeu")
		return
	}

	// Préparer la réponse
	response := map[string]interface{}{
		"success":     true,
		"minigame_id": minigameID,
	}

	middleware.RespondWithJSON(w, http.StatusOK, response)
}

// DeleteMinigame supprime un mini-jeu
func DeleteMinigame(w http.ResponseWriter, r *http.Request) {
	// Vérifier si l'utilisateur est admin
	userID := r.Context().Value("userId").(int)
	user, err := models.GetUserByID(userID)
	if err != nil || !user.Admin {
		middleware.RespondWithError(w, http.StatusForbidden, "Accès restreint aux administrateurs")
		return
	}

	// Extraire l'ID du mini-jeu de l'URL
	path := r.URL.Path
	parts := strings.Split(path, "/")
	if len(parts) < 5 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID mini-jeu manquant")
		return
	}

	minigameIDStr := parts[4]
	minigameID, err := strconv.Atoi(minigameIDStr)
	if err != nil || minigameID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID mini-jeu invalide")
		return
	}

	// Vérifier si le mini-jeu existe
	var exists bool
	existsQuery := `SELECT EXISTS(SELECT 1 FROM minigames WHERE minigame_id = $1)`
	err = db.DB.QueryRow(existsQuery, minigameID).Scan(&exists)
	if err != nil {
		log.Printf("Erreur lors de la vérification de l'existence du mini-jeu: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la suppression du mini-jeu")
		return
	}

	if !exists {
		middleware.RespondWithError(w, http.StatusNotFound, "Mini-jeu non trouvé")
		return
	}

	// Démarrer une transaction
	tx, err := db.DB.Begin()
	if err != nil {
		log.Printf("Erreur lors du début de la transaction: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la suppression du mini-jeu")
		return
	}
	defer tx.Rollback()

	// Supprimer d'abord les relations
	// 1. Supprimer les prérequis où ce mini-jeu est requis
	_, err = tx.Exec(`DELETE FROM minigames_requirements WHERE minigame_id_required = $1`, minigameID)
	if err != nil {
		log.Printf("Erreur lors de la suppression des prérequis (requis): %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la suppression du mini-jeu")
		return
	}

	// 2. Supprimer les prérequis où ce mini-jeu débloque d'autres
	_, err = tx.Exec(`DELETE FROM minigames_requirements WHERE minigame_id = $1`, minigameID)
	if err != nil {
		log.Printf("Erreur lors de la suppression des prérequis (débloqueur): %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la suppression du mini-jeu")
		return
	}

	// 3. Supprimer les associations d'années scolaires
	_, err = tx.Exec(`DELETE FROM minigames_year WHERE minigame_id = $1`, minigameID)
	if err != nil {
		log.Printf("Erreur lors de la suppression des années scolaires: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la suppression du mini-jeu")
		return
	}

	// 4. Supprimer les progressions des joueurs
	_, err = tx.Exec(`DELETE FROM minigames_progress WHERE minigame_id = $1`, minigameID)
	if err != nil {
		log.Printf("Erreur lors de la suppression des progressions: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la suppression du mini-jeu")
		return
	}

	// 5. Enfin, supprimer le mini-jeu lui-même
	_, err = tx.Exec(`DELETE FROM minigames WHERE minigame_id = $1`, minigameID)
	if err != nil {
		log.Printf("Erreur lors de la suppression du mini-jeu: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la suppression du mini-jeu")
		return
	}

	// Valider la transaction
	if err := tx.Commit(); err != nil {
		log.Printf("Erreur lors de la validation de la transaction: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la suppression du mini-jeu")
		return
	}

	middleware.RespondWithJSON(w, http.StatusOK, map[string]bool{"success": true})
}

// AddDifficultyLevel ajoute un niveau de difficulté à un mini-jeu
func AddDifficultyLevel(w http.ResponseWriter, r *http.Request) {
	// Vérifier si l'utilisateur est admin
	userID := r.Context().Value("userId").(int)
	user, err := models.GetUserByID(userID)
	if err != nil || !user.Admin {
		middleware.RespondWithError(w, http.StatusForbidden, "Accès restreint aux administrateurs")
		return
	}

	// Extraire l'ID du mini-jeu de l'URL
	path := r.URL.Path
	parts := strings.Split(path, "/")
	if len(parts) < 6 || parts[5] != "difficulty" {
		middleware.RespondWithError(w, http.StatusBadRequest, "URL invalide")
		return
	}

	minigameIDStr := parts[4]
	minigameID, err := strconv.Atoi(minigameIDStr)
	if err != nil || minigameID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID mini-jeu invalide")
		return
	}

	// Décoder la requête
	var request DifficultyAddRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		middleware.RespondWithError(w, http.StatusBadRequest, "Données invalides")
		return
	}

	if request.Level <= 0 || request.Level > 3 {
		middleware.RespondWithError(w, http.StatusBadRequest, "Niveau de difficulté invalide")
		return
	}

	// Vérifier si le mini-jeu existe
	var exists bool
	existsQuery := `SELECT EXISTS(SELECT 1 FROM minigames WHERE minigame_id = $1)`
	err = db.DB.QueryRow(existsQuery, minigameID).Scan(&exists)
	if err != nil {
		log.Printf("Erreur lors de la vérification de l'existence du mini-jeu: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de l'ajout du niveau de difficulté")
		return
	}

	if !exists {
		middleware.RespondWithError(w, http.StatusNotFound, "Mini-jeu non trouvé")
		return
	}

	// Vérifier si ce niveau de difficulté existe déjà
	var levelExists bool
	levelExistsQuery := `
		SELECT EXISTS(
			SELECT 1 FROM minigames_progress 
			WHERE minigame_id = $1 AND difficulty_level = $2
		)
	`
	err = db.DB.QueryRow(levelExistsQuery, minigameID, request.Level).Scan(&levelExists)
	if err != nil {
		log.Printf("Erreur lors de la vérification de l'existence du niveau: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de l'ajout du niveau de difficulté")
		return
	}

	if levelExists {
		middleware.RespondWithError(w, http.StatusConflict, "Ce niveau de difficulté existe déjà")
		return
	}

	// Créer les entrées pour tous les utilisateurs avec ce niveau de difficulté
	usersQuery := `SELECT id FROM users`
	usersRows, err := db.DB.Query(usersQuery)
	if err != nil {
		log.Printf("Erreur lors de la récupération des utilisateurs: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de l'ajout du niveau de difficulté")
		return
	}
	defer usersRows.Close()

	for usersRows.Next() {
		var userID int
		if err := usersRows.Scan(&userID); err != nil {
			continue
		}

		// Insérer l'entrée dans minigames_progress
		_, err = db.DB.Exec(`
			INSERT INTO minigames_progress 
			(user_id, minigame_id, difficulty_level, points, available, cost, time_played, total_played, last_played)
			VALUES ($1, $2, $3, 0, false, $3, 0, 0, NOW())
			ON CONFLICT (user_id, minigame_id, difficulty_level) DO NOTHING
		`, userID, minigameID, request.Level)

		if err != nil {
			log.Printf("Erreur lors de l'initialisation du niveau pour l'utilisateur %d: %v", userID, err)
			// Continuer malgré l'erreur
		}
	}

	middleware.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"level":   request.Level,
	})
}

// DeleteDifficultyLevel supprime un niveau de difficulté d'un mini-jeu
func DeleteDifficultyLevel(w http.ResponseWriter, r *http.Request) {
	// Vérifier si l'utilisateur est admin
	userID := r.Context().Value("userId").(int)
	user, err := models.GetUserByID(userID)
	if err != nil || !user.Admin {
		middleware.RespondWithError(w, http.StatusForbidden, "Accès restreint aux administrateurs")
		return
	}

	// Extraire l'ID du mini-jeu et le niveau de difficulté de l'URL
	path := r.URL.Path
	parts := strings.Split(path, "/")
	if len(parts) < 7 || parts[5] != "difficulty" {
		middleware.RespondWithError(w, http.StatusBadRequest, "URL invalide")
		return
	}

	minigameIDStr := parts[4]
	minigameID, err := strconv.Atoi(minigameIDStr)
	if err != nil || minigameID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID mini-jeu invalide")
		return
	}

	levelStr := parts[6]
	level, err := strconv.Atoi(levelStr)
	if err != nil || level <= 0 || level > 3 {
		middleware.RespondWithError(w, http.StatusBadRequest, "Niveau de difficulté invalide")
		return
	}

	// Vérifier si le mini-jeu existe
	var exists bool
	existsQuery := `SELECT EXISTS(SELECT 1 FROM minigames WHERE minigame_id = $1)`
	err = db.DB.QueryRow(existsQuery, minigameID).Scan(&exists)
	if err != nil {
		log.Printf("Erreur lors de la vérification de l'existence du mini-jeu: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la suppression du niveau de difficulté")
		return
	}

	if !exists {
		middleware.RespondWithError(w, http.StatusNotFound, "Mini-jeu non trouvé")
		return
	}

	// Vérifier si c'est le seul niveau de difficulté
	var countLevels int
	countQuery := `
		SELECT COUNT(DISTINCT difficulty_level) 
		FROM minigames_progress 
		WHERE minigame_id = $1
	`
	err = db.DB.QueryRow(countQuery, minigameID).Scan(&countLevels)
	if err != nil {
		log.Printf("Erreur lors du comptage des niveaux de difficulté: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la suppression du niveau de difficulté")
		return
	}

	if countLevels <= 1 {
		middleware.RespondWithError(w, http.StatusBadRequest, "Impossible de supprimer le seul niveau de difficulté")
		return
	}

	// Démarrer une transaction
	tx, err := db.DB.Begin()
	if err != nil {
		log.Printf("Erreur lors du début de la transaction: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la suppression du niveau de difficulté")
		return
	}
	defer tx.Rollback()

	// Supprimer les relations
	// 1. Supprimer les prérequis où ce niveau est requis
	_, err = tx.Exec(`
		DELETE FROM minigames_requirements 
		WHERE minigame_id_required = $1 AND difficulty_level_required = $2
	`, minigameID, level)
	if err != nil {
		log.Printf("Erreur lors de la suppression des prérequis (requis): %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la suppression du niveau de difficulté")
		return
	}

	// 2. Supprimer les prérequis où ce niveau débloque d'autres
	_, err = tx.Exec(`
		DELETE FROM minigames_requirements 
		WHERE minigame_id = $1 AND difficulty_level = $2
	`, minigameID, level)
	if err != nil {
		log.Printf("Erreur lors de la suppression des prérequis (débloqueur): %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la suppression du niveau de difficulté")
		return
	}

	// 3. Supprimer les associations d'années scolaires
	_, err = tx.Exec(`
		DELETE FROM minigames_year 
		WHERE minigame_id = $1 AND difficulty_level = $2
	`, minigameID, level)
	if err != nil {
		log.Printf("Erreur lors de la suppression des années scolaires: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la suppression du niveau de difficulté")
		return
	}

	// 4. Supprimer les progressions des joueurs
	_, err = tx.Exec(`
		DELETE FROM minigames_progress 
		WHERE minigame_id = $1 AND difficulty_level = $2
	`, minigameID, level)
	if err != nil {
		log.Printf("Erreur lors de la suppression des progressions: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la suppression du niveau de difficulté")
		return
	}

	// Valider la transaction
	if err := tx.Commit(); err != nil {
		log.Printf("Erreur lors de la validation de la transaction: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la suppression du niveau de difficulté")
		return
	}

	middleware.RespondWithJSON(w, http.StatusOK, map[string]bool{"success": true})
}

// AddMinigameYear ajoute une année scolaire à un niveau de difficulté d'un mini-jeu
func AddMinigameYear(w http.ResponseWriter, r *http.Request) {
	// Vérifier si l'utilisateur est admin
	userID := r.Context().Value("userId").(int)
	user, err := models.GetUserByID(userID)
	if err != nil || !user.Admin {
		middleware.RespondWithError(w, http.StatusForbidden, "Accès restreint aux administrateurs")
		return
	}

	// Extraire l'ID du mini-jeu et le niveau de difficulté de l'URL
	path := r.URL.Path
	parts := strings.Split(path, "/")
	if len(parts) < 8 || parts[5] != "difficulty" || parts[7] != "year" {
		middleware.RespondWithError(w, http.StatusBadRequest, "URL invalide")
		return
	}

	minigameIDStr := parts[4]
	minigameID, err := strconv.Atoi(minigameIDStr)
	if err != nil || minigameID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID mini-jeu invalide")
		return
	}

	levelStr := parts[6]
	level, err := strconv.Atoi(levelStr)
	if err != nil || level <= 0 || level > 3 {
		middleware.RespondWithError(w, http.StatusBadRequest, "Niveau de difficulté invalide")
		return
	}

	// Décoder la requête
	var request YearAddRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		middleware.RespondWithError(w, http.StatusBadRequest, "Données invalides")
		return
	}

	if request.Year == "" {
		middleware.RespondWithError(w, http.StatusBadRequest, "Année scolaire requise")
		return
	}

	// Valider l'année scolaire
	validYears := []string{"CP", "CE1", "CE2", "CM1", "CM2", "DYS"}
	valid := false
	for _, year := range validYears {
		if request.Year == year {
			valid = true
			break
		}
	}
	if !valid {
		middleware.RespondWithError(w, http.StatusBadRequest, "Année scolaire invalide")
		return
	}

	// Vérifier si cette association existe déjà
	var exists bool
	existsQuery := `
		SELECT EXISTS(
			SELECT 1 FROM minigames_year
			WHERE minigame_id = $1 AND difficulty_level = $2 AND year = $3
		)
	`
	err = db.DB.QueryRow(existsQuery, minigameID, level, request.Year).Scan(&exists)
	if err != nil {
		log.Printf("Erreur lors de la vérification de l'association: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de l'ajout de l'année scolaire")
		return
	}

	if exists {
		middleware.RespondWithError(w, http.StatusConflict, "Cette année scolaire est déjà associée à ce niveau de difficulté")
		return
	}

	// Ajouter l'association
	_, err = db.DB.Exec(`
		INSERT INTO minigames_year (minigame_id, difficulty_level, year)
		VALUES ($1, $2, $3)
	`, minigameID, level, request.Year)
	if err != nil {
		log.Printf("Erreur lors de l'ajout de l'année scolaire: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de l'ajout de l'année scolaire")
		return
	}

	middleware.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"year":    request.Year,
	})
}

// DeleteMinigameYear supprime une année scolaire d'un niveau de difficulté d'un mini-jeu
func DeleteMinigameYear(w http.ResponseWriter, r *http.Request) {
	// Vérifier si l'utilisateur est admin
	userID := r.Context().Value("userId").(int)
	user, err := models.GetUserByID(userID)
	if err != nil || !user.Admin {
		middleware.RespondWithError(w, http.StatusForbidden, "Accès restreint aux administrateurs")
		return
	}

	// Extraire l'ID du mini-jeu, le niveau de difficulté et l'année scolaire de l'URL
	path := r.URL.Path
	parts := strings.Split(path, "/")
	if len(parts) < 9 || parts[5] != "difficulty" || parts[7] != "year" {
		middleware.RespondWithError(w, http.StatusBadRequest, "URL invalide")
		return
	}

	minigameIDStr := parts[4]
	minigameID, err := strconv.Atoi(minigameIDStr)
	if err != nil || minigameID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID mini-jeu invalide")
		return
	}

	levelStr := parts[6]
	level, err := strconv.Atoi(levelStr)
	if err != nil || level <= 0 || level > 3 {
		middleware.RespondWithError(w, http.StatusBadRequest, "Niveau de difficulté invalide")
		return
	}

	year := parts[8]
	if year == "" {
		middleware.RespondWithError(w, http.StatusBadRequest, "Année scolaire requise")
		return
	}

	// Supprimer l'association
	_, err = db.DB.Exec(`
		DELETE FROM minigames_year
		WHERE minigame_id = $1 AND difficulty_level = $2 AND year = $3
	`, minigameID, level, year)
	if err != nil {
		log.Printf("Erreur lors de la suppression de l'année scolaire: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la suppression de l'année scolaire")
		return
	}

	middleware.RespondWithJSON(w, http.StatusOK, map[string]bool{"success": true})
}

// AddPrerequisite ajoute un prérequis à un niveau de difficulté d'un mini-jeu
func AddPrerequisite(w http.ResponseWriter, r *http.Request) {
	// Vérifier si l'utilisateur est admin
	userID := r.Context().Value("userId").(int)
	user, err := models.GetUserByID(userID)
	if err != nil || !user.Admin {
		middleware.RespondWithError(w, http.StatusForbidden, "Accès restreint aux administrateurs")
		return
	}

	// Extraire l'ID du mini-jeu et le niveau de difficulté de l'URL
	path := r.URL.Path
	parts := strings.Split(path, "/")
	if len(parts) < 8 || parts[5] != "difficulty" || parts[7] != "prerequisite" {
		middleware.RespondWithError(w, http.StatusBadRequest, "URL invalide")
		return
	}

	minigameIDStr := parts[4]
	minigameID, err := strconv.Atoi(minigameIDStr)
	if err != nil || minigameID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID mini-jeu invalide")
		return
	}

	levelStr := parts[6]
	level, err := strconv.Atoi(levelStr)
	if err != nil || level <= 0 || level > 3 {
		middleware.RespondWithError(w, http.StatusBadRequest, "Niveau de difficulté invalide")
		return
	}

	// Décoder la requête
	var request PrerequisiteAddRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		middleware.RespondWithError(w, http.StatusBadRequest, "Données invalides")
		return
	}

	if request.MinigameID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID du mini-jeu prérequis invalide")
		return
	}

	if request.DifficultyLevel <= 0 || request.DifficultyLevel > 3 {
		middleware.RespondWithError(w, http.StatusBadRequest, "Niveau de difficulté prérequis invalide")
		return
	}

	if request.ScoreRequired <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "Score requis invalide")
		return
	}

	// Vérifier que le mini-jeu prérequis n'est pas le même que le mini-jeu cible
	if request.MinigameID == minigameID {
		middleware.RespondWithError(w, http.StatusBadRequest, "Un mini-jeu ne peut pas être son propre prérequis")
		return
	}

	// Vérifier que le mini-jeu prérequis existe
	var prereqExists bool
	prereqExistsQuery := `
		SELECT EXISTS(
			SELECT 1 FROM minigames 
			WHERE minigame_id = $1
		)
	`
	err = db.DB.QueryRow(prereqExistsQuery, request.MinigameID).Scan(&prereqExists)
	if err != nil {
		log.Printf("Erreur lors de la vérification du mini-jeu prérequis: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de l'ajout du prérequis")
		return
	}

	if !prereqExists {
		middleware.RespondWithError(w, http.StatusBadRequest, "Le mini-jeu prérequis n'existe pas")
		return
	}

	// Vérifier que le niveau de difficulté du mini-jeu prérequis existe
	var levelExists bool
	levelExistsQuery := `
		SELECT EXISTS(
			SELECT 1 FROM minigames_progress 
			WHERE minigame_id = $1 AND difficulty_level = $2
		)
	`
	err = db.DB.QueryRow(levelExistsQuery, request.MinigameID, request.DifficultyLevel).Scan(&levelExists)
	if err != nil {
		log.Printf("Erreur lors de la vérification du niveau de difficulté prérequis: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de l'ajout du prérequis")
		return
	}

	if !levelExists {
		middleware.RespondWithError(w, http.StatusBadRequest, "Le niveau de difficulté du mini-jeu prérequis n'existe pas")
		return
	}

	// Vérifier que ce prérequis n'existe pas déjà
	var prerequisiteExists bool
	prerequisiteExistsQuery := `
		SELECT EXISTS(
			SELECT 1 FROM minigames_requirements 
			WHERE minigame_id = $1 AND difficulty_level = $2 
			AND minigame_id_required = $3 AND difficulty_level_required = $4
		)
	`
	err = db.DB.QueryRow(prerequisiteExistsQuery, minigameID, level, request.MinigameID, request.DifficultyLevel).Scan(&prerequisiteExists)
	if err != nil {
		log.Printf("Erreur lors de la vérification du prérequis: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de l'ajout du prérequis")
		return
	}

	if prerequisiteExists {
		middleware.RespondWithError(w, http.StatusConflict, "Ce prérequis existe déjà")
		return
	}

	// Ajouter le prérequis
	_, err = db.DB.Exec(`
		INSERT INTO minigames_requirements 
		(minigame_id, difficulty_level, minigame_id_required, difficulty_level_required, score_required)
		VALUES ($1, $2, $3, $4, $5)
	`, minigameID, level, request.MinigameID, request.DifficultyLevel, request.ScoreRequired)
	if err != nil {
		log.Printf("Erreur lors de l'ajout du prérequis: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de l'ajout du prérequis")
		return
	}

	// Récupérer le titre du mini-jeu prérequis pour la réponse
	var title string
	titleQuery := `SELECT title FROM minigames WHERE minigame_id = $1`
	err = db.DB.QueryRow(titleQuery, request.MinigameID).Scan(&title)
	if err != nil {
		title = "Mini-jeu #" + strconv.Itoa(request.MinigameID)
		log.Printf("Erreur lors de la récupération du titre: %v", err)
		// Continuer malgré l'erreur
	}

	middleware.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"prerequisite": PrerequisiteItem{
			MinigameID:      request.MinigameID,
			Title:           title,
			DifficultyLevel: request.DifficultyLevel,
			ScoreRequired:   request.ScoreRequired,
		},
	})
}

// DeletePrerequisite supprime un prérequis d'un niveau de difficulté d'un mini-jeu
func DeletePrerequisite(w http.ResponseWriter, r *http.Request) {
	// Vérifier si l'utilisateur est admin
	userID := r.Context().Value("userId").(int)
	user, err := models.GetUserByID(userID)
	if err != nil || !user.Admin {
		middleware.RespondWithError(w, http.StatusForbidden, "Accès restreint aux administrateurs")
		return
	}

	// Extraire l'ID du mini-jeu, le niveau de difficulté et l'ID du mini-jeu prérequis de l'URL
	path := r.URL.Path
	parts := strings.Split(path, "/")
	if len(parts) < 10 || parts[5] != "difficulty" || parts[7] != "prerequisite" {
		middleware.RespondWithError(w, http.StatusBadRequest, "URL invalide")
		return
	}

	minigameIDStr := parts[4]
	minigameID, err := strconv.Atoi(minigameIDStr)
	if err != nil || minigameID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID mini-jeu invalide")
		return
	}

	levelStr := parts[6]
	level, err := strconv.Atoi(levelStr)
	if err != nil || level <= 0 || level > 3 {
		middleware.RespondWithError(w, http.StatusBadRequest, "Niveau de difficulté invalide")
		return
	}

	prereqMinigameIDStr := parts[8]
	prereqMinigameID, err := strconv.Atoi(prereqMinigameIDStr)
	if err != nil || prereqMinigameID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID du mini-jeu prérequis invalide")
		return
	}

	prereqLevelStr := parts[9]
	prereqLevel, err := strconv.Atoi(prereqLevelStr)
	if err != nil || prereqLevel <= 0 || prereqLevel > 3 {
		middleware.RespondWithError(w, http.StatusBadRequest, "Niveau de difficulté prérequis invalide")
		return
	}

	// Supprimer le prérequis
	result, err := db.DB.Exec(`
		DELETE FROM minigames_requirements
		WHERE minigame_id = $1 AND difficulty_level = $2 
		AND minigame_id_required = $3 AND difficulty_level_required = $4
	`, minigameID, level, prereqMinigameID, prereqLevel)
	if err != nil {
		log.Printf("Erreur lors de la suppression du prérequis: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la suppression du prérequis")
		return
	}

	// Vérifier si la suppression a réussi
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("Erreur lors de la vérification de la suppression: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la suppression du prérequis")
		return
	}

	if rowsAffected == 0 {
		middleware.RespondWithError(w, http.StatusNotFound, "Prérequis non trouvé")
		return
	}

	middleware.RespondWithJSON(w, http.StatusOK, map[string]bool{"success": true})
}

// ActivateMinigameForUsers active un mini-jeu pour tous les utilisateurs d'une année spécifique
func ActivateMinigameForUsers(w http.ResponseWriter, r *http.Request) {
	// Vérifier si l'utilisateur est admin
	userID := r.Context().Value("userId").(int)
	user, err := models.GetUserByID(userID)
	if err != nil || !user.Admin {
		middleware.RespondWithError(w, http.StatusForbidden, "Accès restreint aux administrateurs")
		return
	}

	// Extraire l'ID du mini-jeu et le niveau de difficulté de l'URL
	path := r.URL.Path
	parts := strings.Split(path, "/")
	if len(parts) < 8 || parts[5] != "difficulty" || parts[7] != "activate" {
		middleware.RespondWithError(w, http.StatusBadRequest, "URL invalide")
		return
	}

	minigameIDStr := parts[4]
	minigameID, err := strconv.Atoi(minigameIDStr)
	if err != nil || minigameID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID mini-jeu invalide")
		return
	}

	levelStr := parts[6]
	level, err := strconv.Atoi(levelStr)
	if err != nil || level <= 0 || level > 3 {
		middleware.RespondWithError(w, http.StatusBadRequest, "Niveau de difficulté invalide")
		return
	}

	// Décoder la requête (pour obtenir l'année scolaire)
	var request struct {
		Year string `json:"year"`
	}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		middleware.RespondWithError(w, http.StatusBadRequest, "Données invalides")
		return
	}

	if request.Year == "" {
		middleware.RespondWithError(w, http.StatusBadRequest, "Année scolaire requise")
		return
	}

	// Mise à jour des progressions pour tous les utilisateurs de cette année
	updateQuery := `
		UPDATE minigames_progress mp
		SET available = true
		FROM users u
		WHERE mp.user_id = u.id
		AND u.year = $1
		AND mp.minigame_id = $2
		AND mp.difficulty_level = $3
	`
	result, err := db.DB.Exec(updateQuery, request.Year, minigameID, level)
	if err != nil {
		log.Printf("Erreur lors de l'activation du mini-jeu: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de l'activation du mini-jeu")
		return
	}

	rowsAffected, _ := result.RowsAffected()

	middleware.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success":       true,
		"usersAffected": rowsAffected,
	})
}
