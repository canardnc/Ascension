// Variables du jeu
let currentPhraseIndex = 0;
let score = 0;
let phrases = [];
let currentPhrase = null;
let currentWords = [];
let correctOrder = [];
let selectedWordIndex = null;
let gameStartTime;
let maxScore = 100; // 5 phrases * 20 points
let gameEnded = false;

// Éléments DOM
let phraseContainer;
let wordsBank;
let checkButton;

// Fonction d'initialisation (OBLIGATOIRE)
function initGame() {
    console.log('Initialisation du mini-jeu');
    
    // 1. Récupérer les références aux éléments DOM
    phraseContainer = document.getElementById('phrase-container');
    wordsBank = document.getElementById('words-bank');
    checkButton = document.getElementById('check-button');
    
    // 2. Configurer l'état initial du jeu
    generatePhrases();
    
    // 3. Ajouter les écouteurs d'événements
    checkButton.addEventListener('click', checkAnswer);
    
    // 4. Initialiser d'autres composants si nécessaire
    resetGame();
}

// Fonction pour générer des phrases
function generatePhrases() {
    // Tableau de phrases avec leur solution
    phrases = [
        {
            words: ["Les", "gentils", "chats", "mangent", "cette", "délicieuse", "souris"],
            correctOrder: ["Les", "gentils", "chats", "mangent", "cette", "délicieuse", "souris"]
        },
        {
            words: ["Ma", "belle", "fleur", "attire", "ton", "petit", "oiseau"],
            correctOrder: ["Ma", "belle", "fleur", "attire", "ton", "petit", "oiseau"]
        },
        {
            words: ["Ces", "grandes", "maisons", "accueillent", "un", "jeune", "garçon"],
            correctOrder: ["Ces", "grandes", "maisons", "accueillent", "un", "jeune", "garçon"]
        },
        {
            words: ["Le", "vieux", "monsieur", "observe", "toutes", "jolies", "filles"],
            correctOrder: ["Le", "vieux", "monsieur", "observe", "toutes", "jolies", "filles"]
        },
        {
            words: ["Notre", "charmante", "voisine", "aide", "son", "grand", "frère"],
            correctOrder: ["Notre", "charmante", "voisine", "aide", "son", "grand", "frère"]
        },
        {
            words: ["Mes", "petits", "chiens", "suivent", "ta", "jolie", "chatte"],
            correctOrder: ["Mes", "petits", "chiens", "suivent", "ta", "jolie", "chatte"]
        },
        {
            words: ["Une", "forte", "tempête", "secoue", "ce", "vieux", "bateau"],
            correctOrder: ["Une", "forte", "tempête", "secoue", "ce", "vieux", "bateau"]
        },
        {
            words: ["Ton", "beau", "tableau", "inspire", "ces", "créatives", "artistes"],
            correctOrder: ["Ton", "beau", "tableau", "inspire", "ces", "créatives", "artistes"]
        },
        {
            words: ["La", "petite", "fille", "regarde", "les", "grands", "arbres"],
            correctOrder: ["La", "petite", "fille", "regarde", "les", "grands", "arbres"]
        },
        {
            words: ["Ses", "longs", "cheveux", "cachent", "mon", "nouveau", "chapeau"],
            correctOrder: ["Ses", "longs", "cheveux", "cachent", "mon", "nouveau", "chapeau"]
        },
        {
            words: ["Cet", "ancien", "professeur", "enseigne", "aux", "jeunes", "étudiantes"],
            correctOrder: ["Cet", "ancien", "professeur", "enseigne", "aux", "jeunes", "étudiantes"]
        },
        {
            words: ["Des", "belles", "actrices", "jouent", "avec", "le", "petit", "enfant"],
            correctOrder: ["Des", "belles", "actrices", "jouent", "avec", "le", "petit", "enfant"]
        },
        {
            words: ["Leurs", "nouveaux", "vélos", "impressionnent", "cette", "jolie", "dame"],
            correctOrder: ["Leurs", "nouveaux", "vélos", "impressionnent", "cette", "jolie", "dame"]
        },
        {
            words: ["Sa", "grosse", "voiture", "dépasse", "les", "rapides", "motards"],
            correctOrder: ["Sa", "grosse", "voiture", "dépasse", "les", "rapides", "motards"]
        },
        {
            words: ["Un", "grand", "roi", "épouse", "plusieurs", "belles", "princesses"],
            correctOrder: ["Un", "grand", "roi", "épouse", "plusieurs", "belles", "princesses"]
        },
        {
            words: ["Les", "forts", "soldats", "protègent", "notre", "précieuse", "reine"],
            correctOrder: ["Les", "forts", "soldats", "protègent", "notre", "précieuse", "reine"]
        },
        {
            words: ["Cette", "vieille", "dame", "nourrit", "tes", "affamés", "chats"],
            correctOrder: ["Cette", "vieille", "dame", "nourrit", "tes", "affamés", "chats"]
        },
        {
            words: ["Mon", "adorable", "neveu", "photographie", "ces", "majestueuses", "montagnes"],
            correctOrder: ["Mon", "adorable", "neveu", "photographie", "ces", "majestueuses", "montagnes"]
        },
        {
            words: ["Les", "sombres", "nuages", "cachent", "une", "brillante", "étoile"],
            correctOrder: ["Les", "sombres", "nuages", "cachent", "une", "brillante", "étoile"]
        },
        {
            words: ["Chaque", "intelligente", "femme", "influence", "son", "propre", "destin"],
            correctOrder: ["Chaque", "intelligente", "femme", "influence", "son", "propre", "destin"]
        }
    ];
    
    // Mélanger le tableau de phrases
    shuffleArray(phrases);
    
    // Sélectionner seulement 5 phrases pour une partie
    phrases = phrases.slice(0, 5);
}

// Fonction de démarrage du jeu (recommandée)
function startGame() {
    gameStartTime = Date.now();
    currentPhraseIndex = 0;
    score = 0;
    updatetopbar_score(score);
    displayCurrentPhrase();
}

// Fonction pour afficher la phrase actuelle
function displayCurrentPhrase() {
    if (currentPhraseIndex >= phrases.length) {
        endGameWithResults();
        return;
    }
    
    currentPhrase = phrases[currentPhraseIndex];
    correctOrder = [...currentPhrase.correctOrder];
    currentWords = [...currentPhrase.words];
    shuffleArray(currentWords);
    
    // Vérifier que les mots sont bien mélangés
    while (arraysEqual(currentWords, correctOrder)) {
        shuffleArray(currentWords);
    }
    
    // Vider les conteneurs
    phraseContainer.innerHTML = '';
    wordsBank.innerHTML = '';
    
    // Créer les cases vides pour les mots
    for (let i = 0; i < correctOrder.length; i++) {
        const slot = document.createElement('div');
        slot.className = 'word-slot';
        slot.dataset.index = i;
        slot.addEventListener('click', () => handleSlotClick(i));
        phraseContainer.appendChild(slot);
    }
    
    // Créer les mots mélangés
    for (let i = 0; i < currentWords.length; i++) {
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        wordItem.textContent = currentWords[i];
        wordItem.dataset.index = i;
        wordItem.addEventListener('click', () => handleWordClick(i));
        wordsBank.appendChild(wordItem);
    }
    
    // Masquer le bouton vérifier au début
    checkButton.style.display = 'none';
}

// Fonction pour vérifier si deux tableaux sont égaux
function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

// Fonction pour gérer le clic sur un mot
function handleWordClick(index) {
    const wordItems = document.querySelectorAll('.word-item');
    
    // Si un mot est déjà sélectionné, désélectionner
    if (selectedWordIndex !== null) {
        wordItems[selectedWordIndex].style.backgroundColor = '';
        
        // Si on clique sur le même mot, désélectionner seulement
        if (selectedWordIndex === index) {
            selectedWordIndex = null;
            return;
        }
    }
    
    // Sélectionner le nouveau mot
    selectedWordIndex = index;
    wordItems[index].style.backgroundColor = '#B39DDB';
}

// Fonction pour gérer le clic sur une case
function handleSlotClick(index) {
    const slots = document.querySelectorAll('.word-slot');
    const wordItems = document.querySelectorAll('.word-item');
    
    // Si un mot est sélectionné, le placer dans la case
    if (selectedWordIndex !== null) {
        const selectedWord = wordItems[selectedWordIndex].textContent;
        
        // Si la case est déjà remplie, échanger les mots
        if (slots[index].textContent) {
            const tempWord = slots[index].textContent;
            
            // Trouver un emplacement disponible dans la banque de mots
            let emptySlotFound = false;
            for (let i = 0; i < wordItems.length; i++) {
                if (wordItems[i].style.display === 'none') {
                    wordItems[i].textContent = tempWord;
                    wordItems[i].style.display = 'block';
                    emptySlotFound = true;
                    break;
                }
            }
            
            // Si aucun emplacement n'est disponible, en créer un nouveau
            if (!emptySlotFound) {
                const newWordItem = document.createElement('div');
                newWordItem.className = 'word-item';
                newWordItem.textContent = tempWord;
                newWordItem.addEventListener('click', () => handleWordClick(wordItems.length));
                wordsBank.appendChild(newWordItem);
            }
        }
        
        // Placer le mot sélectionné dans la case
        slots[index].textContent = selectedWord;
        slots[index].classList.add('filled');
        wordItems[selectedWordIndex].style.display = 'none';
        
        // Réinitialiser la sélection
        selectedWordIndex = null;
        
        // Vérifier si toutes les cases sont remplies
        checkAllSlotsFilled();
    }
    // Si aucun mot n'est sélectionné mais qu'il y a un mot dans la case,
    // le retirer et le remettre dans la banque de mots
    else if (slots[index].textContent) {
        const word = slots[index].textContent;
        slots[index].textContent = '';
        slots[index].classList.remove('filled');
        
        // Trouver un emplacement disponible dans la banque de mots
        let emptySlotFound = false;
        for (let i = 0; i < wordItems.length; i++) {
            if (wordItems[i].style.display === 'none') {
                wordItems[i].textContent = word;
                wordItems[i].style.display = 'block';
                emptySlotFound = true;
                break;
            }
        }
        
        // Si aucun emplacement n'est disponible, en créer un nouveau
        if (!emptySlotFound) {
            const newWordItem = document.createElement('div');
            newWordItem.className = 'word-item';
            newWordItem.textContent = word;
            newWordItem.addEventListener('click', () => {
                if (selectedWordIndex !== null) {
                    document.querySelectorAll('.word-item')[selectedWordIndex].style.backgroundColor = '';
                }
                selectedWordIndex = document.querySelectorAll('.word-item').length - 1;
                newWordItem.style.backgroundColor = '#B39DDB';
            });
            wordsBank.appendChild(newWordItem);
        }
        
        // Masquer le bouton vérifier si une case est vidée
        checkButton.style.display = 'none';
    }
}

// Vérifier si toutes les cases sont remplies
function checkAllSlotsFilled() {
    const slots = document.querySelectorAll('.word-slot');
    const allFilled = Array.from(slots).every(slot => slot.textContent);
    
    if (allFilled) {
        checkButton.style.display = 'block';
    } else {
        checkButton.style.display = 'none';
    }
}

// Fonction pour vérifier la réponse
function checkAnswer() {
    const slots = document.querySelectorAll('.word-slot');
    let playerAnswer = [];
    for (let i = 0; i < slots.length; i++) {
        playerAnswer.push(slots[i].textContent);
    }
    
    // Créer une copie de la réponse correcte pour vérification
    let answerToCheck = [...correctOrder];
    
    // Permettre la permutation des mots #2 et #3 (adjectif et nom)
    if (playerAnswer.length > 3) {
        if (playerAnswer[1] === correctOrder[2] && playerAnswer[2] === correctOrder[1]) {
            // Si les mots #2 et #3 sont inversés par rapport à l'ordre correct
            answerToCheck[1] = correctOrder[2];
            answerToCheck[2] = correctOrder[1];
        }
    }
    
    // Permettre la permutation des mots #7 et #8 si la phrase est assez longue
    if (playerAnswer.length > 6) {
        if (playerAnswer[5] === correctOrder[6] && playerAnswer[6] === correctOrder[5]) {
            // Si les mots #7 et #8 sont inversés par rapport à l'ordre correct
            answerToCheck[5] = correctOrder[6];
            answerToCheck[6] = correctOrder[5];
        }
    }
    
    // Vérifier chaque mot
    let correct = true;
    for (let i = 0; i < slots.length; i++) {
        if (playerAnswer[i] === answerToCheck[i]) {
            slots[i].classList.add('correct');
        } else {
            slots[i].classList.add('incorrect');
            correct = false;
        }
    }
    
    // Désactiver le bouton pendant la vérification
    checkButton.disabled = true;
    
    // Mettre à jour le score et passer à la phrase suivante
    if (correct) {
        score += 20;
        updateGameScore(score);
        setTimeout(() => {
            currentPhraseIndex++;
            checkButton.disabled = false;
            displayCurrentPhrase();
        }, 1500);
    } else {
        score = Math.max(0, score - 10); // Éviter un score négatif
        updateGameScore(score);
        setTimeout(() => {
            // Réinitialiser les classes de résultat
            slots.forEach(slot => {
                slot.classList.remove('correct');
                slot.classList.remove('incorrect');
            });
            checkButton.disabled = false;
        }, 2000);
    }
}

// Fonction pour mélanger un tableau
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Fonction pour terminer le jeu (OBLIGATOIRE)
function endGameWithResults() {
    if (gameEnded) return;
    gameEnded = true;
    
    // 1. Arrêter les timers ou animations en cours
    const totalTimeElapsed = Math.ceil((Date.now() - gameStartTime) / 1000);
    
    // 2. Calculer le score final et le temps écoulé
    const finalScore = score;
    
    // 3. Appeler la fonction endGame du template
    window.GameEnd.endGame({
        score: finalScore,
        maxScore: maxScore,
        timeSpent: totalTimeElapsed
    }, resetGame);
}

// Fonction de réinitialisation du jeu (OBLIGATOIRE)
function resetGame() {
    // Réinitialiser les variables du jeu
    currentPhraseIndex = 0;
    score = 0;
    selectedWordIndex = null;
    gameEnded = false;
    
    // Mettre à jour l'affichage du score
    updateGameScore(score);
    
    // Démarrer le jeu
    startGame();
}

// Fonction pour mettre à jour le score affiché
function updateGameScore(newScore) {
    if (typeof window.updatetopbar_score === 'function') {
        window.updatetopbar_score(newScore);
    }
}