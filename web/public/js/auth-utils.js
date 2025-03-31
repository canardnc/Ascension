// auth-utils.js - Save this file in /web/public/js/auth-utils.js

/**
 * Makes an authenticated API request
 * Automatically handles authentication failures by redirecting to login
 * 
 * @param {string} url - The API endpoint to call
 * @param {Object} options - Fetch options
 * @returns {Promise} - Promise that resolves to the JSON response
 */
function fetchWithAuth(url, options = {}) {
  // Get the token from localStorage
  const token = localStorage.getItem('token');
  
  // If token doesn't exist, redirect immediately
  if (!token) {
    console.log('No authentication token found, redirecting to login');
    window.location.href = '/';
    // Return a rejected promise to prevent further execution
    return Promise.reject(new Error('Authentication required'));
  }
  
  // Add Authorization header to options
  const authOptions = {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': 'Bearer ' + token
    }
  };
  
  // Make the API call
  return fetch(url, authOptions)
    .then(response => {
      // Check if response is 401 Unauthorized or 403 Forbidden
      if (response.status === 401 || response.status === 403) {
        console.log('Authentication failed, redirecting to login');
        // Clear the token
        localStorage.removeItem('token');
        // Redirect to login page
        window.location.href = '/';
        // Return a rejected promise to prevent further execution
        return Promise.reject(new Error('Authentication failed'));
      }
      
      // For other errors, just mark the response as not ok
      if (!response.ok) {
        throw new Error('Request failed with status: ' + response.status);
      }
      
      // If everything is ok, parse the JSON response
      return response.json();
    });
}

/**
 * Checks if the user is authenticated, redirects if not
 * Use this at the beginning of each page load
 * 
 * @returns {boolean} - True if authenticated, redirects otherwise
 */
function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('No authentication token found, redirecting to login');
    window.location.href = '/';
    return false;
  }
  return true;
}

/**
 * Safe version of fetch that validates token before making the request
 * Useful for non-JSON responses or when you need the full Response object
 * 
 * @param {string} url - The API endpoint to call
 * @param {Object} options - Fetch options
 * @returns {Promise} - Promise that resolves to the Response object
 */
function safeFetch(url, options = {}) {
  // Check auth first
  if (!checkAuth()) {
    return Promise.reject(new Error('Authentication required'));
  }
  
  // Add Authorization header to options
  const authOptions = {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
  };
  
  // Make the request
  return fetch(url, authOptions)
    .then(response => {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/';
        return Promise.reject(new Error('Authentication failed'));
      }
      return response;
    });
}
