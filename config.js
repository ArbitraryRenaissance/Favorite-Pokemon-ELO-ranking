const isProduction = window.location.hostname !== 'localhost';
const apiBaseUrl = isProduction ? 'https://fav-pokemon-elo.herokuapp.com' : 'http://localhost:3000';

export default {
  apiBaseUrl,
};
