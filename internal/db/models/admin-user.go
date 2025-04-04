package models

import (
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/canardnc/Ascension/internal/db"
)

// GetUsersCount récupère le nombre total d'utilisateurs correspondant à une recherche
func GetUsersCount(searchQuery string) (int, error) {
	query := `SELECT COUNT(*) FROM users`
	params := []interface{}{}

	// Ajouter la condition de recherche si nécessaire
	if searchQuery != "" {
		query += ` WHERE username ILIKE $1 OR email ILIKE $1 OR hero_name ILIKE $1`
		params = append(params, "%"+searchQuery+"%")
	}

	var count int
	err := db.DB.QueryRow(query, params...).Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}

// GetUsersPaginated récupère une liste paginée d'utilisateurs
func GetUsersPaginated(searchQuery string, page, perPage int) ([]*User, error) {
	// Calculer l'offset pour la pagination
	offset := (page - 1) * perPage

	// Construire la requête SQL de base
	query := `
		SELECT id, username, email, hero_name, year, level, created_at, admin, teacher, parent
		FROM users
	`
	params := []interface{}{}
	paramIndex := 1

	// Ajouter la condition de recherche si nécessaire
	if searchQuery != "" {
		query += fmt.Sprintf(" WHERE username ILIKE $%d OR email ILIKE $%d OR hero_name ILIKE $%d", 
			paramIndex, paramIndex, paramIndex)
		params = append(params, "%"+searchQuery+"%")
		paramIndex++
	}

	// Ajouter le tri et la pagination
	query += ` ORDER BY id DESC LIMIT $` + fmt.Sprintf("%d", paramIndex) + ` OFFSET $` + fmt.Sprintf("%d", paramIndex+1)
	params = append(params, perPage, offset)

	// Exécuter la requête
	rows, err := db.DB.Query(query, params...)
	if err != nil {
		log.Printf("Erreur lors de l'exécution de la requête utilisateurs: %v", err)
		return nil, err
	}
	defer rows.Close()

	// Parcourir les résultats
	var users []*User
	for rows.Next() {
		var user User
		if err := rows.Scan(
			&user.ID, &user.Username, &user.Email, &user.HeroName, &user.Year, 
			&user.Level, &user.CreatedAt, &user.Admin, &user.Teacher, &user.Parent,
		); err != nil {
			log.Printf("Erreur lors de la lecture des données utilisateurs: %v", err)
			return nil, err
		}
		users = append(users, &user)
	}

	// Vérifier s'il y a eu des erreurs lors du parcours
	if err := rows.Err(); err != nil {
		log.Printf("Erreur lors du parcours des résultats: %v", err)
		return nil, err
	}

	return users, nil
}

// RechargeEnergy recharge l'énergie d'un utilisateur à une valeur spécifiée
func RechargeEnergy(userID int, energyAmount int) error {
	query := `
		UPDATE player_energy
		SET current_energy = $1, last_refresh = $2
		WHERE user_id = $3
	`

	_, err := db.DB.Exec(query, energyAmount, time.Now(), userID)
	if err != nil {
		// Si l'entrée n'existe pas, la créer
		if strings.Contains(err.Error(), "no rows") {
			insertQuery := `
				INSERT INTO player_energy (user_id, current_energy, max_energy, last_refresh)
				VALUES ($1, $2, $2, $3)
			`
			_, err = db.DB.Exec(insertQuery, userID, energyAmount, time.Now())
			if err != nil {
				return err
			}
		} else {
			return err
		}
	}

	return nil
}
