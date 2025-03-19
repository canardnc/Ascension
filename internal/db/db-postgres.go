package db

import (
	"database/sql"
	"fmt"

	"github.com/canardnc/Ascension/internal/config"
	_ "github.com/lib/pq"
)

// DB est l'instance globale de la base de données
var DB *sql.DB

// Initialize initialise la connexion à la base de données PostgreSQL
func Initialize(cfg config.DatabaseConfig) error {
	connStr := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.Name,
	)

	var err error
	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		return err
	}

	// Vérifier la connexion
	if err := DB.Ping(); err != nil {
		return err
	}

	return nil
}

// Close ferme la connexion à la base de données
func Close() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}
