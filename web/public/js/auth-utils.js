// auth-utils.js - Utilitaires pour l'authentification et les requêtes API

/**
 * Vérifie si un token est valide via un appel API
 * @returns {Promise<boolean>} - True si le token est valide, false sinon
 */
function validateToken() {
  const token = localStorage.getItem('token');
  
  // Si pas de token, pas besoin de vérifier
  if (!token) {
      return Promise.resolve(false);
  }
  
  // Faire un appel API simple pour vérifier la validité du token
  return fetch('/api/user', {
      headers: { 'Authorization': 'Bearer ' + token }
  })
  .then(response => {
      // Si on reçoit 401 ou 403, le token est invalide
      if (response.status === 401 || response.status === 403) {
          console.log('Token invalide, suppression du token');
          localStorage.removeItem('token'); // Supprimer le token invalide
          return false;
      }
      
      // Sinon, le token est valide
      return response.ok;
  })
  .catch(error => {
      console.error('Erreur lors de la validation du token:', error);
      // En cas d'erreur réseau, on considère le token comme potentiellement invalide
      return false;
  });
}

/**
* Vérifie si l'utilisateur est authentifié, redirige si ce n'est pas le cas
* @param {string} [redirectUrl='/'] - URL de redirection en cas d'échec d'authentification
* @returns {boolean} - True si authentifié, false sinon et redirige
*/
function checkAuth(redirectUrl = '/') {
  const token = localStorage.getItem('token');
  if (!token) {
      console.log('Aucun token d\'authentification trouvé, redirection vers', redirectUrl);
      window.location.href = redirectUrl;
      return false;
  }
  return true;
}

/**
* Effectue une requête API authentifiée
* Gère automatiquement les échecs d'authentification en redirigeant vers la page de connexion
* 
* @param {string} url - L'endpoint API à appeler
* @param {Object} options - Options Fetch (méthode, corps, en-têtes...)
* @param {string} [redirectUrl='/'] - URL de redirection en cas d'échec d'authentification
* @returns {Promise} - Promise qui résout vers la réponse JSON
*/
function fetchWithAuth(url, options = {}, redirectUrl = '/') {
  // Récupérer le token depuis localStorage
  const token = localStorage.getItem('token');
  
  // Si le token n'existe pas, rediriger immédiatement
  if (!token) {
      console.log('Aucun token d\'authentification trouvé, redirection vers', redirectUrl);
      window.location.href = redirectUrl;
      // Renvoyer une promesse rejetée pour empêcher l'exécution ultérieure
      return Promise.reject(new Error('Authentification requise'));
  }
  
  // Ajouter l'en-tête Authorization aux options
  const authOptions = {
      ...options,
      headers: {
          ...options.headers,
          'Authorization': 'Bearer ' + token
      }
  };
  
  // Effectuer l'appel API
  return fetch(url, authOptions)
      .then(response => {
          // Vérifier si la réponse est 401 Unauthorized ou 403 Forbidden
          if (response.status === 401 || response.status === 403) {
              console.log('Échec d\'authentification, redirection vers', redirectUrl);
              // Effacer le token
              localStorage.removeItem('token');
              // Rediriger vers la page de connexion
              window.location.href = redirectUrl;
              // Renvoyer une promesse rejetée pour empêcher l'exécution ultérieure
              return Promise.reject(new Error('Échec d\'authentification'));
          }
          
          // Pour les autres erreurs, simplement marquer la réponse comme non ok
          if (!response.ok) {
              return response.json().then(data => {
                  throw new Error(data.error || 'La requête a échoué avec le statut: ' + response.status);
              });
          }
          
          // Si tout est ok, analyser la réponse JSON
          return response.json();
      });
}

/**
* Version sécurisée de fetch qui vérifie le token avant d'effectuer la requête
* Utile pour les réponses non-JSON ou lorsque vous avez besoin de l'objet Response complet
* 
* @param {string} url - L'endpoint API à appeler
* @param {Object} options - Options Fetch
* @param {string} [redirectUrl='/'] - URL de redirection en cas d'échec d'authentification
* @returns {Promise} - Promise qui résout vers l'objet Response
*/
function safeFetch(url, options = {}, redirectUrl = '/') {
  // Vérifier l'authentification d'abord
  if (!checkAuth(redirectUrl)) {
      return Promise.reject(new Error('Authentification requise'));
  }
  
  // Ajouter l'en-tête Authorization aux options
  const authOptions = {
      ...options,
      headers: {
          ...options.headers,
          'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
  };
  
  // Effectuer la requête
  return fetch(url, authOptions)
      .then(response => {
          if (response.status === 401 || response.status === 403) {
              localStorage.removeItem('token');
              window.location.href = redirectUrl;
              return Promise.reject(new Error('Échec d\'authentification'));
          }
          return response;
      });
}

/**
* Se déconnecte en supprimant le token et redirige vers la page de connexion
* @param {string} [redirectUrl='/'] - URL de redirection après déconnexion
*/
function logout(redirectUrl = '/') {
  localStorage.removeItem('token');
  localStorage.removeItem('email');
  window.location.href = redirectUrl;
}

/**
* Vérifie si l'utilisateur a des droits administrateur
* @returns {Promise<boolean>} - True si l'utilisateur est admin, false sinon
*/
function checkAdminRights() {
  return fetchWithAuth('/api/user')
      .then(user => {
          return user.admin === true;
      })
      .catch(() => {
          return false;
      });
}

/**
* Vérifie si l'utilisateur a des droits enseignant
* @returns {Promise<boolean>} - True si l'utilisateur est enseignant, false sinon
*/
function checkTeacherRights() {
  return fetchWithAuth('/api/user')
      .then(user => {
          return user.teacher === true || user.admin === true;
      })
      .catch(() => {
          return false;
      });
}

/**
* Récupère l'email stocké localement
* @returns {string|null} - email ou null
*/
function getEmail() {
  return localStorage.getItem('email');
}