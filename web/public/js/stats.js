// Configuration des catégories et limites
const categoryConfig = {
  strength: { 
    max: 16, 
    stats: ['attack', 'precision', 'critical'],
    color: 'red'
  },
  endurance: { 
    max: 21, 
    stats: ['health', 'armor', 'dodge'],
    color: 'blue' 
  },
  recovery: { 
    max: 12, 
    stats: ['regen', 'lifesteal'],
    color: 'green'
  },
  agility: { 
    max: 9, 
    stats: ['range', 'speed'],
    color: 'yellow'
  }
};

// Variables globales simples
const categories = ['strength', 'endurance', 'recovery', 'agility'];
let currentCategoryIndex = 0;
let radarChart;
const categoryElements = {};
const statsData = {}; // Valeurs actuelles des stats
const categoryTotalPoints = {}; // Total des points par catégorie
let totalStats = {}; // Points totaux par catégorie
let availablePoints = {}; // Points disponibles par catégorie

// Appel API avec authentification
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/'; // Rediriger vers la page de connexion
    return null;
  }

  // Ajouter le header d'authentification
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token invalide, rediriger vers la page de connexion
        localStorage.removeItem('token');
        window.location.href = '/';
        return null;
      }
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur de requête:', error);
    return null;
  }
}

// Vérifier si l'utilisateur est authentifié
function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/'; // Rediriger vers la page de connexion
    return false;
  }
  return true;
}

// Fonction pour naviguer vers le menu principal
function navigateToMainMenu() {
  window.location.href = '/home.html';
}

// Calcule les points utilisés et disponibles pour une catégorie
function calculatePointsForCategory(categoryName) {
  const stats = categoryConfig[categoryName].stats;
  let usedPoints = 0;
  
  // Somme des points utilisés dans cette catégorie
  stats.forEach(stat => {
    usedPoints += statsData[stat] || 0;
  });
  
  // Points totaux pour cette catégorie
  const totalPoints = categoryTotalPoints[categoryName];
  
  // Points restants
  const remainingPoints = totalPoints - usedPoints;
  
  return {
    used: usedPoints,
    total: totalPoints,
    remaining: remainingPoints
  };
}

// Mise à jour simple des affichages après un changement
function updateCategoryDisplay(categoryName) {
  const points = calculatePointsForCategory(categoryName);
  const element = categoryElements[categoryName];
  
  // Mettre à jour l'affichage des points restants
  if (element && element.pointsElement) {
    element.pointsElement.textContent = points.remaining;
  }
}

async function saveStats() {
  // Vérifier si les variables sont initialisées
  if (!categories) {
    console.error("Variables non initialisées");
    return;
  }
  
  // Variable pour suivre le succès global de l'opération
  let allSuccess = true;
  
  // Sauvegarder chaque catégorie séquentiellement
  for (const category of categories) {
    // Préparer les données pour l'API pour la catégorie courante
    const payload = {
      category: category,
      subStats: {}
    };
    
    // Récupérer les valeurs actuelles des sliders pour cette catégorie
    const stats = categoryConfig[category].stats;
    stats.forEach(stat => {
      payload.subStats[stat] = statsData[stat] || 0;
    });
    
    try {
      // Appel API pour sauvegarder cette catégorie
      const response = await fetchWithAuth('/api/player/stats', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (!(response && response.success)) {
        allSuccess = false;
        console.error(`Échec de la sauvegarde pour la catégorie ${category}`);
      }
    } catch (error) {
      allSuccess = false;
      console.error(`Erreur lors de la sauvegarde de la catégorie ${category}:`, error);
    }
  }

  // Animation de réussite pour toutes les catégories si tout s'est bien passé
  if (allSuccess) {
    // Obtenir la catégorie actuellement affichée pour l'animation visuelle
    const currentCategory = categories[currentCategoryIndex];
    const category = document.querySelector(`#${currentCategory.toLowerCase()}`);
    
    category.classList.add('saved');
    setTimeout(() => {
      category.classList.remove('saved');
    }, 1000);
    
    // Feedback utilisateur supplémentaire (optionnel)
    const saveButton = document.querySelector('.save-button');
    if (saveButton) {
      const originalText = saveButton.textContent;
      saveButton.textContent = "Sauvegardé!";
      setTimeout(() => {
        saveButton.textContent = originalText;
      }, 2000);
    }
  }
}

// Gestionnaire du carousel
function initCarousel() {
  const carousel = document.getElementById('carousel');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  
  // Fonction pour changer de catégorie
  function changeCategory(direction) {
    currentCategoryIndex = (currentCategoryIndex + direction + categories.length) % categories.length;
    const scrollAmount = carousel.clientWidth * currentCategoryIndex;
    carousel.scrollTo({
      left: scrollAmount,
      behavior: 'smooth'
    });
    
    // Mise à jour du graphique radar
    updateRadarChart();
  }
  
  // Écouteurs d'événements
  prevBtn.addEventListener('click', () => changeCategory(-1));
  nextBtn.addEventListener('click', () => changeCategory(1));
  
  // Support du swipe pour les écrans tactiles
  let touchStartX = 0;
  let touchEndX = 0;
  
  carousel.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  });
  
  carousel.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  });
  
  function handleSwipe() {
    const threshold = 50; // Seuil minimum pour considérer un swipe
    if (touchEndX - touchStartX > threshold) {
      // Swipe vers la droite -> catégorie précédente
      changeCategory(-1);
    } else if (touchStartX - touchEndX > threshold) {
      // Swipe vers la gauche -> catégorie suivante
      changeCategory(1);
    }
  }
}

// Mécanique des sliders
function setupSliders() {
  // Référencer tous les sliders et créer les marqueurs de craie
  categories.forEach(categoryName => {
    const categoryId = categoryName.toLowerCase();
    const categoryElement = document.getElementById(categoryId);
    
    categoryElements[categoryName] = {
      element: categoryElement,
      sliders: categoryElement.querySelectorAll('.chalk-slider'),
      pointsElement: document.getElementById(`${categoryId}-points`),
      statValues: categoryElement.querySelectorAll('.stat-value')
    };
    
    // Initialiser les données des stats et les max des sliders
    const totalPoints = categoryTotalPoints[categoryName] || categoryConfig[categoryName].max;
    
    categoryConfig[categoryName].stats.forEach((stat, index) => {
      const slider = categoryElement.querySelector(`[data-stat="${stat}"]`);
      if (slider) {
        // Définir la valeur maximale du slider égale au total des points
        slider.max = totalPoints;
        
        // Initialiser les données
        statsData[stat] = parseInt(slider.value);
        
        // Mettre à jour l'affichage initial
        categoryElements[categoryName].statValues[index].textContent = statsData[stat];
        
        // Ajouter les écouteurs d'événements pour les mises à jour
        slider.addEventListener('input', (event) => {
          const value = parseInt(slider.value);
          const previousValue = statsData[stat];
          const delta = value - previousValue;
        
          const available = calculatePointsForCategory(categoryName).remaining;
        
          if (delta > available) {
            // Trop de points utilisés, on corrige la valeur
            slider.value = previousValue + available;
            statsData[stat] = previousValue + available;
          } else {
            statsData[stat] = value;
          }
        
          categoryElements[categoryName].statValues[index].textContent = statsData[stat];
        
          updateCategoryStats(categoryName);
        });
      }
    });
    
    // Initialiser l'affichage des points
    updateCategoryStats(categoryName);
  });
}

// Mise à jour des statistiques d'une catégorie
function updateCategoryStats(categoryName) {
  const config = categoryConfig[categoryName];
  const elements = categoryElements[categoryName];
  
  // Calculer le total des points utilisés
  let totalUsed = 0;
  elements.sliders.forEach(slider => {
    const statName = slider.dataset.stat;
    const value = parseInt(slider.value);
    statsData[statName] = value;
    totalUsed += value;
  });
  
  // Points disponibles pour cette catégorie
  const totalPoints = categoryTotalPoints[categoryName] || config.max;
  const available = totalPoints - totalUsed;
  
  // Mettre à jour l'affichage des points restants
  elements.pointsElement.textContent = available;
  availablePoints[categoryName] = available;
  
  // Mise à jour du graphique radar
  updateRadarChart();
}

// Initialisation et mise à jour du graphique radar
function initRadarChart() {
  const ctx = document.getElementById('radarChart').getContext('2d');
  
  // Créer le graphique
  radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Force', 'endurance', 'Récupération', 'Agilité'],
      datasets: [{
        label: 'Statistiques',
        data: [0, 0, 0, 0],
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.8)',
        borderWidth: 2,
        pointBackgroundColor: ['#ff5252', '#42a5f5', '#66bb6a', '#ffee58'],
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      scales: {
        r: {
          angleLines: { color: 'rgba(255, 255, 255, 0.4)' },
          grid: { color: 'rgba(255, 255, 255, 0.4)' },
          pointLabels: {
            color: 'white',
            font: { family: 'Schoolbell', size: 16, weight: 'bold' }
          },
          ticks: {
            stepSize: 5,
            backdropColor: 'transparent',
            color: 'white',
            font: { size: 12 }
          },
          suggestedMin: 0,
          suggestedMax: Math.max(...categories.map(cat => categoryTotalPoints[cat] || 0)),

        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
  
  // Mise à jour initiale
  updateRadarChart();
}

// Mettre à jour le graphique radar
function updateRadarChart() {
  if (!radarChart) return;

  // Calcul des totaux par catégorie
  const newData = categories.map(category => {
    const stats = categoryConfig[category].stats;
    return stats.reduce((sum, stat) => sum + (statsData[stat] || 0), 0);
  });

  // Calcul du max dynamique pour le graphique
  const maxValue = Math.max(...categories.map(cat => categoryTotalPoints[cat] || 0));

  // Mettre à jour les données
  radarChart.data.datasets[0].data = newData;

  // Mettre à jour les options du graphique avec le nouveau max
  radarChart.options.scales.r.suggestedMax = maxValue;

  radarChart.update();
}

// Mise à jour visuelle des valeurs de stats
function updateStatValues() {
  categories.forEach(categoryName => {
    const elements = categoryElements[categoryName];
    const stats = categoryConfig[categoryName].stats;
    
    stats.forEach((stat, index) => {
      const value = statsData[stat] || 0;
      if (elements.statValues[index]) {
        elements.statValues[index].textContent = value;
      }
    });
  });
}

// Chargement des données depuis l'API
async function loadPlayerStats() {
  try {
    const data = await fetchWithAuth('/api/player/stats');
    
    if (!data) {
      console.error("Échec du chargement des données");
      return;
    }
    
    console.log("Données chargées:", data);
    
    // 1. Calculer les points totaux pour chaque catégorie
    categoryTotalPoints.strength = data.attack + data.precision + data.critical + data.availableStrengthPoints;
    categoryTotalPoints.endurance = data.health + data.armor + data.dodge + data.availableEndurancePoints;
    categoryTotalPoints.recovery = data.regen + data.lifesteal + data.availableRecoveryPoints;
    categoryTotalPoints.agility = data.range + data.speed + data.availableAgilityPoints;
    
    console.log("Points totaux par catégorie:", categoryTotalPoints);
    
    // 2. Initialiser les valeurs des statistiques
    statsData.attack = data.attack || 0;
    statsData.precision = data.precision || 0;
    statsData.critical = data.critical || 0;
    statsData.health = data.health || 0;
    statsData.armor = data.armor || 0;
    statsData.dodge = data.dodge || 0;
    statsData.regen = data.regen || 0;
    statsData.lifesteal = data.lifesteal || 0;
    statsData.range = data.range || 0;
    statsData.speed = data.speed || 0;
    
    // 3. Créer les marques de craie pour chaque slider
    categories.forEach(category => {
      drawChalkMarks(category);
    });
    
    // 4. Mettre à jour les sliders et les valeurs affichées
    updateSlidersFromStats();
    
    // 5. Mettre à jour l'affichage des points
    categories.forEach(category => {
      updateCategoryDisplay(category);
    });
    
    // 6. Mettre à jour le graphique radar
    updateRadarChart();
    
  } catch (error) {
    console.error("Erreur lors du chargement des stats:", error);
  }
}

// Mise à jour des sliders et des affichages à partir des données stats
function updateSlidersFromStats() {
  categories.forEach(categoryName => {
    const categoryId = categoryName.toLowerCase();
    
    // Mettre à jour chaque stat pour cette catégorie
    categoryConfig[categoryName].stats.forEach((statName, index) => {
      const value = statsData[statName];
      const slider = document.querySelector(`#${categoryId} [data-stat="${statName}"]`);
      
      if (slider) {
        // Définir la valeur max du slider = total points de la catégorie
        slider.max = categoryTotalPoints[categoryName];
        
        // Définir la valeur actuelle
        slider.value = value;
        
        // Mettre à jour l'affichage de la valeur
        const valueElement = categoryElements[categoryName].statValues[index];
        if (valueElement) {
          valueElement.textContent = value;
        }
      }
    });
  });
}

// Dessiner les tirets de craie correspondant aux points disponibles
function drawChalkMarks(categoryName) {
  const categoryId = categoryName.toLowerCase();
  const totalPoints = categoryTotalPoints[categoryName] || categoryConfig[categoryName].max;
  const chalkMarksContainers = document.querySelectorAll(`#${categoryId} .chalk-marks`);
  
  chalkMarksContainers.forEach(container => {
    // Vider le conteneur
    container.innerHTML = '';
    
    // Ajouter un tiret pour chaque point (de 1 à totalPoints)
    for (let i = 1; i <= totalPoints; i++) {
      const mark = document.createElement('div');
      mark.className = 'chalk-mark';
      
      // Positionner le tiret
      const position = (i / totalPoints) * 100;
      mark.style.left = `${position}%`;
      
      container.appendChild(mark);
    }
  });
}

// Fonction pour déterminer à quelle catégorie appartient une stat
function getCategoryForStat(statName) {
  for (const category of categories) {
    if (categoryConfig[category].stats.includes(statName)) {
      return category;
    }
  }
  return null;
}

// Mise à jour des valeurs max des sliders en fonction des points totaux disponibles
function updateSliderMaxValues() {
  categories.forEach(categoryName => {
    const maxPoints = totalStats[categoryName];
    const stats = categoryConfig[categoryName].stats;
    
    stats.forEach(statName => {
      const slider = document.querySelector(`[data-stat="${statName}"]`);
      if (slider) {
        slider.max = maxPoints;
      }
    });
  });
}

// Vérifier l'authentification
function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/'; // Rediriger vers la page de connexion
    return false;
  }
  return true;
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
  // Vérifier l'authentification
  if (!checkAuth()) return;
  
  // Initialiser les variables globales
  categories.forEach(category => {
    categoryTotalPoints[category] = categoryConfig[category].max;
  });
  
  // Dessiner les marques de craie initiales
  categories.forEach(category => {
    drawChalkMarks(category);
  });
  
  // Initialiser les composants
  setupSliders();
  initRadarChart();
  initCarousel();
  
  // Charger les données du joueur
  await loadPlayerStats();
});