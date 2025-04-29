// Variables du jeu
let gameState = {
    score: 0,
    maxScore: 0,
    currentProblem: 0,
    totalProblems: 10,
    errors: 0,
    errorsByProblem: 0,
    startTime: null,
    elapsedTime: 0,
    problems: [],
    currentAnswers: [],
    difficulty: 1
};

// Nouvelle variable pour le système de clic-clic
let selectedGemValue = null;

// Éléments DOM
let rowsContainer;
let draggableGemsContainer;

// Constantes
const POINTS_BY_LEVEL = { 1: 10, 2: 20, 3: 30 };
const ERROR_PENALTY = 5;

// Fonction d'initialisation
function initGame() {
    console.log('Initialisation du jeu d\'addition');
    rowsContainer = document.querySelector('.rows-container');
    draggableGemsContainer = document.getElementById('draggable-gems');
    
    if (window.GameTemplate && window.GameTemplate.gameState) {
        gameState.difficulty = window.GameTemplate.gameState.difficulty || 1;
    }
    gameState.maxScore = gameState.totalProblems * POINTS_BY_LEVEL[gameState.difficulty];
    gameState.problems = generateProblems(gameState.difficulty);
    resetGame();
    startGame();
}

function startGame() {
    console.log('Démarrage du jeu');
    gameState.score = 0;
    updatetopbar_score(0);
    gameState.currentProblem = 0;
    gameState.startTime = Date.now();
    setupProblem();
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateProblems(difficulty) {
    const problems = [];
    for (let i = 0; i < gameState.totalProblems; i++) {
        let problem = { numbers: [], answer: [] };
        if (difficulty === 1) {
            const num1 = getRandomNumber(0, 9);
            const num2 = getRandomNumber(0, 9);
            problem.numbers = [[num1], [num2]];
            const sum = num1 + num2;
            problem.answer = sum < 10 ? [sum] : [1, sum % 10];
        } else if (difficulty === 2) {
            const num1 = getRandomNumber(1, 9999);
            const num2 = getRandomNumber(1, 9999);
            problem.numbers = [
                num1.toString().padStart(4, '0').split('').map(Number),
                num2.toString().padStart(4, '0').split('').map(Number)
            ];
            const sum = num1 + num2;
            problem.answer = sum.toString().padStart(5, '0').split('').map(Number);
            while (problem.answer[0] === 0 && problem.answer.length > 1) {
                problem.answer.shift();
            }
        } else if (difficulty === 3) {
            const num1 = getRandomNumber(1, 999999);
            const num2 = getRandomNumber(1, 999999);
            const num3 = getRandomNumber(1, 999999);
            problem.numbers = [
                num1.toString().padStart(6, '0').split('').map(Number),
                num2.toString().padStart(6, '0').split('').map(Number),
                num3.toString().padStart(6, '0').split('').map(Number)
            ];
            const sum = num1 + num2 + num3;
            problem.answer = sum.toString().padStart(7, '0').split('').map(Number);
            while (problem.answer[0] === 0 && problem.answer.length > 1) {
                problem.answer.shift();
            }
        }
        problem.carries = computeCarries(problem.numbers, problem.answer);

        problems.push(problem);
    }

    return problems;
}

function computeCarries(numbers, answer) {
    const maxLen = Math.max(...numbers.map(n => n.length));
    const paddedNumbers = numbers.map(n => Array(maxLen - n.length).fill(0).concat(n));

    // On aura maxLen-1 retenues car la colonne des unités ne produit pas de retenue visible
    const carries = new Array(maxLen - 1).fill(0);

    let carry = 0;
    for (let i = maxLen - 1; i >= 0; i--) {
        // Somme des chiffres de la colonne actuelle + la retenue précédente
        const columnSum = paddedNumbers.reduce((acc, num) => acc + num[i], 0) + carry;
        
        // La retenue est le nombre divisé par 10 et arrondi à l'entier inférieur
        carry = Math.floor(columnSum / 10);
        
        // On stocke la retenue pour la colonne à gauche
        // Mais pas pour la dernière itération (i=0) car il n'y a pas de colonne plus à gauche
        if (i > 0) {
            // i-1 correspond à la position de la colonne qui recevra cette retenue
            carries[i-1] = carry;
        }
    }

    return carries;
}

function createProblemLayout(problem) {
    rowsContainer.innerHTML = '';
    const difficultyLevel = gameState.difficulty;
    const numRows = difficultyLevel === 1 ? 3 : (difficultyLevel === 2 ? 4 : 5);
    const numNumberRows = difficultyLevel === 3 ? 3 : 2;
    const maxWidth = Math.max(...problem.numbers.map(arr => arr.length));

    if (difficultyLevel > 1) {
        const carryRow = document.createElement('div');
        carryRow.className = 'row carries-row';
        
        // Ajouter un slot vide pour s'aligner avec la première colonne (qui contient un slot vide)
        const emptySlot = document.createElement('div');
        emptySlot.className = 'gem-slot empty-slot';
        emptySlot.style.visibility = 'hidden';
        carryRow.appendChild(emptySlot);
        
        // Créer les slots de retenue alignés avec les colonnes de chiffres SAUF la dernière colonne (unités)
        for (let i = 0; i < maxWidth - 1; i++) {
            const slot = document.createElement('div');
            slot.className = 'gem-slot carry-slot';
            // Les retenues sont décalées d'une position vers la gauche par rapport aux chiffres
            // Car la retenue de la colonne i+1 affecte la colonne i
            slot.dataset.position = i;
            slot.dataset.row = 0;
            slot.dataset.droppable = 'true';
            carryRow.appendChild(slot);
        }
        
        // Ajouter un slot vide à la place de la dernière position (unités)
        // car il n'y a jamais de retenue pour les unités
        const lastEmptySlot = document.createElement('div');
        lastEmptySlot.className = 'gem-slot empty-slot';
        lastEmptySlot.style.visibility = 'hidden';
        carryRow.appendChild(lastEmptySlot);
        
        rowsContainer.appendChild(carryRow);
    }

    for (let i = 0; i < numNumberRows; i++) {
        const row = document.createElement('div');
        row.className = 'row number-row';
        const emptySlot = document.createElement('div');
        emptySlot.className = 'gem-slot empty-slot';
        emptySlot.style.visibility = 'hidden';
        row.appendChild(emptySlot);

        const numberArray = problem.numbers[i] || [];
        const paddedArray = numberArray.length < maxWidth 
            ? Array(maxWidth - numberArray.length).fill(0).concat(numberArray)
            : numberArray;

        for (let j = 0; j < maxWidth; j++) {
            const slot = document.createElement('div');
            slot.className = 'gem-slot number-slot';
            slot.dataset.position = j;
            slot.dataset.row = difficultyLevel === 1 ? i : i + 1;

            const num = paddedArray[j] || 0;
            const gem = document.createElement('div');
            gem.className = 'gem';
            gem.style.backgroundImage = `url('/assets/images/gem_${num}.webp')`;
            gem.dataset.value = num;

            const gemNumber = document.createElement('div');
            gemNumber.className = 'gem-number';
            gemNumber.textContent = num;
            gem.appendChild(gemNumber);

            slot.appendChild(gem);
            row.appendChild(slot);
        }
        rowsContainer.appendChild(row);
    }

    const answerRow = document.createElement('div');
    answerRow.className = 'row answer-row';
    const firstSlot = document.createElement('div');
    firstSlot.className = 'gem-slot answer-slot';
    firstSlot.dataset.position = 0;
    firstSlot.dataset.row = numRows - 1;
    firstSlot.dataset.droppable = 'true';
    answerRow.appendChild(firstSlot);

    for (let i = 0; i < maxWidth; i++) {
        const slot = document.createElement('div');
        slot.className = 'gem-slot answer-slot';
        slot.dataset.position = i + 1;
        slot.dataset.row = numRows - 1;
        slot.dataset.droppable = 'true';
        answerRow.appendChild(slot);
    }
    rowsContainer.appendChild(answerRow);

    gameState.currentAnswers = Array(maxWidth + 1).fill(null);
}

// Nouvelle fonction pour gérer la sélection des gemmes par clic
function handleGemSelection(e) {
    // Désélectionne toutes les gemmes
    document.querySelectorAll('.draggable-gem').forEach(gem => {
        gem.classList.remove('selected');
    });
    
    // Sélectionne cette gemme
    selectedGemValue = parseInt(e.currentTarget.dataset.value);
    e.currentTarget.classList.add('selected');
    
    console.log("🔄 Gemme sélectionnée avec valeur:", selectedGemValue);
}

// Nouvelle fonction pour gérer le clic sur un emplacement
function handleSlotClick(e) {
    if (selectedGemValue === null) {
        return; // Aucune gemme sélectionnée
    }
    
    let targetSlot = e.target;
    if (!targetSlot.classList.contains('gem-slot')) {
        targetSlot = e.target.closest('.gem-slot');
    }
    
    if (!targetSlot || targetSlot.dataset.droppable !== 'true') {
        console.log("❌ Pas de slot valide pour le clic");
        return;
    }
    
    const position = parseInt(targetSlot.dataset.position);
    const row = parseInt(targetSlot.dataset.row);
    console.log("🎯 Slot cible position:", position, "row:", row);
    
    // Nettoyer uniquement l'ancienne gemme
    const existingGem = targetSlot.querySelector('.gem');
    if (existingGem) {
        existingGem.remove();
    }
    
    // Ajouter la nouvelle gemme
    const gem = document.createElement('div');
    gem.className = 'gem';
    gem.style.backgroundImage = `url('/assets/images/gem_${selectedGemValue}.webp')`;
    gem.dataset.value = selectedGemValue;
    
    const gemNumber = document.createElement('div');
    gemNumber.className = 'gem-number';
    gemNumber.textContent = selectedGemValue;
    gem.appendChild(gemNumber);
    
    targetSlot.appendChild(gem);
    
    // Mise à jour des réponses uniquement pour les réponses finales
    if (targetSlot.classList.contains('answer-slot')) {
        gameState.currentAnswers[position] = selectedGemValue;
        
        const isCorrect = isAnswerCorrect(position, selectedGemValue);
        
        if (isCorrect) {
            targetSlot.style.backgroundImage = `url('/assets/images/good_gem_slot.webp')`;
        } else {
            targetSlot.style.backgroundImage = `url('/assets/images/bad_gem_slot.webp')`;
            
            gameState.errors++;
            gameState.errorsByProblem++;
            gameState.score = Math.max(0, gameState.score - ERROR_PENALTY);
            updatetopbar_score(gameState.score);
        }
    }
    
    // Vérifier les retenues aussi
    if (targetSlot.classList.contains('carry-slot')) {
        const isCorrectCarry = isCarryCorrect(position, selectedGemValue);
        
        if (isCorrectCarry) {
            targetSlot.style.backgroundImage = `url('/assets/images/good_gem_slot.webp')`;
        } else {
            targetSlot.style.backgroundImage = `url('/assets/images/bad_gem_slot.webp')`;
        }
    }
    
    // Réinitialiser la sélection
    selectedGemValue = null;
    document.querySelectorAll('.draggable-gem').forEach(gem => {
        gem.classList.remove('selected');
    });
    
    checkCompletion();
}

// Création des gemmes cliquables au lieu de glissables
function createDraggableGems() {
    draggableGemsContainer.innerHTML = '';
    for (let i = 0; i <= 9; i++) {
        const gem = document.createElement('div');
        gem.className = 'draggable-gem';
        gem.style.backgroundImage = `url('/assets/images/gem_${i}.webp')`;
        gem.dataset.value = i;
        
        const gemNumber = document.createElement('div');
        gemNumber.className = 'gem-number';
        gemNumber.textContent = i;
        gem.appendChild(gemNumber);
        
        // Utiliser un clic au lieu du glisser-déposer
        gem.addEventListener('click', handleGemSelection);
        draggableGemsContainer.appendChild(gem);
    }
}

// Ajouter les écouteurs de clic sur les emplacements
function setupSlotListeners() {
    document.querySelectorAll('.gem-slot[data-droppable="true"]').forEach(slot => {
        slot.addEventListener('click', handleSlotClick);
    });
}

function isCarryCorrect(position, value) {
    const currentProblem = gameState.problems[gameState.currentProblem];
    const carries = currentProblem.carries || [];

    // Vérifier si on a des données de retenues (carries)
    if (position >= 0 && position < carries.length) {
        return carries[position] === value;
    }
    // Si pas de donnée, considérer que la retenue devrait être 0
    return value === 0;
}

function isAnswerCorrect(position, value) {
    const currentProblem = gameState.problems[gameState.currentProblem];
    const correctAnswer = currentProblem.answer;

    const totalSlots = gameState.currentAnswers.length; // nombre de cases de réponse affichées
    const startOffset = totalSlots - correctAnswer.length;

    const answerIndex = position - startOffset;

    if (answerIndex < 0) {
        return value === 0; // cases de gauche non utilisées : attend un 0
    }
    if (answerIndex >= correctAnswer.length) {
        return false;
    }
    return value === correctAnswer[answerIndex];
}

function checkCompletion() {
    const answerSlots = document.querySelectorAll('.answer-slot');
    let allCorrect = true;
    let allFilled = true;

    answerSlots.forEach((slot, index) => {
        const gem = slot.querySelector('.gem');
        if (!gem) {
            allFilled = false;
            return;
        }
        const value = parseInt(gem.dataset.value);
        if (!isAnswerCorrect(index, value)) {
            allCorrect = false;
        }
    });

    if (allCorrect && allFilled) {
        answerSlots.forEach(slot => {
            slot.style.backgroundImage = `url('/assets/images/good_gem_slot.webp')`;
        });
        setTimeout(() => {
            nextProblem();
        }, 2000);
    }
}

function nextProblem() {
    const pointsForLevel = POINTS_BY_LEVEL[gameState.difficulty];
    const penaltyPoints = Math.min(gameState.errorsByProblem * ERROR_PENALTY, pointsForLevel);
    const pointsAwarded = Math.max(0, pointsForLevel - penaltyPoints);

    console.log(`Problème terminé - Score de base: ${pointsForLevel}, Erreurs: ${gameState.errorsByProblem}, Pénalité: ${penaltyPoints}, Points accordés: ${pointsAwarded}`);

    gameState.score += pointsAwarded;
    updatetopbar_score(gameState.score);

    gameState.errorsByProblem = 0; // reset pour prochain problème
    gameState.currentProblem++;

    if (gameState.currentProblem >= gameState.totalProblems) {
        endGameWithResults();
        return;
    }
    setupProblem();
}

function setupProblem() {
    const currentProblem = gameState.problems[gameState.currentProblem];
    createProblemLayout(currentProblem);
    createDraggableGems();
    setupSlotListeners();
}

function endGameWithResults() {
    console.log('Fin du jeu');
    const endTime = Date.now();
    const elapsedSeconds = Math.ceil((endTime - gameState.startTime) / 1000);
    window.GameEnd.endGame({
        score: gameState.score,
        maxScore: gameState.maxScore,
        timeSpent: elapsedSeconds
    }, resetGame);
}

function resetGame() {
    console.log('Réinitialisation');
    gameState.score = 0;
    gameState.currentProblem = 0;
    gameState.errors = 0;
    gameState.errorsByProblem = 0;
    gameState.currentAnswers = [];
    rowsContainer.innerHTML = '';
    draggableGemsContainer.innerHTML = '';
    selectedGemValue = null; // Réinitialiser la valeur de gemme sélectionnée
    gameState.problems = generateProblems(gameState.difficulty);
}