// Variables du jeu
let currentRound = 0;
let totalRounds = 10;
let score = 0;
let vocabularyData = [];
let currentWord = null;
let selectedWords = [];
let correctImageIndex = -1;
let canClick = true;
let difficultyLevel = 1;
let pointsPerCorrectAnswer = 10;
let gameStartTime;
let audioPlayer;

// Éléments DOM
let englishWordElement;
let speakerButton;
let optionsContainer;
let skullOverlay;

// Fonction d'initialisation (OBLIGATOIRE)
function initGame() {
    console.log('Initialisation du mini-jeu de vocabulaire');
    
    // 1. Récupérer les références aux éléments DOM
    englishWordElement = document.getElementById('englishWord');
    speakerButton = document.getElementById('speakerButton');
    optionsContainer = document.getElementById('optionsContainer');
    skullOverlay = document.getElementById('skullOverlay');
    
    // 2. Configurer l'état initial du jeu
    // Récupérer le niveau de difficulté depuis GameTemplate
    if (window.GameTemplate && window.GameTemplate.gameState) {
        difficultyLevel = window.GameTemplate.gameState.difficultyLevel || 1;
    }
    
    // Définir les points par bonne réponse selon la difficulté
    switch (difficultyLevel) {
        case 1:
            pointsPerCorrectAnswer = 10;
            break;
        case 2:
            pointsPerCorrectAnswer = 20;
            break;
        case 3:
            pointsPerCorrectAnswer = 30;
            break;
        default:
            pointsPerCorrectAnswer = 10;
    }
    
    // 3. Initialiser le lecteur audio
    initAudioPlayer();
    
    // 4. Ajouter les écouteurs d'événements
    speakerButton.addEventListener('click', () => {
        if (currentWord) {
            playWordAudio(currentWord.id);
        }
    });
    
    // 5. Charger les données de vocabulaire et démarrer le jeu
    loadVocabularyData();
}

// Initialisation du lecteur audio
function initAudioPlayer() {
    // Créer un élément audio qui sera réutilisé pour jouer tous les sons
    audioPlayer = new Audio();
}

// Fonction pour charger les données de vocabulaire depuis l'API
async function loadVocabularyData() {
    try {
        console.log('Tentative de récupération des données...');
        
        // Vérifier si les fonctions et variables du template sont disponibles
        if (typeof fetchWithAuth === 'undefined') {
            console.error('Les fonctions du template ne sont pas disponibles');
            throw new Error('Template API unavailable');
        }
        
        // Utiliser fetchWithAuth qui gère automatiquement le token
        const apiUrl = '/api/vocabulary?difficulty=' + difficultyLevel;
        console.log('Calling API with URL:', apiUrl);
        
        // fetchWithAuth renvoie directement les données JSON
        vocabularyData = await fetchWithAuth(apiUrl);
        console.log('Données reçues:', vocabularyData);
        
        if (!Array.isArray(vocabularyData) || vocabularyData.length < 5) {
            console.error('Pas assez de données de vocabulaire disponibles');
            useTestData();
            return;
        }
        
        startGame();
    } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        // En cas d'erreur, utiliser les données de test
        useTestData();
    }
}

// Fonction pour utiliser des données de test
function useTestData() {
    // Simulation de données pour tests - à remplacer par les vraies données
    vocabularyData = [
        { id: 1, filename: "apple.png", type: "noun", description: "pomme", description_en: "apple", difficulty: difficultyLevel },
        { id: 2, filename: "banana.png", type: "noun", description: "banane", description_en: "banana", difficulty: difficultyLevel },
        { id: 3, filename: "cat.png", type: "noun", description: "chat", description_en: "cat", difficulty: difficultyLevel },
        { id: 4, filename: "dog.png", type: "noun", description: "chien", description_en: "dog", difficulty: difficultyLevel },
        { id: 5, filename: "elephant.png", type: "noun", description: "éléphant", description_en: "elephant", difficulty: difficultyLevel },
        { id: 6, filename: "fish.png", type: "noun", description: "poisson", description_en: "fish", difficulty: difficultyLevel },
        { id: 7, filename: "giraffe.png", type: "noun", description: "girafe", description_en: "giraffe", difficulty: difficultyLevel },
        { id: 8, filename: "house.png", type: "noun", description: "maison", description_en: "house", difficulty: difficultyLevel },
        { id: 9, filename: "ice_cream.png", type: "noun", description: "glace", description_en: "ice cream", difficulty: difficultyLevel },
        { id: 10, filename: "jacket.png", type: "noun", description: "veste", description_en: "jacket", difficulty: difficultyLevel },
        { id: 11, filename: "kite.png", type: "noun", description: "cerf-volant", description_en: "kite", difficulty: difficultyLevel },
        { id: 12, filename: "lion.png", type: "noun", description: "lion", description_en: "lion", difficulty: difficultyLevel },
        { id: 13, filename: "monkey.png", type: "noun", description: "singe", description_en: "monkey", difficulty: difficultyLevel },
        { id: 14, filename: "nest.png", type: "noun", description: "nid", description_en: "nest", difficulty: difficultyLevel },
        { id: 15, filename: "orange.png", type: "noun", description: "orange", description_en: "orange", difficulty: difficultyLevel }
    ];
    
    startGame();
}

// Fonction de démarrage du jeu
function startGame() {
    // Réinitialiser le jeu
    currentRound = 0;
    score = 0;
    selectedWords = [];
    
    // Démarrer le chronomètre
    gameStartTime = Date.now();
    
    // Mettre à jour le score initial
    updatetopbar_score(score);
    
    // Démarrer le premier tour
    nextRound();
}

// Fonction pour passer au tour suivant
function nextRound() {
    // Vérifier si on a atteint la fin du jeu
    if (currentRound >= totalRounds) {
        endGameWithResults();
        return;
    }
    
    currentRound++;
    canClick = true;
    
    // Réinitialiser l'affichage
    skullOverlay.style.backgroundSize = '0%';
    
    // Sélectionner un mot au hasard qui n'a pas encore été utilisé
    let availableWords = vocabularyData.filter(word => !selectedWords.includes(word.id));
    
    // Si on a épuisé tous les mots, on réinitialise la liste
    if (availableWords.length === 0) {
        selectedWords = [];
        availableWords = vocabularyData;
    }
    
    // Choisir un mot aléatoire
    const randomIndex = Math.floor(Math.random() * availableWords.length);
    currentWord = availableWords[randomIndex];
    selectedWords.push(currentWord.id);
    
    // Afficher le mot en anglais
    englishWordElement.textContent = currentWord.description_en;
    
    // Lire le mot automatiquement
    setTimeout(() => {
        playWordAudio(currentWord.id);
    }, 1500); // Délai de 1,5 secondes comme dans la version originale
    
    // Générer les options
    generateOptions();
}

// Fonction pour jouer l'audio d'un mot basé sur son ID
function playWordAudio(wordId) {
    // Arrêter toute lecture en cours
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    
    // Construire le chemin du fichier audio
    const audioPath = `/assets/images/vocabulary/english_${wordId}.mp3`;
    
    // Définir la source du lecteur audio
    audioPlayer.src = audioPath;
    
    // Gérer les erreurs de chargement
    audioPlayer.onerror = function() {
        console.error('Erreur lors du chargement du fichier audio:', audioPath);
    };
    
    // Jouer l'audio
    audioPlayer.play().catch(error => {
        console.error('Erreur lors de la lecture du fichier audio:', error);
    });
}

// Fonction pour générer les options d'images
function generateOptions() {
    // Vider le conteneur d'options
    optionsContainer.innerHTML = '';
    
    // Créer un tableau avec l'image correcte et 4 images incorrectes
    const correctImage = currentWord;
    let incorrectImages = vocabularyData
        .filter(item => item.id !== currentWord.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 4);
    
    let allOptions = [correctImage, ...incorrectImages];
    
    // Mélanger les options
    allOptions = shuffleArray(allOptions);
    
    // Trouver l'index de la bonne réponse
    correctImageIndex = allOptions.findIndex(item => item.id === currentWord.id);
    
    // Créer les éléments d'option
    allOptions.forEach((option, index) => {
        // Créer l'élément d'option
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.dataset.index = index;
        
        // Choisir une fiole aléatoire comme fond
        const flaskNumber = Math.floor(Math.random() * 10) + 1;
        
        // Créer l'image de la fiole
        const flaskImage = document.createElement('img');
        flaskImage.src = `/assets/images/flask_${flaskNumber}.webp`;
        flaskImage.alt = 'Flask';
        flaskImage.className = 'flask-image';
        
        // Créer l'image du vocabulaire
        const vocabImage = document.createElement('img');
        vocabImage.src = `/assets/images/vocabulary/${option.filename}`;
        vocabImage.alt = option.description;
        vocabImage.className = 'vocabulary-image';
        
        // Créer l'icône de feedback (check ou crâne)
        const feedbackIcon = document.createElement('img');
        feedbackIcon.className = 'feedback-icon';
        
        // Ajouter les images à l'option
        optionElement.appendChild(flaskImage);
        optionElement.appendChild(vocabImage);
        optionElement.appendChild(feedbackIcon);
        
        // Ajouter l'événement de clic
        optionElement.addEventListener('click', () => handleOptionClick(index));
        
        // Ajouter l'option au conteneur
        optionsContainer.appendChild(optionElement);
    });
}

// Fonction pour gérer le clic sur une option
function handleOptionClick(index) {
    // Vérifier si le joueur peut cliquer
    if (!canClick) return;
    
    // Désactiver les clics pendant l'animation
    canClick = false;
    
    // Vérifier si la réponse est correcte
    const isCorrect = index === correctImageIndex;
    
    if (isCorrect) {
        // Bonne réponse
        score += pointsPerCorrectAnswer;
        updatetopbar_score(score);
        
        // Afficher le check vert
        const feedbackIcon = optionsContainer.children[index].querySelector('.feedback-icon');
        feedbackIcon.src = '/assets/images/check.webp';
        feedbackIcon.style.opacity = '1';
        
        // Passer au tour suivant après un délai
        setTimeout(() => {
            nextRound();
        }, 1000);
    } else {
        // Mauvaise réponse
        score = Math.max(0, score - 5); // Éviter un score négatif
        updatetopbar_score(score);
        
        // Récupérer l'élément sélectionné et l'icône de feedback
        const selectedOption = optionsContainer.children[index];
        const feedbackIcon = selectedOption.querySelector('.feedback-icon');
        
        // Afficher et animer le crâne directement sur l'option incorrecte
        feedbackIcon.src = '/assets/images/skull.webp';
        feedbackIcon.style.opacity = '1';
        feedbackIcon.style.transition = 'opacity 0.3s, transform 0.5s';
        feedbackIcon.style.transform = 'scale(2)';
        
        // Afficher le check sur la bonne réponse
        const correctOption = optionsContainer.children[correctImageIndex];
        const correctFeedback = correctOption.querySelector('.feedback-icon');
        correctFeedback.src = '/assets/images/check.webp';
        correctFeedback.style.opacity = '1';
        
        // Passer au tour suivant après l'animation
        setTimeout(() => {
            // Réinitialiser les styles avant de passer au tour suivant
            feedbackIcon.style.transform = 'scale(1)';
            nextRound();
        }, 1500);
    }
}

// Fonction pour mélanger un tableau (algorithme de Fisher-Yates)
function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    
    // Tant qu'il reste des éléments à mélanger
    while (currentIndex !== 0) {
        // Choisir un élément restant
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        
        // Et l'échanger avec l'élément actuel
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    
    return array;
}

// Fonction pour terminer le jeu (OBLIGATOIRE)
function endGameWithResults() {
    // Calculer le temps écoulé
    const timeSpent = Math.ceil((Date.now() - gameStartTime) / 1000);
    
    // Appeler la fonction endGame du template
    window.GameEnd.endGame({
        score: score,
        maxScore: totalRounds * pointsPerCorrectAnswer,
        timeSpent: timeSpent
    }, resetGame);
}

// Fonction de réinitialisation du jeu (OBLIGATOIRE)
function resetGame() {
    // Réinitialiser les variables
    currentRound = 0;
    score = 0;
    selectedWords = [];
    
    // Réinitialiser l'affichage
    skullOverlay.style.backgroundSize = '0%';
    
    // Recommencer le jeu
    startGame();
}