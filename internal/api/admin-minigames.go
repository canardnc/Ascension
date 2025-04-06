package api

import (
	"net/http"
	"strings"

	"github.com/canardnc/Ascension/internal/api/handlers"
	"github.com/canardnc/Ascension/internal/api/middleware"
)

// SetupAdminMinigamesRoutes configure les routes d'administration des mini-jeux
func SetupAdminMinigamesRoutes(mux *http.ServeMux) {
	// Route pour la liste des mini-jeux
	mux.HandleFunc("/api/admin/minigames", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			middleware.JWTAuth(handlers.GetAdminMinigamesList)(w, r)
		case http.MethodPost:
			middleware.JWTAuth(handlers.CreateMinigame)(w, r)
		default:
			http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		}
	})

	// Routes pour les mini-jeux spécifiques
	mux.HandleFunc("/api/admin/minigames/", func(w http.ResponseWriter, r *http.Request) {
		// Extraire le reste du chemin
		path := r.URL.Path
		pathParts := strings.Split(path, "/")

		// Ignorer /api/admin/minigames/
		if len(pathParts) <= 4 {
			http.NotFound(w, r)
			return
		}

		// Route pour un mini-jeu spécifique: /api/admin/minigames/{id}
		if len(pathParts) == 5 {
			switch r.Method {
			case http.MethodGet:
				middleware.JWTAuth(handlers.GetAdminMinigameDetail)(w, r)
			case http.MethodPut:
				middleware.JWTAuth(handlers.UpdateMinigame)(w, r)
			case http.MethodDelete:
				middleware.JWTAuth(handlers.DeleteMinigame)(w, r)
			default:
				http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
			}
			return
		}

		// Route pour ajouter un niveau de difficulté: /api/admin/minigames/{id}/difficulty
		if len(pathParts) == 6 && pathParts[5] == "difficulty" {
			if r.Method == http.MethodPost {
				middleware.JWTAuth(handlers.AddDifficultyLevel)(w, r)
			} else {
				http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
			}
			return
		}

		// Route pour supprimer un niveau de difficulté: /api/admin/minigames/{id}/difficulty/{level}
		if len(pathParts) == 7 && pathParts[5] == "difficulty" {
			if r.Method == http.MethodDelete {
				middleware.JWTAuth(handlers.DeleteDifficultyLevel)(w, r)
			} else {
				http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
			}
			return
		}

		// Route pour activer le mini-jeu pour les utilisateurs: /api/admin/minigames/{id}/difficulty/{level}/activate
		if len(pathParts) == 8 && pathParts[5] == "difficulty" && pathParts[7] == "activate" {
			if r.Method == http.MethodPost {
				middleware.JWTAuth(handlers.ActivateMinigameForUsers)(w, r)
			} else {
				http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
			}
			return
		}

		// Route pour ajouter une année scolaire: /api/admin/minigames/{id}/difficulty/{level}/year
		if len(pathParts) == 8 && pathParts[5] == "difficulty" && pathParts[7] == "year" {
			if r.Method == http.MethodPost {
				middleware.JWTAuth(handlers.AddMinigameYear)(w, r)
			} else {
				http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
			}
			return
		}

		// Route pour supprimer une année scolaire: /api/admin/minigames/{id}/difficulty/{level}/year/{year}
		if len(pathParts) == 9 && pathParts[5] == "difficulty" && pathParts[7] == "year" {
			if r.Method == http.MethodDelete {
				middleware.JWTAuth(handlers.DeleteMinigameYear)(w, r)
			} else {
				http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
			}
			return
		}

		// Route pour ajouter un prérequis: /api/admin/minigames/{id}/difficulty/{level}/prerequisite
		if len(pathParts) == 8 && pathParts[5] == "difficulty" && pathParts[7] == "prerequisite" {
			if r.Method == http.MethodPost {
				middleware.JWTAuth(handlers.AddPrerequisite)(w, r)
			} else {
				http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
			}
			return
		}

		// Route pour supprimer un prérequis: /api/admin/minigames/{id}/difficulty/{level}/prerequisite/{prereqId}/{prereqLevel}
		if len(pathParts) == 10 && pathParts[5] == "difficulty" && pathParts[7] == "prerequisite" {
			if r.Method == http.MethodDelete {
				middleware.JWTAuth(handlers.DeletePrerequisite)(w, r)
			} else {
				http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
			}
			return
		}

		http.NotFound(w, r)
	})
}
