package api

import (
	"net/http"

	"github.com/canardnc/Ascension/internal/api/handlers"
	"github.com/canardnc/Ascension/internal/api/middleware"
)

// SetupRoutes configure les routes de l'API
func SetupRoutes(mux *http.ServeMux) {
	configsDir := http.FileServer(http.Dir("./web/public/configs"))
	mux.Handle("/configs/", http.StripPrefix("/configs/", configsDir))

	// Routes publiques
	mux.HandleFunc("/api/auth/simple", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.SimpleAuth(w, r)
		} else {
			http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		}
	})

	// Routes statiques - doivent être définis avant les routes spécifiques
	assetsDir := http.FileServer(http.Dir("./web/public/assets"))
	mux.Handle("/assets/", http.StripPrefix("/assets/", assetsDir))

	iconsDir := http.FileServer(http.Dir("./web/public/icons"))
	mux.Handle("/icons/", http.StripPrefix("/icons/", iconsDir))

	gamesDir := http.FileServer(http.Dir("./web/public/games"))
	mux.Handle("/games/", http.StripPrefix("/games/", gamesDir))

	// Routes HTML
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			http.ServeFile(w, r, "./web/public/index.html")
		} else {
			http.NotFound(w, r)
		}
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

	mux.HandleFunc("/minigame.html", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./web/public/minigame.html")
	})

	mux.HandleFunc("/game.html", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./web/public/game.html")
	})

	mux.HandleFunc("/manifest.json", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./web/public/manifest.json")
	})

	// Routes authentifiées
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

	// Entraînement
	mux.HandleFunc("/api/training/complete", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			middleware.JWTAuth(handlers.CompleteTraining)(w, r)
		} else {
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
}
