const fs = require('fs');
console.log('Starting script...');

async function fetchPokemonData() {
  let pokemonList = [];
  for (let id = 1; id <= 1010; id++) {
    try {
      const idstr = id.toString().padStart(4, '0');
      const dirs = fs.readdirSync(`pkmnlist`);
      const dir = dirs.find(dir => dir.match(`^${idstr}_`));
      console.log(`idstr: ${idstr}, dir: ${dir}`);

      // Get the name from the directory name
      const name = dir.replace(`${idstr}_`, '').replace(/_/g, ' ');

      const png = `pkmnlist/${dir}/${idstr}.png`;

      pokemonList.push({
        name: name,
        id: idstr,
        png: png,
        elo: 1500,
        RD: 350,
        last_game: 0
      });
    } catch (err) {
      console.error(`Failed to read data for Pokemon ID ${idstr}: ${err}`);
      continue;
    }
  }

  return pokemonList;
}


(async () => {
  console.log('Starting script...');
  const pokemonData = await fetchPokemonData();
  fs.writeFileSync('./pokemonData.json', JSON.stringify(pokemonData));
  console.log('Finished writing pokemon data to pokemonData.json');
})();
