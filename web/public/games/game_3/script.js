// Variables du jeu
const GAME_ID = 3; // ID du mini-jeu
const QUESTIONS_PER_GAME = 10; // Nombre de questions par partie
const DOORS_COUNT = 5; // Nombre de portes à afficher

// Chemins des images
const CLOSED_DOOR_PATH = '/assets/images/closed_door.webp';
const GOOD_DOOR_PATH = '/assets/images/good_door.webp';
const BAD_DOOR_PATH = '/assets/images/bad_door.webp';

// Variables globales
let difficultyLevel = 1;
let currentQuestionIndex = 0;
let iconsCollection = [];
let currentIcon = null;
let score = 0;
let waitingForNextQuestion = false;
let gameStartTime;
let currentGameTime = 0;
let timeInterval;
let speechSynthesis = window.speechSynthesis;
let speechUtterance = null;

// Éléments DOM
let doorsContainer;
let currentWordElement;
let scoreDisplay;
let timerDisplay;
let progressBar;
let nextQuestionBtn;

// Points par difficulté
const pointsPerCorrectAnswer = {
    1: 10,  // 10 points par bonne réponse au niveau 1
    2: 20,  // 20 points par bonne réponse au niveau 2
    3: 30   // 30 points par bonne réponse au niveau 3
};

// Pénalité par mauvaise réponse
const WRONG_ANSWER_PENALTY = 5;

// Fonction d'initialisation (OBLIGATOIRE)
function initGame() {
    console.log('Initialisation du mini-jeu Word Doors');
    
    // 1. Récupérer les références aux éléments DOM
    doorsContainer = document.getElementById('doors-container');
    currentWordElement = document.getElementById('current-word');
    scoreDisplay = document.getElementById('score-display');
    timerDisplay = document.getElementById('timer-display');
    progressBar = document.getElementById('progress-bar');
    nextQuestionBtn = document.getElementById('next-question-btn');
    
    // 2. Configurer l'état initial du jeu
    // Récupérer le niveau de difficulté depuis l'état du jeu
    difficultyLevel = window.GameTemplate?.gameState?.difficulty || 1;
    
    // 3. Ajouter les écouteurs d'événements
    nextQuestionBtn.addEventListener('click', nextQuestion);
    
    // 4. Charger les données du jeu
    loadIcons();
}

// Fonction pour charger les icônes/mots du jeu
function loadIcons() {
    console.log('Chargement des icônes...');
    
    // Utiliser la fonction fetchWithAuth du template si disponible
    const fetchFunc = window.fetchWithAuth || fetch;
    
    // Nombre d'icônes à charger (plus que nécessaire pour avoir des options diverses)
    const iconsToLoad = QUESTIONS_PER_GAME * 5;
    
    // Récupérer les icônes aléatoires de la base de données
    fetchFunc(`/api/icons/random?count=${iconsToLoad}&difficulty=${difficultyLevel}`)
        .then(res => {
            if (!res.ok) throw new Error('Erreur lors du chargement des icônes');
            return res.json();
        })
        .then(icons => {
            if (!icons || icons.length < QUESTIONS_PER_GAME) {
                throw new Error('Pas assez d\'icônes disponibles');
            }
            
            // Traiter les icônes reçues
            iconsCollection = icons.map(icon => {
                // Déterminer le mot anglais
                const englishWord = icon.englishWord || icon.EnglishWord || icon.description_en || 
                                  icon.filename.split('.')[0].replace(/_/g, ' ');
                
                return {
                    id: icon.id,
                    filename: icon.filename,
                    type: icon.type,
                    description: icon.description,
                    englishWord: englishWord,
                    // Le chemin d'accès à l'image
                    imagePath: `/assets/images/icons/${icon.filename}`
                };
            });
            
            // Démarrer le jeu
            startGame();
        })
        .catch(error => {
            console.error('Erreur:', error);
            currentWordElement.textContent = "Erreur de chargement";
            
            // Si les données sont manquantes, utiliser des données factices pour les tests
            if (window.GameTemplate?.isPreview) {
                console.log("Mode prévisualisation: utilisation de données de test");
                createTestData();
                startGame();
            }
        });
}

// Créer des données de test pour le mode prévisualisation
function createTestData() {
    iconsCollection = [
        { id: 1, englishWord: "apple", description: "pomme" },
        { id: 2, englishWord: "house", description: "maison" },
        { id: 3, englishWord: "car", description: "voiture" },
        { id: 4, englishWord: "tree", description: "arbre" },
        { id: 5, englishWord: "book", description: "livre" },
        { id: 6, englishWord: "dog", description: "chien" },
        { id: 7, englishWord: "cat", description: "chat" },
        { id: 8, englishWord: "sun", description: "soleil" },
        { id: 9, englishWord: "moon", description: "lune" },
        { id: 10, englishWord: "star", description: "étoile" },
        { id: 11, englishWord: "flower", description: "fleur" },
        { id: 12, englishWord: "bird", description: "oiseau" }
    ];
}

// Fonction de démarrage du jeu
function startGame() {
    console.log('Démarrage du jeu...');
    
    // Mélanger les icônes et prendre le nombre nécessaire pour le jeu
    const shuffledIcons = shuffleArray(iconsCollection);
    iconsCollection = shuffledIcons.slice(0, QUESTIONS_PER_GAME * 3); // Conserver plus d'icônes que nécessaire
    
    // Initialiser les variables
    currentQuestionIndex = 0;
    score = 0;
    waitingForNextQuestion = false;
    
    // Mettre à jour l'affichage du score
    scoreDisplay.textContent = score;
    
    // Mettre à jour la barre de progression
    updateProgressBar();
    
    // Enregistrer l'heure de début et démarrer le chronomètre
    gameStartTime = Date.now();
    currentGameTime = 0;
    startTimer();
    
    // Démarrer avec la première question
    showNextQuestion();
}

// Fonction pour démarrer le chronomètre
function startTimer() {
    // Afficher le temps initial
    updateTimerDisplay();
    
    // Démarrer le chronomètre
    timeInterval = setInterval(() => {
        currentGameTime++;
        updateTimerDisplay();
    }, 1000);
}

// Mettre à jour l'affichage du chronomètre
function updateTimerDisplay() {
    const minutes = Math.floor(currentGameTime / 60);
    const seconds = currentGameTime % 60;
    timerDisplay.textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Afficher la prochaine question
function showNextQuestion() {
    // Vérifier si toutes les questions ont été posées
    if (currentQuestionIndex >= QUESTIONS_PER_GAME) {
        endGameWithResults();
        return;
    }
    
    // Cacher le bouton "Question suivante"
    nextQuestionBtn.style.display = 'none';
    
    // Sélectionner une icône aléatoire parmi la collection
    const availableIcons = iconsCollection.filter(icon => 
        !icon.used || icon.used === false
    );
    
    if (availableIcons.length === 0) {
        endGameWithResults();
        return;
    }
    
    // Sélectionner une icône aléatoire
    const randomIndex = Math.floor(Math.random() * availableIcons.length);
    currentIcon = availableIcons[randomIndex];
    
    // Marquer l'icône comme utilisée
    currentIcon.used = true;
    
    // Mettre à jour le mot affiché sur le parchemin
    currentWordElement.textContent = currentIcon.englishWord;
    
    // Prononcer le mot automatiquement
    playCurrentWordSound();
    
    // Créer les portes
    createDoors();
    
    // Mettre à jour la barre de progression
    updateProgressBar();
    
    // Incrémentation du compteur de questions
    currentQuestionIndex++;
}

// Créer l'affichage des portes
function createDoors() {
    // Vider le conteneur des portes
    doorsContainer.innerHTML = '';
    
    // Déterminer aléatoirement quelle porte contient la bonne réponse
    const correctDoorIndex = Math.floor(Math.random() * DOORS_COUNT);
    
    // Créer les portes
    for (let i = 0; i < DOORS_COUNT; i++) {
        const doorElement = document.createElement('img');
        doorElement.src = CLOSED_DOOR_PATH;
        doorElement.alt = 'Porte fermée';
        doorElement.className = 'door';
        doorElement.dataset.index = i;
        doorElement.dataset.isCorrect = (i === correctDoorIndex).toString();
        
        // Ajouter un gestionnaire d'événement pour le clic
        doorElement.addEventListener('click', handleDoorClick);
        
        // Ajouter la porte au conteneur
        doorsContainer.appendChild(doorElement);
    }
}

// Gérer le clic sur une porte
function handleDoorClick(event) {
    // Si on attend déjà la prochaine question, ignorer
    if (waitingForNextQuestion) return;
    
    // Récupérer l'élément porte cliqué
    const doorElement = event.currentTarget;
    const isCorrect = doorElement.dataset.isCorrect === 'true';
    
    // Remplacer l'image de la porte en fonction de la réponse
    doorElement.src = isCorrect ? GOOD_DOOR_PATH : BAD_DOOR_PATH;
    
    if (isCorrect) {
        // Bonne réponse - ajouter des points selon le niveau
        score += pointsPerCorrectAnswer[difficultyLevel];
        playCorrectSound();
    } else {
        // Mauvaise réponse - retirer des points (sans aller en dessous de 0)
        score = Math.max(0, score - WRONG_ANSWER_PENALTY);
        playWrongSound();
        
        // Révéler la bonne porte
        const doors = doorsContainer.querySelectorAll('.door');
        doors.forEach(door => {
            if (door.dataset.isCorrect === 'true') {
                door.src = GOOD_DOOR_PATH;
            }
        });
    }
    
    // Mettre à jour l'affichage du score
    scoreDisplay.textContent = score;
    
    // Désactiver toutes les portes
    const doors = doorsContainer.querySelectorAll('.door');
    doors.forEach(door => {
        door.removeEventListener('click', handleDoorClick);
        door.style.cursor = 'default';
        
        // Si ce n'est pas la porte cliquée et ce n'est pas la bonne porte
        if (door !== doorElement && door.dataset.isCorrect !== 'true') {
            door.style.opacity = '0.5';
        }
    });
    
    // Attendre avant d'afficher le bouton pour la question suivante
    waitingForNextQuestion = true;
    setTimeout(() => {
        nextQuestionBtn.style.display = 'block';
    }, 1500);
}

// Fonction pour passer à la question suivante
function nextQuestion() {
    waitingForNextQuestion = false;
    showNextQuestion();
}

// Fonction pour jouer le son du mot actuel
function playCurrentWordSound() {
    // Arrêter toute prononciation en cours
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }
    
    // S'assurer qu'il y a un mot à prononcer
    if (!currentIcon || !currentIcon.englishWord) {
        return;
    }
    
    // Créer un nouvel objet de prononciation
    speechUtterance = new SpeechSynthesisUtterance(currentIcon.englishWord);
    speechUtterance.lang = 'en-US';
    speechUtterance.rate = 0.8; // Ralentir légèrement pour plus de clarté
    
    // Prononcer le mot
    speechSynthesis.speak(speechUtterance);
}

// Jouer un son pour une réponse correcte
function playCorrectSound() {
    // Utiliser l'API Audio si disponible dans le navigateur
    if (typeof Audio !== 'undefined') {
        const sound = new Audio('/assets/sounds/correct.mp3');
        sound.play().catch(e => console.log('Impossible de jouer le son:', e));
    }
}

// Jouer un son pour une réponse incorrecte
function playWrongSound() {
    if (typeof Audio !== 'undefined') {
        const sound = new Audio('/assets/sounds/wrong.mp3');
        sound.play().catch(e => console.log('Impossible de jouer le son:', e));
    }
}

// Mettre à jour la barre de progression
function updateProgressBar() {
    const progress = (currentQuestionIndex / QUESTIONS_PER_GAME) * 100;
    progressBar.style.width = `${progress}%`;
}

// Mélanger un tableau (algorithme de Fisher-Yates)
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Obtenir le score maximum possible
function getMaxPossibleScore() {
    return QUESTIONS_PER_GAME * pointsPerCorrectAnswer[difficultyLevel];
}

// Fonction pour terminer le jeu avec résultats (OBLIGATOIRE)
function endGameWithResults() {
    // 1. Arrêter les timers ou animations en cours
    clearInterval(timeInterval);
    
    // 2. Calculer le score final et le temps écoulé
    const finalScore = score;
    const maxScore = getMaxPossibleScore();
    const tempsEcoule = Math.ceil((Date.now() - gameStartTime) / 1000);
    
    // 3. Appeler la fonction endGame du template
    window.GameEnd.endGame({
        score: finalScore,         // Score obtenu
        maxScore: maxScore,        // Score maximum possible
        timeSpent: tempsEcoule     // Temps écoulé en secondes
    }, resetGame);
}

// Fonction de réinitialisation du jeu (OBLIGATOIRE)
function resetGame() {
    // Réinitialiser les variables
    currentQuestionIndex = 0;
    score = 0;
    waitingForNextQuestion = false;
    currentGameTime = 0;
    
    // Réinitialiser les icônes utilisées
    iconsCollection.forEach(icon => {
        icon.used = false;
    });
    
    // Mettre à jour l'affichage
    scoreDisplay.textContent = score;
    updateTimerDisplay();
    nextQuestionBtn.style.display = 'none';
    
    // Vider le conteneur des portes
    doorsContainer.innerHTML = '';
    
    // Démarrer une nouvelle partie
    gameStartTime = Date.now();
    startTimer();
    showNextQuestion();
}

// Initialiser le jeu lorsque la page est chargée
document.addEventListener('DOMContentLoaded', initGame);
