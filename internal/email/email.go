package email

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"net/smtp"
	"os"
)

// Config représente la configuration du service d'email
type Config struct {
	SMTPHost     string
	SMTPPort     int
	SMTPUsername string
	SMTPPassword string
	FromEmail    string
	FromName     string
	BaseURL      string
}

// Service représente le service d'email
type Service struct {
	config Config
}

// NewService crée une nouvelle instance du service d'email
func NewService(config Config) *Service {
	return &Service{
		config: config,
	}
}

// GenerateVerificationCode génère un code de vérification aléatoire
func GenerateVerificationCode() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// SendVerificationEmail envoie un email de vérification à l'utilisateur
func (s *Service) SendVerificationEmail(to, username, code string) error {
	subject := "Vérification de votre compte Ascension"
	verificationURL := fmt.Sprintf("%s/verify-email?code=%s", s.config.BaseURL, code)
	
	body := fmt.Sprintf(`Bonjour %s,

Merci de vous être inscrit sur Ascension ! Pour activer votre compte, veuillez cliquer sur le lien ci-dessous :

%s

Si vous n'avez pas créé de compte sur Ascension, veuillez ignorer cet email.

L'équipe Ascension
`, username, verificationURL)

	return s.sendEmail(to, subject, body)
}

// SendPasswordResetEmail envoie un email de réinitialisation de mot de passe
func (s *Service) SendPasswordResetEmail(to, username, code string) error {
	subject := "Réinitialisation de votre mot de passe Ascension"
	resetURL := fmt.Sprintf("%s/reset-password?code=%s", s.config.BaseURL, code)
	
	body := fmt.Sprintf(`Bonjour %s,

Vous avez demandé une réinitialisation de votre mot de passe. Veuillez cliquer sur le lien ci-dessous pour définir un nouveau mot de passe :

%s

Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.

L'équipe Ascension
`, username, resetURL)

	return s.sendEmail(to, subject, body)
}

// sendEmail envoie un email avec le sujet et le corps spécifiés
func (s *Service) sendEmail(to, subject, body string) error {
	// Si nous sommes en mode développement, on simule l'envoi
	if os.Getenv("ENVIRONMENT") == "development" {
		log.Printf("Simulation d'envoi d'email à %s\nSujet: %s\n%s", to, subject, body)
		return nil
	}

	// Construire l'email
	from := fmt.Sprintf("%s <%s>", s.config.FromName, s.config.FromEmail)
	msg := fmt.Sprintf("From: %s\r\n"+
		"To: %s\r\n"+
		"Subject: %s\r\n"+
		"MIME-Version: 1.0\r\n"+
		"Content-Type: text/plain; charset=UTF-8\r\n"+
		"\r\n"+
		"%s", from, to, subject, body)

	// Configurer l'authentification SMTP
	auth := smtp.PlainAuth("", s.config.SMTPUsername, s.config.SMTPPassword, s.config.SMTPHost)

	// Envoyer l'email
	addr := fmt.Sprintf("%s:%d", s.config.SMTPHost, s.config.SMTPPort)
	err := smtp.SendMail(addr, auth, s.config.FromEmail, []string{to}, []byte(msg))
	if err != nil {
		log.Printf("Erreur lors de l'envoi de l'email à %s: %v", to, err)
		return err
	}

	return nil
}

// LoadEmailConfigFromEnvironment charge la configuration email depuis les variables d'environnement
func LoadEmailConfigFromEnvironment() Config {
	return Config{
		SMTPHost:     getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:     getEnvAsInt("SMTP_PORT", 587),
		SMTPUsername: getEnv("SMTP_USERNAME", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
		FromEmail:    getEnv("FROM_EMAIL", "noreply@example.com"),
		FromName:     getEnv("FROM_NAME", "Ascension"),
		BaseURL:      getEnv("BASE_URL", "http://localhost:8080"),
	}
}

// getEnv récupère une variable d'environnement ou retourne une valeur par défaut
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// getEnvAsInt récupère une variable d'environnement en tant qu'entier ou retourne une valeur par défaut
func getEnvAsInt(key string, defaultValue int) int {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	
	var intValue int
	_, err := fmt.Sscanf(value, "%d", &intValue)
	if err != nil {
		return defaultValue
	}
	
	return intValue
}
