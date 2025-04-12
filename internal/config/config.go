package config

import (
	"io/ioutil"
	"os"

	"gopkg.in/yaml.v2"
)

// Config représente la configuration globale de l'application
type Config struct {
	Server   ServerConfig   `yaml:"server"`
	Database DatabaseConfig `yaml:"database"`
	Security SecurityConfig `yaml:"security"`
}

// ServerConfig contient les paramètres du serveur
type ServerConfig struct {
	Port        int    `yaml:"port"`
	Environment string `yaml:"environment"`
}

// DatabaseConfig contient les paramètres de la base de données
type DatabaseConfig struct {
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	Name     string `yaml:"name"`
	User     string `yaml:"user"`
	Password string `yaml:"password"`
}

// SecurityConfig contient les paramètres de sécurité
type SecurityConfig struct {
	JWTSecret string `yaml:"jwt_secret"`
}

// LoadConfig charge la configuration depuis un fichier YAML
func LoadConfig(filePath string) (*Config, error) {
	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	var config Config
	if err := yaml.Unmarshal(data, &config); err != nil {
		return nil, err
	}

	// Priorité aux variables d'environnement si elles existent
	if jwtSecret := os.Getenv("JWT_SECRET"); jwtSecret != "" {
		config.Security.JWTSecret = jwtSecret
	}

	// Valeur par défaut si aucune clé n'est spécifiée (éviter les clés vides)
	if config.Security.JWTSecret == "" {
		// En développement uniquement - à éviter en production
		config.Security.JWTSecret = "ascension_default_dev_key_CHANGEME"
	}

	return &config, nil
}

// GetJWTSecret retourne la clé secrète pour les tokens JWT
func GetJWTSecret() []byte {
	// Pour les tests ou l'utilisation sans chargement de config
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		// Valeur par défaut (uniquement pour le développement)
		jwtSecret = "ascension_default_dev_key_CHANGEME"
	}
	return []byte(jwtSecret)
}
