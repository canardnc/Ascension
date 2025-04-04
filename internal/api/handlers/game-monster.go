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

// GameMonster représente un monstre dans la base de données
type GameMonster struct {
	MonsterID   int     `json:"monster_id"`
	MonsterName string  `json:"monster_name"`
	HP          int     `json:"hp"`
	Damage      int     `json:"damage"`
	Range       float64 `json:"range"`
	AttackSpeed float64 `json:"attack_speed"`
	MoveSpeed   float64 `json:"move_speed"`
	Size        float64 `json:"size"`
	Design      string  `json:"design"`
	Points      int     `json:"points"`
}

// MonstersResponse représente la réponse de l'API pour la liste des monstres
type MonstersResponse struct {
	Monsters []GameMonster `json:"monsters"`
}

// GetMonsters récupère tous les monstres du jeu
func GetMonsters(w http.ResponseWriter, r *http.Request) {
	// Vérifier si l'utilisateur est admin
	userID := r.Context().Value("userId").(int)
	user, err := models.GetUserByID(userID)
	if err != nil || !user.Admin {
		middleware.RespondWithError(w, http.StatusForbidden, "Accès restreint aux administrateurs")
		return
	}

	// Récupérer les monstres depuis la base de données
	query := `
		SELECT monster_id, monster_name, hp, damage, range, attack_speed, move_speed, size, design, points
		FROM monsters
		ORDER BY monster_id
	`

	rows, err := db.DB.Query(query)
	if err != nil {
		log.Printf("Erreur lors de la récupération des monstres: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération des monstres")
		return
	}
	defer rows.Close()

	// Parcourir les résultats
	var monsters []GameMonster
	for rows.Next() {
		var monster GameMonster
		if err := rows.Scan(
			&monster.MonsterID, &monster.MonsterName, &monster.HP, &monster.Damage,
			&monster.Range, &monster.AttackSpeed, &monster.MoveSpeed,
			&monster.Size, &monster.Design, &monster.Points,
		); err != nil {
			log.Printf("Erreur lors de la lecture d'un monstre: %v", err)
			middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la lecture des données des monstres")
			return
		}
		monsters = append(monsters, monster)
	}

	// Vérifier s'il y a eu des erreurs lors du parcours
	if err := rows.Err(); err != nil {
		log.Printf("Erreur lors du parcours des monstres: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors du parcours des monstres")
		return
	}

	// Renvoyer la réponse
	response := MonstersResponse{
		Monsters: monsters,
	}

	middleware.RespondWithJSON(w, http.StatusOK, response)
}

// GetMonsterByID récupère un monstre spécifique par son ID
func GetMonsterByID(w http.ResponseWriter, r *http.Request) {
	// Vérifier si l'utilisateur est admin
	userID := r.Context().Value("userId").(int)
	user, err := models.GetUserByID(userID)
	if err != nil || !user.Admin {
		middleware.RespondWithError(w, http.StatusForbidden, "Accès restreint aux administrateurs")
		return
	}

	// Extraire l'ID du monstre de l'URL (format: /api/game/monsters/{id})
	path := r.URL.Path
	parts := strings.Split(path, "/")
	if len(parts) < 4 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID monstre manquant")
		return
	}

	monsterIDStr := parts[len(parts)-1]
	monsterID, err := strconv.Atoi(monsterIDStr)
	if err != nil || monsterID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID monstre invalide")
		return
	}

	// Récupérer le monstre depuis la base de données
	query := `
		SELECT monster_id, monster_name, hp, damage, range, attack_speed, move_speed, size, design, points
		FROM monsters
		WHERE monster_id = $1
	`

	var monster GameMonster
	err = db.DB.QueryRow(query, monsterID).Scan(
		&monster.MonsterID, &monster.MonsterName, &monster.HP, &monster.Damage,
		&monster.Range, &monster.AttackSpeed, &monster.MoveSpeed,
		&monster.Size, &monster.Design, &monster.Points,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			middleware.RespondWithError(w, http.StatusNotFound, "Monstre non trouvé")
		} else {
			log.Printf("Erreur lors de la récupération du monstre %d: %v", monsterID, err)
			middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération du monstre")
		}
		return
	}

	// Renvoyer la réponse
	middleware.RespondWithJSON(w, http.StatusOK, monster)
}

// CreateMonster crée un nouveau monstre
func CreateMonster(w http.ResponseWriter, r *http.Request) {
	// Vérifier si l'utilisateur est admin
	userID := r.Context().Value("userId").(int)
	user, err := models.GetUserByID(userID)
	if err != nil || !user.Admin {
		middleware.RespondWithError(w, http.StatusForbidden, "Accès restreint aux administrateurs")
		return
	}

	// Décoder la requête
	var monster GameMonster
	if err := json.NewDecoder(r.Body).Decode(&monster); err != nil {
		middleware.RespondWithError(w, http.StatusBadRequest, "Format de données invalide")
		return
	}

	// Valider les données
	if monster.MonsterName == "" {
		middleware.RespondWithError(w, http.StatusBadRequest, "Le nom du monstre est requis")
		return
	}

	// Insérer le monstre dans la base de données
	query := `
		INSERT INTO monsters (monster_name, hp, damage, range, attack_speed, move_speed, size, design, points)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING monster_id
	`

	err = db.DB.QueryRow(
		query,
		monster.MonsterName, monster.HP, monster.Damage, monster.Range,
		monster.AttackSpeed, monster.MoveSpeed, monster.Size, monster.Design, monster.Points,
	).Scan(&monster.MonsterID)

	if err != nil {
		log.Printf("Erreur lors de la création du monstre: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la création du monstre")
		return
	}

	// Renvoyer la réponse
	middleware.RespondWithJSON(w, http.StatusCreated, monster)
}

// UpdateMonster met à jour un monstre existant
func UpdateMonster(w http.ResponseWriter, r *http.Request) {
	// Vérifier si l'utilisateur est admin
	userID := r.Context().Value("userId").(int)
	user, err := models.GetUserByID(userID)
	if err != nil || !user.Admin {
		middleware.RespondWithError(w, http.StatusForbidden, "Accès restreint aux administrateurs")
		return
	}

	// Extraire l'ID du monstre de l'URL (format: /api/game/monsters/{id})
	path := r.URL.Path
	parts := strings.Split(path, "/")
	if len(parts) < 4 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID monstre manquant")
		return
	}

	monsterIDStr := parts[len(parts)-1]
	monsterID, err := strconv.Atoi(monsterIDStr)
	if err != nil || monsterID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID monstre invalide")
		return
	}

	// Décoder la requête
	var monster GameMonster
	if err := json.NewDecoder(r.Body).Decode(&monster); err != nil {
		middleware.RespondWithError(w, http.StatusBadRequest, "Format de données invalide")
		return
	}

	// S'assurer que l'ID dans l'URL correspond à celui dans le corps
	if monster.MonsterID != 0 && monster.MonsterID != monsterID {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID monstre incohérent")
		return
	}
	monster.MonsterID = monsterID

	// Valider les données
	if monster.MonsterName == "" {
		middleware.RespondWithError(w, http.StatusBadRequest, "Le nom du monstre est requis")
		return
	}

	// Vérifier si le monstre existe
	var exists bool
	err = db.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM monsters WHERE monster_id = $1)", monsterID).Scan(&exists)
	if err != nil {
		log.Printf("Erreur lors de la vérification de l'existence du monstre %d: %v", monsterID, err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la vérification de l'existence du monstre")
		return
	}

	if !exists {
		middleware.RespondWithError(w, http.StatusNotFound, "Monstre non trouvé")
		return
	}

	// Mettre à jour le monstre dans la base de données
	query := `
		UPDATE monsters
		SET monster_name = $1, hp = $2, damage = $3, range = $4, 
			attack_speed = $5, move_speed = $6, size = $7, design = $8, points = $9
		WHERE monster_id = $10
	`

	_, err = db.DB.Exec(
		query,
		monster.MonsterName, monster.HP, monster.Damage, monster.Range,
		monster.AttackSpeed, monster.MoveSpeed, monster.Size, monster.Design, monster.Points,
		monsterID,
	)

	if err != nil {
		log.Printf("Erreur lors de la mise à jour du monstre %d: %v", monsterID, err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la mise à jour du monstre")
		return
	}

	// Renvoyer la réponse
	middleware.RespondWithJSON(w, http.StatusOK, monster)
}

// DeleteMonster supprime un monstre
func DeleteMonster(w http.ResponseWriter, r *http.Request) {
	// Vérifier si l'utilisateur est admin
	userID := r.Context().Value("userId").(int)
	user, err := models.GetUserByID(userID)
	if err != nil || !user.Admin {
		middleware.RespondWithError(w, http.StatusForbidden, "Accès restreint aux administrateurs")
		return
	}

	// Extraire l'ID du monstre de l'URL (format: /api/game/monsters/{id})
	path := r.URL.Path
	parts := strings.Split(path, "/")
	if len(parts) < 4 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID monstre manquant")
		return
	}

	monsterIDStr := parts[len(parts)-1]
	monsterID, err := strconv.Atoi(monsterIDStr)
	if err != nil || monsterID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID monstre invalide")
		return
	}

	// Vérifier si le monstre est utilisé dans des niveaux
	var usedInLevels bool
	err = db.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM levels WHERE monster_id = $1)", monsterID).Scan(&usedInLevels)
	if err != nil {
		log.Printf("Erreur lors de la vérification de l'utilisation du monstre %d: %v", monsterID, err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la vérification de l'utilisation du monstre")
		return
	}

	if usedInLevels {
		middleware.RespondWithError(w, http.StatusConflict, "Ce monstre est utilisé dans un ou plusieurs niveaux. Veuillez d'abord le retirer des niveaux.")
		return
	}

	// Supprimer le monstre de la base de données
	_, err = db.DB.Exec("DELETE FROM monsters WHERE monster_id = $1", monsterID)
	if err != nil {
		log.Printf("Erreur lors de la suppression du monstre %d: %v", monsterID, err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la suppression du monstre")
		return
	}

	// Renvoyer la réponse
	middleware.RespondWithJSON(w, http.StatusOK, map[string]bool{"success": true})
}
