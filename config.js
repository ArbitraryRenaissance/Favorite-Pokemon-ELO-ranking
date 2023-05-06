const isProduction = window.location.hostname !== 'localhost';
const apiBaseUrl = isProduction ? 'https://www.betterpokemon.app' : 'http://localhost:3000';

export default {
  apiBaseUrl,
};
