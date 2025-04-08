// Variables globales
const ITEMS_PER_PAGE = 10;
let currentPage = 1;
let totalPages = 1;
let selectedMinigameId = null;
let selectedDifficultyLevel = null;
let minigames = [];
let categories = {
    1: "Force",
    2: "Endurance",
    3: "Récupération",
    4: "Agilité"
};

// Éléments DOM
const minigamesListBody = document.getElementById('minigames-list-body');
const minigameDetailSection = document.getElementById('minigame-detail-section');
const noMinigameSelectedSection = document.getElementById('no-minigame-selected');
const minigamesCountElement = document.getElementById('minigames-count');
const searchInput = document.getElementById('search-minigames');
const paginationContainer = document.getElementById('pagination');
const difficultyTabs = document.getElementById('difficulty-tabs');
const difficultyContents = document.getElementById('difficulty-contents');
const addDifficultyTab = document.getElementById('add-difficulty-tab');

// Détails mini-jeu
const detailTitle = document.getElementById('detail-title');
const detailId = document.getElementById('detail-id');
const detailTitleInput = document.getElementById('detail-title-input');
const detailCategory = document.getElementById('detail-category');
const detailDescription = document.getElementById('detail-description');
const cancelEditButton = document.getElementById('cancel-edit-button');
const saveMinigameButton = document.getElementById('save-minigame-button');

// Modals
const confirmDeleteModal = document.getElementById('confirm-delete-modal');
const addMinigameModal = document.getElementById('add-minigame-modal');
const addDifficultyModal = document.getElementById('add-difficulty-modal');
const addYearModal = document.getElementById('add-year-modal');
const addPrerequisiteModal = document.getElementById('add-prerequisite-modal');
const addUnlockModal = document.getElementById('add-unlock-modal');

// Boutons et notifications
const addMinigameBtn = document.getElementById('add-minigame-btn');
const notification = document.getElementById('notification');
const deleteModalConfirm = document.getElementById('delete-modal-confirm');
const addModalConfirm = document.getElementById('add-modal-confirm');
const difficultyModalConfirm = document.getElementById('difficulty-modal-confirm');
const yearModalConfirm = document.getElementById('year-modal-confirm');
const prerequisiteModalConfirm = document.getElementById('prerequisite-modal-confirm');
const unlockModalConfirm = document.getElementById('unlock-modal-confirm');

// Variables pour tracking des actions en cours
let pendingDeleteId = null;
let pendingDifficulty = null;

// Initialiser la page au chargement
document.addEventListener('DOMContentLoaded', () => {
    fetchMinigames();
    initEventListeners();
});

// Initialiser tous les écouteurs d'événements
function initEventListeners() {
    // Recherche
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    
    // Boutons d'édition
    cancelEditButton.addEventListener('click', cancelMinigameEdit);
    saveMinigameButton.addEventListener('click', saveMinigameChanges);
    
    // Ajout d'onglet de difficulté
    addDifficultyTab.addEventListener('click', showAddDifficultyModal);
    
    // Boutons et modals
    addMinigameBtn.addEventListener('click', showAddMinigameModal);
    
    // Modal de suppression
    document.getElementById('delete-modal-close').addEventListener('click', () => closeModal(confirmDeleteModal));
    document.getElementById('delete-modal-cancel').addEventListener('click', () => closeModal(confirmDeleteModal));
    deleteModalConfirm.addEventListener('click', confirmDeleteMinigame);
    
    // Modal d'ajout de mini-jeu
    document.getElementById('add-modal-close').addEventListener('click', () => closeModal(addMinigameModal));
    document.getElementById('add-modal-cancel').addEventListener('click', () => closeModal(addMinigameModal));
    addModalConfirm.addEventListener('click', addNewMinigame);
    
    // Modal d'ajout de niveau de difficulté
    document.getElementById('difficulty-modal-close').addEventListener('click', () => closeModal(addDifficultyModal));
    document.getElementById('difficulty-modal-cancel').addEventListener('click', () => closeModal(addDifficultyModal));
    difficultyModalConfirm.addEventListener('click', addNewDifficultyLevel);
    
    // Modal d'ajout d'année scolaire
    document.getElementById('year-modal-close').addEventListener('click', () => closeModal(addYearModal));
    document.getElementById('year-modal-cancel').addEventListener('click', () => closeModal(addYearModal));
    yearModalConfirm.addEventListener('click', addNewYear);
    
    // Modal d'ajout de prérequis
    document.getElementById('prerequisite-modal-close').addEventListener('click', () => closeModal(addPrerequisiteModal));
    document.getElementById('prerequisite-modal-cancel').addEventListener('click', () => closeModal(addPrerequisiteModal));
    prerequisiteModalConfirm.addEventListener('click', addNewPrerequisite);
    
    // Modal d'ajout de débloquage
    document.getElementById('unlock-modal-close').addEventListener('click', () => closeModal(addUnlockModal));
    document.getElementById('unlock-modal-cancel').addEventListener('click', () => closeModal(addUnlockModal));
    unlockModalConfirm.addEventListener('click', addNewUnlock);
}

// Fonction de debounce pour limiter le nombre d'appels lors des recherches
function debounce(func, delay) {
    let timeoutId;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(context, args);
        }, delay);
    };
}

// Fonction pour effectuer des requêtes API avec authentification
async function fetchWithAuth(url, options = {}) {
    try {
        // Get token from parent window (iframe communication)
        const token = window.parent.localStorage.getItem('token');
        
        if (!token) {
            showNotification("Vous n'êtes pas authentifié", 'error');
            return null;
        }
        
        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
        
        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };
        
        const response = await fetch(url, mergedOptions);
        
        if (response.status === 401 || response.status === 403) {
            showNotification("Session expirée ou accès refusé", 'error');
            setTimeout(() => {
                window.parent.location.href = '/';
            }, 2000);
            return null;
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || `Erreur ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erreur API:', error);
        showNotification(`Erreur: ${error.message}`, 'error');
        return null;
    }
}

// Récupérer les mini-jeux depuis l'API
async function fetchMinigames() {
    try {
        // Afficher l'indicateur de chargement
        minigamesListBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-container">
                    <div class="loading-spinner"></div>
                    <div style="margin-top: 10px;">Chargement des mini-jeux...</div>
                </td>
            </tr>
        `;
        
        // Préparer les paramètres de requête
        const searchTerm = searchInput.value.trim();
        const params = new URLSearchParams({
            page: currentPage,
            perPage: ITEMS_PER_PAGE
        });
        
        if (searchTerm) {
            params.append('q', searchTerm);
        }
        
        // Récupérer les données depuis l'API
        const data = await fetchWithAuth(`/api/admin/minigames?${params.toString()}`);
        
        if (!data) return;
        
        // Mettre à jour les variables globales
        minigames = data.minigames || [];
        totalPages = data.totalPages || 1;
        
        // Mettre à jour l'interface
        minigamesCountElement.textContent = data.totalCount || minigames.length;
        updateMinigamesTable();
        updatePagination();
        
    } catch (error) {
        console.error('Erreur fetchMinigames:', error);
        showNotification(`Erreur lors du chargement des mini-jeux: ${error.message}`, 'error');
        minigamesListBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px;">
                    Erreur lors du chargement des mini-jeux. <br>
                    <button class="btn btn-primary" style="margin-top: 10px;" onclick="fetchMinigames()">
                        Réessayer
                    </button>
                </td>
            </tr>
        `;
    }
}

// Mettre à jour le tableau des mini-jeux
function updateMinigamesTable() {
    if (!minigames || minigames.length === 0) {
        minigamesListBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center;">Aucun mini-jeu trouvé</td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    minigames.forEach(minigame => {
        const isSelected = minigame.minigame_id === selectedMinigameId ? 'selected' : '';
        
        // Générer les tags de difficulté
        let difficultyTags = '';
        if (minigame.difficulties && minigame.difficulties.length > 0) {
            minigame.difficulties.forEach(level => {
                difficultyTags += `<span class="difficulty-tag">Niveau ${level}</span>`;
            });
        } else {
            difficultyTags = '<span class="difficulty-tag">Aucun niveau</span>';
        }
        
        // Limiter la longueur de la description
        const shortDesc = minigame.description && minigame.description.length > 50 
            ? minigame.description.substring(0, 50) + '...' 
            : (minigame.description || 'Aucune description');
        
        html += `
            <tr class="${isSelected}" data-id="${minigame.minigame_id}" onclick="selectMinigame(${minigame.minigame_id})">
                <td>${minigame.minigame_id}</td>
                <td>${minigame.title || 'Sans titre'}</td>
                <td>${categories[minigame.category_id] || 'Non catégorisé'}</td>
                <td>${shortDesc}</td>
                <td>${difficultyTags}</td>
                <td>
                    <div class="game-actions">
                        <button class="action-button delete" title="Supprimer ce mini-jeu" onclick="event.stopPropagation(); showDeleteConfirmation(${minigame.minigame_id})">❌</button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    minigamesListBody.innerHTML = html;
}

// Mettre à jour la pagination
function updatePagination() {
    let html = '';
    
    // Bouton précédent
    html += `
        <button class="pagination-button ${currentPage === 1 ? 'disabled' : ''}" 
          ${currentPage === 1 ? 'disabled' : 'onclick="changePage(' + (currentPage - 1) + ')"'}>
            &laquo;
        </button>
    `;
    
    // Pages
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button class="pagination-button ${i === currentPage ? 'active' : ''}" 
              onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }
    
    // Bouton suivant
    html += `
        <button class="pagination-button ${currentPage === totalPages ? 'disabled' : ''}" 
          ${currentPage === totalPages ? 'disabled' : 'onclick="changePage(' + (currentPage + 1) + ')"'}>
            &raquo;
        </button>
    `;
    
    paginationContainer.innerHTML = html;
}

// Changer de page
function changePage(page) {
    if (page === currentPage) return;
    
    currentPage = page;
    fetchMinigames();
}

// Rechercher des mini-jeux
function handleSearch() {
    currentPage = 1; // Revenir à la première page lors d'une recherche
    fetchMinigames();
}

// Sélectionner un mini-jeu
async function selectMinigame(minigameId) {
    if (minigameId === selectedMinigameId) return;
    
    try {
        selectedMinigameId = minigameId;
        
        // Mettre à jour la sélection dans le tableau
        document.querySelectorAll('#minigames-list-body tr').forEach(row => {
            row.classList.remove('selected');
            if (parseInt(row.dataset.id) === minigameId) {
                row.classList.add('selected');
            }
        });
        
        // Récupérer les détails du mini-jeu depuis l'API
        const minigame = await fetchWithAuth(`/api/admin/minigames/${minigameId}`);
        
        if (!minigame) {
            throw new Error("Erreur lors de la récupération des détails du mini-jeu");
        }
        
        // Mise à jour des champs de formulaire
        detailId.value = minigame.minigame_id;
        detailTitle.textContent = minigame.title;
        detailTitleInput.value = minigame.title;
        detailCategory.value = minigame.category_id;
        detailDescription.value = minigame.description || '';
        
        // Afficher la section de détails
        minigameDetailSection.classList.add('visible');
        noMinigameSelectedSection.style.display = 'none';
        
        // Récupérer les niveaux de difficulté
        const difficulties = minigame.difficulties || [];
        const levels = difficulties.map(diff => diff.level);
        
        // Générer les onglets de difficulté
        generateDifficultyTabs(levels);
        
        // Sélectionner le premier niveau de difficulté par défaut
        if (levels.length > 0) {
            selectDifficultyLevel(levels[0], difficulties);
        } else {
            // Aucun niveau de difficulté
            difficultyContents.innerHTML = '<div class="no-difficulty">Aucun niveau de difficulté disponible. Cliquez sur "+ Ajouter un niveau" pour commencer.</div>';
        }
        
    } catch (error) {
        console.error('Erreur selectMinigame:', error);
        showNotification(`Erreur: ${error.message}`, 'error');
        
        // Réinitialiser la sélection
        selectedMinigameId = null;
        minigameDetailSection.classList.remove('visible');
        noMinigameSelectedSection.style.display = 'block';
    }
}

// Générer les onglets de difficulté
function generateDifficultyTabs(levels) {
    // Réinitialiser les onglets existants, sauf le bouton d'ajout
    const tabs = Array.from(difficultyTabs.querySelectorAll('.difficulty-tab:not(.add-tab)'));
    tabs.forEach(tab => tab.remove());
    
    // Trier les niveaux
    levels.sort((a, b) => a - b);
    
    // Ajouter les nouveaux onglets avant le bouton d'ajout
    levels.forEach(level => {
        const tab = document.createElement('button');
        tab.className = 'difficulty-tab';
        tab.setAttribute('data-level', level);
        tab.innerHTML = `Niveau ${level} <span class="close-icon" title="Supprimer ce niveau" onclick="event.stopPropagation(); confirmDeleteDifficulty(${level})">×</span>`;
        tab.addEventListener('click', () => selectDifficultyLevel(level));
        
        difficultyTabs.insertBefore(tab, addDifficultyTab);
    });
    
    // Vider le contenu des niveaux
    difficultyContents.innerHTML = '';
}

// Sélectionner un niveau de difficulté
function selectDifficultyLevel(level, difficulties = null) {
    selectedDifficultyLevel = level;
    
    // Mettre à jour l'onglet actif
    document.querySelectorAll('.difficulty-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-level') == level) {
            tab.classList.add('active');
        }
    });
    
    // Mettre à jour le contenu
    if (difficulties) {
        // Utiliser les données déjà chargées
        const difficultyData = difficulties.find(d => d.level === level);
        if (difficultyData) {
            renderDifficultyContent(level, difficultyData);
        } else {
            loadDifficultyContent(level);
        }
    } else {
        // Charger les données
        loadDifficultyContent(level);
    }
}

// Charger le contenu d'un niveau de difficulté depuis l'API
async function loadDifficultyContent(level) {
    try {
        // Afficher l'indicateur de chargement
        difficultyContents.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <div style="margin-top: 10px;">Chargement des détails du niveau ${level}...</div>
            </div>
        `;
        
        // Récupérer les détails du mini-jeu depuis l'API
        const minigame = await fetchWithAuth(`/api/admin/minigames/${selectedMinigameId}`);
        
        if (!minigame) {
            throw new Error("Erreur lors de la récupération des détails du mini-jeu");
        }
        
        // Trouver les données du niveau de difficulté
        const difficultyData = minigame.difficulties.find(d => d.level === level);
        
        if (!difficultyData) {
            throw new Error(`Niveau de difficulté ${level} non trouvé`);
        }
        
        // Afficher le contenu
        renderDifficultyContent(level, difficultyData);
        
    } catch (error) {
        console.error('Erreur loadDifficultyContent:', error);
        difficultyContents.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                Erreur lors du chargement des détails du niveau ${level}<br>
                <button class="btn btn-primary" style="margin-top: 10px;" onclick="loadDifficultyContent(${level})">
                    Réessayer
                </button>
            </div>
        `;
    }
}
function addNewPrerequisite() {
    if (!selectedMinigameId || !selectedDifficultyLevel) {
        closeModal(addPrerequisiteModal);
        return;
    }
    
    try {
        // Récupérer les valeurs avec vérification
        const minigameSelect = document.getElementById('prerequisite-minigame');
        const difficultySelect = document.getElementById('prerequisite-difficulty');
        const scoreInput = document.getElementById('prerequisite-score');
        
        if (!minigameSelect || !difficultySelect || !scoreInput) {
            showNotification('Erreur: éléments du formulaire non trouvés', 'error');
            return;
        }
        
        const minigame_id = parseInt(minigameSelect.value);
        const difficulty_level = parseInt(difficultySelect.value);
        const score_required = parseInt(scoreInput.value);
        
        // Validation
        if (isNaN(minigame_id) || minigame_id <= 0) {
            showNotification('Veuillez sélectionner un mini-jeu', 'error');
            return;
        }
        
        if (isNaN(score_required) || score_required <= 0) {
            showNotification('Le score requis doit être un nombre positif', 'error');
            return;
        }
        
        // Afficher le spinner
        const prereqConfirmText = document.getElementById('prerequisite-confirm-text');
        const prereqSpinner = document.getElementById('prerequisite-spinner');
        
        if (prereqConfirmText && prereqSpinner) {
            prereqConfirmText.style.display = 'none';
            prereqSpinner.style.display = 'inline-block';
        }
        
        // Envoyer la requête
        fetchWithAuth(`/api/admin/minigames/${selectedMinigameId}/difficulty/${selectedDifficultyLevel}/prerequisite`, {
            method: 'POST',
            body: JSON.stringify({
                minigame_id,
                difficulty_level,
                score_required
            })
        }).then(response => {
            if (!response) return;
            
            // Recharger le contenu du niveau
            closeModal(addPrerequisiteModal);
            loadDifficultyContent(selectedDifficultyLevel);
            
            showNotification(`Prérequis ajouté avec succès`, 'success');
        }).catch(error => {
            console.error('Erreur addNewPrerequisite:', error);
            showNotification(`Erreur lors de l'ajout: ${error.message}`, 'error');
        }).finally(() => {
            // Masquer le spinner
            if (prereqConfirmText && prereqSpinner) {
                prereqConfirmText.style.display = 'inline';
                prereqSpinner.style.display = 'none';
            }
        });
        
    } catch (error) {
        console.error('Erreur addNewPrerequisite:', error);
        showNotification(`Erreur lors de l'ajout: ${error.message}`, 'error');
        
        // Masquer le spinner en cas d'erreur
        const prereqConfirmText = document.getElementById('prerequisite-confirm-text');
        const prereqSpinner = document.getElementById('prerequisite-spinner');
        
        if (prereqConfirmText && prereqSpinner) {
            prereqConfirmText.style.display = 'inline';
            prereqSpinner.style.display = 'none';
        }
    }
}

// Afficher le contenu d'un niveau de difficulté
function renderDifficultyContent(level, difficultyData) {
    // Vider le contenu précédent
    difficultyContents.innerHTML = '';
    
    // Créer le contenu
    const content = document.createElement('div');
    content.className = 'difficulty-content active';
    content.setAttribute('data-level', level);
    
    // Extraire les données
    const years = difficultyData.years || [];
    const prerequisites = difficultyData.prerequisites || [];
    const unlocks = difficultyData.unlocks || [];
    const stats = difficultyData.stats || { playerCount: 0, averageScore: 0, averageTime: 0 };
    
    // Layout à 3 colonnes
    content.innerHTML = `
        <div class="three-column-layout">
            <!-- Colonne de gauche: Years et Prerequisites -->
            <div class="column">
                <!-- Years -->
                <div class="column-header">
                    <span>Années scolaires</span>
                    <button class="btn btn-secondary" onclick="showAddYearModal()">+</button>
                </div>
                <div id="years-container">
                    ${years.length > 0 ? years.map(year => `
                        <div class="relation-card">
                            <h4 class="relation-card-title">${year}</h4>
                            <button class="delete-relation" onclick="deleteYear('${year}')" title="Supprimer cette année">×</button>
                        </div>
                    `).join('') : '<p style="color: var(--text-secondary);">Aucune année scolaire associée</p>'}
                </div>
                
                <!-- Prerequisites -->
                <div class="column-subheader">
                    <span>Prérequis pour débloquer ce mini-jeu</span>
                </div>
                <div id="prerequisites-container">
                    ${prerequisites.length > 0 ? prerequisites.map(prereq => `
                        <div class="relation-card">
                            <h4 class="relation-card-title">${prereq.title || 'Mini-jeu #' + prereq.minigame_id}</h4>
                            <div class="relation-card-subtitle">
                                Niveau ${prereq.difficulty_level} • Score min: ${prereq.score_required}
                            </div>
                            <button class="delete-relation" onclick="deletePrerequisite(${prereq.minigame_id}, ${prereq.difficulty_level})" title="Supprimer ce prérequis">×</button>
                        </div>
                    `).join('') : '<p style="color: var(--text-secondary);">Aucun prérequis</p>'}
                </div>
                
                <button class="add-relation-btn" onclick="showAddPrerequisiteModal()">
                    + Ajouter un prérequis
                </button>
            </div>
            
            <!-- Colonne du milieu: Informations sur le mini-jeu -->
            <div class="column">
                <div class="column-header">
                    <span>Informations du mini-jeu</span>
                </div>
                <div id="minigame-info">
                    <div class="relation-card">
                        <h4 class="relation-card-title">Identifiant: ${selectedMinigameId}</h4>
                        <div class="relation-card-subtitle">
                            Niveau de difficulté: ${level}
                        </div>
                    </div>
                    
                    <div class="relation-card">
                        <h4 class="relation-card-title">Statistiques</h4>
                        <div class="relation-card-subtitle">
                            Nombre de joueurs: <strong>${stats.playerCount}</strong><br>
                            Score moyen: <strong>${Math.round(stats.averageScore)}</strong><br>
                            Temps moyen: <strong>${formatTime(stats.averageTime)}</strong>
                        </div>
                    </div>
                    
                    <button class="add-relation-btn" onclick="activateMinigameForUsers()">
                        + Activer pour les élèves
                    </button>
                </div>
            </div>
            
            <!-- Colonne de droite: Débloquages -->
            <div class="column">
                <div class="column-header">
                    <span>Mini-jeux débloqués</span>
                    <button class="btn btn-secondary" onclick="showAddUnlockModal()">+</button>
                </div>
                <div id="unlocks-container">
                    ${unlocks.length > 0 ? unlocks.map(unlock => `
                        <div class="relation-card">
                            <h4 class="relation-card-title">${unlock.title || 'Mini-jeu #' + unlock.minigame_id}</h4>
                            <div class="relation-card-subtitle">
                                Niveau ${unlock.difficulty_level} • Score requis: ${unlock.score_required}
                            </div>
                            <button class="delete-relation" onclick="deleteUnlock(${unlock.minigame_id}, ${unlock.difficulty_level})" title="Supprimer ce débloquage">×</button>
                        </div>
                    `).join('') : '<p style="color: var(--text-secondary);">Ne débloque aucun mini-jeu</p>'}
                </div>
            </div>
        </div>
    `;
    
    difficultyContents.appendChild(content);
}

// Formater le temps en minutes et secondes
function formatTime(seconds) {
    if (!seconds || seconds <= 0) return '0 s';
    
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    
    if (minutes > 0) {
        return `${minutes} min ${secs} s`;
    } else {
        return `${secs} s`;
    }
}

// Annuler les modifications d'un mini-jeu
function cancelMinigameEdit() {
    if (!selectedMinigameId) return;
    
    // Recharger les détails du mini-jeu
    selectMinigame(selectedMinigameId);
    showNotification('Modifications annulées', 'warning');
}

// Enregistrer les modifications d'un mini-jeu
async function saveMinigameChanges() {
    if (!selectedMinigameId) return;
    
    try {
        // Afficher le spinner
        const saveButtonText = document.getElementById('save-button-text');
        const saveSpinner = document.getElementById('save-spinner');
        saveButtonText.style.display = 'none';
        saveSpinner.style.display = 'inline-block';
        
        // Préparer les données
        const updateData = {
            title: detailTitleInput.value.trim(),
            category_id: parseInt(detailCategory.value),
            description: detailDescription.value.trim()
        };
        
        // Valider les données
        if (!updateData.title) {
            showNotification('Le titre est requis', 'error');
            saveButtonText.style.display = 'inline';
            saveSpinner.style.display = 'none';
            return;
        }
        
        // Envoyer la requête
        const response = await fetchWithAuth(`/api/admin/minigames/${selectedMinigameId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
        
        if (!response) return;
        
        // Mettre à jour les données locales
        const minigame = minigames.find(m => m.minigame_id === selectedMinigameId);
        if (minigame) {
            minigame.title = updateData.title;
            minigame.category_id = updateData.category_id;
            minigame.description = updateData.description;
        }
        
        // Mettre à jour l'interface
        updateMinigamesTable();
        detailTitle.textContent = updateData.title;
        
        showNotification('Mini-jeu mis à jour avec succès', 'success');
        
    } catch (error) {
        console.error('Erreur saveMinigameChanges:', error);
        showNotification(`Erreur lors de la mise à jour: ${error.message}`, 'error');
    } finally {
        // Masquer le spinner
        const saveButtonText = document.getElementById('save-button-text');
        const saveSpinner = document.getElementById('save-spinner');
        saveButtonText.style.display = 'inline';
        saveSpinner.style.display = 'none';
    }
}

// Afficher la confirmation de suppression d'un mini-jeu
function showDeleteConfirmation(minigameId) {
    pendingDeleteId = minigameId;
    
    // Trouver le mini-jeu pour afficher son titre
    const minigame = minigames.find(m => m.minigame_id === minigameId);
    if (minigame) {
        document.getElementById('delete-modal-body').textContent = 
            `Êtes-vous sûr de vouloir supprimer le mini-jeu "${minigame.title}" ? Cette action est irréversible et supprimera toutes les données associées.`;
    }
    
    confirmDeleteModal.classList.add('active');
}

// Confirmer la suppression d'un mini-jeu
async function confirmDeleteMinigame() {
    if (!pendingDeleteId) {
        closeModal(confirmDeleteModal);
        return;
    }
    
    try {
        // Afficher le spinner
        const deleteConfirmText = document.getElementById('delete-confirm-text');
        const deleteSpinner = document.getElementById('delete-spinner');
        deleteConfirmText.style.display = 'none';
        deleteSpinner.style.display = 'inline-block';
        
        // Envoyer la requête
        const response = await fetchWithAuth(`/api/admin/minigames/${pendingDeleteId}`, {
            method: 'DELETE'
        });
        
        if (!response) return;
        
        // Supprimer le mini-jeu localement
        minigames = minigames.filter(m => m.minigame_id !== pendingDeleteId);
        
        // Si le mini-jeu supprimé était sélectionné, désélectionner
        if (selectedMinigameId === pendingDeleteId) {
            selectedMinigameId = null;
            minigameDetailSection.classList.remove('visible');
            noMinigameSelectedSection.style.display = 'block';
        }
        
        // Mettre à jour l'interface
        updateMinigamesTable();
        showNotification('Mini-jeu supprimé avec succès', 'success');
        
    } catch (error) {
        console.error('Erreur confirmDeleteMinigame:', error);
        showNotification(`Erreur lors de la suppression: ${error.message}`, 'error');
    } finally {
        // Masquer le spinner et fermer la modal
        const deleteConfirmText = document.getElementById('delete-confirm-text');
        const deleteSpinner = document.getElementById('delete-spinner');
        deleteConfirmText.style.display = 'inline';
        deleteSpinner.style.display = 'none';
        
        closeModal(confirmDeleteModal);
        pendingDeleteId = null;
    }
}

// Afficher la modal d'ajout de mini-jeu
function showAddMinigameModal() {
    // Réinitialiser les champs
    document.getElementById('new-minigame-title').value = '';
    document.getElementById('new-minigame-category').value = '1';
    document.getElementById('new-minigame-description').value = '';
    document.getElementById('new-minigame-difficulty').value = '1';
    
    addMinigameModal.classList.add('active');
}

// Ajouter un nouveau mini-jeu
async function addNewMinigame() {
    try {
        // Récupérer les valeurs
        const title = document.getElementById('new-minigame-title').value.trim();
        const category_id = parseInt(document.getElementById('new-minigame-category').value);
        const description = document.getElementById('new-minigame-description').value.trim();
        const difficulty_level = parseInt(document.getElementById('new-minigame-difficulty').value);
        
        // Validation plus stricte
        if (!title) {
            showNotification('Le titre du mini-jeu est requis', 'error');
            return;
        }
        
        if (isNaN(category_id) || category_id <= 0) {
            showNotification('Catégorie invalide', 'error');
            return;
        }
        
        if (isNaN(difficulty_level) || difficulty_level <= 0 || difficulty_level > 3) {
            showNotification('Niveau de difficulté invalide', 'error');
            return;
        }
        
        // Afficher le spinner
        const addConfirmText = document.getElementById('add-confirm-text');
        const addSpinner = document.getElementById('add-spinner');
        addConfirmText.style.display = 'none';
        addSpinner.style.display = 'inline-block';
        
        // Préparer les données - en veillant à ce que tous les types soient corrects
        const newMinigameData = {
            title: String(title),
            category_id: Number(category_id),
            description: description ? String(description) : "",
            difficulty_level: Number(difficulty_level)
        };
        
        console.log('Données envoyées:', JSON.stringify(newMinigameData)); // Logging pour débogage
        
        // Envoyer la requête avec le Content-Type approprié
        const response = await fetchWithAuth('/api/admin/minigames', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newMinigameData)
        });
        
        if (!response) return;
        
        // Ajouter le mini-jeu localement
        minigames.unshift(response);
        
        // Mettre à jour l'interface
        updateMinigamesTable();
        closeModal(addMinigameModal);
        showNotification('Mini-jeu ajouté avec succès', 'success');
        
        // Sélectionner le nouveau mini-jeu
        selectMinigame(response.minigame_id);
        
    } catch (error) {
        console.error('Erreur addNewMinigame:', error);
        showNotification(`Erreur lors de l'ajout: ${error.message}`, 'error');
    } finally {
        // Masquer le spinner
        const addConfirmText = document.getElementById('add-confirm-text');
        const addSpinner = document.getElementById('add-spinner');
        addConfirmText.style.display = 'inline';
        addSpinner.style.display = 'none';
    }
}

// Confirmer la suppression d'un niveau de difficulté
function confirmDeleteDifficulty(level) {
    pendingDifficulty = level;
    
    document.getElementById('delete-modal-body').textContent = 
        `Êtes-vous sûr de vouloir supprimer le niveau de difficulté ${level} ? Cette action supprimera toutes les données associées, y compris les relations avec les années scolaires et les autres mini-jeux.`;
    
    // Remplacer la fonction du bouton de confirmation
    const originalCallback = deleteModalConfirm.onclick;
    deleteModalConfirm.onclick = function() {
        deleteDifficultyLevel().then(() => {
            // Restaurer la fonction originale
            deleteModalConfirm.onclick = originalCallback;
        });
    };
    
    confirmDeleteModal.classList.add('active');
}

// Supprimer un niveau de difficulté
async function deleteDifficultyLevel() {
    if (!selectedMinigameId || !pendingDifficulty) {
        closeModal(confirmDeleteModal);
        return;
    }
    
    try {
        // Afficher le spinner
        const deleteConfirmText = document.getElementById('delete-confirm-text');
        const deleteSpinner = document.getElementById('delete-spinner');
        deleteConfirmText.style.display = 'none';
        deleteSpinner.style.display = 'inline-block';
        
        // Envoyer la requête
        const response = await fetchWithAuth(`/api/admin/minigames/${selectedMinigameId}/difficulty/${pendingDifficulty}`, {
            method: 'DELETE'
        });
        
        if (!response) return;
        
        // Mettre à jour le mini-jeu localement
        const minigame = minigames.find(m => m.minigame_id === selectedMinigameId);
        if (minigame && minigame.difficulties) {
            minigame.difficulties = minigame.difficulties.filter(d => d !== pendingDifficulty);
        }
        
        // Mettre à jour l'interface
        updateMinigamesTable();
        
        // Recharger les détails du mini-jeu
        await selectMinigame(selectedMinigameId);
        
        showNotification(`Niveau de difficulté ${pendingDifficulty} supprimé avec succès`, 'success');
        
    } catch (error) {
        console.error('Erreur deleteDifficultyLevel:', error);
        showNotification(`Erreur lors de la suppression: ${error.message}`, 'error');
    } finally {
        // Masquer le spinner et fermer la modal
        const deleteConfirmText = document.getElementById('delete-confirm-text');
        const deleteSpinner = document.getElementById('delete-spinner');
        deleteConfirmText.style.display = 'inline';
        deleteSpinner.style.display = 'none';
        
        closeModal(confirmDeleteModal);
        pendingDifficulty = null;
    }
}

// Afficher la modal d'ajout de niveau de difficulté
function showAddDifficultyModal() {
    if (!selectedMinigameId) return;
    
    // Trouver les niveaux déjà utilisés
    const minigame = minigames.find(m => m.minigame_id === selectedMinigameId);
    if (!minigame) return;
    
    const existingLevels = minigame.difficulties || [];
    
    // Réinitialiser le sélecteur
    const select = document.getElementById('new-difficulty-level');
    select.innerHTML = '';
    
    // Ajouter uniquement les niveaux non utilisés
    const availableLevels = [1, 2, 3].filter(l => !existingLevels.includes(l));
    
    availableLevels.forEach(level => {
        const option = document.createElement('option');
        option.value = level;
        option.textContent = level;
        select.appendChild(option);
    });
    
    // Si tous les niveaux sont utilisés, désactiver le bouton de confirmation
    if (availableLevels.length === 0) {
        select.innerHTML = '<option value="">Aucun niveau disponible</option>';
        document.getElementById('difficulty-modal-confirm').disabled = true;
    } else {
        document.getElementById('difficulty-modal-confirm').disabled = false;
    }
    
    addDifficultyModal.classList.add('active');
}

// Ajouter un nouveau niveau de difficulté
async function addNewDifficultyLevel() {
    if (!selectedMinigameId) {
        closeModal(addDifficultyModal);
        return;
    }
    
    try {
        // Récupérer le niveau sélectionné
        const level = parseInt(document.getElementById('new-difficulty-level').value);
        if (isNaN(level) || level <= 0) {
            showNotification('Veuillez sélectionner un niveau de difficulté valide', 'error');
            return;
        }
        
        // Afficher le spinner
        const difficultyConfirmText = document.getElementById('difficulty-confirm-text');
        const difficultySpinner = document.getElementById('difficulty-spinner');
        difficultyConfirmText.style.display = 'none';
        difficultySpinner.style.display = 'inline-block';
        
        // Envoyer la requête
        const response = await fetchWithAuth(`/api/admin/minigames/${selectedMinigameId}/difficulty`, {
            method: 'POST',
            body: JSON.stringify({ level })
        });
        
        if (!response) return;
        
        // Mettre à jour le mini-jeu localement
        const minigame = minigames.find(m => m.minigame_id === selectedMinigameId);
        if (minigame) {
            if (!minigame.difficulties) {
                minigame.difficulties = [];
            }
            minigame.difficulties.push(level);
            minigame.difficulties.sort((a, b) => a - b);
        }
        
        // Mettre à jour l'interface
        updateMinigamesTable();
        closeModal(addDifficultyModal);
        
        // Recharger les détails du mini-jeu
        await selectMinigame(selectedMinigameId);
        
        showNotification(`Niveau de difficulté ${level} ajouté avec succès`, 'success');
        
    } catch (error) {
        console.error('Erreur addNewDifficultyLevel:', error);
        showNotification(`Erreur lors de l'ajout: ${error.message}`, 'error');
    } finally {
        // Masquer le spinner
        const difficultyConfirmText = document.getElementById('difficulty-confirm-text');
        const difficultySpinner = document.getElementById('difficulty-spinner');
        difficultyConfirmText.style.display = 'inline';
        difficultySpinner.style.display = 'none';
    }
}

// Afficher la modal d'ajout d'année scolaire
function showAddYearModal() {
    if (!selectedMinigameId || !selectedDifficultyLevel) return;
    
    // Réinitialiser le sélecteur
    document.getElementById('new-year-value').value = 'CP';
    
    addYearModal.classList.add('active');
}

// Ajouter une nouvelle année scolaire
async function addNewYear() {
    if (!selectedMinigameId || !selectedDifficultyLevel) {
        closeModal(addYearModal);
        return;
    }
    
    try {
        // Récupérer l'année sélectionnée
        const year = document.getElementById('new-year-value').value;
        if (!year) {
            showNotification('Veuillez sélectionner une année scolaire', 'error');
            return;
        }
        
        // Afficher le spinner
        const yearConfirmText = document.getElementById('year-confirm-text');
        const yearSpinner = document.getElementById('year-spinner');
        yearConfirmText.style.display = 'none';
        yearSpinner.style.display = 'inline-block';
        
        // Envoyer la requête
        const response = await fetchWithAuth(`/api/admin/minigames/${selectedMinigameId}/difficulty/${selectedDifficultyLevel}/year`, {
            method: 'POST',
            body: JSON.stringify({ year })
        });
        
        if (!response) return;
        
        // Recharger le contenu du niveau
        closeModal(addYearModal);
        loadDifficultyContent(selectedDifficultyLevel);
        
        showNotification(`Année scolaire ${year} ajoutée avec succès`, 'success');
        
    } catch (error) {
        console.error('Erreur addNewYear:', error);
        showNotification(`Erreur lors de l'ajout: ${error.message}`, 'error');
    } finally {
        // Masquer le spinner
        const yearConfirmText = document.getElementById('year-confirm-text');
        const yearSpinner = document.getElementById('year-spinner');
        yearConfirmText.style.display = 'inline';
        yearSpinner.style.display = 'none';
    }
}

// Supprimer une année scolaire
async function deleteYear(year) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'année scolaire ${year} ?`)) {
        return;
    }
    
    if (!selectedMinigameId || !selectedDifficultyLevel) return;
    
    try {
        // Envoyer la requête
        const response = await fetchWithAuth(`/api/admin/minigames/${selectedMinigameId}/difficulty/${selectedDifficultyLevel}/year/${year}`, {
            method: 'DELETE'
        });
        
        if (!response) return;
        
        // Recharger le contenu du niveau
        loadDifficultyContent(selectedDifficultyLevel);
        
        showNotification(`Année scolaire ${year} supprimée avec succès`, 'success');
        
    } catch (error) {
        console.error('Erreur deleteYear:', error);
        showNotification(`Erreur lors de la suppression: ${error.message}`, 'error');
    }
}

// Afficher la modal d'ajout de prérequis
function showAddPrerequisiteModal() {
    if (!selectedMinigameId || !selectedDifficultyLevel) return;
    
    // Récupérer la liste des mini-jeux pour le sélecteur
    fetchWithAuth('/api/admin/minigames?perPage=100').then(data => {
        if (!data || !data.minigames) return;
        
        // Remplir les options de mini-jeux (INCLURE le mini-jeu actuel avec une mention spéciale)
        const select = document.getElementById('prerequisite-minigame');
        select.innerHTML = '<option value="">Sélectionnez un mini-jeu</option>';
        
        data.minigames.forEach(minigame => {
            const option = document.createElement('option');
            option.value = minigame.minigame_id;
            
            // Ajouter une mention spéciale pour le mini-jeu actuel
            if (minigame.minigame_id === selectedMinigameId) {
                option.textContent = `${minigame.title || `Mini-jeu #${minigame.minigame_id}`} (mini-jeu actuel)`;
            } else {
                option.textContent = minigame.title || `Mini-jeu #${minigame.minigame_id}`;
            }
            
            select.appendChild(option);
        });
        
        // Réinitialiser les autres champs
        document.getElementById('prerequisite-difficulty').value = '1';
        document.getElementById('prerequisite-score').value = '100';
        
        addPrerequisiteModal.classList.add('active');
    });
}


// Supprimer un prérequis
async function deletePrerequisite(prereqMinigameId, prereqLevel) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ce prérequis ?`)) {
        return;
    }
    
    if (!selectedMinigameId || !selectedDifficultyLevel) return;
    
    try {
        // Envoyer la requête
        const response = await fetchWithAuth(`/api/admin/minigames/${selectedMinigameId}/difficulty/${selectedDifficultyLevel}/prerequisite/${prereqMinigameId}/${prereqLevel}`, {
            method: 'DELETE'
        });
        
        if (!response) return;
        
        // Recharger le contenu du niveau
        loadDifficultyContent(selectedDifficultyLevel);
        
        showNotification(`Prérequis supprimé avec succès`, 'success');
        
    } catch (error) {
        console.error('Erreur deletePrerequisite:', error);
        showNotification(`Erreur lors de la suppression: ${error.message}`, 'error');
    }
}

// Activer le mini-jeu pour les utilisateurs d'une année spécifique
async function activateMinigameForUsers() {
    if (!selectedMinigameId || !selectedDifficultyLevel) return;
    
    // Modal pour sélectionner l'année scolaire
    showAddYearModal();
    
    // Remplacer la fonction du bouton de confirmation
    const originalCallback = yearModalConfirm.onclick;
    yearModalConfirm.onclick = async function() {
        try {
            const year = document.getElementById('new-year-value').value;
            
            // Afficher le spinner
            const yearConfirmText = document.getElementById('year-confirm-text');
            const yearSpinner = document.getElementById('year-spinner');
            yearConfirmText.style.display = 'none';
            yearSpinner.style.display = 'inline-block';
            
            // Envoyer la requête d'activation
            const response = await fetchWithAuth(`/api/admin/minigames/${selectedMinigameId}/difficulty/${selectedDifficultyLevel}/activate`, {
                method: 'POST',
                body: JSON.stringify({ year })
            });
            
            if (response) {
                showNotification(`Mini-jeu activé avec succès pour ${response.usersAffected} élèves de ${year}`, 'success');
            }
        } catch (error) {
            console.error('Erreur activateMinigameForUsers:', error);
            showNotification(`Erreur lors de l'activation: ${error.message}`, 'error');
        } finally {
            // Masquer le spinner et fermer la modal
            const yearConfirmText = document.getElementById('year-confirm-text');
            const yearSpinner = document.getElementById('year-spinner');
            yearConfirmText.style.display = 'inline';
            yearSpinner.style.display = 'none';
            
            closeModal(addYearModal);
            
            // Restaurer la fonction originale
            yearModalConfirm.onclick = originalCallback;
        }
    };
}

// Afficher la modal d'ajout de débloquage
function showAddUnlockModal() {
    if (!selectedMinigameId || !selectedDifficultyLevel) return;
    
    // Récupérer la liste des mini-jeux pour le sélecteur
    fetchWithAuth('/api/admin/minigames?perPage=100').then(data => {
        if (!data || !data.minigames) return;
        
        // Remplir les options de mini-jeux (INCLURE le mini-jeu actuel avec une mention spéciale)
        const select = document.getElementById('unlock-minigame');
        select.innerHTML = '<option value="">Sélectionnez un mini-jeu</option>';
        
        data.minigames.forEach(minigame => {
            const option = document.createElement('option');
            option.value = minigame.minigame_id;
            
            // Ajouter une mention spéciale pour le mini-jeu actuel
            if (minigame.minigame_id === selectedMinigameId) {
                option.textContent = `${minigame.title || `Mini-jeu #${minigame.minigame_id}`} (mini-jeu actuel)`;
            } else {
                option.textContent = minigame.title || `Mini-jeu #${minigame.minigame_id}`;
            }
            
            select.appendChild(option);
        });
        
        // Réinitialiser les autres champs
        document.getElementById('unlock-difficulty').value = '1';
        document.getElementById('unlock-score').value = '100';
        
        addUnlockModal.classList.add('active');
    });
}

// Ajouter un nouveau débloquage
async function addNewUnlock() {
    // Fonctionnalité non implémentée
    showNotification("Cette fonctionnalité sera disponible dans une prochaine mise à jour", "warning");
    closeModal(addUnlockModal);
}

// Supprimer un débloquage
async function deleteUnlock(unlockMinigameId, unlockLevel) {
    // Fonctionnalité non implémentée
    showNotification("Cette fonctionnalité sera disponible dans une prochaine mise à jour", "warning");
}

// Fermer une modal
function closeModal(modal) {
    modal.classList.remove('active');
}

// Afficher une notification
function showNotification(message, type = 'success') {
    notification.textContent = message;
    notification.className = 'notification';
    notification.classList.add(type);
    notification.classList.add('active');
    
    setTimeout(() => {
        notification.classList.remove('active');
    }, 3000);
}
