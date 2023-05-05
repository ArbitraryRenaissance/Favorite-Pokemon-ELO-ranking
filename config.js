const isProduction = window.location.hostname !== 'localhost';
const apiBaseUrl = isProduction ? 'https://api.betterpokemon.app' : 'http://localhost:3000';

export default {
  apiBaseUrl,
};
