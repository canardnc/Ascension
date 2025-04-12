package api

import (
	"net/http"
	"strings"

	"github.com/canardnc/Ascension/internal/api/handlers"
	"github.com/canardnc/Ascension/internal/api/middleware"
	"github.com/canardnc/Ascension/internal/email"
)

// InitApp initialise l'application
func InitApp() {
	// Initialiser le service d'email
	emailConfig := email.LoadEmailConfigFromEnvironment()
	handlers.InitEmailService(emailConfig)
}

// SetupRoutes configure les routes de l'API
func SetupRoutes(mux *http.ServeMux) {
	// Initialiser l'application
	InitApp()

	// Fichiers de configuration
	configsDir := http.FileServer(http.Dir("./web/public/configs"))
	mux.Handle("/configs/", http.StripPrefix("/configs/", configsDir))

	// ===== ROUTES D'AUTHENTIFICATION =====

	// Nouvelles routes d'authentification
	mux.HandleFunc("/api/auth/register", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.Register(w, r)
		} else {
			http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/api/auth/login", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.Login(w, r)
		} else {
			http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/api/auth/verify-email", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handlers.VerifyEmail(w, r)
		} else {
			http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/api/auth/request-reset", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.RequestPasswordReset(w, r)
		} else {
			http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/api/auth/reset-password", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.ResetPassword(w, r)
		} else {
			http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		}
	})

	// Route d'authentification simplifiée (pour compatibilité)
	mux.HandleFunc("/api/auth/simple", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.SimpleAuth(w, r)
		} else {
			http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		}
	})

	// ===== ROUTES STATIQUES =====

	// Routes pour les fichiers statiques - doivent être définies avant les routes spécifiques
	assetsDir := http.FileServer(http.Dir("./web/public/assets"))
	mux.Handle("/assets/", http.StripPrefix("/assets/", assetsDir))

	adminDir := http.FileServer(http.Dir("./web/public/admin"))
	mux.Handle("/admin/", http.StripPrefix("/admin/", adminDir))

	jsDir := http.FileServer(http.Dir("./web/public/js"))
	mux.Handle("/js/", http.StripPrefix("/js/", jsDir))

	cssDir := http.FileServer(http.Dir("./web/public/css"))
	mux.Handle("/css/", http.StripPrefix("/css/", cssDir))

	iconsDir := http.FileServer(http.Dir("./web/public/icons"))
	mux.Handle("/icons/", http.StripPrefix("/icons/", iconsDir))

	gamesDir := http.FileServer(http.Dir("./web/public/games"))
	mux.Handle("/games/", http.StripPrefix("/games/", gamesDir))

	mainGameDir := http.FileServer(http.Dir("./web/public/main_game"))
	mux.Handle("/main_game/", http.StripPrefix("/main_game/", mainGameDir))

	// ===== ROUTES HTML =====

	// Routes HTML principales
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			http.ServeFile(w, r, "./web/public/index.html")
		} else {
			http.NotFound(w, r)
		}
	})

	// Pages d'authentification et de vérification
	mux.HandleFunc("/verify-email.html", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./web/public/verify-email.html")
	})

	mux.HandleFunc("/reset-password.html", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./web/public/reset-password.html")
	})

	mux.HandleFunc("/onboarding.html", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./web/public/onboarding.html")
	})

	mux.HandleFunc("/home.html", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./web/public/home.html")
	})

	mux.HandleFunc("/training.html", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./web/public/training.html")
	})

	mux.HandleFunc("/battle.html", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./web/public/battle.html")
	})

	mux.HandleFunc("/game.html", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./web/public/game.html")
	})

	mux.HandleFunc("/manifest.json", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./web/public/manifest.json")
	})

	mux.HandleFunc("/stats.html", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./web/public/stats.html")
	})

	// ===== ROUTES D'ADMINISTRATION DU JEU =====

	// Configurer les routes d'administration du jeu
	SetupGameAdminRoutes(mux)

	// ===== ROUTES API =====

	mux.HandleFunc("/api/icons/random", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			middleware.JWTAuth(handlers.GetRandomIcons)(w, r)
		} else {
			http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/api/minigame/metadata", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			middleware.JWTAuth(handlers.GetMinigameMetadata)(w, r)
		} else {
			http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		}
	})

	// Routes authentifiées pour les utilisateurs
	mux.HandleFunc("/api/user", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			middleware.JWTAuth(handlers.GetUserInfo)(w, r)
		case http.MethodPut:
			middleware.JWTAuth(handlers.UpdateUser)(w, r)
		default:
			http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		}
	})

	// Routes d'administration des utilisateurs
	mux.HandleFunc("/api/users", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			middleware.RequireAdmin(handlers.GetUsersList)(w, r)
		default:
			http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		}
	})

	// Route pour obtenir le statut d'un mini-jeu (disponibilité et coût en énergie)
	mux.HandleFunc("/api/minigame/status", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			middleware.JWTAuth(handlers.GetMinigameStatus)(w, r)
		} else {
			http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		}
	})

	// Routes utilisateur avec paramètres d'URL
	mux.HandleFunc("/api/users/", func(w http.ResponseWriter, r *http.Request) {
		// Extraire l'ID de l'URL
		path := r.URL.Path
		parts := strings.Split(path, "/")

		// Si c'est juste /api/users/ sans ID, renvoyer une erreur
		if len(parts) < 4 || parts[3] == "" {
			http.Error(w, "ID utilisateur manquant", http.StatusBadRequest)
			return
		}

		// Route pour recharger l'énergie: /api/users/{id}/recharge-energy
		if len(parts) >= 5 && parts[4] == "recharge-energy" {
			if r.Method == http.MethodPost {
				middleware.JWTAuth(handlers.RechargeUserEnergy)(w, r)
			} else {
				http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
			}
			return
		}

		// Route pour gérer les permissions: /api/users/{id}/permissions
		if len(parts) >= 5 && parts[4] == "permissions" {
			if r.Method == http.MethodPatch {
				middleware.JWTAuth(handlers.UpdateUserPermissions)(w, r)
			} else {
				http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
			}
			return
		}

		// Route pour réinitialiser un utilisateur: /api/users/{id}/reset
		if len(parts) >= 5 && parts[4] == "reset" {
			if r.Method == http.MethodPost {
				middleware.JWTAuth(handlers.ResetUser)(w, r)
			} else {
				http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
			}
			return
		}

		// Route par défaut pour les détails et mises à jour: /api/users/{id}
		switch r.Method {
		case http.MethodGet:
			middleware.JWTAuth(handlers.GetUserDetails)(w, r)
		case http.MethodPut:
			middleware.JWTAuth(handlers.AdminUpdateUser)(w, r)
		case http.MethodDelete:
			middleware.JWTAuth(handlers.DeleteUser)(w, r)
		default:
			http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		}
	})

	// Route d'initialisation des données du joueur
	mux.HandleFunc("/api/user/initialize", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			middleware.JWTAuth(handlers.InitializePlayer)(w, r)
		} else {
			http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		}
	})

	// ===== ROUTES DE JEU =====

	// Scores
	mux.HandleFunc("/api/scores", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			middleware.JWTAuth(handlers.GetScores)(w, r)
		case http.MethodPost:
			middleware.JWTAuth(handlers.SaveScore)(w, r)
		default:
			http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		}
	})

	// Route pour les détails d'un niveau
	mux.HandleFunc("/api/battle/level-details", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			middleware.JWTAuth(handlers.GetLevelDetails)(w, r)
		} else {
			http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		}
	})

	// Routes des mini-jeux
	mux.HandleFunc("/api/minigames", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			middleware.JWTAuth(handlers.GetMinigames)(w, r)
		} else {
			http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/api/minigame/complete", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			middleware.JWTAuth(handlers.CompleteMinigame)(w, r)
		} else {
			http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		}
	})

	// Statistiques du joueur
	mux.HandleFunc("/api/player/stats", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			middleware.JWTAuth(handlers.GetPlayerStats)(w, r)
		case http.MethodPut:
			middleware.JWTAuth(handlers.UpdatePlayerStats)(w, r)
		default:
			http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		}
	})

	// Combat
	mux.HandleFunc("/api/battle/start", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			middleware.JWTAuth(handlers.StartBattle)(w, r)
		} else {
			http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/api/battle/complete", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			middleware.JWTAuth(handlers.CompleteBattle)(w, r)
		} else {
			http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		}
	})

	// Configurations du jeu
	mux.HandleFunc("/api/game/config/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			// Extraire le type de configuration de l'URL
			configType := r.URL.Path[len("/api/game/config/"):]
			middleware.JWTAuth(func(w http.ResponseWriter, r *http.Request) {
				handlers.GetGameConfig(w, r, configType)
			})(w, r)
		} else {
			http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		}
	})

	// Configurer les routes d'administration des mini-jeux
	SetupAdminMinigamesRoutes(mux)
}
