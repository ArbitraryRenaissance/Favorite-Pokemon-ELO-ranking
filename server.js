const express = require('express');
const app = express();
const fs = require('fs');
const bodyParser = require('body-parser');

app.use(bodyParser.json({limit: '50mb'})); // increase the limit to 50mb
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

const cors = require('cors');
const allowedOrigins = ['http://localhost:8080'];
const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};
app.use(cors(corsOptions));

app.use(express.json());

app.post('/update-pokemon-data', (req, res) => {
  const pokemonData = req.body;
  fs.writeFile('pokemonData.json', JSON.stringify(pokemonData, null, 2), (error) => {
    if (error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
});

app.post('/update-competition-data', (req, res) => {
  const competitionData = req.body;
  fs.writeFile('competitions.json', JSON.stringify(competitionData, null, 2), (error) => {
    if (error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
});

app.post('/update-leaderboard', (req, res) => {
  const leaderboard = req.body;
  fs.writeFile('leaderboard.json', JSON.stringify(leaderboard, null, 2), (error) => {
    if (error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
});

app.post('/search', (req, res) => {
  const { name } = req.body;

  fs.readFile('pokemonData.json', 'utf8', (err, data) => {
      if (err) {
          console.error('Error reading pokemonData.json:', err);
          return res.status(500).send('Internal server error');
      }

      const pokemonData = JSON.parse(data);
      const pokemon = pokemonData.find(p => p.name.toLowerCase() === name.toLowerCase());

      if (pokemon) {
          res.json({
              name: pokemon.name,
              id: pokemon.id,
              png: pokemon.png,
              elo: pokemon.elo,
              RD: pokemon.RD,
              last_game: pokemon.last_game
          });
      } else {
          res.status(404).send('Pokemon not found');
      }
  });
});

app.post('/autocomplete', (req, res) => {
  const { term } = req.body;

  fs.readFile('pokemonData.json', 'utf8', (err, data) => {
      if (err) {
          console.error('Error reading pokemonData.json:', err);
          return res.status(500).send('Internal server error');
      }

      const pokemonData = JSON.parse(data);
      const suggestions = pokemonData
          .filter(p => p.name.toLowerCase().startsWith(term.toLowerCase()))
          .map(p => p.name)
          .slice(0, 5); // Limit the number of suggestions

      res.json(suggestions);
  });
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});