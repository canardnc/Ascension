// --- Début script.js corrigé ---

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

// Éléments DOM
let rowsContainer;
let draggableGemsContainer;
let progressBar;

// Constantes
const POINTS_BY_LEVEL = { 1: 10, 2: 20, 3: 30 };
const ERROR_PENALTY = 5;

// Fonction d'initialisation
function initGame() {
    console.log('Initialisation du jeu d\'addition');
    rowsContainer = document.querySelector('.rows-container');
    draggableGemsContainer = document.getElementById('draggable-gems');
    progressBar = document.getElementById('progress');
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
    progressBar.style.width = '0%';
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
        problems.push(problem);
    }
    return problems;
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
        const emptySlot = document.createElement('div');
        emptySlot.className = 'gem-slot empty-slot';
        emptySlot.style.visibility = 'hidden';
        carryRow.appendChild(emptySlot);
        for (let i = 0; i < maxWidth; i++) {
            const slot = document.createElement('div');
            slot.className = 'gem-slot carry-slot';
            slot.dataset.position = i;
            slot.dataset.row = 0;
            slot.dataset.droppable = 'true';
            slot.addEventListener('dragover', handleDragOver);
            slot.addEventListener('drop', handleDrop);
            carryRow.appendChild(slot);
        }
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
    firstSlot.addEventListener('dragover', handleDragOver);
    firstSlot.addEventListener('drop', handleDrop);
    answerRow.appendChild(firstSlot);

    for (let i = 0; i < maxWidth; i++) {
        const slot = document.createElement('div');
        slot.className = 'gem-slot answer-slot';
        slot.dataset.position = i + 1;
        slot.dataset.row = numRows - 1;
        slot.dataset.droppable = 'true';
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('drop', handleDrop);
        answerRow.appendChild(slot);
    }
    rowsContainer.appendChild(answerRow);

    gameState.currentAnswers = Array(maxWidth + 1).fill(null);
}

function createDraggableGems() {
    draggableGemsContainer.innerHTML = '';
    for (let i = 0; i <= 9; i++) {
        const gem = document.createElement('div');
        gem.className = 'draggable-gem';
        gem.style.backgroundImage = `url('/assets/images/gem_${i}.webp')`;
        gem.dataset.value = i;
        gem.draggable = true;
        const gemNumber = document.createElement('div');
        gemNumber.className = 'gem-number';
        gemNumber.textContent = i;
        gem.appendChild(gemNumber);
        gem.addEventListener('dragstart', handleDragStart);
        draggableGemsContainer.appendChild(gem);
    }
}

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.value);
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    if (e.target.dataset.droppable === 'true') {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }
}

function handleDrop(e) {
    e.preventDefault();
    const value = parseInt(e.dataTransfer.getData('text/plain'));
    console.log("===> Drop d'une gemme avec valeur:", value);

    let targetSlot = e.target;
    if (!targetSlot.classList.contains('gem-slot')) {
        targetSlot = e.target.closest('.gem-slot');
    }
    if (!targetSlot || targetSlot.dataset.droppable !== 'true') {
        console.log("❌ Pas de slot valide pour le drop");
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
    gem.style.backgroundImage = `url('/assets/images/gem_${value}.webp')`;
    gem.dataset.value = value;
    gem.draggable = false;

    const gemNumber = document.createElement('div');
    gemNumber.className = 'gem-number';
    gemNumber.textContent = value;
    gem.appendChild(gemNumber);

    targetSlot.appendChild(gem);

    // Mise à jour des réponses uniquement pour les réponses finales
    if (targetSlot.classList.contains('answer-slot')) {
        gameState.currentAnswers[position] = value;

        const isCorrect = isAnswerCorrect(position, value);

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

    // ✅ Nouvelle gestion : vérifier les retenues aussi
    if (targetSlot.classList.contains('carry-slot')) {
        const isCorrectCarry = isCarryCorrect(position, value);

        if (isCorrectCarry) {
            targetSlot.style.backgroundImage = `url('/assets/images/good_gem_slot.webp')`;
        } else {
            targetSlot.style.backgroundImage = `url('/assets/images/bad_gem_slot.webp')`;
        }
        // ➔ PAS de pénalité ici, car facultatif
    }

    checkCompletion();
}



function isCarryCorrect(position, value) {
    const currentProblem = gameState.problems[gameState.currentProblem];
    const carries = currentProblem.carries || [];

    // Vérifier si on a des données de retenues (carries)
    if (carries.length > position) {
        return carries[position] === value;
    }
    // Si pas de donnée, considérer que ce n'est pas nécessaire
    return true;
}




function isAnswerCorrect(position, value) {
    const currentProblem = gameState.problems[gameState.currentProblem];
    const correctAnswer = currentProblem.answer;
    if (position === 0) {
        return correctAnswer.length <= (gameState.currentAnswers.length - 1) ? value === 0 : value === correctAnswer[0];
    }
    const adjustedPosition = position - 1;
    const expectedPosition = correctAnswer.length - (gameState.currentAnswers.length - 1) + adjustedPosition;
    if (expectedPosition < 0) return false;
    if (expectedPosition < correctAnswer.length) {
        return value === correctAnswer[expectedPosition];
    }
    return false;
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
    const progressPercentage = (gameState.currentProblem / gameState.totalProblems) * 100;
    progressBar.style.width = `${progressPercentage}%`;

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
    progressBar.style.width = '0%';
    gameState.problems = generateProblems(gameState.difficulty);
}

// --- Fin script.js corrigé ---

