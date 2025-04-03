package handlers

import (
	"net/http"
	"strconv"

	"github.com/canardnc/Ascension/internal/api/middleware"
	"github.com/canardnc/Ascension/internal/db"
)

// MonsterData représente les données d'un monstre dans un niveau
type MonsterData struct {
	Name         string  `json:"name"`
	HP           int     `json:"health"`
	Damage       int     `json:"damage"`
	Range        float64 `json:"range"`
	AttackSpeed  float64 `json:"attackSpeed"`
	MoveSpeed    float64 `json:"speed"`
	Size         float64 `json:"size"`
	Design       string  `json:"design"`
	Points       int     `json:"points"`       // Nouveau champ
	MonsterLevel int     `json:"monsterLevel"` // Nouveau champ pour le niveau du monstre
}

// LevelDetailsResponse représente la réponse avec les détails du niveau
type LevelDetailsResponse struct {
	Monsters []MonsterData `json:"monsters"`
	Boss     *MonsterData  `json:"boss,omitempty"`
}

// GetLevelDetails récupère les détails d'un niveau depuis la base de données
func GetLevelDetails(w http.ResponseWriter, r *http.Request) {
	// Récupérer l'ID du niveau depuis les paramètres
	levelIDStr := r.URL.Query().Get("id")
	levelID, err := strconv.Atoi(levelIDStr)
	if err != nil || levelID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID de niveau invalide")
		return
	}

	// Récupérer les détails du niveau depuis la base de données
	levelDetails, err := getLevelDetailsFromDB(levelID)
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération des détails du niveau")
		return
	}

	// Envoyer la réponse
	middleware.RespondWithJSON(w, http.StatusOK, levelDetails)
}

// getLevelDetailsFromDB récupère les détails du niveau depuis la base de données
func getLevelDetailsFromDB(levelID int) (*LevelDetailsResponse, error) {
	// Initialiser la réponse
	response := &LevelDetailsResponse{
		Monsters: []MonsterData{},
	}

	// 1. Récupérer les monstres du niveau
	rows, err := db.DB.Query(`
    SELECT m.monster_name, m.hp, m.damage, m.range, m.attack_speed, m.move_speed, m.size, m.design, m.points, l.amount, l.monster_level
    FROM levels l
    JOIN monsters m ON l.monster_id = m.monster_id
    WHERE l.level = $1
`, levelID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var name string
		var hp, damage, amount, points, monsterLevel int
		var monsterRange, attackSpeed, moveSpeed, size float64
		var design string

		err := rows.Scan(&name, &hp, &damage, &monsterRange, &attackSpeed, &moveSpeed, &size, &design, &points, &amount, &monsterLevel)
		if err != nil {
			return nil, err
		}

		// Ajouter le monstre à la liste le nombre de fois spécifié par amount
		monster := MonsterData{
			Name:         name,
			HP:           hp,
			Damage:       damage,
			Range:        monsterRange,
			AttackSpeed:  attackSpeed,
			MoveSpeed:    moveSpeed,
			Size:         size,
			Design:       design,
			Points:       points,
			MonsterLevel: monsterLevel, // Ajout du niveau du monstre
		}

		// Créer amount instances du monstre
		for i := 0; i < amount; i++ {
			response.Monsters = append(response.Monsters, monster)
		}
	}

	// Si aucun monstre n'est trouvé, ajouter quelques monstres par défaut
	if len(response.Monsters) == 0 {
		defaultMonster := MonsterData{
			Name:         "Livre Ensorcelé",
			HP:           50,
			Damage:       5,
			Range:        100,
			AttackSpeed:  1,
			MoveSpeed:    80,
			Size:         30,
			Design:       "book_default",
			Points:       10, // Points par défaut
			MonsterLevel: 1,  // Niveau par défaut
		}

		// Ajouter 5 monstres par défaut
		for i := 0; i < 5; i++ {
			response.Monsters = append(response.Monsters, defaultMonster)
		}
	}

	return response, nil
}
