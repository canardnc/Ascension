// Variables du jeu
let score = 0;
let currentTour = 0;
let maxTours = 10;
let tableMin = 1;
let tableMax = 5;
let pointsPerCorrectAnswer = 10;
let difficultyLevel = 1;
let gameStartTime;
let currentX, currentY;
let usedCombinations = [];
let isAnimating = false;

// Éléments DOM
let chestGrid;
let questionContainer;
let answersContainer;

// Fonction d'initialisation (OBLIGATOIRE)
function initGame() {
    console.log('Initialisation du mini-jeu Tables de Multiplication');
    
    // 1. Récupérer les références aux éléments DOM
    chestGrid = document.getElementById('chest-grid');
    questionContainer = document.getElementById('question-container');
    answersContainer = document.getElementById('answers-container');
    
    // 2. Configurer la difficulté du jeu selon les paramètres
    if (window.GameTemplate && window.GameTemplate.gameState) {
        difficultyLevel = window.GameTemplate.gameState.difficulty || 1;
    }
    
    setupDifficulty(difficultyLevel);
    
    // 3. Configurer l'état initial du jeu
    score = 0;
    currentTour = 0;
    usedCombinations = [];
    
    // 4. Créer la grille de coffres
    createChestGrid();
    
    // 5. Commencer le jeu
    startGame();
}

// Configuration de la difficulté
function setupDifficulty(level) {
    switch(level) {
        case 1:
            tableMin = 2; // Commencer à 2 au lieu de 1
            tableMax = 5;
            pointsPerCorrectAnswer = 10;
            break;
        case 2:
            tableMin = 3;
            tableMax = 6;
            pointsPerCorrectAnswer = 20;
            break;
        case 3:
            tableMin = 4;
            tableMax = 9;
            pointsPerCorrectAnswer = 30;
            break;
        default:
            tableMin = 2; // Commencer à 2 au lieu de 1
            tableMax = 5;
            pointsPerCorrectAnswer = 10;
    }
}

// Création de la grille de coffres
function createChestGrid() {
    // Vider la grille existante
    chestGrid.innerHTML = '';
    
    // Définir le nombre de colonnes de la grille (tables + 1 pour les en-têtes de ligne)
    const columns = tableMax - tableMin + 2; // +1 pour l'espace des indices de ligne
    chestGrid.style.gridTemplateColumns = `repeat(${columns}, 60px)`;
    
    // Ajouter une cellule vide dans le coin supérieur gauche
    const emptyCell = document.createElement('div');
    chestGrid.appendChild(emptyCell);
    
    // Ajouter les en-têtes de colonne (numéros des tables)
    for (let x = tableMin; x <= tableMax; x++) {
        const tableHeader = document.createElement('div');
        tableHeader.className = 'table-header';
        tableHeader.textContent = x;
        chestGrid.appendChild(tableHeader);
    }
    
    // Créer les lignes avec en-têtes et coffres
    for (let y = 2; y <= 9; y++) { // Commencer à 2 au lieu de 1
        // En-tête de ligne
        const rowHeader = document.createElement('div');
        rowHeader.className = 'row-header';
        rowHeader.textContent = y;
        chestGrid.appendChild(rowHeader);
        
        // Coffres pour chaque table
        for (let x = tableMin; x <= tableMax; x++) {
            const chest = document.createElement('div');
            chest.className = 'chest';
            chest.dataset.x = x;
            chest.dataset.y = y;
            chest.style.backgroundImage = `url('/assets/images/chest.webp')`;
            
            // Ajouter l'élément pour afficher la valeur (initialement vide)
            const valueDisplay = document.createElement('div');
            valueDisplay.className = 'chest-value';
            chest.appendChild(valueDisplay);
            
            chestGrid.appendChild(chest);
        }
    }
}

// Fonction de démarrage du jeu
function startGame() {
    gameStartTime = Date.now();
    currentTour = 1;
    
    // Commencer le premier tour
    startNextTour();
}

// Démarrer un nouveau tour
function startNextTour() {
    if (currentTour > maxTours) {
        endGameWithResults();
        return;
    }
    
    // Sélectionner une combinaison aléatoire qui n'a pas encore été utilisée
    selectRandomCombination();
}

// Sélectionner une combinaison aléatoire
function selectRandomCombination() {
    if (isAnimating) return;
    isAnimating = true;
    
    // Animation de sélection aléatoire des coffres
    let animationCount = 0;
    const maxAnimations = 10;
    let animationInterval;
    let lastActiveChest = null;
    
    // Fonction pour activer un coffre aléatoire
    function activateRandomChest() {
        // Désactiver le coffre précédent s'il existe
        if (lastActiveChest && !lastActiveChest.classList.contains('answered')) {
            lastActiveChest.style.backgroundImage = `url('/assets/images/chest.webp')`;
        }
        
        // Sélectionner un coffre aléatoire dans la plage qui n'a pas encore été répondu
        let foundValidChest = false;
        let attempts = 0;
        let chest;
        
        while (!foundValidChest && attempts < 20) {
            const randomX = Math.floor(Math.random() * (tableMax - tableMin + 1)) + tableMin;
            const randomY = Math.floor(Math.random() * 8) + 2; // 2 à 9
            
            chest = document.querySelector(`.chest[data-x="${randomX}"][data-y="${randomY}"]:not(.answered)`);
            if (chest) {
                foundValidChest = true;
            }
            attempts++;
        }
        
        if (foundValidChest && chest) {
            chest.style.backgroundImage = `url('/assets/images/active_chest.webp')`;
            lastActiveChest = chest;
        }
        
        animationCount++;
        
        // Si l'animation est terminée, sélectionner la combinaison finale
        if (animationCount >= maxAnimations) {
            clearInterval(animationInterval);
            
            // Choisir une combinaison finale qui n'a pas encore été utilisée
            finalizeRandomCombination();
        }
    }
    
    // Démarrer l'animation
    animationInterval = setInterval(activateRandomChest, 200);
}

// Finaliser la sélection d'une combinaison aléatoire
function finalizeRandomCombination() {
    let attempts = 0;
    const maxAttempts = 50; // Pour éviter une boucle infinie si toutes les combinaisons sont utilisées
    let foundValidCombination = false;
    
    // Désactiver tous les coffres actifs qui n'ont pas encore été répondus
    document.querySelectorAll('.chest:not(.answered)').forEach(chest => {
        chest.style.backgroundImage = `url('/assets/images/chest.webp')`;
    });
    
    // Trouver une combinaison non utilisée
    while (!foundValidCombination && attempts < maxAttempts) {
        currentX = Math.floor(Math.random() * (tableMax - tableMin + 1)) + tableMin;
        currentY = Math.floor(Math.random() * 8) + 2; // 2 à 9
        attempts++;
        
        // Vérifier si la combinaison a déjà été utilisée
        if (!isUsedCombination(currentX, currentY)) {
            // Vérifier si le coffre existe et n'a pas encore été répondu
            const chest = document.querySelector(`.chest[data-x="${currentX}"][data-y="${currentY}"]:not(.answered)`);
            if (chest) {
                foundValidCombination = true;
                
                // Marquer cette combinaison comme utilisée
                usedCombinations.push(`${currentX},${currentY}`);
                
                // Activer le coffre sélectionné
                chest.style.backgroundImage = `url('/assets/images/active_chest.webp')`;
                
                // Afficher la question
                displayQuestion(currentX, currentY);
            }
        }
        
        // Si on a essayé trop de fois, vérifier s'il reste des combinaisons disponibles
        if (attempts >= maxAttempts) {
            // Vérifier s'il reste des coffres non répondus
            const remainingChests = document.querySelectorAll('.chest:not(.answered)');
            if (remainingChests.length > 0) {
                // Prendre le premier coffre non répondu
                const chest = remainingChests[0];
                currentX = parseInt(chest.dataset.x);
                currentY = parseInt(chest.dataset.y);
                
                usedCombinations.push(`${currentX},${currentY}`);
                chest.style.backgroundImage = `url('/assets/images/active_chest.webp')`;
                displayQuestion(currentX, currentY);
                foundValidCombination = true;
            } else {
                // Tous les coffres ont été répondus, terminer le jeu
                endGameWithResults();
                return;
            }
        }
    }
    
    isAnimating = false;
}

// Vérifier si une combinaison a déjà été utilisée
function isUsedCombination(x, y) {
    return usedCombinations.includes(`${x},${y}`);
}

// Afficher la question et les réponses possibles
function displayQuestion(x, y) {
    // Afficher la question
    questionContainer.textContent = `${x} × ${y} = ??`;
    
    // Préparer les réponses
    const correctAnswer = x * y;
    const answers = generatePossibleAnswers(x, y, correctAnswer);
    
    // Afficher les réponses
    answersContainer.innerHTML = '';
    answers.forEach(answer => {
        const answerElement = document.createElement('div');
        answerElement.className = 'answer-option';
        answerElement.textContent = answer;
        answerElement.dataset.value = answer;
        answerElement.addEventListener('click', () => checkAnswer(answer, correctAnswer));
        answersContainer.appendChild(answerElement);
    });
}

// Générer des réponses plausibles
function generatePossibleAnswers(x, y, correctAnswer) {
    const possibleAnswers = [correctAnswer];
    
    // Générer des réponses incorrectes plausibles
    while (possibleAnswers.length < 5) {
        // Perturbations possibles
        const perturbations = [
            (x + 1) * y, // x augmenté de 1
            (x - 1) * y, // x diminué de 1
            x * (y + 1), // y augmenté de 1
            x * (y - 1), // y diminué de 1
            (x + 1) * (y + 1), // les deux augmentés
            (x - 1) * (y - 1)  // les deux diminués
        ];
        
        // Sélectionner une perturbation aléatoire
        const randomPerturbation = perturbations[Math.floor(Math.random() * perturbations.length)];
        
        // Ajouter si elle n'est pas déjà dans les réponses
        if (!possibleAnswers.includes(randomPerturbation) && randomPerturbation > 0) {
            possibleAnswers.push(randomPerturbation);
        }
    }
    
    // Limiter à 5 réponses si on en a plus
    while (possibleAnswers.length > 5) {
        const randomIndex = Math.floor(Math.random() * possibleAnswers.length);
        if (possibleAnswers[randomIndex] !== correctAnswer) {
            possibleAnswers.splice(randomIndex, 1);
        }
    }
    
    // Mélanger les réponses
    return shuffleArray(possibleAnswers);
}

// Fonction pour mélanger un tableau
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Vérifier la réponse du joueur
function checkAnswer(userAnswer, correctAnswer) {
    userAnswer = parseInt(userAnswer);
    const isCorrect = userAnswer === correctAnswer;
    
    // Trouver l'élément de réponse sélectionné
    const selectedAnswer = document.querySelector(`.answer-option[data-value="${userAnswer}"]`);
    
    // Trouver le coffre actif
    const activeChest = document.querySelector(`.chest[data-x="${currentX}"][data-y="${currentY}"]`);
    const valueDisplay = activeChest.querySelector('.chest-value');
    
    // Marquer le coffre comme ayant reçu une réponse
    activeChest.classList.add('answered');
    
    if (isCorrect) {
        // Marquer la réponse comme correcte
        const marker = document.createElement('div');
        marker.className = 'correct-marker';
        marker.textContent = '✓';
        selectedAnswer.appendChild(marker);
        
        // Changer l'apparence du coffre
        activeChest.style.backgroundImage = `url('/assets/images/gold_chest.webp')`;
        valueDisplay.textContent = correctAnswer;
        valueDisplay.className = 'chest-value gold-text';
        
        // Ajouter des points
        score += pointsPerCorrectAnswer;
        updatetopbar_score(score);
    } else {
        // Marquer la réponse comme incorrecte
        const marker = document.createElement('div');
        marker.className = 'incorrect-marker';
        marker.textContent = '✗';
        selectedAnswer.appendChild(marker);
        
        // Changer l'apparence du coffre
        activeChest.style.backgroundImage = `url('/assets/images/empty_chest.webp')`;
        valueDisplay.textContent = correctAnswer;
        valueDisplay.className = 'chest-value red-text';
        
        // Soustraire des points (sans passer en négatif)
        score = Math.max(0, score - 10);
        updatetopbar_score(score);
    }
    
    // Désactiver les clics sur les réponses
    document.querySelectorAll('.answer-option').forEach(option => {
        option.style.pointerEvents = 'none';
    });
    
    // Attendre avant de passer au tour suivant
    setTimeout(() => {
        currentTour++;
        // Effacer la question et les réponses
        questionContainer.textContent = '';
        answersContainer.innerHTML = '';
        // Passer au tour suivant
        startNextTour();
    }, isCorrect ? 1000 : 3000);
}

// Fonction pour terminer le jeu (OBLIGATOIRE)
function endGameWithResults() {
    // 1. Arrêter les timers ou animations en cours
    isAnimating = false;
    
    // 2. Calculer le score final et le temps écoulé
    const timeSpent = Math.ceil((Date.now() - gameStartTime) / 1000);
    const maxScore = maxTours * pointsPerCorrectAnswer;
    
    // 3. Appeler la fonction endGame du template
    if (window.GameEnd && window.GameEnd.endGame) {
        window.GameEnd.endGame({
            score: score,
            maxScore: maxScore,
            timeSpent: timeSpent
        }, resetGame);
    } else {
        console.log('Fin du jeu - Score:', score, 'Max possible:', maxScore, 'Temps:', timeSpent);
    }
}

// Fonction de réinitialisation du jeu (OBLIGATOIRE)
function resetGame() {
    // Réinitialiser les variables
    score = 0;
    currentTour = 0;
    usedCombinations = [];
    
    // Réinitialiser l'affichage
    questionContainer.textContent = '';
    answersContainer.innerHTML = '';
    
    // Recréer la grille
    createChestGrid();
    
    // Redémarrer le jeu
    startGame();
}