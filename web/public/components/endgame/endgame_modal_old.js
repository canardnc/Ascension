// Fonction globale pour afficher le bloc de fin de partie
window.showEndgameModal = function(score, maxScore, categoryType = 'strength', resetGameFunction) {
    // Calculer le pourcentage de réussite
    const percentage = (score / maxScore) * 100;
    
    // Déterminer le nombre d'étoiles en fonction du pourcentage
    let stars = 0;
    let message = "Continue de pratiquer, tu vas t'améliorer !";
    
    if (percentage >= 95) {
        stars = 3;
        message = "Parfait ! Tu es excellent à ce jeu !";
    } else if (percentage >= 66) {
        stars = 2;
        message = "Bravo ! C'est un très bon score !";
    } else if (percentage >= 30) {
        stars = 1;
        message = "C'est un bon début, tu progresses !";
    }
    
    // Mettre à jour le score et le message
    document.getElementById("endgame-score").textContent = score;
    document.getElementById("endgame-max-score").textContent = maxScore;
    document.getElementById("endgame-message").textContent = message;
    
    // Réinitialiser les étoiles
    document.querySelectorAll(".star").forEach(star => {
        star.classList.remove("active");
    });
    
    // Activer les étoiles avec une animation séquentielle
    for (let i = 1; i <= stars; i++) {
        setTimeout(() => {
            document.getElementById(`star${i}`).classList.add("active");
        }, i * 300); // Ajouter un délai pour chaque étoile
    }
    
    // Configurer les boutons
    document.getElementById("replay-button").onclick = () => {
        // Cacher le modal
        document.getElementById("endgame-modal").style.display = "none";
        
        // Réinitialiser le jeu avec la fonction fournie
        if (typeof resetGameFunction === 'function') {
            resetGameFunction();
        }
    };
    
    document.getElementById("quit-button").onclick = () => {
        // Rediriger vers la page d'entraînement avec le type de catégorie
        window.location.href = `/training.html?type=${categoryType}`;
    };
    
    // Afficher le modal
    const modal = document.getElementById("endgame-modal");
    modal.style.display = "flex";
};

// Fonction pour charger dynamiquement le composant de fin de partie
function loadEndgameComponent() {
    // Vérifier si le composant est déjà chargé
    if (document.getElementById('endgame-modal')) {
        return Promise.resolve();
    }
    
    // Charger le HTML
    return fetch('/components/endgame/endgame-modal.html')
        .then(response => response.text())
        .then(html => {
            // Ajouter le HTML à la fin du body
            document.body.insertAdjacentHTML('beforeend', html);
            
            // S'il n'y a pas encore de lien vers le CSS, l'ajouter
            if (!document.querySelector('link[href="/components/endgame/endgame-modal.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = '/components/endgame/endgame-modal.css';
                document.head.appendChild(link);
            }
        });
}

// Charger le composant au chargement de la page
document.addEventListener('DOMContentLoaded', loadEndgameComponent);