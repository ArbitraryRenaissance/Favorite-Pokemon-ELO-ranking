const express = require('express');
const app = express();
const fs = require('fs');

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

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});