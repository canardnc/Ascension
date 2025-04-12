package models

import (
	"database/sql"
	"errors"
	"log"
	"time"

	"github.com/canardnc/Ascension/internal/auth"
	"github.com/canardnc/Ascension/internal/db"
	"github.com/canardnc/Ascension/internal/email"
)

// UserAuth représente les données d'authentification d'un utilisateur
type UserAuth struct {
	ID        int       `json:"id"`
	Email     string    `json:"email"`
	Password  string    `json:"-"`
	Salt      string    `json:"-"`
	IsActive  bool      `json:"isActive"`
	EmailCode string    `json:"-"`
	HeroName  string    `json:"heroName,omitempty"`
	Year      string    `json:"year,omitempty"`
	Level     int       `json:"level"`
	CreatedAt time.Time `json:"createdAt"`
	Admin     bool      `json:"admin"`
	Teacher   bool      `json:"teacher"`
	Parent    bool      `json:"parent"`
}

// User est un alias pour la compatibilité avec le code existant
// qui utiliserait encore l'ancienne structure
type User struct {
	ID        int       `json:"id"`
	Email     string    `json:"email"`
	HeroName  string    `json:"heroName,omitempty"`
	Year      string    `json:"year,omitempty"`
	Level     int       `json:"level"`
	CreatedAt time.Time `json:"createdAt"`
	Admin     bool      `json:"admin"`
	Teacher   bool      `json:"teacher"`
	Parent    bool      `json:"parent"`
}

// ToUserAuth convertit un User en UserAuth
func (u *User) ToUserAuth() *UserAuth {
	return &UserAuth{
		ID:        u.ID,
		Email:     u.Email,
		HeroName:  u.HeroName,
		Year:      u.Year,
		Level:     u.Level,
		CreatedAt: u.CreatedAt,
		IsActive:  true, // On suppose que les anciens utilisateurs sont actifs
		Admin:     u.Admin,
		Teacher:   u.Teacher,
		Parent:    u.Parent,
	}
}

// ToUser convertit un UserAuth en User (pour la compatibilité)
func (u *UserAuth) ToUser() *User {
	return &User{
		ID:        u.ID,
		Email:     u.Email,
		HeroName:  u.HeroName,
		Year:      u.Year,
		Level:     u.Level,
		CreatedAt: u.CreatedAt,
		Admin:     u.Admin,
		Teacher:   u.Teacher,
		Parent:    u.Parent,
	}
}

// ----- TYPES POUR L'AUTHENTIFICATION -----

// UserRegistration représente les données d'inscription d'un utilisateur
type UserRegistration struct {
	Email           string `json:"email"`
	Password        string `json:"password"`
	ConfirmPassword string `json:"confirmPassword"`
}

// UserLogin représente les données de connexion d'un utilisateur
type UserLogin struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// UserPasswordReset représente les données de réinitialisation de mot de passe
type UserPasswordReset struct {
	Email string `json:"email"`
}

// UserPasswordUpdate représente les données de mise à jour de mot de passe
type UserPasswordUpdate struct {
	Code            string `json:"code"`
	Password        string `json:"password"`
	ConfirmPassword string `json:"confirmPassword"`
}

// ----- ERREURS COURANTES -----

// ErrUserNotFound est renvoyé lorsqu'un utilisateur n'est pas trouvé
var ErrUserNotFound = errors.New("utilisateur non trouvé")

// ErrInvalidCredentials est renvoyé lors d'une tentative de connexion avec des identifiants invalides
var ErrInvalidCredentials = errors.New("identifiants invalides")

// ErrUserNotActive est renvoyé lorsqu'un utilisateur tente de se connecter avec un compte non activé
var ErrUserNotActive = errors.New("compte non activé")

// ErrEmailTaken est renvoyé lorsqu'un utilisateur tente de s'inscrire avec un email déjà utilisé
var ErrEmailTaken = errors.New("cet email est déjà utilisé")

// ----- MÉTHODES DE L'ENTITÉ USER -----

// Create crée un nouvel utilisateur dans la base de données (compatibilité avec User)
func (u *User) Create() error {
	query := `
		INSERT INTO users (email, hero_name, year, level, created_at, admin, teacher, parent, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, created_at
	`
	now := time.Now()
	email := u.Email

	return db.DB.QueryRow(
		query, email, u.HeroName, u.Year, 1, now, u.Admin, u.Teacher, u.Parent, true,
	).Scan(&u.ID, &u.CreatedAt)
}

// Update met à jour les informations de l'utilisateur (compatibilité avec User)
func (u *User) Update() error {
	query := `
		UPDATE users
		SET hero_name = $1, year = $2, level = $3, admin = $4, teacher = $5, parent = $6
		WHERE id = $7
	`

	_, err := db.DB.Exec(query, u.HeroName, u.Year, u.Level, u.Admin, u.Teacher, u.Parent, u.ID)
	return err
}

// ----- MÉTHODES DE L'ENTITÉ USERAUTH -----

// Create crée un nouvel utilisateur dans la base de données
func (u *UserAuth) Create() error {
	query := `
		INSERT INTO users (email, password, salt, is_active, email_code, hero_name, year, level, created_at, admin, teacher, parent)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id, created_at
	`
	now := time.Now()

	return db.DB.QueryRow(
		query, u.Email, u.Password, u.Salt, u.IsActive, u.EmailCode,
		u.HeroName, u.Year, u.Level, now, u.Admin, u.Teacher, u.Parent,
	).Scan(&u.ID, &u.CreatedAt)
}

// Update met à jour les informations de l'utilisateur
func (u *UserAuth) Update() error {
	query := `
		UPDATE users
		SET hero_name = $1, year = $2, level = $3, admin = $4, teacher = $5, parent = $6
		WHERE id = $7
	`

	_, err := db.DB.Exec(query, u.HeroName, u.Year, u.Level, u.Admin, u.Teacher, u.Parent, u.ID)
	return err
}

// ----- FONCTIONS D'AUTHENTIFICATION -----

// RegisterUser inscrit un nouvel utilisateur avec mot de passe
func RegisterUser(reg UserRegistration, emailService *email.Service) (*UserAuth, error) {
	// Vérifier si l'email est déjà utilisé
	var count int
	err := db.DB.QueryRow("SELECT COUNT(*) FROM users WHERE email = $1", reg.Email).Scan(&count)
	if err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, ErrEmailTaken
	}

	// Hasher le mot de passe
	hashedPassword, salt, err := auth.HashPasswordWithDefaultParams(reg.Password)
	if err != nil {
		return nil, err
	}

	// Générer un code de vérification d'email
	verificationCode, err := email.GenerateVerificationCode()
	if err != nil {
		return nil, err
	}

	// Créer l'utilisateur dans la base de données
	user := &UserAuth{
		Email:     reg.Email,
		Password:  hashedPassword,
		Salt:      salt,
		IsActive:  false,
		EmailCode: verificationCode,
		Level:     1,
	}

	// Insertion dans la base de données
	query := `
		INSERT INTO users (email, password, salt, is_active, email_code, level, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at
	`
	now := time.Now()

	err = db.DB.QueryRow(
		query, user.Email, user.Password, user.Salt, user.IsActive, user.EmailCode, user.Level, now,
	).Scan(&user.ID, &user.CreatedAt)
	if err != nil {
		return nil, err
	}

	// Envoyer l'email de vérification
	if emailService != nil {
		err = emailService.SendVerificationEmail(user.Email, user.EmailCode)
		if err != nil {
			log.Printf("Erreur lors de l'envoi de l'email de vérification: %v", err)
		}
	}

	return user, nil
}

// VerifyEmail vérifie le code de vérification d'email et active le compte
func VerifyEmail(code string) (*UserAuth, error) {
	// Log pour débogage
	log.Printf("Vérification du code d'email: %s", code)

	// Rechercher l'utilisateur par code
	var user UserAuth
	var heroName, year sql.NullString

	// Utiliser des sql.NullString pour gérer les valeurs NULL
	query := `
        SELECT id, email, is_active, 
               hero_name, year, level, created_at,
               admin, teacher, parent
        FROM users
        WHERE email_code = $1
    `

	err := db.DB.QueryRow(query, code).Scan(
		&user.ID, &user.Email, &user.IsActive,
		&heroName, &year, &user.Level, &user.CreatedAt,
		&user.Admin, &user.Teacher, &user.Parent,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("Aucun utilisateur trouvé avec le code: %s", code)
			return nil, ErrUserNotFound
		}
		log.Printf("Erreur SQL lors de la recherche utilisateur avec code %s: %v", code, err)
		return nil, err
	}

	// Convertir les sql.NullString en string
	if heroName.Valid {
		user.HeroName = heroName.String
	} else {
		user.HeroName = ""
	}

	if year.Valid {
		user.Year = year.String
	} else {
		user.Year = ""
	}

	log.Printf("Utilisateur trouvé: ID=%d, Email=%s, IsActive=%t", user.ID, user.Email, user.IsActive)

	// Si le compte est déjà actif, renvoyer l'utilisateur
	if user.IsActive {
		log.Printf("Le compte est déjà actif pour l'utilisateur: %s", user.Email)
		return &user, nil
	}

	// Activer le compte
	updateQuery := "UPDATE users SET is_active = true WHERE id = $1"
	result, err := db.DB.Exec(updateQuery, user.ID)
	if err != nil {
		log.Printf("Erreur lors de l'activation du compte: %v", err)
		return nil, err
	}

	// Vérifier que la mise à jour a bien été effectuée
	rowsAffected, _ := result.RowsAffected()
	log.Printf("Mise à jour réussie: %d lignes affectées", rowsAffected)

	user.IsActive = true
	return &user, nil
}

// LoginUser authentifie un utilisateur avec son nom d'utilisateur et son mot de passe
func LoginUser(login UserLogin) (*UserAuth, error) {
	// Rechercher l'utilisateur par email
	var user UserAuth
	query := `
        SELECT id, email, password, is_active, 
               COALESCE(hero_name, ''), COALESCE(year, ''), level, created_at,
               admin, teacher, parent
        FROM users
        WHERE email = $1
    `

	err := db.DB.QueryRow(query, login.Email).Scan(
		&user.ID, &user.Email, &user.Password, &user.IsActive,
		&user.HeroName, &user.Year, &user.Level, &user.CreatedAt,
		&user.Admin, &user.Teacher, &user.Parent,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	// Vérifier si le compte est actif
	if !user.IsActive {
		return nil, ErrUserNotActive
	}

	// Vérifier le mot de passe
	isValid, err := auth.VerifyPassword(login.Password, user.Password)
	if err != nil || !isValid {
		return nil, ErrInvalidCredentials
	}

	// Ne pas renvoyer le mot de passe hashé
	user.Password = ""
	user.Salt = ""
	user.EmailCode = ""

	return &user, nil
}

// RequestPasswordReset demande une réinitialisation de mot de passe pour un email donné
func RequestPasswordReset(reset UserPasswordReset, emailService *email.Service) error {
	// Rechercher l'utilisateur par email
	var user UserAuth
	query := "SELECT id, email FROM users WHERE email = $1"

	err := db.DB.QueryRow(query, reset.Email).Scan(&user.ID, &user.Email)
	if err != nil {
		if err == sql.ErrNoRows {
			// Ne pas révéler si l'email existe ou non (protection contre l'énumération)
			return nil
		}
		return err
	}

	// Générer un code de réinitialisation
	resetCode, err := email.GenerateVerificationCode()
	if err != nil {
		return err
	}

	// Mettre à jour le code de réinitialisation dans la base de données
	_, err = db.DB.Exec("UPDATE users SET email_code = $1 WHERE id = $2", resetCode, user.ID)
	if err != nil {
		return err
	}

	// Envoyer l'email de réinitialisation
	if emailService != nil {
		err = emailService.SendPasswordResetEmail(user.Email, resetCode)
		if err != nil {
			log.Printf("Erreur lors de l'envoi de l'email de réinitialisation: %v", err)
			// On renvoie quand même une réponse positive pour ne pas révéler si l'email existe
		}
	}

	return nil
}

// UpdatePassword met à jour le mot de passe avec le code de réinitialisation
func UpdatePassword(update UserPasswordUpdate) error {
	// Rechercher l'utilisateur par code de réinitialisation
	var userID int
	query := "SELECT id FROM users WHERE email_code = $1"

	err := db.DB.QueryRow(query, update.Code).Scan(&userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return ErrUserNotFound
		}
		return err
	}

	// Hasher le nouveau mot de passe
	hashedPassword, salt, err := auth.HashPasswordWithDefaultParams(update.Password)
	if err != nil {
		return err
	}

	// Mettre à jour le mot de passe et réinitialiser le code
	_, err = db.DB.Exec(
		"UPDATE users SET password = $1, salt = $2, email_code = NULL, is_active = true WHERE id = $3",
		hashedPassword, salt, userID,
	)
	if err != nil {
		return err
	}

	return nil
}

// ----- FONCTIONS DE RÉCUPÉRATION D'UTILISATEURS -----
// GetUserByID récupère un utilisateur par son ID
func GetUserByID(id int) (*UserAuth, error) {
	// Utiliser COALESCE pour convertir les valeurs NULL en chaînes vides
	query := `
        SELECT id, email, is_active, 
               COALESCE(hero_name, ''), COALESCE(year, ''), level, created_at, 
               admin, teacher, parent
        FROM users
        WHERE id = $1
    `

	var user UserAuth
	err := db.DB.QueryRow(query, id).Scan(
		&user.ID, &user.Email, &user.IsActive,
		&user.HeroName, &user.Year, &user.Level, &user.CreatedAt,
		&user.Admin, &user.Teacher, &user.Parent,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	return &user, nil
}

// GetUserByEmail récupère un utilisateur par son email
func GetUserByEmail(email string) (*UserAuth, error) {
	query := `
        SELECT id, email, is_active, 
               COALESCE(hero_name, ''), COALESCE(year, ''), level, created_at,
               admin, teacher, parent
        FROM users
        WHERE email = $1
    `

	var user UserAuth
	err := db.DB.QueryRow(query, email).Scan(
		&user.ID, &user.Email, &user.IsActive,
		&user.HeroName, &user.Year, &user.Level, &user.CreatedAt,
		&user.Admin, &user.Teacher, &user.Parent,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrUserNotFound
		}
		log.Printf("GetUserByEmail, Erreur lors de la récupération de l'utilisateur : %v", err)
		return nil, err
	}

	return &user, nil
}

// ----- FONCTIONS LIÉES AUX SCORES ET NIVEAUX -----

// GetBestScore récupère le meilleur score de l'utilisateur
func (u *UserAuth) GetBestScore() (int, error) {
	query := `
		SELECT COALESCE(MAX(score), 0)
		FROM game_scores
		WHERE user_id = $1
	`

	var bestScore int
	err := db.DB.QueryRow(query, u.ID).Scan(&bestScore)
	if err != nil {
		return 0, err
	}

	return bestScore, nil
}

// GetBestScore récupère le meilleur score de l'utilisateur (pour compatibilité avec User)
func (u *User) GetBestScore() (int, error) {
	query := `
		SELECT COALESCE(MAX(score), 0)
		FROM game_scores
		WHERE user_id = $1
	`

	var bestScore int
	err := db.DB.QueryRow(query, u.ID).Scan(&bestScore)
	if err != nil {
		return 0, err
	}

	return bestScore, nil
}

// GetLevelStars récupère le nombre d'étoiles et le score pour un niveau donné
func GetLevelStars(userID, levelID int) (stars int, score int, err error) {
	query := `
        SELECT stars, score
        FROM level_progress
        WHERE user_id = $1 AND level_id = $2
    `

	err = db.DB.QueryRow(query, userID, levelID).Scan(&stars, &score)
	return
}

// GetMaxLevelID récupère l'ID du niveau maximum disponible dans le jeu
func GetMaxLevelID() (int, error) {
	query := `
        SELECT COALESCE(MAX(level), 0) 
        FROM levels
    `

	var maxLevelID int
	err := db.DB.QueryRow(query).Scan(&maxLevelID)
	if err != nil {
		return 0, err
	}

	return maxLevelID, nil
}

// UpdateLevelStars met à jour le nombre d'étoiles et le score pour un niveau
func UpdateLevelStars(userID, levelID, stars, score int) error {
	query := `
        INSERT INTO level_progress (user_id, level_id, stars, score, completed_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (user_id, level_id)
        DO UPDATE SET 
            stars = CASE WHEN EXCLUDED.stars > level_progress.stars THEN EXCLUDED.stars ELSE level_progress.stars END,
            score = CASE WHEN EXCLUDED.score > level_progress.score THEN EXCLUDED.score ELSE level_progress.score END,
            completed_at = CASE 
                WHEN EXCLUDED.stars > level_progress.stars OR EXCLUDED.score > level_progress.score 
                THEN NOW() 
                ELSE level_progress.completed_at 
            END
    `

	_, err := db.DB.Exec(query, userID, levelID, stars, score)
	return err
}

// UpdateUserRights met à jour les droits d'un utilisateur
func UpdateUserRights(userID int, isAdmin, isTeacher, isParent bool) error {
	query := `
		UPDATE users
		SET admin = $1, teacher = $2, parent = $3
		WHERE id = $4
	`

	_, err := db.DB.Exec(query, isAdmin, isTeacher, isParent, userID)
	return err
}
