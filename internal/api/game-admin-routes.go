package api

import (
	"net/http"
	"strings"

	"github.com/canardnc/Ascension/internal/api/handlers"
	"github.com/canardnc/Ascension/internal/api/middleware"
)

// SetupGameAdminRoutes configure les routes d'administration du jeu
func SetupGameAdminRoutes(mux *http.ServeMux) {
	// Routes pour la gestion des monstres

	mux.HandleFunc("/api/game/monsters/", func(w http.ResponseWriter, r *http.Request) {
		// Extraire l'ID monster de l'URL
		path := r.URL.Path
		parts := strings.Split(path, "/")

		// Si l'URL se termine par un slash, ignorer la dernière partie vide
		if parts[len(parts)-1] == "" {
			parts = parts[:len(parts)-1]
		}

		// Si c'est juste /api/game/monsters/ sans ID, rediriger vers la route principale
		if len(parts) <= 4 {
			http.Redirect(w, r, "/api/game/monsters", http.StatusSeeOther)
			return
		}

		switch r.Method {
		case http.MethodGet:
			middleware.JWTAuth(handlers.GetMonsterByID)(w, r)
		case http.MethodPut:
			middleware.JWTAuth(handlers.UpdateMonster)(w, r)
		case http.MethodDelete:
			middleware.JWTAuth(handlers.DeleteMonster)(w, r)
		default:
			http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		}
	})

	// Routes pour la gestion des niveaux
	mux.HandleFunc("/api/game/levels", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			middleware.JWTAuth(handlers.GetLevels)(w, r)
		case http.MethodPost:
			middleware.JWTAuth(handlers.CreateLevel)(w, r)
		default:
			http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/api/game/levels/", func(w http.ResponseWriter, r *http.Request) {
		// Extraire l'ID niveau de l'URL
		path := r.URL.Path
		parts := strings.Split(path, "/")

		// Si l'URL se termine par un slash, ignorer la dernière partie vide
		if parts[len(parts)-1] == "" {
			parts = parts[:len(parts)-1]
		}

		// Si c'est juste /api/game/levels/ sans ID, rediriger vers la route principale
		if len(parts) <= 4 {
			http.Redirect(w, r, "/api/game/levels", http.StatusSeeOther)
			return
		}

		// Route pour ajouter un monstre à un niveau: /api/game/levels/{id}/monsters
		if len(parts) >= 6 && parts[5] == "monsters" {
			if r.Method == http.MethodPost {
				middleware.JWTAuth(handlers.AddMonsterToLevel)(w, r)
			} else if r.Method == http.MethodGet {
				middleware.JWTAuth(handlers.GetLevelEntries)(w, r)
			} else {
				http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
			}
			return
		}

		// Routes principales pour les niveaux
		switch r.Method {
		case http.MethodGet:
			middleware.JWTAuth(handlers.GetLevelEntries)(w, r)
		case http.MethodDelete:
			middleware.JWTAuth(handlers.DeleteLevel)(w, r)
		default:
			http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		}
	})

	// Routes pour les entrées de niveau (monstre dans un niveau)
	mux.HandleFunc("/api/game/levels/entries/", func(w http.ResponseWriter, r *http.Request) {
		// Extraire l'ID de l'entrée de l'URL
		path := r.URL.Path
		parts := strings.Split(path, "/")

		// Si l'URL se termine par un slash, ignorer la dernière partie vide
		if parts[len(parts)-1] == "" {
			parts = parts[:len(parts)-1]
		}

		// Si c'est juste /api/game/levels/entries/ sans ID, renvoyer une erreur
		if len(parts) <= 5 {
			http.Error(w, "ID d'entrée manquant", http.StatusBadRequest)
			return
		}

		switch r.Method {
		case http.MethodPut:
			middleware.JWTAuth(handlers.UpdateLevelEntry)(w, r)
		case http.MethodDelete:
			middleware.JWTAuth(handlers.DeleteLevelEntry)(w, r)
		default:
			http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		}
	})
}
